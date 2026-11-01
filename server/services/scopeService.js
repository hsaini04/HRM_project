import { DEPARTMENTS } from '../config/constants.js';
import { Employee } from '../models/index.js';
import { assertObjectId, assertOneOf } from '../utils/query.js';

/**
 * Resolves which (non-inactive) employees a report or list should cover.
 * Employee-role requests are always limited to the persona's own record.
 */
export async function resolveEmployeeScope(req, { employeeId, managerId, department, jobTitle } = {}) {
  const filter = { employmentStatus: { $ne: 'Inactive' } };

  const selfId = req.demo.role === 'employee' ? req.demo.employeeId : employeeId;
  if (selfId) filter._id = assertObjectId(selfId, 'employeeId');
  if (managerId) filter.manager = assertObjectId(managerId, 'managerId');
  if (department) filter.department = assertOneOf(department, DEPARTMENTS, 'department');
  if (jobTitle) filter.jobTitle = String(jobTitle);

  return Employee.find(filter)
    .select('name employeeCode department jobTitle manager employmentStatus')
    .sort({ name: 1 })
    .lean();
}

export function scopeLabel(req, query) {
  if (req.demo.role === 'employee' || query.employeeId) return 'self';
  if (query.managerId) return 'team';
  if (query.department) return 'department';
  return 'organisation';
}
