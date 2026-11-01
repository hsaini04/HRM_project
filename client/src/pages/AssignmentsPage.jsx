import { CalendarDays, ClipboardList, Plus, SearchX, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useReveal } from '../animations/index.js';
import { AssignTrainingModal } from '../components/training/AssignTrainingModal.jsx';
import { ProgressModal } from '../components/training/ProgressModal.jsx';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FilterSelect,
  Modal,
  PageHeader,
  Pagination,
  PersonCell,
  ProgressBar,
  SearchInput,
  SegmentedControl,
  SkeletonRows,
  StatusBadge,
  TextInput,
} from '../components/ui/index.js';
import { useDemo } from '../context/DemoContext.jsx';
import { useMeta } from '../context/MetaContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { enrollmentsApi } from '../services/resources.js';
import { dueLabel, formatDate, shortDepartment, toDateInput } from '../utils/format.js';

const STATUSES = ['Not Started', 'In Progress', 'Completed', 'Overdue'];

function daysLeft(dueDate) {
  const today = new Date();
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((new Date(dueDate).getTime() - todayUTC) / 86400000);
}

function DueDateModal({ target, onClose, onSaved }) {
  const toast = useToast();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (target.open && target.item) {
      setValue(toDateInput(target.item.dueDate));
      setError('');
    }
  }, [target]);

  const save = async (event) => {
    event.preventDefault();
    if (!value) return setError('Choose a due date');
    if (value < toDateInput(target.item.assignedAt)) return setError('Due date cannot be before the assignment date');
    setSaving(true);
    try {
      const updated = await enrollmentsApi.update(target.item._id, { dueDate: value });
      toast.success('Due date updated', `${updated.program.title} · now ${updated.status}`);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.details?.dueDate || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={target.open}
      onClose={onClose}
      size="sm"
      title="Change due date"
      description={target.item ? `${target.item.program.title} · ${target.item.employee.name}` : ''}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="due-form" loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <form id="due-form" onSubmit={save} noValidate>
        <TextInput
          label="Due date"
          type="date"
          value={value}
          min={target.item ? toDateInput(target.item.assignedAt) : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            setError('');
          }}
          error={error}
          hint="Status is recalculated: a past due date marks unfinished training as Overdue."
          data-autofocus
        />
      </form>
    </Modal>
  );
}

export default function AssignmentsPage() {
  const { role, session, can, canManage, isSelf } = useDemo();
  const { meta } = useMeta();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || '';
  const [scope, setScope] = useState(role === 'manager' ? 'team' : 'all');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [sort, setSort] = useState('dueDate');
  const [page, setPage] = useState(1);
  const [assignOpen, setAssignOpen] = useState(false);
  const [progressTarget, setProgressTarget] = useState({ open: false, item: null });
  const [dueTarget, setDueTarget] = useState({ open: false, item: null });
  const [removeTarget, setRemoveTarget] = useState({ open: false, item: null });
  const [removing, setRemoving] = useState(false);
  const term = useDebouncedValue(search, 300);
  const isEmployee = role === 'employee';

  const params = {
    status,
    search: term,
    department,
    sort,
    page,
    limit: 15,
    managerId: scope === 'team' ? session.employeeId : undefined,
  };
  const { data, error, loading, reload } = useApi((signal) => enrollmentsApi.list(params, { signal }), [status, term, department, sort, page, scope]);
  const ref = useRef(null);
  useReveal(ref, { ready: Boolean(data) });
  useEffect(() => setPage(1), [status, term, department, sort, scope]);

  const setStatus = (value) => setSearchParams(value ? { status: value } : {});
  const counts = data?.meta.counts;

  const remove = async () => {
    setRemoving(true);
    try {
      await enrollmentsApi.remove(removeTarget.item._id);
      toast.success('Assignment removed', `${removeTarget.item.program.title} · ${removeTarget.item.employee.name}`);
      setRemoveTarget((current) => ({ ...current, open: false }));
      reload();
    } catch (err) {
      toast.error('Could not remove assignment', err.message);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div ref={ref}>
      <PageHeader
        eyebrow="Learning"
        title={isEmployee ? 'My training' : 'Training assignments'}
        description={
          isEmployee
            ? 'Programmes assigned to you, their due dates and your progress. Update progress as you go — status changes automatically.'
            : 'Assign programmes, set due dates and track progress. Status is derived from progress and due date: Not Started, In Progress, Completed or Overdue.'
        }
        actions={
          can('assign') && (
            <Button variant="primary" icon={Plus} onClick={() => setAssignOpen(true)}>
              Assign training
            </Button>
          )
        }
      />

      <Card data-reveal>
        <div className="flex flex-col gap-3 border-b border-line p-4">
          <SegmentedControl
            label="Filter by status"
            value={status}
            onChange={setStatus}
            options={[{ value: '', label: 'All', count: counts?.All }, ...STATUSES.map((value) => ({ value, label: value, count: counts?.[value] }))]}
          />
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={isEmployee ? 'Search programmes…' : 'Search employee or programme…'}
              className="lg:w-80"
              label="Search assignments"
            />
            <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
              {role === 'manager' && (
                <SegmentedControl
                  label="Scope"
                  value={scope}
                  onChange={setScope}
                  options={[
                    { value: 'team', label: 'My team' },
                    { value: 'all', label: 'Everyone' },
                  ]}
                />
              )}
              {!isEmployee && (
                <FilterSelect
                  label="Department"
                  value={department}
                  onChange={setDepartment}
                  placeholder="All departments"
                  options={(meta?.departments || []).map((item) => ({ value: item, label: shortDepartment(item) }))}
                />
              )}
              <FilterSelect
                label="Sort"
                value={sort}
                onChange={setSort}
                placeholder="Sort"
                options={[
                  { value: 'dueDate', label: 'Due date (soonest)' },
                  { value: '-dueDate', label: 'Due date (latest)' },
                  { value: '-assignedAt', label: 'Recently assigned' },
                  { value: 'progress', label: 'Progress (lowest)' },
                  { value: '-progress', label: 'Progress (highest)' },
                ]}
              />
            </div>
          </div>
        </div>

        {error && !data ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data ? (
          <SkeletonRows rows={8} />
        ) : data.data.length === 0 ? (
          <EmptyState
            icon={status || term || department ? SearchX : ClipboardList}
            title={status || term || department ? 'No assignments match' : 'No training assigned yet'}
            description={status || term || department ? 'Try another status, search term or department.' : 'Assign a programme to get started.'}
            action={
              can('assign') &&
              !status &&
              !term && (
                <Button icon={Plus} onClick={() => setAssignOpen(true)}>
                  Assign training
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className={`scrollbar-thin relative overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
              <table className="w-full min-w-[680px] text-sm">
                <thead className="table-head">
                  <tr>
                    {!isEmployee && <th className="px-5 py-3">Employee</th>}
                    <th className="px-4 py-3">Programme</th>
                    <th className="hidden px-4 py-3 xl:table-cell">Assigned · due</th>
                    <th className="w-48 px-4 py-3">Status &amp; progress</th>
                    <th className="px-5 py-3 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.data.map((item) => {
                    const manageable = canManage(item.employee);
                    const editable = manageable || isSelf(item.employee._id);
                    const left = daysLeft(item.dueDate);
                    return (
                      <tr key={item._id} className="hover:bg-slate-50/60">
                        {!isEmployee && (
                          <td className="px-5 py-3">
                            <Link to={`/employees/${item.employee._id}`} className="block max-w-44 hover:[&_p:first-child]:text-brand-700">
                              <PersonCell name={item.employee.name} subtitle={item.employee.jobTitle} size="sm" />
                            </Link>
                          </td>
                        )}
                        <td className="max-w-xs px-4 py-3">
                          <p className="font-medium text-slate-800">{item.program.title}</p>
                          <p className="text-xs text-slate-500">
                            {item.program.deliveryMode} · {item.program.durationHours} h{item.assignedBy && ` · by ${item.assignedBy.name}`}
                          </p>
                          {/* Narrower screens fold the due date in here instead of a separate column. */}
                          <p className={`mt-1 text-xs xl:hidden ${item.status === 'Overdue' ? 'font-medium text-red-700' : 'text-slate-600'}`}>
                            {item.status === 'Completed' ? `Completed ${formatDate(item.completedAt)}` : `${formatDate(item.dueDate)} · ${dueLabel(left)}`}
                          </p>
                        </td>
                        <td className="hidden px-4 py-3 whitespace-nowrap xl:table-cell">
                          <p className="text-slate-700">{formatDate(item.dueDate)}</p>
                          <p className={`text-xs ${item.status === 'Overdue' ? 'font-medium text-red-700' : 'text-slate-500'}`}>
                            {item.status === 'Completed'
                              ? `Completed ${formatDate(item.completedAt)}`
                              : left < 0
                                ? `${Math.abs(left)} days overdue`
                                : left === 0
                                  ? 'Due today'
                                  : `${left} days left · assigned ${formatDate(item.assignedAt, { year: undefined })}`}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <StatusBadge status={item.status} />
                            {item.assessmentScore !== null && item.assessmentScore !== undefined && (
                              <span className="tabular text-xs text-slate-500">Score {item.assessmentScore}</span>
                            )}
                          </div>
                          <ProgressBar value={item.progress} status={item.status} />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            {editable && (
                              <Button size="sm" variant={item.status === 'Completed' ? 'ghost' : 'subtle'} onClick={() => setProgressTarget({ open: true, item })}>
                                {item.status === 'Completed' ? 'Edit' : 'Update'}
                              </Button>
                            )}
                            {manageable && (
                              <>
                                <Button variant="ghost" size="icon-sm" onClick={() => setDueTarget({ open: true, item })} aria-label="Change due date" title="Change due date">
                                  <CalendarDays className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => setRemoveTarget({ open: true, item })}
                                  aria-label="Remove assignment"
                                  title="Remove assignment"
                                  className="hover:text-red-700"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination {...data.meta} onChange={setPage} noun="assignments" />
          </>
        )}
      </Card>

      <AssignTrainingModal open={assignOpen} onClose={() => setAssignOpen(false)} onAssigned={reload} />
      <ProgressModal
        open={progressTarget.open}
        enrollment={progressTarget.item}
        onClose={() => setProgressTarget((current) => ({ ...current, open: false }))}
        onSaved={reload}
      />
      <DueDateModal target={dueTarget} onClose={() => setDueTarget((current) => ({ ...current, open: false }))} onSaved={reload} />
      <ConfirmDialog
        open={removeTarget.open}
        onClose={() => setRemoveTarget((current) => ({ ...current, open: false }))}
        onConfirm={remove}
        loading={removing}
        title="Remove this assignment?"
        description={removeTarget.item ? `“${removeTarget.item.program.title}” will be removed from ${removeTarget.item.employee.name}’s learning plan.` : ''}
        confirmLabel="Remove"
      />
    </div>
  );
}
