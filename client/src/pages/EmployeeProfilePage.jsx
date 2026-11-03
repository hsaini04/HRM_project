import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Flag,
  Gauge,
  Mail,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useReveal } from '../animations/index.js';
import { AssessmentDrawer } from '../components/employees/AssessmentDrawer.jsx';
import { EmployeeFormModal } from '../components/employees/EmployeeFormModal.jsx';
import { AssignTrainingModal } from '../components/training/AssignTrainingModal.jsx';
import { ProgressModal } from '../components/training/ProgressModal.jsx';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  GoalStatusBadge,
  LevelMeter,
  PageSkeleton,
  ProgressBar,
  SegmentedControl,
  SeverityBadge,
  StatusBadge,
} from '../components/ui/index.js';
import { useDemo } from '../context/DemoContext.jsx';
import { useMeta } from '../context/MetaContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { careerApi, competenciesApi, employeesApi, enrollmentsApi } from '../services/resources.js';
import { CATEGORY_META } from '../utils/constants.js';
import { formatDate, formatShortDate, shortDepartment } from '../utils/format.js';

function GapCell({ item }) {
  if (item.currentLevel === null) return <Badge>Not assessed</Badge>;
  if (item.gap > 0) return <SeverityBadge severity={item.severity} gap={item.gap} />;
  if (item.currentLevel > item.requiredLevel) return <Badge tone="success">Exceeds</Badge>;
  return <Badge tone="success">Meets</Badge>;
}

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { can, canManage, isSelf, role } = useDemo();
  const { reload: reloadMeta } = useMeta();
  const [category, setCategory] = useState('All');
  const [assessOpen, setAssessOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progressTarget, setProgressTarget] = useState({ open: false, item: null });

  const employee = useApi(() => employeesApi.get(id), [id]);
  const competencies = useApi(() => competenciesApi.forEmployee(id), [id]);
  const enrollments = useApi((signal) => enrollmentsApi.list({ employee: id, limit: 100, sort: 'dueDate' }, { signal }), [id]);
  const plans = useApi(() => careerApi.plans({ employee: id }), [id]);
  const ref = useRef(null);
  const ready = Boolean(employee.data && competencies.data && enrollments.data && plans.data);
  useReveal(ref, { ready });

  const items = useMemo(() => competencies.data?.items || [], [competencies.data]);
  const visibleItems = category === 'All' ? items : items.filter((item) => item.competency.category === category);

  const error = employee.error || competencies.error || enrollments.error || plans.error;
  if (error && !ready) {
    return (
      <Card>
        <ErrorState error={error} onRetry={() => [employee, competencies, enrollments, plans].forEach((item) => item.reload())} />
      </Card>
    );
  }
  if (!ready) return <PageSkeleton cards={3} />;

  const person = employee.data;
  const summary = competencies.data.summary;
  const plan = plans.data[0];
  const training = enrollments.data.data;
  const counts = enrollments.data.meta.counts;
  const manageable = canManage(person);
  const self = isSelf(person._id);

  const refreshLearning = () => {
    employee.reload();
    enrollments.reload();
    competencies.reload();
  };

  const updateGoal = async (goal, status) => {
    try {
      const updated = await careerApi.updateGoal(plan._id, goal._id, status);
      plans.setData([updated]);
      toast.success('Goal updated', `${goal.title} → ${status}`);
    } catch (err) {
      toast.error('Could not update goal', err.message);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await employeesApi.remove(person._id);
      toast.success('Employee removed', `${person.name} and their learning records were deleted from the demo dataset.`);
      reloadMeta();
      navigate('/employees');
    } catch (err) {
      toast.error('Could not delete employee', err.message);
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div ref={ref}>
      {role !== 'employee' && (
        <Link data-reveal to="/employees" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Employees
        </Link>
      )}

      <Card data-reveal className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={person.name} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{person.name}</h1>
                <Badge tone={person.employmentStatus === 'Active' ? 'success' : 'warning'}>{person.employmentStatus}</Badge>
                {person.role?.isFocusRole && <Badge tone="glow">Focus role (CA-2 Q2)</Badge>}
              </div>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {person.jobTitle} · <span className="text-slate-500">{person.department}</span>
              </p>
              <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-600">
                <div className="flex items-center gap-1.5">
                  <UserRound className="size-4 text-slate-400" aria-hidden="true" />
                  <dt className="sr-only">Employee code</dt>
                  <dd>{person.employeeCode}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="size-4 text-slate-400" aria-hidden="true" />
                  <dt className="sr-only">Email</dt>
                  <dd>{person.email}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-slate-400" aria-hidden="true" />
                  <dt className="sr-only">Joined</dt>
                  <dd>Joined {formatDate(person.joiningDate)}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="size-4 text-slate-400" aria-hidden="true" />
                  <dt className="sr-only">Manager</dt>
                  <dd>
                    Reports to{' '}
                    {person.manager ? (
                      role === 'employee' ? (
                        person.manager.name
                      ) : (
                        <Link to={`/employees/${person.manager._id}`} className="font-medium text-brand-700 hover:underline">
                          {person.manager.name}
                        </Link>
                      )
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {manageable && can('assess') && (
              <Button variant="primary" icon={Gauge} onClick={() => setAssessOpen(true)}>
                Assess competencies
              </Button>
            )}
            {manageable && can('assign') && (
              <Button icon={Plus} onClick={() => setAssignOpen(true)}>
                Assign training
              </Button>
            )}
            {can('employees.manage') && (
              <>
                <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} aria-label="Edit employee">
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)} aria-label="Delete employee" className="hover:text-red-700">
                  <Trash2 className="size-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Role readiness</p>
            <p className="tabular mt-1 text-xl font-semibold text-slate-900">{summary.assessed ? `${summary.readiness}%` : '—'}</p>
            <p className="text-xs text-slate-500">
              {summary.met} of {summary.totalCompetencies} competencies meet the requirement
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Skill gaps</p>
            <p className="tabular mt-1 text-xl font-semibold text-slate-900">{summary.gaps}</p>
            <p className="text-xs text-slate-500">{summary.priorityGaps} priority (≥ 2 levels)</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Training completed</p>
            <p className="tabular mt-1 text-xl font-semibold text-slate-900">
              {counts.Completed}/{counts.All}
            </p>
            <p className="text-xs text-slate-500">
              {counts['In Progress']} in progress · {counts.Overdue} overdue
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Development plan</p>
            <p className="mt-1 truncate text-xl font-semibold text-slate-900">{plan ? plan.targetRole : '—'}</p>
            <p className="text-xs text-slate-500">{plan ? `Review ${formatDate(plan.reviewDate)}` : 'No plan yet'}</p>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card data-reveal>
          <CardHeader
            title="Competencies — required vs current"
            subtitle={`${person.jobTitle} framework · gap = required − current (never negative)`}
            action={
              <SegmentedControl
                label="Competency category"
                value={category}
                onChange={setCategory}
                options={['All', 'Core', 'Functional', 'Behavioural'].map((value) => ({
                  value,
                  label: value,
                  count: value === 'All' ? items.length : items.filter((item) => item.competency.category === value).length,
                }))}
              />
            }
          />
          {summary.assessed === 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-glow-50 px-5 py-3 text-sm text-amber-900">
              <span>No competencies have been assessed yet — expected levels for the role are loaded below.</span>
              {manageable && can('assess') && (
                <Button size="sm" variant="primary" onClick={() => setAssessOpen(true)}>
                  Start assessment
                </Button>
              )}
            </div>
          )}
          {visibleItems.length ? (
            <div className="scrollbar-thin relative overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="table-head">
                  <tr>
                    <th className="px-5 py-2.5">Competency</th>
                    <th className="px-4 py-2.5">Current vs required</th>
                    <th className="px-4 py-2.5">Gap</th>
                    <th className="px-5 py-2.5">Suggested training</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visibleItems.map((item) => (
                    <tr key={item.competency._id} className="align-top">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">{item.competency.name}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <span className={`size-1.5 rounded-full ${CATEGORY_META[item.competency.category].dot}`} aria-hidden="true" />
                          {item.competency.category}
                          {item.lastAssessedAt && ` · assessed ${formatShortDate(item.lastAssessedAt)}`}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <LevelMeter current={item.currentLevel} required={item.requiredLevel} />
                      </td>
                      <td className="px-4 py-3">
                        <GapCell item={item} />
                      </td>
                      <td className="px-5 py-3">
                        {item.suggestedTrainings.length ? (
                          <ul className="space-y-1">
                            {item.suggestedTrainings.map((program) => (
                              <li key={program._id} className="text-xs">
                                <span className="text-slate-700">{program.title}</span>
                                {program.enrollment && <span className="ml-1 text-slate-500">· {program.enrollment.status.toLowerCase()}</span>}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No competencies in this category" />
          )}
        </Card>

        <div className="space-y-6">
          <Card data-reveal>
            <CardHeader title="Assigned training" subtitle={`${counts.All} assignments`} icon={ClipboardList} />
            {training.length ? (
              <ul className="divide-y divide-line">
                {training.map((item) => (
                  <li key={item._id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{item.program.title}</p>
                        <p className="text-xs text-slate-500">
                          {item.program.deliveryMode} · due {formatShortDate(item.dueDate)}
                          {item.completedAt && ` · completed ${formatShortDate(item.completedAt)}`}
                        </p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <ProgressBar value={item.progress} status={item.status} size="sm" className="flex-1" />
                      {(manageable || self) && item.status !== 'Completed' && (
                        <Button size="sm" variant="ghost" onClick={() => setProgressTarget({ open: true, item })}>
                          Update
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No training assigned"
                description="Assign a programme that addresses this employee’s skill gaps."
                action={
                  manageable &&
                  can('assign') && (
                    <Button size="sm" icon={Plus} onClick={() => setAssignOpen(true)}>
                      Assign training
                    </Button>
                  )
                }
              />
            )}
          </Card>

          <Card data-reveal>
            <CardHeader
              title="Career development"
              subtitle={plan ? `${plan.currentRole} → ${plan.targetRole}` : 'Development goals and mentoring'}
              icon={Flag}
              action={
                <Link to="/career-paths" className="text-sm font-medium text-brand-700 hover:underline">
                  {plan ? 'Open plan' : 'Career paths'}
                </Link>
              }
            />
            {plan ? (
              <div className="px-5 py-4">
                <dl className="mb-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Mentor (fictional)</dt>
                    <dd className="font-medium text-slate-800">{plan.mentor?.name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Next review</dt>
                    <dd className="font-medium text-slate-800">{formatDate(plan.reviewDate)}</dd>
                  </div>
                </dl>
                <ul className="space-y-2.5">
                  {plan.goals.map((goal) => (
                    <li key={goal._id} className="flex items-start justify-between gap-3 rounded-lg border border-line px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm text-slate-800">{goal.title}</p>
                        <p className="text-xs text-slate-500">
                          {goal.competency?.name || 'General'}
                          {goal.targetDate && ` · target ${formatShortDate(goal.targetDate)}`}
                        </p>
                      </div>
                      {self || manageable ? (
                        <select
                          aria-label={`Status of goal ${goal.title}`}
                          value={goal.status}
                          onChange={(event) => updateGoal(goal, event.target.value)}
                          className="input h-7 w-auto shrink-0 py-0 pr-7 text-xs"
                        >
                          {['Not Started', 'In Progress', 'Achieved'].map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      ) : (
                        <GoalStatusBadge status={goal.status} />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <EmptyState title="No development plan" description="HR or the reporting manager can create one from Career Development." />
            )}
          </Card>

          {person.role?.summary && (
            <Card data-reveal className="p-5">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Role profile (proposed)</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{person.jobTitle}</p>
              <p className="mt-1.5 text-sm text-slate-600">{person.role.summary}</p>
              {person.role.responsibilities?.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {person.role.responsibilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {person.directReports?.length > 0 && (
            <Card data-reveal>
              <CardHeader title="Direct reports" subtitle={`${person.directReports.length} people · ${shortDepartment(person.department)}`} icon={Users} />
              <ul className="divide-y divide-line">
                {person.directReports.map((report) => (
                  <li key={report._id}>
                    <Link to={`/employees/${report._id}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50">
                      <Avatar name={report.name} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800">{report.name}</span>
                        <span className="block truncate text-xs text-slate-500">{report.jobTitle}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <AssessmentDrawer
        open={assessOpen}
        onClose={() => setAssessOpen(false)}
        employee={person}
        items={items}
        onSaved={(data) => {
          competencies.setData(data);
          employee.reload();
        }}
      />
      <AssignTrainingModal open={assignOpen} onClose={() => setAssignOpen(false)} employee={person} onAssigned={refreshLearning} />
      <ProgressModal
        open={progressTarget.open}
        enrollment={progressTarget.item}
        onClose={() => setProgressTarget((current) => ({ ...current, open: false }))}
        onSaved={refreshLearning}
      />
      <EmployeeFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        employee={person}
        onSaved={() => {
          reloadMeta();
          refreshLearning();
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={remove}
        loading={deleting}
        title={`Delete ${person.name}?`}
        description="This removes the fictional employee together with their competency ratings, training assignments and development plan. This cannot be undone (re-run the seed to restore the demo data)."
        confirmLabel="Delete employee"
      />
    </div>
  );
}
