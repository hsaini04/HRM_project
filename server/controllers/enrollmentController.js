import { ENROLLMENT_STATUSES } from '../config/constants.js';
import { assertCanManageEmployee, assertCanViewEmployee, getActor } from '../middleware/demoRole.js';
import { Employee, TrainingEnrollment, TrainingProgram } from '../models/index.js';
import { logActivity } from '../services/activityService.js';
import { refreshOverdueStatuses } from '../services/enrollmentService.js';
import { resolveEmployeeScope } from '../services/scopeService.js';
import { parseDateInput, startOfUTCDay } from '../utils/dates.js';
import { badRequest, conflict, notFound } from '../utils/httpError.js';
import {
  assertOneOf,
  escapeRegex,
  isObjectId,
  optionalObjectId,
  paginationMeta,
  parsePagination,
} from '../utils/query.js';

const SORTS = {
  dueDate: { dueDate: 1 },
  '-dueDate': { dueDate: -1 },
  '-assignedAt': { assignedAt: -1 },
  progress: { progress: 1 },
  '-progress': { progress: -1 },
};

const populateEnrollment = (query) =>
  query
    .populate('employee', 'name employeeCode department jobTitle manager')
    .populate('program', 'title deliveryMode durationHours level')
    .populate('assignedBy', 'name');

export async function listEnrollments(req, res) {
  await refreshOverdueStatuses();
  const { employee, program, status, department, managerId, search, sort = 'dueDate' } = req.query;

  const employees = await resolveEmployeeScope(req, {
    employeeId: optionalObjectId(employee, 'employee'),
    managerId,
    department,
  });
  const scopeIds = employees.map((item) => item._id);
  const baseFilter = { employee: { $in: scopeIds } };
  if (program) baseFilter.program = optionalObjectId(program, 'program');

  if (search) {
    const pattern = new RegExp(escapeRegex(String(search).trim()), 'i');
    const matchingEmployees = employees.filter((item) => pattern.test(item.name)).map((item) => item._id);
    const matchingPrograms = await TrainingProgram.find({ title: pattern }).distinct('_id');
    baseFilter.$or = [{ employee: { $in: matchingEmployees } }, { program: { $in: matchingPrograms } }];
  }

  const filter = { ...baseFilter };
  if (status) filter.status = assertOneOf(status, ENROLLMENT_STATUSES, 'status');

  const pagination = parsePagination(req.query, { defaultLimit: 20, maxLimit: 200 });
  const [items, total, statusRows] = await Promise.all([
    populateEnrollment(TrainingEnrollment.find(filter))
      .sort({ ...(SORTS[sort] || SORTS.dueDate), _id: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    TrainingEnrollment.countDocuments(filter),
    TrainingEnrollment.aggregate([{ $match: baseFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const counts = Object.fromEntries(ENROLLMENT_STATUSES.map((value) => [value, 0]));
  for (const row of statusRows) counts[row._id] = row.count;
  counts.All = Object.values(counts).reduce((sum, value) => sum + value, 0);

  res.json({ data: items, meta: { ...paginationMeta(pagination, total), counts } });
}

export async function getEnrollment(req, res) {
  const enrollment = await populateEnrollment(TrainingEnrollment.findById(req.params.id)).lean();
  if (!enrollment) throw notFound('Enrolment');
  assertCanViewEmployee(req, enrollment.employee._id);
  res.json({ data: enrollment });
}

export async function createEnrollments(req, res) {
  const { employeeId, programIds, dueDate, assignedAt } = req.body || {};
  const errors = {};

  if (!isObjectId(employeeId)) errors.employeeId = 'Select an employee';
  if (!Array.isArray(programIds) || programIds.length === 0) errors.programIds = 'Select at least one programme';
  else if (programIds.length > 10) errors.programIds = 'Assign at most 10 programmes at a time';
  else if (programIds.some((id) => !isObjectId(id))) errors.programIds = 'Invalid programme id';

  const due = dueDate ? parseDateInput(dueDate, 'dueDate') : null;
  const assigned = assignedAt ? parseDateInput(assignedAt, 'assignedAt') : new Date();
  if (!due) errors.dueDate = 'Due date is required';
  else if (startOfUTCDay(due) < startOfUTCDay(assigned)) errors.dueDate = 'Due date cannot be before the assignment date';
  if (Object.keys(errors).length) throw badRequest('Validation failed', errors);

  const employee = await Employee.findById(employeeId).select('name jobTitle manager employmentStatus').lean();
  if (!employee) throw notFound('Employee');
  if (employee.employmentStatus === 'Inactive') throw badRequest('Training cannot be assigned to an inactive employee');
  assertCanManageEmployee(req, employee);

  const uniqueIds = [...new Set(programIds.map(String))];
  const programs = await TrainingProgram.find({ _id: { $in: uniqueIds } }).select('title status').lean();
  const programById = new Map(programs.map((program) => [String(program._id), program]));
  const openEnrollments = await TrainingEnrollment.find({
    employee: employee._id,
    program: { $in: uniqueIds },
    status: { $ne: 'Completed' },
  }).lean();
  const openByProgram = new Map(openEnrollments.map((item) => [String(item.program), item]));

  const actor = await getActor(req);
  const created = [];
  const skipped = [];

  for (const id of uniqueIds) {
    const program = programById.get(id);
    if (!program) {
      skipped.push({ programId: id, reason: 'Programme not found' });
    } else if (program.status !== 'Active') {
      skipped.push({ programId: id, title: program.title, reason: `Programme is ${program.status.toLowerCase()}` });
    } else if (openByProgram.has(id)) {
      skipped.push({ programId: id, title: program.title, reason: `Already assigned (${openByProgram.get(id).status})` });
    } else {
      const enrollment = await TrainingEnrollment.create({
        employee: employee._id,
        program: id,
        assignedBy: actor.id,
        assignedAt: assigned,
        dueDate: due,
      });
      created.push(enrollment);
      await logActivity({
        type: 'enrollment.assigned',
        message: `${actor.name} assigned "${program.title}" to ${employee.name}`,
        actor,
        employee: employee._id,
      });
    }
  }

  if (!created.length) {
    throw conflict('No new assignments were created', { skipped });
  }

  const populated = await populateEnrollment(
    TrainingEnrollment.find({ _id: { $in: created.map((item) => item._id) } }),
  ).lean();
  res.status(201).json({ data: populated, meta: { created: populated.length, skipped } });
}

export async function updateEnrollmentProgress(req, res) {
  const enrollment = await TrainingEnrollment.findById(req.params.id);
  if (!enrollment) throw notFound('Enrolment');
  const employee = await Employee.findById(enrollment.employee).select('name manager').lean();
  assertCanManageEmployee(req, employee, { allowSelf: true });

  const { progress, feedback, assessmentScore } = req.body || {};
  const value = Number(progress);
  if (progress === undefined || progress === null || progress === '' || !Number.isInteger(value) || value < 0 || value > 100) {
    throw badRequest('Validation failed', { progress: 'Progress must be a whole number from 0 to 100' });
  }

  let score;
  if (assessmentScore !== undefined && assessmentScore !== null && assessmentScore !== '') {
    score = Number(assessmentScore);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      throw badRequest('Validation failed', { assessmentScore: 'Assessment score must be between 0 and 100' });
    }
  }

  const previousStatus = enrollment.status;
  enrollment.progress = value;
  enrollment.lastProgressAt = new Date();
  if (feedback !== undefined) enrollment.feedback = String(feedback).trim();
  if (score !== undefined) enrollment.assessmentScore = score;
  await enrollment.save();

  const program = await TrainingProgram.findById(enrollment.program).select('title').lean();
  const actor = await getActor(req);
  const completedNow = enrollment.status === 'Completed' && previousStatus !== 'Completed';
  await logActivity({
    type: completedNow ? 'enrollment.completed' : 'enrollment.progress',
    message: completedNow
      ? `${employee.name} completed "${program?.title}"`
      : `${actor.name} updated "${program?.title}" for ${employee.name} to ${value}%`,
    actor,
    employee: employee._id,
  });

  const populated = await populateEnrollment(TrainingEnrollment.findById(enrollment._id)).lean();
  res.json({ data: populated, meta: { previousStatus } });
}

export async function updateEnrollment(req, res) {
  const enrollment = await TrainingEnrollment.findById(req.params.id);
  if (!enrollment) throw notFound('Enrolment');
  const employee = await Employee.findById(enrollment.employee).select('name manager').lean();
  assertCanManageEmployee(req, employee);

  const due = parseDateInput(req.body?.dueDate, 'dueDate');
  if (!due) throw badRequest('Validation failed', { dueDate: 'Due date is required' });
  enrollment.dueDate = due;
  await enrollment.save();

  const actor = await getActor(req);
  await logActivity({
    type: 'enrollment.updated',
    message: `${actor.name} changed a due date for ${employee.name}`,
    actor,
    employee: employee._id,
  });

  const populated = await populateEnrollment(TrainingEnrollment.findById(enrollment._id)).lean();
  res.json({ data: populated });
}

export async function deleteEnrollment(req, res) {
  const enrollment = await TrainingEnrollment.findById(req.params.id).populate('program', 'title');
  if (!enrollment) throw notFound('Enrolment');
  const employee = await Employee.findById(enrollment.employee).select('name manager').lean();
  assertCanManageEmployee(req, employee);

  await enrollment.deleteOne();
  const actor = await getActor(req);
  await logActivity({
    type: 'enrollment.removed',
    message: `${actor.name} removed "${enrollment.program?.title}" from ${employee.name}'s plan`,
    actor,
    employee: employee._id,
  });
  res.status(204).end();
}
