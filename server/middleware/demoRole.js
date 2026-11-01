import { DEMO_ROLE_LABELS, DEMO_ROLES } from '../config/constants.js';
import { Employee } from '../models/index.js';
import { badRequest, forbidden } from '../utils/httpError.js';
import { isObjectId } from '../utils/query.js';

/**
 * Demo role context for the academic prototype.
 *
 * The React client sends `X-Demo-Role` (hr | manager | employee) and `X-Demo-Employee`
 * (the persona's employee id). This lets the API apply role-appropriate permissions during a
 * demonstration. It is NOT authentication — headers can be changed by anyone — and requests
 * without a header default to the HR/Admin role so the API can be explored with curl.
 */
export function demoContext(req, res, next) {
  const role = String(req.get('x-demo-role') || 'hr').toLowerCase();
  if (!DEMO_ROLES.includes(role)) {
    return next(badRequest(`Unknown demo role "${role}". Use one of: ${DEMO_ROLES.join(', ')}`));
  }

  const employeeId = req.get('x-demo-employee') || null;
  if (employeeId && !isObjectId(employeeId)) {
    return next(badRequest('X-Demo-Employee must be a valid employee id'));
  }
  if (role === 'employee' && !employeeId) {
    return next(badRequest('The Employee demo role needs an X-Demo-Employee header'));
  }

  req.demo = { role, employeeId, label: DEMO_ROLE_LABELS[role] };
  return next();
}

export const allowRoles =
  (...roles) =>
  (req, res, next) => {
    if (roles.includes(req.demo.role)) return next();
    return next(forbidden(`The ${req.demo.label} demo role cannot perform this action`));
  };

// Employees may only read their own personal records.
export function assertCanViewEmployee(req, employeeId) {
  if (req.demo.role === 'employee' && String(employeeId) !== String(req.demo.employeeId)) {
    throw forbidden('In the Employee demo role you can only view your own records');
  }
}

// HR can act on anyone; managers only on their direct reports; employees optionally on themselves.
export function assertCanManageEmployee(req, employee, { allowSelf = false } = {}) {
  const { role, employeeId, label } = req.demo;
  if (role === 'hr') return;
  if (role === 'manager' && String(employee.manager) === String(employeeId)) return;
  if (allowSelf && String(employee._id) === String(employeeId)) return;
  if (role === 'manager') throw forbidden('Managers can only perform this action for their direct reports');
  throw forbidden(`The ${label} demo role cannot perform this action`);
}

export async function getActor(req) {
  const fallback = { name: req.demo.label, role: req.demo.role, id: null };
  if (!req.demo.employeeId) return fallback;
  const person = await Employee.findById(req.demo.employeeId).select('name').lean();
  return person ? { name: person.name, role: req.demo.role, id: person._id } : fallback;
}
