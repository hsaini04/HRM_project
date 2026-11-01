import { COMPETENCY_CATEGORIES } from '../config/constants.js';
import { computeGapRows, GAP_SEVERITIES, summariseGaps } from '../services/gapService.js';
import { resolveEmployeeScope } from '../services/scopeService.js';
import { assertOneOf, optionalObjectId } from '../utils/query.js';

export async function listSkillGaps(req, res) {
  const { department, jobTitle, managerId, employeeId, competency, category, severity } = req.query;

  const employees = await resolveEmployeeScope(req, { department, jobTitle, managerId, employeeId });
  const rows = await computeGapRows(employees, {
    competencyId: optionalObjectId(competency, 'competency'),
    category: assertOneOf(category, COMPETENCY_CATEGORIES, 'category'),
    severity: assertOneOf(severity, [...GAP_SEVERITIES, 'priority'], 'severity'),
  });

  res.json({
    data: rows,
    summary: { ...summariseGaps(rows), employeesInScope: employees.length },
  });
}
