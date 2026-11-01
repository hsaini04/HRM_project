import { PRIORITY_GAP_THRESHOLD } from '../config/constants.js';
import { EmployeeCompetency, TrainingEnrollment, TrainingProgram } from '../models/index.js';

export const GAP_SEVERITIES = ['Critical', 'High', 'Moderate'];

/** Skill gap = requiredLevel − currentLevel, floored at 0 (exceeding a requirement is not a deficiency). */
export function calculateGap(requiredLevel, currentLevel) {
  if (currentLevel === null || currentLevel === undefined) return null;
  return Math.max(0, requiredLevel - currentLevel);
}

export function gapSeverity(gap) {
  if (gap === null || gap === undefined) return 'Not assessed';
  if (gap >= 3) return 'Critical';
  if (gap === 2) return 'High';
  if (gap === 1) return 'Moderate';
  return 'None';
}

export const isPriorityGap = (gap) => gap !== null && gap >= PRIORITY_GAP_THRESHOLD;

function matchesSeverity(gap, severity) {
  if (!severity) return true;
  if (severity === 'priority') return isPriorityGap(gap);
  return gapSeverity(gap) === severity;
}

/**
 * Builds a lookup of active programmes per competency and of each employee's enrolments,
 * so gap rows can recommend relevant training and show whether it is already assigned.
 */
export async function buildTrainingIndex(employeeIds) {
  const [programs, enrollments] = await Promise.all([
    TrainingProgram.find({ status: 'Active' })
      .select('title competencies targetRoles deliveryMode durationHours level')
      .lean(),
    TrainingEnrollment.find({ employee: { $in: employeeIds } })
      .select('employee program status progress')
      .lean(),
  ]);

  const programsByCompetency = new Map();
  for (const program of programs) {
    for (const competencyId of program.competencies) {
      const key = String(competencyId);
      if (!programsByCompetency.has(key)) programsByCompetency.set(key, []);
      programsByCompetency.get(key).push(program);
    }
  }

  const enrollmentByEmployeeProgram = new Map();
  for (const enrollment of enrollments) {
    enrollmentByEmployeeProgram.set(`${enrollment.employee}:${enrollment.program}`, enrollment);
  }

  return { programsByCompetency, enrollmentByEmployeeProgram };
}

export function suggestTrainings(index, employee, competencyId, limit = 3) {
  const candidates = index.programsByCompetency.get(String(competencyId)) || [];
  return candidates
    .map((program) => {
      const targeted = !program.targetRoles?.length || program.targetRoles.includes(employee.jobTitle);
      const enrollment = index.enrollmentByEmployeeProgram.get(`${employee._id}:${program._id}`) || null;
      return {
        _id: program._id,
        title: program.title,
        deliveryMode: program.deliveryMode,
        durationHours: program.durationHours,
        level: program.level,
        targetedToRole: targeted,
        enrollment: enrollment
          ? { _id: enrollment._id, status: enrollment.status, progress: enrollment.progress }
          : null,
      };
    })
    .sort((a, b) => Number(b.targetedToRole) - Number(a.targetedToRole) || a.title.localeCompare(b.title))
    .slice(0, limit);
}

/**
 * Returns one row per (employee, competency) assessment where a positive gap exists.
 */
export async function computeGapRows(employees, { competencyId, category, severity, withSuggestions = true } = {}) {
  if (!employees.length) return [];
  const employeeById = new Map(employees.map((employee) => [String(employee._id), employee]));
  const employeeIds = employees.map((employee) => employee._id);

  const filter = { employee: { $in: employeeIds } };
  if (competencyId) filter.competency = competencyId;

  const records = await EmployeeCompetency.find(filter)
    .populate('competency', 'name category active')
    .lean();

  const index = withSuggestions ? await buildTrainingIndex(employeeIds) : null;
  const rows = [];

  for (const record of records) {
    if (!record.competency || record.competency.active === false) continue;
    if (category && record.competency.category !== category) continue;

    const gap = calculateGap(record.requiredLevel, record.currentLevel);
    if (!gap || !matchesSeverity(gap, severity)) continue;

    const employee = employeeById.get(String(record.employee));
    rows.push({
      _id: record._id,
      employee,
      competency: { _id: record.competency._id, name: record.competency.name, category: record.competency.category },
      requiredLevel: record.requiredLevel,
      currentLevel: record.currentLevel,
      gap,
      severity: gapSeverity(gap),
      priority: isPriorityGap(gap),
      lastAssessedAt: record.lastAssessedAt,
      suggestedTrainings: index ? suggestTrainings(index, employee, record.competency._id) : [],
    });
  }

  return rows.sort(
    (a, b) =>
      b.gap - a.gap ||
      a.competency.name.localeCompare(b.competency.name) ||
      a.employee.name.localeCompare(b.employee.name),
  );
}

export function summariseGaps(rows) {
  const bySeverity = { Critical: 0, High: 0, Moderate: 0 };
  const competencyMap = new Map();
  const departmentMap = new Map();
  const affected = new Set();

  for (const row of rows) {
    bySeverity[row.severity] += 1;
    affected.add(String(row.employee._id));

    const compKey = String(row.competency._id);
    const comp = competencyMap.get(compKey) || {
      competencyId: row.competency._id,
      name: row.competency.name,
      category: row.competency.category,
      employeesAffected: 0,
      priorityCount: 0,
      totalGap: 0,
    };
    comp.employeesAffected += 1;
    comp.priorityCount += row.priority ? 1 : 0;
    comp.totalGap += row.gap;
    competencyMap.set(compKey, comp);

    const dept = departmentMap.get(row.employee.department) || {
      department: row.employee.department,
      Moderate: 0,
      High: 0,
      Critical: 0,
      total: 0,
    };
    dept[row.severity] += 1;
    dept.total += 1;
    departmentMap.set(row.employee.department, dept);
  }

  const byCompetency = [...competencyMap.values()]
    .map((item) => ({ ...item, averageGap: Number((item.totalGap / item.employeesAffected).toFixed(2)) }))
    .sort((a, b) => b.employeesAffected - a.employeesAffected || b.priorityCount - a.priorityCount);

  return {
    totalGaps: rows.length,
    priorityGaps: rows.filter((row) => row.priority).length,
    affectedEmployees: affected.size,
    bySeverity,
    byCompetency,
    byDepartment: [...departmentMap.values()].sort((a, b) => b.total - a.total),
  };
}
