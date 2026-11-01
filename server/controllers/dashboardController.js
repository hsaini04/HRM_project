import { buildAlerts, buildDashboardSummary, buildTrainingAnalytics } from '../services/analyticsService.js';
import { resolveEmployeeScope, scopeLabel } from '../services/scopeService.js';

const scopeOptions = (query) => ({
  employeeId: query.employeeId,
  managerId: query.managerId,
  department: query.department,
});

export async function getSummary(req, res) {
  const employees = await resolveEmployeeScope(req, scopeOptions(req.query));
  const scope = scopeLabel(req, req.query);
  const data = await buildDashboardSummary(employees, { orgWide: scope === 'organisation' });
  res.json({ data: { scope, ...data } });
}

export async function getTrainingAnalytics(req, res) {
  const employees = await resolveEmployeeScope(req, scopeOptions(req.query));
  const data = await buildTrainingAnalytics(employees);
  res.json({ data: { scope: scopeLabel(req, req.query), ...data } });
}

export async function getAlerts(req, res) {
  const employees = await resolveEmployeeScope(req, scopeOptions(req.query));
  res.json({ data: await buildAlerts(employees) });
}
