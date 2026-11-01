import { DEPARTMENTS, ENROLLMENT_STATUSES, DELIVERY_MODES, COMPETENCY_CATEGORIES } from '../config/constants.js';
import { ActivityLog, EmployeeCompetency, TrainingEnrollment } from '../models/index.js';
import { addDays, daysBetween, startOfUTCDay } from '../utils/dates.js';
import { refreshOverdueStatuses } from './enrollmentService.js';
import { computeGapRows, summariseGaps } from './gapService.js';

const percent = (part, whole) => (whole ? Number(((part / whole) * 100).toFixed(1)) : 0);
const average = (values) => (values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)) : 0);

async function loadEnrollments(employeeIds) {
  await refreshOverdueStatuses();
  return TrainingEnrollment.find({ employee: { $in: employeeIds } })
    .populate('program', 'title deliveryMode durationHours level')
    .populate('employee', 'name employeeCode department jobTitle')
    .lean();
}

function countStatuses(enrollments) {
  const counts = Object.fromEntries(ENROLLMENT_STATUSES.map((status) => [status, 0]));
  for (const enrollment of enrollments) counts[enrollment.status] += 1;
  return counts;
}

/** KPI cards, status chart, gap summary, upcoming due dates and recent activity. */
export async function buildDashboardSummary(employees, { orgWide = false } = {}) {
  const employeeIds = employees.map((employee) => employee._id);
  const [enrollments, gapRows] = await Promise.all([
    loadEnrollments(employeeIds),
    computeGapRows(employees, { withSuggestions: false }),
  ]);

  const statusCounts = countStatuses(enrollments);
  const completed = statusCounts.Completed;
  const active = enrollments.length - completed;
  const gapSummary = summariseGaps(gapRows);
  const today = startOfUTCDay();

  const upcomingDue = enrollments
    .filter((item) => item.status !== 'Completed' && item.status !== 'Overdue')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 6)
    .map((item) => ({
      _id: item._id,
      employee: item.employee,
      program: item.program,
      dueDate: item.dueDate,
      daysLeft: daysBetween(today, item.dueDate),
      progress: item.progress,
      status: item.status,
    }));

  // Organisation-wide view also shows catalogue/framework events that are not tied to one employee.
  const activityFilter = orgWide ? {} : { employee: { $in: employeeIds } };
  const recentActivity = await ActivityLog.find(activityFilter).sort({ createdAt: -1 }).limit(8).lean();

  const presentDepartments = new Set(employees.map((employee) => employee.department));
  const gapsByDepartment = DEPARTMENTS.filter((department) => presentDepartments.has(department)).map(
    (department) =>
      gapSummary.byDepartment.find((row) => row.department === department) || {
        department,
        Moderate: 0,
        High: 0,
        Critical: 0,
        total: 0,
      },
  );

  return {
    kpis: {
      employees: employees.length,
      totalAssignments: enrollments.length,
      activeAssignments: active,
      completedAssignments: completed,
      overdueAssignments: statusCounts.Overdue,
      completionRate: percent(completed, enrollments.length),
      averageProgress: average(enrollments.filter((item) => item.status !== 'Completed').map((item) => item.progress)),
      totalGaps: gapSummary.totalGaps,
      priorityGaps: gapSummary.priorityGaps,
      employeesWithGaps: gapSummary.affectedEmployees,
    },
    statusBreakdown: ENROLLMENT_STATUSES.map((status) => ({ status, count: statusCounts[status] })),
    gapsByDepartment,
    topGapCompetencies: gapSummary.byCompetency.slice(0, 5),
    upcomingDue,
    recentActivity,
  };
}

/** Department/role/competency-level learning analytics. */
export async function buildTrainingAnalytics(employees) {
  const employeeIds = employees.map((employee) => employee._id);
  const [enrollments, gapRows] = await Promise.all([
    loadEnrollments(employeeIds),
    computeGapRows(employees, { withSuggestions: false }),
  ]);
  const gapSummary = summariseGaps(gapRows);

  // Completion and participation by department
  const presentDepartments = DEPARTMENTS.filter((department) =>
    employees.some((employee) => employee.department === department),
  );
  const byDepartment = presentDepartments.map((department) => {
    const deptEmployees = employees.filter((employee) => employee.department === department);
    const deptEnrollments = enrollments.filter((item) => item.employee?.department === department);
    const counts = countStatuses(deptEnrollments);
    const participants = new Set(deptEnrollments.map((item) => String(item.employee._id)));
    return {
      department,
      employees: deptEmployees.length,
      participants: participants.size,
      participationRate: percent(participants.size, deptEmployees.length),
      enrollments: deptEnrollments.length,
      completed: counts.Completed,
      inProgress: counts['In Progress'],
      notStarted: counts['Not Started'],
      overdue: counts.Overdue,
      completionRate: percent(counts.Completed, deptEnrollments.length),
      averageProgress: average(deptEnrollments.map((item) => item.progress)),
    };
  });

  // Average progress by job role
  const roleMap = new Map();
  for (const item of enrollments) {
    const role = item.employee?.jobTitle || 'Unknown';
    const entry = roleMap.get(role) || { jobTitle: role, progress: [], completed: 0 };
    entry.progress.push(item.progress);
    entry.completed += item.status === 'Completed' ? 1 : 0;
    roleMap.set(role, entry);
  }
  const progressByRole = [...roleMap.values()]
    .map((entry) => ({
      jobTitle: entry.jobTitle,
      enrollments: entry.progress.length,
      completed: entry.completed,
      averageProgress: average(entry.progress),
    }))
    .sort((a, b) => b.averageProgress - a.averageProgress);

  // Delivery-mode mix
  const deliveryModes = DELIVERY_MODES.map((mode) => {
    const items = enrollments.filter((item) => item.program?.deliveryMode === mode);
    return { mode, enrollments: items.length, completed: items.filter((item) => item.status === 'Completed').length };
  });

  // Monthly trend for the last six months (assignments vs completions)
  const now = new Date();
  const months = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    const inMonth = (value) => value && new Date(value) >= start && new Date(value) < end;
    months.push({
      month: start.toLocaleString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
      assigned: enrollments.filter((item) => inMonth(item.assignedAt)).length,
      completed: enrollments.filter((item) => inMonth(item.completedAt)).length,
    });
  }

  // Programme-level stats
  const programMap = new Map();
  for (const item of enrollments) {
    if (!item.program) continue;
    const key = String(item.program._id);
    const entry = programMap.get(key) || { programId: item.program._id, title: item.program.title, enrollments: 0, completed: 0 };
    entry.enrollments += 1;
    entry.completed += item.status === 'Completed' ? 1 : 0;
    programMap.set(key, entry);
  }
  const programmes = [...programMap.values()]
    .map((entry) => ({ ...entry, completionRate: percent(entry.completed, entry.enrollments) }))
    .sort((a, b) => b.enrollments - a.enrollments);

  // Gap rate = employees with a gap ÷ employees assessed on that competency.
  const assessedRows = await EmployeeCompetency.aggregate([
    { $match: { employee: { $in: employeeIds } } },
    { $group: { _id: '$competency', assessed: { $sum: 1 } } },
  ]);
  const assessedByCompetency = new Map(assessedRows.map((row) => [String(row._id), row.assessed]));
  const frequentGaps = gapSummary.byCompetency.slice(0, 8).map((item) => {
    const assessed = assessedByCompetency.get(String(item.competencyId)) || 0;
    return { ...item, assessedEmployees: assessed, gapRate: percent(item.employeesAffected, assessed) };
  });

  const completedItems = enrollments.filter((item) => item.status === 'Completed');
  const scores = completedItems.map((item) => item.assessmentScore).filter((score) => typeof score === 'number');
  const participants = new Set(enrollments.map((item) => String(item.employee?._id)));

  return {
    totals: {
      employees: employees.length,
      enrollments: enrollments.length,
      completed: completedItems.length,
      completionRate: percent(completedItems.length, enrollments.length),
      participants: participants.size,
      participationRate: percent(participants.size, employees.length),
      learningHoursCompleted: Number(
        completedItems.reduce((sum, item) => sum + (item.program?.durationHours || 0), 0).toFixed(1),
      ),
      averageAssessmentScore: average(scores),
      overdue: enrollments.filter((item) => item.status === 'Overdue').length,
    },
    byDepartment,
    progressByRole,
    deliveryModes,
    monthlyTrend: months,
    programmes,
    frequentGaps,
    gapsByCategory: COMPETENCY_CATEGORIES.map((category) => ({
      category,
      gaps: gapRows.filter((row) => row.competency.category === category).length,
      priority: gapRows.filter((row) => row.competency.category === category && row.priority).length,
    })),
    gapSeverity: gapSummary.bySeverity,
  };
}

/** Overdue items and items due within the next 7 days — used by the notification bell. */
export async function buildAlerts(employees) {
  const employeeIds = employees.map((employee) => employee._id);
  await refreshOverdueStatuses();
  const today = startOfUTCDay();
  const items = await TrainingEnrollment.find({
    employee: { $in: employeeIds },
    status: { $ne: 'Completed' },
    dueDate: { $lte: addDays(today, 7) },
  })
    .populate('program', 'title')
    .populate('employee', 'name')
    .sort({ dueDate: 1 })
    .limit(20)
    .lean();

  return items.map((item) => ({
    _id: item._id,
    type: item.status === 'Overdue' ? 'overdue' : 'due-soon',
    employee: item.employee,
    program: item.program,
    dueDate: item.dueDate,
    daysLeft: daysBetween(today, item.dueDate),
    progress: item.progress,
  }));
}
