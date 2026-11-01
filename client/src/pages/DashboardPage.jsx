import { CircleCheck, ClipboardList, Flag, Gauge, RefreshCw, Target, Users } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useReveal } from '../animations/index.js';
import { axisProps, CHART, ChartCard, ChartTooltip, chartAnimation } from '../components/charts/ChartCard.jsx';
import { ActivityCard, TopGapsCard, UpcomingDueCard } from '../components/dashboard/DashboardWidgets.jsx';
import { ProgressModal } from '../components/training/ProgressModal.jsx';
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  FilterSelect,
  GoalStatusBadge,
  KpiCard,
  LevelMeter,
  PageHeader,
  PageSkeleton,
  ProgressBar,
  SegmentedControl,
  SeverityBadge,
  StatusBadge,
} from '../components/ui/index.js';
import { useDemo } from '../context/DemoContext.jsx';
import { useMeta } from '../context/MetaContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { careerApi, competenciesApi, dashboardApi, enrollmentsApi } from '../services/resources.js';
import { SEVERITY_META, STATUS_META } from '../utils/constants.js';
import { formatDate, formatShortDate, shortDepartment } from '../utils/format.js';

function StatusChart({ data, total }) {
  const rows = data.map((row) => ({ ...row, share: total ? Math.round((row.count / total) * 100) : 0 }));
  return (
    <ChartCard
      title="Training status"
      subtitle={`${total} assignments in scope, by current status`}
      table={{
        columns: [
          { key: 'status', label: 'Status' },
          { key: 'count', label: 'Assignments', align: 'right' },
          { key: 'share', label: 'Share', align: 'right', format: (value) => `${value}%` },
        ],
        rows,
      }}
      height={230}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 84, bottom: 4, left: 8 }} barCategoryGap="28%">
          <CartesianGrid horizontal={false} stroke={CHART.grid} />
          <XAxis type="number" allowDecimals={false} {...axisProps} />
          <YAxis type="category" dataKey="status" width={92} {...axisProps} axisLine={false} />
          <Tooltip cursor={{ fill: '#f3f4f7' }} content={<ChartTooltip valueFormatter={(value) => `${value} assignments`} />} />
          <Bar dataKey="count" name="Assignments" maxBarSize={24} radius={[0, 4, 4, 0]} isAnimationActive={chartAnimation()}>
            {rows.map((row) => (
              <Cell key={row.status} fill={STATUS_META[row.status].chart} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              formatter={(value) => `${value} (${total ? Math.round((value / total) * 100) : 0}%)`}
              style={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function GapsByDepartmentChart({ data }) {
  // Department totals ride on the axis label so they stay visible even when a severity is empty.
  const rows = data.map((row) => ({ ...row, name: `${shortDepartment(row.department)} · ${row.total}` }));
  const severities = ['Moderate', 'High', 'Critical'];
  return (
    <ChartCard
      title="Skill gaps by department"
      subtitle="Competency ratings below the role requirement, by severity"
      legend={severities.map((severity) => ({ label: `${severity} (${SEVERITY_META[severity].level} level${SEVERITY_META[severity].level > 1 ? 's' : ''})`, color: SEVERITY_META[severity].chart }))}
      table={{
        columns: [
          { key: 'department', label: 'Department' },
          { key: 'Moderate', label: 'Moderate', align: 'right' },
          { key: 'High', label: 'High', align: 'right' },
          { key: 'Critical', label: 'Critical', align: 'right' },
          { key: 'total', label: 'Total', align: 'right' },
        ],
        rows,
      }}
      height={230}
    >
      {rows.some((row) => row.total > 0) ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }} barCategoryGap="26%">
            <CartesianGrid horizontal={false} stroke={CHART.grid} />
            <XAxis type="number" allowDecimals={false} {...axisProps} />
            <YAxis type="category" dataKey="name" width={170} {...axisProps} axisLine={false} />
            <Tooltip cursor={{ fill: '#f3f4f7' }} content={<ChartTooltip labelFormatter={(label, payload) => payload?.[0]?.payload?.department || label} />} />
            {severities.map((severity, index) => (
              <Bar
                key={severity}
                dataKey={severity}
                name={severity}
                stackId="gaps"
                fill={SEVERITY_META[severity].chart}
                stroke={CHART.surface}
                strokeWidth={2}
                maxBarSize={24}
                radius={index === severities.length - 1 ? [0, 4, 4, 0] : 0}
                isAnimationActive={chartAnimation()}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState title="No skill gaps recorded" />
      )}
    </ChartCard>
  );
}

function OrgDashboard() {
  const { role, session } = useDemo();
  const { meta } = useMeta();
  const [scope, setScope] = useState(role === 'manager' ? 'team' : 'organisation');
  const [department, setDepartment] = useState('');
  const params = scope === 'team' ? { managerId: session.employeeId } : { department };
  const { data, error, loading, reload } = useApi((signal) => dashboardApi.summary(params, { signal }), [scope, department]);
  const ref = useRef(null);
  useReveal(ref, { ready: Boolean(data) });
  useReveal(ref, { ready: Boolean(data), selector: '[data-kpi]', stagger: 0.08, y: 18 });

  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;
  const { kpis } = data;
  const scopeText = scope === 'team' ? 'your direct reports' : department ? shortDepartment(department) : 'the demo office';

  return (
    <div ref={ref}>
      <PageHeader
        eyebrow={scope === 'team' ? 'Team overview' : 'Learning & skills overview'}
        title={role === 'manager' ? `Welcome back, ${session.name.split(' ')[0]}` : 'Skill development dashboard'}
        description={`Training progress and skill gaps for ${scopeText}. Every figure is calculated live from the demo database.`}
        actions={
          <>
            {role === 'manager' ? (
              <SegmentedControl
                label="Dashboard scope"
                value={scope}
                onChange={setScope}
                options={[
                  { value: 'team', label: 'My team' },
                  { value: 'organisation', label: 'Whole office' },
                ]}
              />
            ) : (
              <FilterSelect
                label="Department"
                value={department}
                onChange={setDepartment}
                placeholder="All departments"
                options={(meta?.departments || []).map((item) => ({ value: item, label: shortDepartment(item) }))}
              />
            )}
            <Button icon={RefreshCw} onClick={reload} loading={loading} aria-label="Refresh dashboard">
              Refresh
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={scope === 'team' ? 'Team members' : 'Demo employees'}
          value={kpis.employees}
          icon={Users}
          caption={scope === 'team' ? 'Direct reports in the demo dataset' : 'Fictional records in this prototype'}
        />
        <KpiCard
          label="Active training assignments"
          value={kpis.activeAssignments}
          icon={ClipboardList}
          tone={kpis.overdueAssignments ? 'warning' : 'brand'}
          caption={`${kpis.overdueAssignments} overdue · ${kpis.totalAssignments} assigned in total`}
        />
        <KpiCard
          label="Completion rate"
          value={kpis.completionRate}
          decimals={1}
          suffix="%"
          icon={CircleCheck}
          tone="success"
          caption={`${kpis.completedAssignments} of ${kpis.totalAssignments} assignments completed`}
        >
          <ProgressBar value={Math.round(kpis.completionRate)} status="Completed" size="sm" showValue={false} />
        </KpiCard>
        <KpiCard
          label="Priority skill gaps"
          value={kpis.priorityGaps}
          icon={Target}
          tone="danger"
          caption={`≥ 2 levels below requirement · ${kpis.totalGaps} gaps across ${kpis.employeesWithGaps} employees`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <StatusChart data={data.statusBreakdown} total={kpis.totalAssignments} />
        <GapsByDepartmentChart data={data.gapsByDepartment} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <UpcomingDueCard items={data.upcomingDue} />
        <TopGapsCard items={data.topGapCompetencies} />
        <ActivityCard items={data.recentActivity} />
      </div>

      {meta?.ca1Context && scope === 'organisation' && !department && (
        <Card data-reveal className="mt-6 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-slate-900">Planning context · {meta.ca1Context.label}</p>
              <p className="mt-1 text-sm text-slate-600">
                CA-1 estimated the real Gurugram office at {meta.ca1Context.currentWorkforce}, with a possible near-term need of{' '}
                {meta.ca1Context.nearTermRequirement} (indicative gap {meta.ca1Context.planningGap}). These estimates are context only — this
                prototype holds {kpis.employees} fictional demo records, and every metric above is calculated from those records.
              </p>
            </div>
            <dl className="grid shrink-0 grid-cols-3 gap-4 text-center">
              {[
                ['Current (est.)', '100–105'],
                ['Near-term need', '15–25'],
                ['Planning gap', '18–23'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="text-[11px] text-slate-500">{label}</dt>
                  <dd className="tabular text-base font-semibold text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Card>
      )}
    </div>
  );
}

function EmployeeDashboard() {
  const { session } = useDemo();
  const id = session.employeeId;
  const [progressTarget, setProgressTarget] = useState({ open: false, item: null });
  const summary = useApi((signal) => dashboardApi.summary({}, { signal }), []);
  const enrollments = useApi((signal) => enrollmentsApi.list({ employee: id, limit: 50 }, { signal }), []);
  const skills = useApi(() => competenciesApi.forEmployee(id), []);
  const plans = useApi(() => careerApi.plans({ employee: id }), []);
  const ref = useRef(null);
  const ready = Boolean(summary.data && enrollments.data && skills.data && plans.data);
  useReveal(ref, { ready });
  useReveal(ref, { ready, selector: '[data-kpi]', stagger: 0.08, y: 18 });

  const firstError = summary.error || enrollments.error || skills.error || plans.error;
  if (firstError && !ready) return <ErrorState error={firstError} onRetry={() => [summary, enrollments, skills, plans].forEach((item) => item.reload())} />;
  if (!ready) return <PageSkeleton />;

  const { kpis } = summary.data;
  const open = enrollments.data.data.filter((item) => item.status !== 'Completed');
  const gaps = skills.data.items.filter((item) => item.gap > 0).sort((a, b) => b.gap - a.gap);
  const plan = plans.data[0];

  const afterSave = () => {
    summary.reload();
    enrollments.reload();
  };

  return (
    <div ref={ref}>
      <PageHeader
        eyebrow="My learning"
        title={`Welcome back, ${session.name.split(' ')[0]}`}
        description={`${session.jobTitle} · Your assigned training, skill profile and development goals.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Open assignments" value={kpis.activeAssignments} icon={ClipboardList} caption={`${kpis.overdueAssignments} overdue`} tone={kpis.overdueAssignments ? 'warning' : 'brand'} />
        <KpiCard label="Completed programmes" value={kpis.completedAssignments} icon={CircleCheck} tone="success" caption={`${kpis.completionRate}% of everything assigned to you`} />
        <KpiCard label="Average progress" value={kpis.averageProgress} suffix="%" decimals={0} icon={Gauge} caption="Across your open assignments" />
        <KpiCard label="Skill gaps" value={kpis.totalGaps} icon={Target} tone="danger" caption={`${kpis.priorityGaps} priority · readiness ${skills.data.summary.readiness}%`} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card data-reveal>
          <CardHeader
            title="My training"
            subtitle="Update progress as you complete each programme"
            icon={ClipboardList}
            action={
              <Link to="/assignments" className="text-sm font-medium text-brand-700 hover:underline">
                All my training
              </Link>
            }
          />
          {open.length ? (
            <ul className="divide-y divide-line">
              {open.map((item) => (
                <li key={item._id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">{item.program.title}</p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.program.deliveryMode} · {item.program.durationHours} h · due {formatShortDate(item.dueDate)}
                    </p>
                    <ProgressBar value={item.progress} status={item.status} size="sm" className="mt-2 max-w-md" />
                  </div>
                  <Button size="sm" variant="subtle" onClick={() => setProgressTarget({ open: true, item })}>
                    Update progress
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="All caught up" description="You have no open training assignments." />
          )}
        </Card>

        <Card data-reveal>
          <CardHeader
            title="Priority development areas"
            subtitle={`Against the ${session.jobTitle} framework`}
            icon={Target}
            action={
              <Link to={`/employees/${id}`} className="text-sm font-medium text-brand-700 hover:underline">
                Full profile
              </Link>
            }
          />
          {gaps.length ? (
            <ul className="divide-y divide-line">
              {gaps.slice(0, 6).map((item) => (
                <li key={item.competency._id} className="px-5 py-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-slate-800">{item.competency.name}</p>
                    <SeverityBadge severity={item.severity} gap={item.gap} />
                  </div>
                  <LevelMeter current={item.currentLevel} required={item.requiredLevel} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No gaps" description="You meet every requirement for your role." />
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <UpcomingDueCard items={summary.data.upcomingDue} showEmployee={false} title="My upcoming due dates" />
        <Card data-reveal>
          <CardHeader
            title="My development goals"
            subtitle={plan ? `Target role: ${plan.targetRole} · review ${formatDate(plan.reviewDate)}` : 'No development plan yet'}
            icon={Flag}
            action={
              <Link to="/career-paths" className="text-sm font-medium text-brand-700 hover:underline">
                Career development
              </Link>
            }
          />
          {plan?.goals?.length ? (
            <ul className="divide-y divide-line">
              {plan.goals.map((goal) => (
                <li key={goal._id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-800">{goal.title}</p>
                    <p className="text-xs text-slate-500">
                      {goal.competency?.name || 'General'}
                      {goal.targetDate && ` · target ${formatShortDate(goal.targetDate)}`}
                    </p>
                  </div>
                  <GoalStatusBadge status={goal.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No goals yet" description="Your manager or HR can create a development plan with you." />
          )}
        </Card>
      </div>

      <ProgressModal
        open={progressTarget.open}
        enrollment={progressTarget.item}
        onClose={() => setProgressTarget((current) => ({ ...current, open: false }))}
        onSaved={afterSave}
      />
    </div>
  );
}

export default function DashboardPage() {
  const { role } = useDemo();
  return role === 'employee' ? <EmployeeDashboard /> : <OrgDashboard />;
}
