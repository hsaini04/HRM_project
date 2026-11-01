import { DEPARTMENTS, EMPLOYMENT_STATUSES } from '../config/constants.js';
import { assertCanViewEmployee, getActor } from '../middleware/demoRole.js';
import {
  CareerPlan,
  Employee,
  EmployeeCompetency,
  JobRole,
  TrainingEnrollment,
} from '../models/index.js';
import { logActivity } from '../services/activityService.js';
import { syncRequirementsForEmployee } from '../services/frameworkService.js';
import { badRequest, conflict, notFound } from '../utils/httpError.js';
import {
  assertOneOf,
  escapeRegex,
  optionalObjectId,
  paginationMeta,
  parsePagination,
  pick,
} from '../utils/query.js';

const EDITABLE_FIELDS = [
  'employeeCode',
  'name',
  'email',
  'department',
  'jobTitle',
  'manager',
  'joiningDate',
  'employmentStatus',
];

const SORTS = {
  name: { name: 1 },
  '-name': { name: -1 },
  department: { department: 1, name: 1 },
  jobTitle: { jobTitle: 1, name: 1 },
  joiningDate: { joiningDate: 1 },
  '-joiningDate': { joiningDate: -1 },
  employeeCode: { employeeCode: 1 },
};

async function learningSnapshot(employeeIds) {
  const [enrollmentRows, gapRows] = await Promise.all([
    TrainingEnrollment.aggregate([
      { $match: { employee: { $in: employeeIds } } },
      {
        $group: {
          _id: '$employee',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          overdue: { $sum: { $cond: [{ $eq: ['$status', 'Overdue'] }, 1, 0] } },
          averageProgress: { $avg: '$progress' },
        },
      },
    ]),
    EmployeeCompetency.aggregate([
      { $match: { employee: { $in: employeeIds }, $expr: { $gt: ['$requiredLevel', '$currentLevel'] } } },
      {
        $group: {
          _id: '$employee',
          gaps: { $sum: 1 },
          priorityGaps: {
            $sum: { $cond: [{ $gte: [{ $subtract: ['$requiredLevel', '$currentLevel'] }, 2] }, 1, 0] },
          },
        },
      },
    ]),
  ]);
  const enrollments = new Map(enrollmentRows.map((row) => [String(row._id), row]));
  const gaps = new Map(gapRows.map((row) => [String(row._id), row]));
  return (id) => {
    const e = enrollments.get(String(id));
    const g = gaps.get(String(id));
    return {
      assignments: e?.total || 0,
      completed: e?.completed || 0,
      overdue: e?.overdue || 0,
      averageProgress: e ? Math.round(e.averageProgress) : 0,
      gaps: g?.gaps || 0,
      priorityGaps: g?.priorityGaps || 0,
    };
  };
}

async function validateRelations(payload, existingId) {
  if (payload.jobTitle !== undefined || payload.department !== undefined) {
    const role = await JobRole.findOne({ title: payload.jobTitle }).lean();
    if (!role) {
      throw badRequest('Validation failed', { jobTitle: 'Select a job role from the role framework' });
    }
    if (payload.department && role.department !== payload.department) {
      throw badRequest('Validation failed', {
        jobTitle: `"${role.title}" belongs to ${role.department}. Choose a role from the selected department.`,
      });
    }
  }

  if (payload.manager) {
    optionalObjectId(payload.manager, 'manager');
    if (existingId && String(payload.manager) === String(existingId)) {
      throw badRequest('Validation failed', { manager: 'An employee cannot be their own manager' });
    }
    const manager = await Employee.findById(payload.manager).select('manager').lean();
    if (!manager) throw badRequest('Validation failed', { manager: 'Selected manager does not exist' });

    // Prevent reporting loops (A manages B manages A).
    let cursor = manager;
    for (let depth = 0; cursor?.manager && depth < 10; depth += 1) {
      if (existingId && String(cursor.manager) === String(existingId)) {
        throw badRequest('Validation failed', { manager: 'This would create a circular reporting line' });
      }
      cursor = await Employee.findById(cursor.manager).select('manager').lean();
    }
  }
}

export async function listEmployees(req, res) {
  const { search, department, jobTitle, managerId, status, sort = 'name' } = req.query;
  const filter = {};

  if (req.demo.role === 'employee') filter._id = req.demo.employeeId;
  if (department) filter.department = assertOneOf(department, DEPARTMENTS, 'department');
  if (jobTitle) filter.jobTitle = String(jobTitle);
  if (managerId) filter.manager = optionalObjectId(managerId, 'managerId');
  if (status) filter.employmentStatus = assertOneOf(status, EMPLOYMENT_STATUSES, 'status');
  if (search) {
    const pattern = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ name: pattern }, { employeeCode: pattern }, { email: pattern }, { jobTitle: pattern }];
  }

  const pagination = parsePagination(req.query, { defaultLimit: 10, maxLimit: 100 });
  const [items, total] = await Promise.all([
    Employee.find(filter)
      .populate('manager', 'name jobTitle')
      .sort(SORTS[sort] || SORTS.name)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Employee.countDocuments(filter),
  ]);

  const snapshot = await learningSnapshot(items.map((item) => item._id));
  res.json({
    data: items.map((item) => ({ ...item, learning: snapshot(item._id) })),
    meta: paginationMeta(pagination, total),
  });
}

export async function getEmployee(req, res) {
  assertCanViewEmployee(req, req.params.id);
  const employee = await Employee.findById(req.params.id).populate('manager', 'name jobTitle employeeCode').lean();
  if (!employee) throw notFound('Employee');

  const [directReports, role] = await Promise.all([
    Employee.find({ manager: employee._id }).select('name jobTitle employeeCode').sort({ name: 1 }).lean(),
    JobRole.findOne({ title: employee.jobTitle }).lean(),
  ]);
  const snapshot = await learningSnapshot([employee._id]);

  res.json({ data: { ...employee, role, directReports, learning: snapshot(employee._id) } });
}

export async function createEmployee(req, res) {
  const payload = pick(req.body, EDITABLE_FIELDS);
  if (!payload.manager) payload.manager = null;
  await validateRelations(payload);

  const employee = await Employee.create(payload);
  const actor = await getActor(req);
  await logActivity({
    type: 'employee.created',
    message: `${actor.name} added ${employee.name} (${employee.jobTitle}) to the directory`,
    actor,
    employee: employee._id,
  });

  res.status(201).json({ data: employee });
}

export async function updateEmployee(req, res) {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw notFound('Employee');

  const payload = pick(req.body, EDITABLE_FIELDS);
  if ('manager' in payload && !payload.manager) payload.manager = null;
  const roleChanged = payload.jobTitle !== undefined && payload.jobTitle !== employee.jobTitle;

  await validateRelations(
    {
      ...payload,
      jobTitle: payload.jobTitle ?? employee.jobTitle,
      department: payload.department ?? employee.department,
    },
    employee._id,
  );

  employee.set(payload);
  await employee.save();
  if (roleChanged) await syncRequirementsForEmployee(employee);

  const actor = await getActor(req);
  await logActivity({
    type: 'employee.updated',
    message: roleChanged
      ? `${actor.name} moved ${employee.name} to the ${employee.jobTitle} role`
      : `${actor.name} updated ${employee.name}'s profile`,
    actor,
    employee: employee._id,
  });

  res.json({ data: employee });
}

export async function deleteEmployee(req, res) {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw notFound('Employee');

  const reports = await Employee.countDocuments({ manager: employee._id });
  if (reports > 0) {
    throw conflict(`${employee.name} manages ${reports} employee(s). Reassign their reports before deleting.`);
  }

  // Remove dependent learning records first so no orphaned references remain.
  await Promise.all([
    EmployeeCompetency.deleteMany({ employee: employee._id }),
    TrainingEnrollment.deleteMany({ employee: employee._id }),
    CareerPlan.deleteMany({ employee: employee._id }),
    CareerPlan.updateMany({ mentor: employee._id }, { $set: { mentor: null } }),
  ]);
  await employee.deleteOne();

  const actor = await getActor(req);
  await logActivity({
    type: 'employee.deleted',
    message: `${actor.name} removed ${employee.name} and their learning records from the demo directory`,
    actor,
  });

  res.status(204).end();
}
