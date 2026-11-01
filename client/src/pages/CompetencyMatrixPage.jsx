import { BookOpenCheck, Pencil, Plus } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useReveal } from '../animations/index.js';
import { CompetencyFormModal } from '../components/competencies/CompetencyFormModal.jsx';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CategoryBadge,
  EmptyState,
  ErrorState,
  PageHeader,
  SearchInput,
  SegmentedControl,
  SkeletonRows,
} from '../components/ui/index.js';
import { useDemo } from '../context/DemoContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { competenciesApi } from '../services/resources.js';
import { CATEGORY_META, LEVEL_LABELS } from '../utils/constants.js';
import { initials, shortDepartment } from '../utils/format.js';

const CATEGORIES = ['Core', 'Functional', 'Behavioural'];

function ExpectedLevel({ level }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Expected level ${level}, ${LEVEL_LABELS[level]}`}>
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className={`h-2.5 w-3 rounded-[2px] ${step <= level ? 'bg-brand-600' : 'bg-slate-200'}`} />
        ))}
      </span>
      <span className="text-xs whitespace-nowrap text-slate-600">
        L{level} · {LEVEL_LABELS[level]}
      </span>
    </div>
  );
}

function LevelCell({ current, required }) {
  if (current === null || current === undefined) {
    return <span className="inline-grid size-8 place-items-center rounded-md bg-slate-50 text-xs text-slate-400 ring-1 ring-slate-200 ring-inset">–</span>;
  }
  const gap = required - current;
  const tone =
    gap <= 0 ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20' : gap === 1 ? 'bg-orange-50 text-orange-800 ring-orange-500/30' : 'bg-orange-200 text-orange-950 ring-orange-600/40';
  return (
    <span
      className={`tabular inline-grid size-8 place-items-center rounded-md text-sm font-semibold ring-1 ring-inset ${tone}`}
      title={gap > 0 ? `Current ${current}, required ${required} — gap ${gap}` : `Current ${current}, required ${required} — meets`}
    >
      {current}
    </span>
  );
}

function RoleFramework({ jobTitle, onRoleChange }) {
  const { role: demoRole } = useDemo();
  const { data, error, loading, reload } = useApi(() => competenciesApi.matrix(jobTitle ? { jobTitle } : {}), [jobTitle]);

  const rolesByDepartment = useMemo(() => {
    const map = new Map();
    for (const role of data?.roles || []) {
      if (!map.has(role.department)) map.set(role.department, []);
      map.get(role.department).push(role);
    }
    return [...map.entries()];
  }, [data]);

  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <SkeletonRows rows={8} />;
  const { role, competencies, employees } = data;

  return (
    <div className={loading ? 'opacity-60 transition-opacity' : ''}>
      <div className="flex flex-col gap-4 border-b border-line p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">{role.title}</h2>
            {role.isFocusRole && <Badge tone="glow">Key role · CA-2 Q2</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{role.department}</p>
          {role.summary && <p className="mt-2 text-sm text-slate-600">{role.summary}</p>}
        </div>
        <label className="shrink-0 text-sm">
          <span className="label">Job role</span>
          <select value={role.title} onChange={(event) => onRoleChange(event.target.value)} className="input w-72 max-w-full">
            {rolesByDepartment.map(([department, roles]) => (
              <optgroup key={department} label={shortDepartment(department)}>
                {roles.map((item) => (
                  <option key={item.title} value={item.title}>
                    {item.title} {item.headcount ? `(${item.headcount})` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line bg-slate-50/60 px-5 py-2.5 text-xs text-slate-600">
        <span className="font-medium text-slate-700">Current level cells:</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-emerald-100 ring-1 ring-emerald-600/30" />Meets or exceeds</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-orange-50 ring-1 ring-orange-500/40" />1 level below</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-orange-200 ring-1 ring-orange-600/40" />2+ levels below</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-slate-50 ring-1 ring-slate-300" />Not assessed</span>
      </div>

      {competencies.length === 0 ? (
        <EmptyState title="No competencies defined for this role" description="Add competencies to the library and link them to this role." />
      ) : (
        <div className="scrollbar-thin relative overflow-x-auto">
          {/* Width grows with the number of employee columns, so small teams fit without scrolling. */}
          <table className="w-full text-sm" style={{ minWidth: 480 + employees.length * 76 }}>
            <thead className="table-head">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 px-5 py-3">Competency</th>
                <th className="px-4 py-3">Expected level</th>
                <th className="hidden px-4 py-3 xl:table-cell">How it can be assessed</th>
                {employees.map((employee) => (
                  <th key={employee._id} className="px-2 py-3 text-center normal-case" title={employee.name}>
                    <Link to={`/employees/${employee._id}`} className="inline-flex flex-col items-center gap-0.5 hover:text-brand-700">
                      <span className="grid size-7 place-items-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700">{initials(employee.name)}</span>
                      <span className="max-w-20 truncate text-[11px] font-medium tracking-normal">{employee.name.split(' ')[0]}</span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            {CATEGORIES.map((category) => {
              const rows = competencies.filter((item) => item.category === category);
              if (!rows.length) return null;
              return (
                <tbody key={category} className="divide-y divide-line border-b border-line">
                  <tr className="bg-surface">
                    <td colSpan={3 + employees.length} className="sticky left-0 px-5 pt-4 pb-2">
                      <div className="flex items-center gap-2">
                        <CategoryBadge category={category} />
                        <span className="text-xs text-slate-500">{CATEGORY_META[category].description}</span>
                      </div>
                    </td>
                  </tr>
                  {rows.map((competency) => (
                    <tr key={competency._id} className="align-middle hover:bg-slate-50/60">
                      <td className="sticky left-0 z-10 max-w-sm bg-surface px-5 py-3">
                        <p className="font-medium text-slate-800">{competency.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{competency.description}</p>
                      </td>
                      <td className="px-4 py-3">
                        <ExpectedLevel level={competency.requiredLevel} />
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-slate-600 xl:table-cell">{competency.assessmentMethod || '—'}</td>
                      {employees.map((employee) => (
                        <td key={employee._id} className="px-2 py-3 text-center">
                          <LevelCell current={employee.levels[competency._id]} required={competency.requiredLevel} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              );
            })}
          </table>
        </div>
      )}
      <p className="px-5 py-3 text-xs text-slate-500">
        {employees.length
          ? `${employees.length} ${demoRole === 'employee' ? 'record (you)' : `employee${employees.length === 1 ? '' : 's'} currently in this role`} · columns show current proficiency (demo data).`
          : 'No demo employees currently hold this role — expected levels are still shown for planning and career paths.'}
      </p>
    </div>
  );
}

function CompetencyLibrary({ onEdit, refreshKey }) {
  const { can } = useDemo();
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const { data, error, reload } = useApi(() => competenciesApi.list(), [refreshKey]);

  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <SkeletonRows rows={8} />;
  const filtered = data.filter(
    (item) => (!category || item.category === category) && item.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search competencies…" className="w-full sm:w-72" />
        <SegmentedControl
          label="Category"
          value={category}
          onChange={setCategory}
          options={[{ value: '', label: 'All', count: data.length }, ...CATEGORIES.map((value) => ({ value, label: value, count: data.filter((item) => item.category === value).length }))]}
          className="sm:ml-auto"
        />
      </div>
      {filtered.length ? (
        <div className="scrollbar-thin relative overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-5 py-3">Competency</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Applies to</th>
                <th className="px-4 py-3">Employees with gap</th>
                {can('competencies.manage') && <th className="px-5 py-3 text-right"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((competency) => (
                <tr key={competency._id} className="align-top hover:bg-slate-50/60">
                  <td className="max-w-md px-5 py-3">
                    <p className="font-medium text-slate-800">{competency.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{competency.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <CategoryBadge category={competency.category} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span title={competency.applicableRoles.join(', ')}>
                      {competency.applicableRoles.length} role{competency.applicableRoles.length === 1 ? '' : 's'}
                    </span>
                  </td>
                  <td className="tabular px-4 py-3 text-slate-700">{competency.employeesWithGap || '—'}</td>
                  {can('competencies.manage') && (
                    <td className="px-5 py-3 text-right">
                      <Button variant="ghost" size="icon-sm" onClick={() => onEdit(competency)} aria-label={`Edit ${competency.name}`}>
                        <Pencil className="size-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No competencies match" description="Try another search or category." />
      )}
    </>
  );
}

export default function CompetencyMatrixPage() {
  const { can, role, session } = useDemo();
  const [view, setView] = useState('framework');
  const [jobTitle, setJobTitle] = useState(role === 'employee' ? session.jobTitle : '');
  const [form, setForm] = useState({ open: false, competency: null });
  const [refreshKey, setRefreshKey] = useState(0);
  const ref = useRef(null);
  useReveal(ref);

  return (
    <div ref={ref}>
      <PageHeader
        eyebrow="Skills"
        title="Competency matrix"
        description="Proposed competency framework for the prototype (not Lutron’s official framework). Expected proficiency by job role on a 1–4 scale, with current levels for employees in that role."
        actions={
          can('competencies.manage') && (
            <Button variant="primary" icon={Plus} onClick={() => setForm({ open: true, competency: null })}>
              Add competency
            </Button>
          )
        }
      />

      <div data-reveal className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((level) => (
          <div key={level} className="card flex items-start gap-3 p-4">
            <span className="tabular grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700">L{level}</span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{LEVEL_LABELS[level]}</p>
              <p className="text-xs text-slate-500">
                {
                  {
                    1: 'Understands basic concepts; needs guidance.',
                    2: 'Handles routine tasks with some support.',
                    3: 'Works independently on normal role requirements.',
                    4: 'Handles complex work and guides others.',
                  }[level]
                }
              </p>
            </div>
          </div>
        ))}
      </div>

      <Card data-reveal>
        <CardHeader
          title={view === 'framework' ? 'Role framework' : 'Competency library'}
          subtitle={view === 'framework' ? 'Core, functional and behavioural competencies with expected levels' : 'All competencies and the roles that use them'}
          icon={BookOpenCheck}
          action={
            <SegmentedControl
              label="Matrix view"
              value={view}
              onChange={setView}
              options={[
                { value: 'framework', label: 'By role' },
                { value: 'library', label: 'Library' },
              ]}
            />
          }
        />
        {view === 'framework' ? (
          <RoleFramework key={refreshKey} jobTitle={jobTitle} onRoleChange={setJobTitle} />
        ) : (
          <CompetencyLibrary refreshKey={refreshKey} onEdit={(competency) => setForm({ open: true, competency })} />
        )}
      </Card>

      <CompetencyFormModal
        open={form.open}
        competency={form.competency}
        defaultRole={jobTitle || 'Lighting Design Specialist'}
        onClose={() => setForm((current) => ({ ...current, open: false }))}
        onSaved={() => setRefreshKey((value) => value + 1)}
      />
    </div>
  );
}
