import { Award, CircleCheck, Clock3, Users } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useReveal } from '../animations/index.js';
import { axisProps, CHART, ChartCard, ChartTooltip, chartAnimation } from '../components/charts/ChartCard.jsx';
import {
  Card,
  CardHeader,
  ErrorState,
  FilterSelect,
  KpiCard,
  PageHeader,
  PageSkeleton,
  ProgressBar,
  SegmentedControl,
} from '../components/ui/index.js';
import { useDemo } from '../context/DemoContext.jsx';
import { useMeta } from '../context/MetaContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { dashboardApi } from '../services/resources.js';
import { SEVERITY_META, STATUS_META } from '../utils/constants.js';
import { shortDepartment } from '../utils/format.js';

// Two-series charts use categorical slots 1–2 of the validated palette.
const SERIES = { assigned: '#2a78d6', completed: '#eb6834' };
const STATUS_ORDER = [
  ['completed', 'Completed'],
  ['inProgress', 'In Progress'],
  ['notStarted', 'Not Started'],
  ['overdue', 'Overdue'],
];
const percent = (value) => `${value}%`;

function CompletionByDepartment({ rows }) {
  const data = rows.map((row) => ({ ...row, name: shortDepartment(row.department) }));
  return (
    <ChartCard
      title="Training completion by department"
      subtitle="Assignments by status for each CA-1 functional group"
      legend={STATUS_ORDER.map(([, label]) => ({ label, color: STATUS_META[label].chart }))}
      table={{
        columns: [
          { key: 'department', label: 'Department' },
          { key: 'completed', label: 'Completed', align: 'right' },
          { key: 'inProgress', label: 'In progress', align: 'right' },
          { key: 'notStarted', label: 'Not started', align: 'right' },
          { key: 'overdue', label: 'Overdue', align: 'right' },
          { key: 'completionRate', label: 'Completion', align: 'right', format: percent },
        ],
        rows: data,
      }}
      height={260}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 52, bottom: 4, left: 8 }} barCategoryGap="26%">
          <CartesianGrid horizontal={false} stroke={CHART.grid} />
          <XAxis type="number" allowDecimals={false} {...axisProps} />
          <YAxis type="category" dataKey="name" width={140} {...axisProps} axisLine={false} />
          <Tooltip cursor={{ fill: CHART.cursor }} content={<ChartTooltip labelFormatter={(label, payload) => payload?.[0]?.payload?.department || label} />} />
          {STATUS_ORDER.map(([key, label], index) => (
            <Bar
              key={key}
              dataKey={key}
              name={label}
              stackId="status"
              fill={STATUS_META[label].chart}
              stroke={CHART.surface}
              strokeWidth={2}
              maxBarSize={24}
              radius={index === STATUS_ORDER.length - 1 ? [0, 4, 4, 0] : 0}
              isAnimationActive={chartAnimation()}
            >
              {index === STATUS_ORDER.length - 1 && (
                <LabelList dataKey="completionRate" position="right" formatter={(value) => `${value}% done`} style={{ fill: CHART.label, fontSize: 11, fontWeight: 500 }} />
              )}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ParticipationChart({ rows }) {
  const data = rows.map((row) => ({ ...row, name: shortDepartment(row.department) }));
  return (
    <ChartCard
      title="Training participation"
      subtitle="Share of employees with at least one assignment"
      table={{
        columns: [
          { key: 'department', label: 'Department' },
          { key: 'participants', label: 'Participants', align: 'right' },
          { key: 'employees', label: 'Employees', align: 'right' },
          { key: 'participationRate', label: 'Participation', align: 'right', format: percent },
          { key: 'averageProgress', label: 'Avg progress', align: 'right', format: percent },
        ],
        rows: data,
      }}
      height={260}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 8 }} barCategoryGap="30%">
          <CartesianGrid horizontal={false} stroke={CHART.grid} />
          <XAxis type="number" domain={[0, 100]} tickFormatter={percent} {...axisProps} />
          <YAxis type="category" dataKey="name" width={140} {...axisProps} axisLine={false} />
          <Tooltip
            cursor={{ fill: CHART.cursor }}
            content={<ChartTooltip valueFormatter={(value, entry) => `${value}% (${entry.payload.participants}/${entry.payload.employees})`} labelFormatter={(label, payload) => payload?.[0]?.payload?.department || label} />}
          />
          <Bar dataKey="participationRate" name="Participation" fill={CHART.series} maxBarSize={22} radius={[0, 4, 4, 0]} isAnimationActive={chartAnimation()}>
            <LabelList
              dataKey="participants"
              position="right"
              content={({ x, y, width, height, index }) => (
                <text x={x + width + 6} y={y + height / 2} dy={4} fontSize={11} fill={CHART.label} fontWeight={500}>
                  {data[index].participants}/{data[index].employees}
                </text>
              )}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function MonthlyTrend({ rows }) {
  return (
    <ChartCard
      title="Assignments vs completions"
      subtitle="Last six months (by assignment date and completion date)"
      legend={[
        { label: 'Assigned', color: SERIES.assigned },
        { label: 'Completed', color: SERIES.completed },
      ]}
      table={{
        columns: [
          { key: 'month', label: 'Month' },
          { key: 'assigned', label: 'Assigned', align: 'right' },
          { key: 'completed', label: 'Completed', align: 'right' },
        ],
        rows,
      }}
      height={250}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 12, right: 24, bottom: 4, left: -12 }}>
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis allowDecimals={false} {...axisProps} axisLine={false} />
          <Tooltip cursor={{ stroke: CHART.axis, strokeWidth: 1 }} content={<ChartTooltip />} />
          {[
            ['assigned', 'Assigned'],
            ['completed', 'Completed'],
          ].map(([key, name]) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={name}
              stroke={SERIES[key]}
              strokeWidth={2}
              dot={{ r: 4, fill: SERIES[key], stroke: CHART.surface, strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: CHART.surface, strokeWidth: 2 }}
              isAnimationActive={chartAnimation()}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function FrequentGaps({ rows }) {
  const data = rows.map((row) => ({ ...row, label: row.name }));
  return (
    <ChartCard
      title="Frequently occurring skill gaps"
      subtitle="Employees below requirement — label shows share of those assessed"
      table={{
        columns: [
          { key: 'name', label: 'Competency' },
          { key: 'category', label: 'Category' },
          { key: 'employeesAffected', label: 'With gap', align: 'right' },
          { key: 'assessedEmployees', label: 'Assessed', align: 'right' },
          { key: 'gapRate', label: 'Gap rate', align: 'right', format: percent },
          { key: 'averageGap', label: 'Avg gap', align: 'right' },
        ],
        rows: data,
      }}
      height={Math.max(240, data.length * 34)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 72, bottom: 4, left: 8 }} barCategoryGap="26%">
          <CartesianGrid horizontal={false} stroke={CHART.grid} />
          <XAxis type="number" allowDecimals={false} {...axisProps} />
          <YAxis type="category" dataKey="label" width={210} {...axisProps} axisLine={false} />
          <Tooltip
            cursor={{ fill: CHART.cursor }}
            content={<ChartTooltip valueFormatter={(value, entry) => `${value} of ${entry.payload.assessedEmployees} assessed (${entry.payload.gapRate}%)`} />}
          />
          <Bar dataKey="employeesAffected" name="Employees with gap" fill={SEVERITY_META.High.chart} maxBarSize={22} radius={[0, 4, 4, 0]} isAnimationActive={chartAnimation()}>
            <LabelList
              dataKey="employeesAffected"
              position="right"
              content={({ x, y, width, height, index }) => (
                <text x={x + width + 6} y={y + height / 2} dy={4} fontSize={11} fill={CHART.label} fontWeight={500}>
                  {data[index].employeesAffected} · {data[index].gapRate}%
                </text>
              )}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ProgressByRole({ rows }) {
  return (
    <ChartCard
      title="Average progress by role"
      subtitle="Mean progress across all assignments held by each job role"
      table={{
        columns: [
          { key: 'jobTitle', label: 'Job role' },
          { key: 'enrollments', label: 'Assignments', align: 'right' },
          { key: 'completed', label: 'Completed', align: 'right' },
          { key: 'averageProgress', label: 'Avg progress', align: 'right', format: percent },
        ],
        rows,
      }}
      height={Math.max(240, rows.length * 28)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 8 }} barCategoryGap="24%">
          <CartesianGrid horizontal={false} stroke={CHART.grid} />
          <XAxis type="number" domain={[0, 100]} tickFormatter={percent} {...axisProps} />
          <YAxis type="category" dataKey="jobTitle" width={210} {...axisProps} axisLine={false} />
          <Tooltip cursor={{ fill: CHART.cursor }} content={<ChartTooltip valueFormatter={(value, entry) => `${value}% · ${entry.payload.enrollments} assignments`} />} />
          <Bar dataKey="averageProgress" name="Average progress" fill={CHART.series} maxBarSize={18} radius={[0, 4, 4, 0]} isAnimationActive={chartAnimation()}>
            <LabelList dataKey="averageProgress" position="right" formatter={(value) => `${Math.round(value)}%`} style={{ fill: CHART.label, fontSize: 11, fontWeight: 500 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function DeliveryMix({ rows }) {
  return (
    <ChartCard
      title="Delivery method mix"
      subtitle="Assignments and completions by delivery method"
      legend={[
        { label: 'Assigned', color: SERIES.assigned },
        { label: 'Completed', color: SERIES.completed },
      ]}
      table={{
        columns: [
          { key: 'mode', label: 'Delivery method' },
          { key: 'enrollments', label: 'Assigned', align: 'right' },
          { key: 'completed', label: 'Completed', align: 'right' },
        ],
        rows,
      }}
      height={240}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 16, right: 8, bottom: 4, left: -16 }} barCategoryGap="30%" barGap={2}>
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis dataKey="mode" {...axisProps} />
          <YAxis allowDecimals={false} {...axisProps} axisLine={false} />
          <Tooltip cursor={{ fill: CHART.cursor }} content={<ChartTooltip />} />
          <Bar dataKey="enrollments" name="Assigned" fill={SERIES.assigned} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={chartAnimation()}>
            <LabelList dataKey="enrollments" position="top" style={{ fill: CHART.label, fontSize: 11 }} />
          </Bar>
          <Bar dataKey="completed" name="Completed" fill={SERIES.completed} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={chartAnimation()}>
            <LabelList dataKey="completed" position="top" style={{ fill: CHART.label, fontSize: 11 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default function AnalyticsPage() {
  const { role, session } = useDemo();
  const { meta } = useMeta();
  const [scope, setScope] = useState(role === 'manager' ? 'team' : 'organisation');
  const [department, setDepartment] = useState('');
  const params = scope === 'team' ? { managerId: session.employeeId } : { department };
  const { data, error, reload } = useApi((signal) => dashboardApi.analytics(params, { signal }), [scope, department]);
  const ref = useRef(null);
  useReveal(ref, { ready: Boolean(data), stagger: 0.06 });
  useReveal(ref, { ready: Boolean(data), selector: '[data-kpi]', stagger: 0.08, y: 18 });

  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;
  const { totals } = data;

  return (
    <div ref={ref}>
      <PageHeader
        eyebrow="Learning"
        title="Learning analytics"
        description="Completion, participation, progress and recurring skill gaps — every statistic is calculated from the demo records in MongoDB. Use the table icon on any chart to see its exact values."
        actions={
          role === 'manager' ? (
            <SegmentedControl
              label="Scope"
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
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Completion rate" value={totals.completionRate} decimals={1} suffix="%" icon={CircleCheck} tone="success" caption={`${totals.completed} of ${totals.enrollments} assignments`} />
        <KpiCard label="Participation" value={totals.participationRate} decimals={1} suffix="%" icon={Users} caption={`${totals.participants} of ${totals.employees} employees have training assigned`} />
        <KpiCard label="Learning hours completed" value={totals.learningHoursCompleted} icon={Clock3} tone="neutral" caption="Sum of programme hours for completed assignments" />
        <KpiCard
          label="Avg assessment score"
          value={totals.averageAssessmentScore}
          decimals={1}
          icon={Award}
          tone="brand"
          caption="Post-training assessments (demo field)"
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <CompletionByDepartment rows={data.byDepartment} />
        <ParticipationChart rows={data.byDepartment} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <FrequentGaps rows={data.frequentGaps} />
        <MonthlyTrend rows={data.monthlyTrend} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <ProgressByRole rows={data.progressByRole} />
        <div className="grid gap-4">
          <DeliveryMix rows={data.deliveryModes} />
          <Card data-reveal>
            <CardHeader title="Gaps by competency category" subtitle="All gaps vs priority gaps (2+ levels)" />
            <ul className="space-y-3 px-5 py-4">
              {data.gapsByCategory.map((row) => (
                <li key={row.category}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-700">{row.category}</span>
                    <span className="tabular text-xs text-slate-500">
                      <span className="font-semibold text-slate-900">{row.gaps}</span> gaps · {row.priority} priority
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-(--chart-sev-1)" style={{ width: `${(row.gaps / Math.max(1, ...data.gapsByCategory.map((item) => item.gaps))) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <Card data-reveal className="mt-4">
        <CardHeader title="Programme performance" subtitle="Assignments and completion rate per programme" />
        <div className="scrollbar-thin relative overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-5 py-2.5">Programme</th>
                <th className="px-4 py-2.5 text-right">Assigned</th>
                <th className="px-4 py-2.5 text-right">Completed</th>
                <th className="w-64 px-5 py-2.5">Completion rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.programmes.map((row) => (
                <tr key={row.programId}>
                  <td className="px-5 py-2.5 text-slate-800">{row.title}</td>
                  <td className="tabular px-4 py-2.5 text-right text-slate-700">{row.enrollments}</td>
                  <td className="tabular px-4 py-2.5 text-right text-slate-700">{row.completed}</td>
                  <td className="px-5 py-2.5">
                    <ProgressBar value={Math.round(row.completionRate)} status="Completed" size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
