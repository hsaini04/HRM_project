import { ArrowRight, ChevronRight, Info, Pencil, Plus, Route, UserRound } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useReveal } from '../animations/index.js';
import { CareerPlanFormModal } from '../components/career/CareerPlanFormModal.jsx';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  GoalStatusBadge,
  PageHeader,
  PageSkeleton,
  PersonCell,
  ProgressBar,
  SegmentedControl,
} from '../components/ui/index.js';
import { useDemo } from '../context/DemoContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { careerApi } from '../services/resources.js';
import { CATEGORY_META } from '../utils/constants.js';
import { formatDate, formatShortDate } from '../utils/format.js';

function TrackView({ track, highlightRole }) {
  return (
    <ol className="scrollbar-thin flex gap-3 overflow-x-auto px-5 pt-1 pb-5">
      {track.steps.map((step, index) => {
        const current = step.title === highlightRole;
        return (
          <li key={step.title} className="flex shrink-0 items-stretch gap-3">
            <div
              className={`flex w-64 flex-col rounded-xl border p-4 ${
                current ? 'border-brand-400 bg-brand-50/60 ring-2 ring-brand-100' : step.isFocusRole ? 'border-glow-400/60 bg-glow-50/50' : 'border-line bg-surface'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="tabular rounded-md bg-slate-900 px-1.5 py-0.5 text-[11px] font-semibold text-surface">Step {step.level}</span>
                <span className="text-xs text-slate-500">{step.headcount} in demo data</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{step.title}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {current && <Badge tone="brand">You are here</Badge>}
                {step.isFocusRole && <Badge tone="glow">Key role (Q2)</Badge>}
              </div>
              {step.summary && <p className="mt-2 line-clamp-3 text-xs text-slate-600">{step.summary}</p>}
              <div className="mt-auto pt-3">
                {index === 0 ? (
                  <p className="text-xs text-slate-500">{step.competencyCount} competencies in the entry framework</p>
                ) : (
                  <>
                    <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Key step-ups</p>
                    <ul className="space-y-1">
                      {step.stepUps.map((item) => (
                        <li key={item.name} className="flex items-center justify-between gap-2 text-xs">
                          <span className="flex min-w-0 items-center gap-1.5 text-slate-700">
                            <span className={`size-1.5 shrink-0 rounded-full ${CATEGORY_META[item.category]?.dot}`} aria-hidden="true" />
                            <span className="truncate">{item.name}</span>
                          </span>
                          <span className="tabular shrink-0 font-medium text-slate-900">
                            {item.from ? `L${item.from}` : 'new'} → L{item.to}
                          </span>
                        </li>
                      ))}
                      {!step.stepUps.length && <li className="text-xs text-slate-500">Broader scope at the same levels</li>}
                    </ul>
                  </>
                )}
              </div>
            </div>
            {index < track.steps.length - 1 && (
              <span className="grid place-items-center text-slate-300" aria-hidden="true">
                <ChevronRight className="size-5" />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function PlanCard({ plan, editable, goalEditable, onEdit, onGoalChange }) {
  const achieved = plan.goals.filter((goal) => goal.status === 'Achieved').length;
  const percent = plan.goals.length ? Math.round((achieved / plan.goals.length) * 100) : 0;
  return (
    <article data-reveal className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <Link to={`/employees/${plan.employee._id}`} className="min-w-0 hover:[&_p:first-child]:text-brand-700">
          <PersonCell name={plan.employee.name} subtitle={plan.employee.department} />
        </Link>
        <div className="flex items-center gap-1">
          <Badge tone={plan.status === 'Active' ? 'brand' : plan.status === 'Completed' ? 'success' : 'neutral'}>{plan.status}</Badge>
          {editable && (
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(plan)} aria-label={`Edit plan for ${plan.employee.name}`}>
              <Pencil className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
        <span className="min-w-0 truncate text-slate-700">{plan.currentRole}</span>
        <ArrowRight className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
        <span className="min-w-0 truncate font-semibold text-slate-900">{plan.targetRole}</span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-slate-500">Mentor (fictional)</dt>
          <dd className="mt-0.5 font-medium text-slate-800">{plan.mentor?.name || '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Next review</dt>
          <dd className="mt-0.5 font-medium text-slate-800">{formatDate(plan.reviewDate)}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-semibold tracking-wide text-slate-500 uppercase">Goals</span>
          <span className="tabular text-slate-600">
            {achieved}/{plan.goals.length} achieved
          </span>
        </div>
        <ProgressBar value={percent} status="Completed" size="sm" showValue={false} />
        <ul className="mt-3 space-y-2">
          {plan.goals.map((goal) => (
            <li key={goal._id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-slate-800">{goal.title}</p>
                <p className="text-xs text-slate-500">
                  {goal.competency?.name || 'General'}
                  {goal.targetDate && ` · target ${formatShortDate(goal.targetDate)}`}
                </p>
              </div>
              {goalEditable ? (
                <select
                  aria-label={`Status of ${goal.title}`}
                  value={goal.status}
                  onChange={(event) => onGoalChange(plan, goal, event.target.value)}
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

      {plan.recommendedTrainings.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Recommended training</p>
          <ul className="flex flex-wrap gap-1.5">
            {plan.recommendedTrainings.map((program) => (
              <li key={program._id} className="rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-700 ring-1 ring-slate-200 ring-inset">
                {program.title}
              </li>
            ))}
          </ul>
        </div>
      )}
      {plan.notes && <p className="mt-3 text-xs text-slate-500 italic">{plan.notes}</p>}
    </article>
  );
}

export default function CareerPathsPage() {
  const { role, session, can, canManage, isSelf } = useDemo();
  const toast = useToast();
  const [scope, setScope] = useState(role === 'manager' ? 'team' : 'all');
  const [trackName, setTrackName] = useState('');
  const [form, setForm] = useState({ open: false, plan: null });
  const paths = useApi(() => careerApi.paths(), []);
  const plans = useApi(() => careerApi.plans(scope === 'team' ? { managerId: session.employeeId } : {}), [scope]);
  const allPlans = useApi(() => careerApi.plans(), [], { enabled: can('career.manage') });
  const ref = useRef(null);
  const ready = Boolean(paths.data && plans.data);
  useReveal(ref, { ready });

  const myTrack = useMemo(() => paths.data?.find((track) => track.steps.some((step) => step.title === session.jobTitle))?.track, [paths.data, session]);
  const activeTrack = paths.data?.find((track) => track.track === (trackName || myTrack || 'Lighting Design')) || paths.data?.[0];

  const error = paths.error || plans.error;
  if (error && !ready) return <ErrorState error={error} onRetry={() => [paths, plans].forEach((item) => item.reload())} />;
  if (!ready) return <PageSkeleton cards={3} />;

  const onGoalChange = async (plan, goal, status) => {
    try {
      const updated = await careerApi.updateGoal(plan._id, goal._id, status);
      plans.setData((list) => list.map((item) => (item._id === updated._id ? updated : item)));
      toast.success('Goal updated', `${goal.title} → ${status}`);
    } catch (err) {
      toast.error('Could not update goal', err.message);
    }
  };
  const afterSave = () => {
    plans.reload();
    allPlans.reload();
  };

  return (
    <div ref={ref}>
      <PageHeader
        eyebrow="Growth"
        title="Career development"
        description="Role-based learning paths and individual development plans that make growth visible — supporting engagement and retention of specialist talent alongside continuous skill development."
        actions={
          can('career.manage') && (
            <Button variant="primary" icon={Plus} onClick={() => setForm({ open: true, plan: null })}>
              Create plan
            </Button>
          )
        }
      />

      <div data-reveal className="mb-6 flex items-start gap-2.5 rounded-xl border border-glow-100 bg-glow-50 px-4 py-3 text-sm text-amber-900">
        <Info className="mt-0.5 size-4 shrink-0 text-glow-600" aria-hidden="true" />
        <p>
          <strong className="font-semibold">Illustrative career paths.</strong> These tracks are proposed examples for the academic prototype, not
          Lutron Electronics’ confirmed internal promotion policy or job architecture. Headcounts refer to fictional demo records.
        </p>
      </div>

      <Card data-reveal>
        <CardHeader
          title="Role-based career tracks"
          subtitle="Each step lists the competencies whose expected level increases"
          icon={Route}
          action={
            <SegmentedControl
              label="Career track"
              value={activeTrack?.track}
              onChange={setTrackName}
              options={paths.data.map((track) => ({ value: track.track, label: track.track }))}
            />
          }
        />
        <div className="pt-4">{activeTrack && <TrackView track={activeTrack} highlightRole={session.jobTitle} />}</div>
      </Card>

      <div data-reveal className="mt-8 mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{role === 'employee' ? 'My development plan' : 'Individual development plans'}</h2>
          <p className="text-sm text-slate-500">Goals linked to competencies, mentoring and recommended training.</p>
        </div>
        {role === 'manager' && (
          <SegmentedControl
            label="Plan scope"
            value={scope}
            onChange={setScope}
            options={[
              { value: 'team', label: 'My team' },
              { value: 'all', label: 'Everyone' },
            ]}
          />
        )}
      </div>

      {plans.data.length ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {plans.data.map((plan) => {
            const editable = can('career.manage') && canManage(plan.employee);
            return (
              <PlanCard
                key={plan._id}
                plan={plan}
                editable={editable}
                goalEditable={editable || isSelf(plan.employee._id)}
                onEdit={(item) => setForm({ open: true, plan: item })}
                onGoalChange={onGoalChange}
              />
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={UserRound}
            title={role === 'employee' ? 'No development plan yet' : 'No development plans in this scope'}
            description={role === 'employee' ? 'Your manager or HR can create one with you.' : 'Create a plan to set goals, a mentor and recommended training.'}
            action={
              can('career.manage') && (
                <Button icon={Plus} onClick={() => setForm({ open: true, plan: null })}>
                  Create plan
                </Button>
              )
            }
          />
        </Card>
      )}

      <CareerPlanFormModal
        open={form.open}
        plan={form.plan}
        excludeEmployeeIds={(allPlans.data || []).map((plan) => plan.employee._id)}
        onClose={() => setForm((current) => ({ ...current, open: false }))}
        onSaved={afterSave}
      />
    </div>
  );
}
