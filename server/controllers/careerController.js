import { CAREER_PLAN_STATUSES, GOAL_STATUSES } from '../config/constants.js';
import { assertCanManageEmployee, assertCanViewEmployee, getActor } from '../middleware/demoRole.js';
import { CareerPlan, Employee, JobRole, TrainingProgram } from '../models/index.js';
import { logActivity } from '../services/activityService.js';
import { getRoleFramework, headcountByRole } from '../services/frameworkService.js';
import { resolveEmployeeScope } from '../services/scopeService.js';
import { badRequest, conflict, notFound } from '../utils/httpError.js';
import { assertOneOf, isObjectId, optionalObjectId, pick } from '../utils/query.js';

const EDITABLE_FIELDS = ['targetRole', 'goals', 'recommendedTrainings', 'mentor', 'reviewDate', 'status', 'notes'];

const populatePlan = (query) =>
  query
    .populate('employee', 'name employeeCode department jobTitle manager')
    .populate('mentor', 'name jobTitle')
    .populate('recommendedTrainings', 'title deliveryMode durationHours level')
    .populate('goals.competency', 'name category');

async function validatePlanPayload(payload, employeeId) {
  const errors = {};
  if (payload.targetRole !== undefined) {
    const exists = await JobRole.exists({ title: payload.targetRole });
    if (!exists) errors.targetRole = 'Select a target role from the role framework';
  }
  if (payload.mentor) {
    if (!isObjectId(payload.mentor)) errors.mentor = 'Invalid mentor';
    else if (String(payload.mentor) === String(employeeId)) errors.mentor = 'An employee cannot mentor themselves';
    else if (!(await Employee.exists({ _id: payload.mentor }))) errors.mentor = 'Selected mentor does not exist';
  }
  if (payload.recommendedTrainings !== undefined) {
    const ids = Array.isArray(payload.recommendedTrainings) ? payload.recommendedTrainings : null;
    if (!ids || ids.some((id) => !isObjectId(id))) errors.recommendedTrainings = 'Invalid training selection';
    else if ((await TrainingProgram.countDocuments({ _id: { $in: ids } })) !== new Set(ids.map(String)).size) {
      errors.recommendedTrainings = 'One or more selected programmes do not exist';
    }
  }
  if (payload.goals !== undefined && !Array.isArray(payload.goals)) errors.goals = 'Goals must be a list';
  if (Object.keys(errors).length) throw badRequest('Validation failed', errors);
}

export async function listCareerPlans(req, res) {
  const { employee, managerId, status } = req.query;
  const employees = await resolveEmployeeScope(req, {
    employeeId: optionalObjectId(employee, 'employee'),
    managerId,
  });
  const filter = { employee: { $in: employees.map((item) => item._id) } };
  if (status) filter.status = assertOneOf(status, CAREER_PLAN_STATUSES, 'status');

  const plans = await populatePlan(CareerPlan.find(filter)).sort({ reviewDate: 1 }).lean();
  res.json({ data: plans });
}

export async function getCareerPlan(req, res) {
  const plan = await populatePlan(CareerPlan.findById(req.params.id)).lean();
  if (!plan) throw notFound('Career plan');
  assertCanViewEmployee(req, plan.employee._id);
  res.json({ data: plan });
}

export async function createCareerPlan(req, res) {
  const { employeeId } = req.body || {};
  if (!isObjectId(employeeId)) throw badRequest('Validation failed', { employeeId: 'Select an employee' });

  const employee = await Employee.findById(employeeId).select('name jobTitle manager').lean();
  if (!employee) throw notFound('Employee');
  assertCanManageEmployee(req, employee);
  if (await CareerPlan.exists({ employee: employee._id })) {
    throw conflict(`${employee.name} already has a development plan — edit the existing plan instead`);
  }

  const payload = pick(req.body, EDITABLE_FIELDS);
  if (!payload.mentor) payload.mentor = null;
  await validatePlanPayload(payload, employee._id);

  const plan = await CareerPlan.create({ ...payload, employee: employee._id, currentRole: employee.jobTitle });
  const actor = await getActor(req);
  await logActivity({
    type: 'career.created',
    message: `${actor.name} created a development plan for ${employee.name} (target: ${plan.targetRole})`,
    actor,
    employee: employee._id,
  });

  const populated = await populatePlan(CareerPlan.findById(plan._id)).lean();
  res.status(201).json({ data: populated });
}

export async function updateCareerPlan(req, res) {
  const plan = await CareerPlan.findById(req.params.id);
  if (!plan) throw notFound('Career plan');
  const employee = await Employee.findById(plan.employee).select('name jobTitle manager').lean();
  assertCanManageEmployee(req, employee);

  const payload = pick(req.body, EDITABLE_FIELDS);
  if ('mentor' in payload && !payload.mentor) payload.mentor = null;
  await validatePlanPayload(payload, employee._id);

  plan.set({ ...payload, currentRole: employee.jobTitle });
  await plan.save();

  const actor = await getActor(req);
  await logActivity({
    type: 'career.updated',
    message: `${actor.name} updated ${employee.name}'s development plan`,
    actor,
    employee: employee._id,
  });

  const populated = await populatePlan(CareerPlan.findById(plan._id)).lean();
  res.json({ data: populated });
}

export async function updateGoalStatus(req, res) {
  const plan = await CareerPlan.findById(req.params.id);
  if (!plan) throw notFound('Career plan');
  const employee = await Employee.findById(plan.employee).select('name manager').lean();
  assertCanManageEmployee(req, employee, { allowSelf: true });

  const goal = plan.goals.id(req.params.goalId);
  if (!goal) throw notFound('Goal');
  const status = assertOneOf(req.body?.status, GOAL_STATUSES, 'status');
  if (!status) throw badRequest('Validation failed', { status: `Status must be one of ${GOAL_STATUSES.join(', ')}` });

  goal.status = status;
  await plan.save();

  const actor = await getActor(req);
  await logActivity({
    type: 'career.updated',
    message: `${actor.name} marked the goal "${goal.title}" as ${status.toLowerCase()} for ${employee.name}`,
    actor,
    employee: employee._id,
  });

  const populated = await populatePlan(CareerPlan.findById(plan._id)).lean();
  res.json({ data: populated });
}

/**
 * Illustrative role-based career tracks built from the job-role framework.
 * Each step lists headcount (demo data) and the competencies whose expected level rises.
 */
export async function listCareerPaths(req, res) {
  const roles = await JobRole.find({ track: { $ne: null } }).sort({ track: 1, trackLevel: 1 }).lean();
  const headcounts = await headcountByRole();
  const frameworks = new Map(
    await Promise.all(roles.map(async (role) => [role.title, await getRoleFramework(role.title)])),
  );

  const tracks = new Map();
  for (const role of roles) {
    if (!tracks.has(role.track)) tracks.set(role.track, []);
    const steps = tracks.get(role.track);
    const framework = frameworks.get(role.title);
    const previous = steps.length ? frameworks.get(steps[steps.length - 1].title) : [];
    const previousLevels = new Map(previous.map((item) => [String(item._id), item.requiredLevel]));

    const stepUps = framework
      .filter((item) => item.requiredLevel > (previousLevels.get(String(item._id)) ?? 0))
      .sort((a, b) => b.requiredLevel - a.requiredLevel || a.name.localeCompare(b.name))
      .map((item) => ({
        name: item.name,
        category: item.category,
        from: previousLevels.get(String(item._id)) ?? null,
        to: item.requiredLevel,
      }));

    steps.push({
      title: role.title,
      department: role.department,
      level: role.trackLevel,
      summary: role.summary,
      headcount: headcounts.get(role.title) || 0,
      competencyCount: framework.length,
      isFocusRole: role.isFocusRole,
      stepUps: steps.length ? stepUps.slice(0, 5) : [],
    });
  }

  res.json({ data: [...tracks.entries()].map(([track, steps]) => ({ track, steps })) });
}
