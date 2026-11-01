import { Plus, Target, TriangleAlert, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useReveal } from '../animations/index.js';
import { axisProps, CHART, ChartCard, ChartTooltip, chartAnimation } from '../components/charts/ChartCard.jsx';
import { AssignTrainingModal } from '../components/training/AssignTrainingModal.jsx';
import {
  Badge,
  Button,
  Card,
  CategoryBadge,
  EmptyState,
  ErrorState,
  FilterSelect,
  KpiCard,
  LevelMeter,
  PageHeader,
  Pagination,
  PersonCell,
  SegmentedControl,
  SeverityBadge,
  SkeletonRows,
} from '../components/ui/index.js';
import { useDemo } from '../context/DemoContext.jsx';
import { useMeta } from '../context/MetaContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { competenciesApi, skillsApi } from '../services/resources.js';
import { SEVERITY_META } from '../utils/constants.js';
import { shortDepartment } from '../utils/format.js';

const PAGE_SIZE = 12;

function GapsByCompetencyChart({ rows }) {
  const data = rows.slice(0, 10).map((row) => ({
    name: row.name,
    Moderate: row.employeesAffected - row.priorityCount,
    'High / critical': row.priorityCount,
    total: row.employeesAffected,
    category: row.category,
  }));
  return (
    <ChartCard
      title="Gaps by competency"
      subtitle="Employees below the role requirement (top 10 in current filter)"
      legend={[
        { label: 'Moderate (1 level)', color: SEVERITY_META.Moderate.chart },
        { label: 'High / critical (2+ levels)', color: SEVERITY_META.High.chart },
      ]}
      table={{
        columns: [
          { key: 'name', label: 'Competency' },
          { key: 'category', label: 'Category' },
          { key: 'Moderate', label: 'Moderate', align: 'right' },
          { key: 'High / critical', label: 'High / critical', align: 'right' },
          { key: 'total', label: 'Employees', align: 'right' },
        ],
        rows: data,
      }}
      height={Math.max(240, data.length * 44)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 8 }} barCategoryGap="24%">
          <CartesianGrid horizontal={false} stroke={CHART.grid} />
          <XAxis type="number" allowDecimals={false} {...axisProps} />
          <YAxis type="category" dataKey="name" width={210} {...axisProps} axisLine={false} tick={{ ...axisProps.tick, width: 200 }} />
          <Tooltip cursor={{ fill: CHART.cursor }} content={<ChartTooltip valueFormatter={(value) => `${value} employee${value === 1 ? '' : 's'}`} />} />
          <Bar dataKey="Moderate" stackId="g" fill={SEVERITY_META.Moderate.chart} stroke={CHART.surface} strokeWidth={2} maxBarSize={22} isAnimationActive={chartAnimation()} />
          <Bar dataKey="High / critical" stackId="g" fill={SEVERITY_META.High.chart} stroke={CHART.surface} strokeWidth={2} maxBarSize={22} radius={[0, 4, 4, 0]} isAnimationActive={chartAnimation()} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default function SkillGapsPage() {
  const { role, session, can, canManage } = useDemo();
  const { meta } = useMeta();
  const [scope, setScope] = useState(role === 'manager' ? 'team' : 'all');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [competency, setCompetency] = useState('');
  const [severity, setSeverity] = useState('');
  const [page, setPage] = useState(1);
  const [assign, setAssign] = useState({ open: false, employee: null, programIds: [] });

  const filters = {
    department,
    jobTitle,
    competency,
    severity,
    managerId: scope === 'team' ? session.employeeId : undefined,
  };
  const { data, error, loading, reload } = useApi((signal) => skillsApi.gaps(filters, { signal }), [scope, department, jobTitle, competency, severity]);
  const competencies = useApi(() => competenciesApi.list(), []);
  const ref = useRef(null);
  useReveal(ref, { ready: Boolean(data) });
  useReveal(ref, { ready: Boolean(data), selector: '[data-kpi]', stagger: 0.07 });
  useEffect(() => setPage(1), [scope, department, jobTitle, competency, severity]);

  const roleOptions = useMemo(
    () => (meta?.jobRoles || []).filter((item) => item.headcount > 0 && (!department || item.department === department)).map((item) => item.title),
    [meta, department],
  );

  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  const rows = data?.data || [];
  const summary = data?.summary;
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isEmployee = role === 'employee';

  return (
    <div ref={ref}>
      <PageHeader
        eyebrow="Skills"
        title={isEmployee ? 'My skill gaps' : 'Skill gap analysis'}
        description="Gap = required level − current level for each assessed competency (levels above the requirement are never counted as gaps). Priority gaps are 2 or more levels below the requirement."
        actions={
          role === 'manager' && (
            <SegmentedControl
              label="Scope"
              value={scope}
              onChange={setScope}
              options={[
                { value: 'team', label: 'My team' },
                { value: 'all', label: 'Whole office' },
              ]}
            />
          )
        }
      />

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Skill gaps" value={summary.totalGaps} icon={Target} tone="warning" caption="Assessed competencies below requirement" />
          <KpiCard label="Priority gaps" value={summary.priorityGaps} icon={TriangleAlert} tone="danger" caption={`High ${summary.bySeverity.High} · Critical ${summary.bySeverity.Critical}`} />
          <KpiCard label="Employees affected" value={summary.affectedEmployees} icon={Users} tone="neutral" caption={`of ${summary.employeesInScope} employees in scope`} />
          <div data-kpi className="card flex flex-col gap-2 p-5">
            <p className="text-sm font-medium text-slate-600">Most frequent gap</p>
            <p className="text-lg leading-snug font-semibold text-slate-900">{summary.byCompetency[0]?.name || '—'}</p>
            {summary.byCompetency[0] && (
              <p className="text-xs text-slate-500">
                {summary.byCompetency[0].employeesAffected} employees · avg gap {summary.byCompetency[0].averageGap}
              </p>
            )}
          </div>
        </div>
      )}

      <Card data-reveal className="mt-6">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
          {!isEmployee && (
            <>
              <FilterSelect
                label="Department"
                value={department}
                onChange={(value) => {
                  setDepartment(value);
                  setJobTitle('');
                }}
                placeholder="All departments"
                options={(meta?.departments || []).map((item) => ({ value: item, label: shortDepartment(item) }))}
              />
              <FilterSelect label="Job role" value={jobTitle} onChange={setJobTitle} placeholder="All roles" options={roleOptions} />
            </>
          )}
          <FilterSelect
            label="Competency"
            value={competency}
            onChange={setCompetency}
            placeholder="All competencies"
            options={(competencies.data || []).map((item) => ({ value: item._id, label: item.name }))}
            className="max-w-64"
          />
          <FilterSelect
            label="Severity"
            value={severity}
            onChange={setSeverity}
            placeholder="All severities"
            options={[
              { value: 'priority', label: 'Priority only (2+ levels)' },
              { value: 'Critical', label: 'Critical (3 levels)' },
              { value: 'High', label: 'High (2 levels)' },
              { value: 'Moderate', label: 'Moderate (1 level)' },
            ]}
          />
          {(department || jobTitle || competency || severity) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDepartment('');
                setJobTitle('');
                setCompetency('');
                setSeverity('');
              }}
            >
              Clear filters
            </Button>
          )}
          <span className="ml-auto text-xs text-slate-500">{loading ? 'Updating…' : `${rows.length} gap${rows.length === 1 ? '' : 's'}`}</span>
        </div>

        {!data ? (
          <SkeletonRows rows={8} />
        ) : rows.length === 0 ? (
          <EmptyState icon={Target} title="No skill gaps for this selection" description="Everyone in scope meets the expected level, or no assessments match the filters." />
        ) : (
          <>
            <div className={`scrollbar-thin relative overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
              <table className="w-full min-w-[640px] text-sm">
                <thead className="table-head">
                  <tr>
                    {!isEmployee && <th className="px-5 py-3">Employee</th>}
                    <th className="px-4 py-3">Competency</th>
                    <th className="px-4 py-3">Level &amp; gap</th>
                    <th className="px-5 py-3">Suggested training</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pageRows.map((row) => {
                    const manageable = can('assign') && canManage(row.employee);
                    return (
                      <tr key={row._id} className="align-top hover:bg-slate-50/60">
                        {!isEmployee && (
                          <td className="px-5 py-3">
                            <Link to={`/employees/${row.employee._id}`} className="block max-w-40 hover:[&_p:first-child]:text-brand-700">
                              <PersonCell name={row.employee.name} subtitle={row.employee.jobTitle} size="sm" />
                            </Link>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{row.competency.name}</p>
                          <div className="mt-1">
                            <CategoryBadge category={row.competency.category} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <LevelMeter current={row.currentLevel} required={row.requiredLevel} />
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <SeverityBadge severity={row.severity} gap={row.gap} />
                            <span className="tabular text-xs text-slate-500">
                              {row.requiredLevel} − {row.currentLevel} = {row.gap}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {row.suggestedTrainings.length ? (
                            <ul className="space-y-1.5">
                              {row.suggestedTrainings.map((program) => (
                                <li key={program._id} className="flex flex-wrap items-center gap-1.5 text-xs">
                                  <span className="text-slate-700">{program.title}</span>
                                  {program.enrollment ? (
                                    <Badge tone={program.enrollment.status === 'Completed' ? 'success' : program.enrollment.status === 'Overdue' ? 'danger' : 'brand'}>
                                      {program.enrollment.status}
                                      {program.enrollment.status !== 'Completed' && ` · ${program.enrollment.progress}%`}
                                    </Badge>
                                  ) : (
                                    manageable && (
                                      <button
                                        type="button"
                                        onClick={() => setAssign({ open: true, employee: row.employee, programIds: [program._id] })}
                                        className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium text-brand-700 hover:bg-brand-50"
                                      >
                                        <Plus className="size-3" aria-hidden="true" />
                                        Assign
                                      </button>
                                    )
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-xs text-slate-400">No matching programme yet</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} limit={PAGE_SIZE} total={rows.length} totalPages={Math.ceil(rows.length / PAGE_SIZE)} onChange={setPage} noun="gaps" />
          </>
        )}
      </Card>

      {summary?.byCompetency?.length > 0 && (
        <div className="mt-6">
          <GapsByCompetencyChart rows={summary.byCompetency} />
        </div>
      )}

      <AssignTrainingModal
        open={assign.open}
        employee={assign.employee}
        defaultProgramIds={assign.programIds}
        onClose={() => setAssign((current) => ({ ...current, open: false }))}
        onAssigned={reload}
      />
    </div>
  );
}
