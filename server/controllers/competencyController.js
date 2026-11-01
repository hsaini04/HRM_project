import { COMPETENCY_CATEGORIES, PROFICIENCY_SCALE } from '../config/constants.js';
import { assertCanManageEmployee, assertCanViewEmployee, getActor } from '../middleware/demoRole.js';
import { Competency, Employee, EmployeeCompetency, JobRole } from '../models/index.js';
import { logActivity } from '../services/activityService.js';
import { getRoleFramework, headcountByRole, syncRequirementsForCompetency } from '../services/frameworkService.js';
import {
  buildTrainingIndex,
  calculateGap,
  gapSeverity,
  isPriorityGap,
  suggestTrainings,
} from '../services/gapService.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { assertObjectId, assertOneOf, escapeRegex, pick } from '../utils/query.js';

const EDITABLE_FIELDS = ['name', 'category', 'description', 'assessmentMethod', 'roleRequirements', 'active'];

async function validateRoleRequirements(requirements) {
  if (requirements === undefined) return;
  if (!Array.isArray(requirements)) {
    throw badRequest('Validation failed', { roleRequirements: 'Role requirements must be a list' });
  }
  const titles = requirements.map((item) => item?.jobTitle);
  const known = await JobRole.find({ title: { $in: titles } }).distinct('title');
  const unknown = titles.filter((title) => !known.includes(title));
  if (unknown.length) {
    throw badRequest('Validation failed', { roleRequirements: `Unknown job role(s): ${unknown.join(', ')}` });
  }
}

export async function listCompetencies(req, res) {
  const { category, jobTitle, search, includeInactive } = req.query;
  const filter = {};
  if (includeInactive !== 'true') filter.active = true;
  if (category) filter.category = assertOneOf(category, COMPETENCY_CATEGORIES, 'category');
  if (jobTitle) filter['roleRequirements.jobTitle'] = String(jobTitle);
  if (search) filter.name = new RegExp(escapeRegex(search), 'i');

  const competencies = await Competency.find(filter).sort({ category: 1, name: 1 });

  // How many current assessments show a gap for each competency.
  const gapCounts = await EmployeeCompetency.aggregate([
    { $match: { $expr: { $gt: ['$requiredLevel', '$currentLevel'] } } },
    { $group: { _id: '$competency', gaps: { $sum: 1 } } },
  ]);
  const gapsById = new Map(gapCounts.map((row) => [String(row._id), row.gaps]));

  res.json({
    data: competencies.map((competency) => ({
      ...competency.toJSON(),
      employeesWithGap: gapsById.get(String(competency._id)) || 0,
    })),
  });
}

export async function createCompetency(req, res) {
  const payload = pick(req.body, EDITABLE_FIELDS);
  await validateRoleRequirements(payload.roleRequirements);
  const competency = await Competency.create(payload);

  const actor = await getActor(req);
  await logActivity({
    type: 'competency.created',
    message: `${actor.name} added the ${competency.category.toLowerCase()} competency "${competency.name}"`,
    actor,
  });
  res.status(201).json({ data: competency });
}

export async function updateCompetency(req, res) {
  const competency = await Competency.findById(req.params.id);
  if (!competency) throw notFound('Competency');

  const payload = pick(req.body, EDITABLE_FIELDS);
  await validateRoleRequirements(payload.roleRequirements);
  competency.set(payload);
  await competency.save();
  if (payload.roleRequirements) await syncRequirementsForCompetency(competency);

  const actor = await getActor(req);
  await logActivity({
    type: 'competency.updated',
    message: `${actor.name} updated the competency "${competency.name}"`,
    actor,
  });
  res.json({ data: competency });
}

/**
 * Competency matrix for one role: expected levels (grouped by category) plus the current
 * level of every employee who holds that role.
 */
export async function getCompetencyMatrix(req, res) {
  const roles = await JobRole.find().sort({ department: 1, trackLevel: 1, title: 1 }).lean();
  const focusRole = roles.find((role) => role.isFocusRole) || roles[0];
  const jobTitle = req.query.jobTitle || focusRole?.title;
  const role = roles.find((item) => item.title === jobTitle);
  if (!role) throw notFound('Job role');

  const [framework, headcounts] = await Promise.all([getRoleFramework(jobTitle), headcountByRole()]);

  const employeeFilter = { jobTitle, employmentStatus: { $ne: 'Inactive' } };
  if (req.demo.role === 'employee') employeeFilter._id = req.demo.employeeId;
  const employees = await Employee.find(employeeFilter).select('name employeeCode department').sort({ name: 1 }).lean();

  const records = await EmployeeCompetency.find({ employee: { $in: employees.map((employee) => employee._id) } }).lean();
  const levels = new Map(records.map((record) => [`${record.employee}:${record.competency}`, record.currentLevel]));

  const matrixEmployees = employees.map((employee) => {
    const row = {};
    let gaps = 0;
    for (const competency of framework) {
      const current = levels.get(`${employee._id}:${competency._id}`) ?? null;
      row[competency._id] = current;
      if (calculateGap(competency.requiredLevel, current) > 0) gaps += 1;
    }
    return { ...employee, levels: row, gaps };
  });

  res.json({
    data: {
      role,
      roles: roles.map((item) => ({
        title: item.title,
        department: item.department,
        headcount: headcounts.get(item.title) || 0,
        isFocusRole: item.isFocusRole,
      })),
      scale: PROFICIENCY_SCALE,
      competencies: framework,
      employees: matrixEmployees,
    },
  });
}

/** Required vs current proficiency for one employee, based on their role framework. */
export async function getEmployeeCompetencies(req, res) {
  const { employeeId } = req.params;
  assertCanViewEmployee(req, employeeId);

  const employee = await Employee.findById(employeeId).select('name jobTitle department manager').lean();
  if (!employee) throw notFound('Employee');

  const [framework, records, index] = await Promise.all([
    getRoleFramework(employee.jobTitle),
    EmployeeCompetency.find({ employee: employeeId }).populate('assessedBy', 'name').lean(),
    buildTrainingIndex([employee._id]),
  ]);
  const recordByCompetency = new Map(records.map((record) => [String(record.competency), record]));

  const items = framework.map((competency) => {
    const record = recordByCompetency.get(String(competency._id));
    const currentLevel = record?.currentLevel ?? null;
    const gap = calculateGap(competency.requiredLevel, currentLevel);
    return {
      competency,
      requiredLevel: competency.requiredLevel,
      currentLevel,
      gap,
      severity: gapSeverity(gap),
      priority: isPriorityGap(gap),
      lastAssessedAt: record?.lastAssessedAt || null,
      assessedBy: record?.assessedBy || null,
      notes: record?.notes || '',
      suggestedTrainings: gap > 0 ? suggestTrainings(index, employee, competency._id, 2) : [],
    };
  });

  const assessed = items.filter((item) => item.currentLevel !== null);
  res.json({
    data: {
      employee,
      items,
      summary: {
        totalCompetencies: items.length,
        assessed: assessed.length,
        met: assessed.filter((item) => item.gap === 0).length,
        gaps: assessed.filter((item) => item.gap > 0).length,
        priorityGaps: assessed.filter((item) => item.priority).length,
        readiness: assessed.length
          ? Math.round((assessed.filter((item) => item.gap === 0).length / items.length) * 100)
          : 0,
      },
    },
  });
}

export async function updateEmployeeCompetencies(req, res) {
  const { employeeId } = req.params;
  const employee = await Employee.findById(employeeId).select('name jobTitle manager').lean();
  if (!employee) throw notFound('Employee');
  assertCanManageEmployee(req, employee);

  const { assessments } = req.body || {};
  if (!Array.isArray(assessments) || assessments.length === 0) {
    throw badRequest('Validation failed', { assessments: 'Provide at least one competency rating' });
  }

  const framework = await getRoleFramework(employee.jobTitle);
  const requiredById = new Map(framework.map((item) => [String(item._id), item.requiredLevel]));
  const errors = {};

  assessments.forEach((item, index) => {
    const level = Number(item?.currentLevel);
    if (!item?.competencyId || !requiredById.has(String(item.competencyId))) {
      errors[`assessments.${index}.competencyId`] = `Competency is not part of the ${employee.jobTitle} framework`;
    }
    if (!Number.isInteger(level) || level < 1 || level > 4) {
      errors[`assessments.${index}.currentLevel`] = 'Current level must be a whole number from 1 to 4';
    }
    if (item?.notes && String(item.notes).length > 500) {
      errors[`assessments.${index}.notes`] = 'Notes must be at most 500 characters';
    }
  });
  if (Object.keys(errors).length) throw badRequest('Validation failed', errors);

  const actor = await getActor(req);
  for (const item of assessments) {
    assertObjectId(item.competencyId, 'competencyId');
    await EmployeeCompetency.findOneAndUpdate(
      { employee: employeeId, competency: item.competencyId },
      {
        $set: {
          currentLevel: Number(item.currentLevel),
          requiredLevel: requiredById.get(String(item.competencyId)),
          notes: item.notes ? String(item.notes).trim() : '',
          lastAssessedAt: new Date(),
          assessedBy: actor.id,
        },
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  }

  await logActivity({
    type: 'assessment.updated',
    message: `${actor.name} updated ${assessments.length} competency rating${assessments.length === 1 ? '' : 's'} for ${employee.name}`,
    actor,
    employee: employee._id,
  });

  return getEmployeeCompetencies(req, res);
}
