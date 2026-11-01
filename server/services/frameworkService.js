import { Competency, Employee, EmployeeCompetency } from '../models/index.js';

/** Active competencies that a job role is expected to have, with the expected level for that role. */
export async function getRoleFramework(jobTitle) {
  const competencies = await Competency.find({ active: true, 'roleRequirements.jobTitle': jobTitle })
    .sort({ category: 1, name: 1 })
    .lean();

  return competencies.map((competency) => ({
    _id: competency._id,
    name: competency.name,
    category: competency.category,
    description: competency.description,
    assessmentMethod: competency.assessmentMethod,
    requiredLevel: competency.roleRequirements.find((item) => item.jobTitle === jobTitle).requiredLevel,
  }));
}

/**
 * Keeps an employee's stored required levels aligned with their (possibly changed) role.
 * Ratings for competencies that the new role does not use are removed, because gaps are
 * always measured against the current role's framework.
 */
export async function syncRequirementsForEmployee(employee) {
  const framework = await getRoleFramework(employee.jobTitle);
  const requiredById = new Map(framework.map((item) => [String(item._id), item.requiredLevel]));
  const records = await EmployeeCompetency.find({ employee: employee._id });

  for (const record of records) {
    const required = requiredById.get(String(record.competency));
    if (required === undefined) {
      await record.deleteOne();
    } else if (record.requiredLevel !== required) {
      record.requiredLevel = required;
      await record.save();
    }
  }
}

/** Re-applies a competency's role requirements to all stored employee ratings. */
export async function syncRequirementsForCompetency(competency) {
  const requirements = new Map(competency.roleRequirements.map((item) => [item.jobTitle, item.requiredLevel]));
  const records = await EmployeeCompetency.find({ competency: competency._id }).populate('employee', 'jobTitle');

  for (const record of records) {
    const required = record.employee ? requirements.get(record.employee.jobTitle) : undefined;
    if (required === undefined) {
      await record.deleteOne();
    } else if (record.requiredLevel !== required) {
      record.requiredLevel = required;
      await record.save();
    }
  }
}

export async function headcountByRole() {
  const rows = await Employee.aggregate([
    { $match: { employmentStatus: { $ne: 'Inactive' } } },
    { $group: { _id: '$jobTitle', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [row._id, row.count]));
}
