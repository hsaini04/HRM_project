import { ArrowUpRight, Pencil, SearchX, UserPlus, Users } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useReveal } from '../animations/index.js';
import { EmployeeFormModal } from '../components/employees/EmployeeFormModal.jsx';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FilterSelect,
  PageHeader,
  Pagination,
  PersonCell,
  SearchInput,
  SegmentedControl,
  SkeletonRows,
} from '../components/ui/index.js';
import { useDemo } from '../context/DemoContext.jsx';
import { useMeta } from '../context/MetaContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { employeesApi } from '../services/resources.js';
import { formatDate, shortDepartment } from '../utils/format.js';

const SORT_OPTIONS = [
  { value: 'name', label: 'Name A–Z' },
  { value: '-name', label: 'Name Z–A' },
  { value: 'department', label: 'Department' },
  { value: 'jobTitle', label: 'Job role' },
  { value: '-joiningDate', label: 'Newest joiners' },
  { value: 'joiningDate', label: 'Longest tenure' },
];

export default function EmployeesPage() {
  const { role, session, can } = useDemo();
  const { meta, reload: reloadMeta } = useMeta();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [department, setDepartment] = useState(searchParams.get('department') || '');
  const [jobTitle, setJobTitle] = useState('');
  const [sort, setSort] = useState('name');
  const [scope, setScope] = useState(role === 'manager' ? 'team' : 'all');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ open: false, employee: null });
  const term = useDebouncedValue(search, 300);

  const params = {
    search: term,
    department,
    jobTitle,
    sort,
    page,
    limit: 10,
    managerId: scope === 'team' ? session.employeeId : undefined,
  };
  const { data, error, loading, reload } = useApi(
    (signal) => employeesApi.list(params, { signal }),
    [term, department, jobTitle, sort, page, scope],
  );
  const ref = useRef(null);
  useReveal(ref, { ready: Boolean(data) });

  const roleOptions = useMemo(
    () => (meta?.jobRoles || []).filter((item) => !department || item.department === department).filter((item) => item.headcount > 0).map((item) => item.title),
    [meta, department],
  );

  const resetPage = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  const hasFilters = term || department || jobTitle;

  const onSaved = (saved) => {
    reloadMeta();
    if (form.employee) reload();
    else navigate(`/employees/${saved._id}`);
  };

  return (
    <div ref={ref}>
      <PageHeader
        eyebrow="People"
        title="Employee management"
        description="Fictional employee directory for the simulated Gurugram office. Open a profile to review competencies, training and development goals."
        actions={
          can('employees.manage') && (
            <Button variant="primary" icon={UserPlus} onClick={() => setForm({ open: true, employee: null })}>
              Add employee
            </Button>
          )
        }
      />

      <Card data-reveal>
        <div className="flex flex-col gap-3 border-b border-line p-4 xl:flex-row xl:items-center">
          <SearchInput value={search} onChange={resetPage(setSearch)} placeholder="Search name, code, email or role…" className="xl:w-80" label="Search employees" />
          <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
            {role === 'manager' && (
              <SegmentedControl
                label="Employee scope"
                value={scope}
                onChange={resetPage(setScope)}
                options={[
                  { value: 'team', label: 'My team' },
                  { value: 'all', label: 'Everyone' },
                ]}
              />
            )}
            <FilterSelect
              label="Department"
              value={department}
              onChange={(value) => {
                setDepartment(value);
                setJobTitle('');
                setPage(1);
              }}
              placeholder="All departments"
              options={(meta?.departments || []).map((item) => ({ value: item, label: shortDepartment(item) }))}
            />
            <FilterSelect label="Job role" value={jobTitle} onChange={resetPage(setJobTitle)} placeholder="All roles" options={roleOptions} />
            <FilterSelect label="Sort by" value={sort} onChange={setSort} placeholder="Sort" options={SORT_OPTIONS} />
          </div>
        </div>

        {error && !data ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data ? (
          <SkeletonRows rows={8} />
        ) : data.data.length === 0 ? (
          <EmptyState
            icon={hasFilters ? SearchX : Users}
            title={hasFilters ? 'No employees match these filters' : 'No employees yet'}
            description={hasFilters ? 'Try a different search term or clear the filters.' : 'Run the seed script or add an employee.'}
            action={
              hasFilters && (
                <Button
                  onClick={() => {
                    setSearch('');
                    setDepartment('');
                    setJobTitle('');
                  }}
                >
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className={`scrollbar-thin relative overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
              <table className="w-full min-w-[680px] text-sm">
                <thead className="table-head">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-4 py-3">Role & department</th>
                    <th className="hidden px-4 py-3 xl:table-cell">Manager</th>
                    <th className="px-4 py-3">Training</th>
                    <th className="px-4 py-3">Skill gaps</th>
                    <th className="hidden px-4 py-3 xl:table-cell">Joined</th>
                    <th className="px-5 py-3 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.data.map((employee) => (
                    <tr key={employee._id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <Link to={`/employees/${employee._id}`} className="block hover:[&_p:first-child]:text-brand-700">
                          <PersonCell name={employee.name} subtitle={employee.employeeCode} />
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{employee.jobTitle}</p>
                        <p className="text-xs text-slate-500">{shortDepartment(employee.department)}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 xl:table-cell">{employee.manager?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <p className="tabular text-slate-800">
                          {employee.learning.completed}/{employee.learning.assignments} completed
                        </p>
                        {employee.learning.overdue > 0 ? (
                          <Badge tone="danger" className="mt-1">
                            {employee.learning.overdue} overdue
                          </Badge>
                        ) : (
                          employee.learning.assignments === 0 && <p className="text-xs text-slate-500">No assignments</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {employee.learning.gaps > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="tabular font-medium text-slate-800">{employee.learning.gaps}</span>
                            {employee.learning.priorityGaps > 0 && <Badge tone="bg-orange-100 text-orange-900 ring-orange-700/25">{employee.learning.priorityGaps} priority</Badge>}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">None recorded</span>
                        )}
                      </td>
                      <td className="tabular hidden px-4 py-3 text-slate-600 xl:table-cell">{formatDate(employee.joiningDate)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          {can('employees.manage') && (
                            <Button variant="ghost" size="icon-sm" onClick={() => setForm({ open: true, employee })} aria-label={`Edit ${employee.name}`}>
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          <Link
                            to={`/employees/${employee._id}`}
                            aria-label={`View ${employee.name}`}
                            className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
                          >
                            View
                            <ArrowUpRight className="size-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...data.meta} onChange={setPage} noun="employees" />
          </>
        )}
      </Card>

      <EmployeeFormModal open={form.open} employee={form.employee} onClose={() => setForm((current) => ({ ...current, open: false }))} onSaved={onSaved} />
    </div>
  );
}
