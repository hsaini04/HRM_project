/**
 * Lutron SkillBridge — synthetic demo-data seed.
 *
 * RESET BEHAVIOUR: every run clears the SkillBridge collections in the database named by
 * MONGODB_URI and recreates the same fictional dataset, so running it repeatedly never
 * duplicates records. Dates are generated relative to "today" so due dates stay current.
 *
 * Usage: npm run seed            (from /server)
 *        npm run seed -- --force (required if NODE_ENV=production)
 */
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import {
  ActivityLog,
  CareerPlan,
  Competency,
  Employee,
  EmployeeCompetency,
  JobRole,
  TrainingEnrollment,
  TrainingProgram,
} from '../models/index.js';
import { addDays, startOfUTCDay } from '../utils/dates.js';
import { careerPlans } from './data/careerPlans.js';
import { competencies } from './data/competencies.js';
import { emailFor, employees } from './data/employees.js';
import { jobRoles, parseRequirements } from './data/jobRoles.js';
import { trainings } from './data/trainings.js';

// Deterministic pseudo-random generator so every seed run produces identical data.
function mulberry32(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = mulberry32(20261101);
const randInt = (min, max) => min + Math.floor(random() * (max - min + 1));
const weighted = (weights) => {
  const roll = random();
  let total = 0;
  for (const [value, weight] of weights) {
    total += weight;
    if (roll < total) return value;
  }
  return weights[weights.length - 1][0];
};

const today = startOfUTCDay();
const day = (offset) => addDays(today, offset);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Delta = required − current. Negative means the employee exceeds the requirement.
const PROFILE_DELTAS = {
  strong: [[-1, 0.2], [0, 0.71], [1, 0.08], [2, 0.01]],
  steady: [[-1, 0.12], [0, 0.63], [1, 0.21], [2, 0.04]],
  developing: [[-1, 0.06], [0, 0.52], [1, 0.29], [2, 0.1], [3, 0.03]],
};
// Fast-changing technology areas (CA-1 challenge 3) are more likely to show gaps.
const EMERGING_KEYS = new Set(['lcs', 'net', 'cfg', 'tools']);
// A few employees have no assignments yet, so participation is measured rather than assumed.
const NO_TRAINING_CODES = new Set(['DEMO-1002', 'DEMO-1006']);

const STATE_PATTERN = [
  'Completed', 'In Progress', 'Completed', 'Not Started', 'In Progress', 'Overdue',
  'Completed', 'In Progress', 'Completed', 'Overdue', 'Not Started', 'Completed',
];

const PERSONA_ENROLLMENTS = {
  'DEMO-1007': [
    { title: 'Lighting Fundamentals & Design Principles Refresher', state: 'Completed', assigned: -75, due: -35, completed: -40, progress: 100, score: 86 },
    { title: 'Lighting-Control & Shading Concepts for Project Design', state: 'In Progress', assigned: -20, due: 12, progress: 45 },
    { title: 'Client Communication & Presentation Skills', state: 'In Progress', assigned: -14, due: 6, progress: 70 },
    { title: 'Design Estimation & Technical Documentation Clinic', state: 'Overdue', assigned: -50, due: -4, progress: 30 },
    { title: 'CAD/BIM & Lighting-Documentation Practice Lab', state: 'Not Started', assigned: -3, due: 25, progress: 0 },
  ],
  'DEMO-1022': [{ title: 'Consultative Selling for Technical Solutions', state: 'Not Started', assigned: -2, due: 30, progress: 0 }],
};

function enrollmentDates(state) {
  switch (state) {
    case 'Completed': {
      const assigned = -randInt(35, 165);
      const dueIn = randInt(28, 45);
      const completed = Math.min(assigned + randInt(10, dueIn - 2), -2);
      return { assigned, due: assigned + dueIn, completed, progress: 100, score: randInt(68, 97) };
    }
    case 'In Progress':
      return { assigned: -randInt(8, 40), due: randInt(4, 40), progress: 5 * randInt(3, 17), touched: -randInt(0, 6) };
    case 'Not Started':
      return { assigned: -randInt(1, 9), due: randInt(12, 50), progress: 0 };
    default: // Overdue
      return { assigned: -randInt(45, 80), due: -randInt(2, 18), progress: 10 * randInt(0, 6), touched: -randInt(20, 40) };
  }
}

async function seed() {
  if (env.nodeEnv === 'production' && !process.argv.includes('--force')) {
    console.error('Refusing to reset data with NODE_ENV=production. Re-run with --force if you are sure.');
    process.exit(1);
  }

  await connectDB();
  console.log('Connected. Resetting SkillBridge demo collections…');
  await Promise.all(
    [ActivityLog, CareerPlan, TrainingEnrollment, TrainingProgram, EmployeeCompetency, Employee, JobRole, Competency].map(
      (model) => model.deleteMany({}),
    ),
  );
  await Promise.all(
    [ActivityLog, CareerPlan, TrainingEnrollment, TrainingProgram, EmployeeCompetency, Employee, JobRole, Competency].map(
      (model) => model.syncIndexes(),
    ),
  );

  // 1. Competency library with expected levels per job role
  const requirementsByKey = new Map(competencies.map((item) => [item.key, []]));
  const roleRequirements = new Map();
  for (const role of jobRoles) {
    const parsed = parseRequirements(role.requirements);
    roleRequirements.set(role.title, parsed);
    for (const { key, level } of parsed) {
      if (!requirementsByKey.has(key)) throw new Error(`Unknown competency key "${key}" in ${role.title}`);
      requirementsByKey.get(key).push({ jobTitle: role.title, requiredLevel: level });
    }
  }
  const competencyDocs = await Competency.insertMany(
    competencies.map(({ key, ...rest }) => ({ ...rest, roleRequirements: requirementsByKey.get(key) })),
  );
  const competencyId = new Map(competencies.map((item, index) => [item.key, competencyDocs[index]._id]));

  // 2. Job roles
  await JobRole.insertMany(jobRoles.map(({ requirements, ...rest }) => rest));
  const roleDepartment = new Map(jobRoles.map((role) => [role.title, role.department]));

  // 3. Employees (managers linked in a second pass)
  const employeeDocs = await Employee.insertMany(
    employees.map((item) => ({
      employeeCode: item.code,
      name: item.name,
      email: emailFor(item.name),
      department: roleDepartment.get(item.title),
      jobTitle: item.title,
      joiningDate: new Date(item.joined),
      employmentStatus: item.status || 'Active',
    })),
  );
  const employeeByCode = new Map(employeeDocs.map((doc) => [doc.employeeCode, doc]));
  for (const item of employees.filter((entry) => entry.manager)) {
    const doc = employeeByCode.get(item.code);
    doc.manager = employeeByCode.get(item.manager)._id;
    await doc.save();
  }
  const hr = employeeByCode.get('DEMO-1003');
  const reviewerFor = (code) => {
    const managerCode = employees.find((item) => item.code === code)?.manager;
    return managerCode ? employeeByCode.get(managerCode) : hr;
  };

  // 4. Competency assessments (current vs required)
  const assessmentDocs = [];
  const gapKeysByCode = new Map();
  const activity = [];
  for (const item of employees) {
    if (item.profile === 'unassessed') continue;
    const employee = employeeByCode.get(item.code);
    const reviewer = reviewerFor(item.code);
    const custom = item.levels ? new Map(parseRequirements(item.levels).map((entry) => [entry.key, entry.level])) : null;
    const assessedAt = day(-randInt(12, 110));
    const gapKeys = [];

    for (const { key, level: required } of roleRequirements.get(item.title)) {
      let current;
      if (custom) {
        current = custom.get(key) ?? required;
      } else {
        let delta = weighted(PROFILE_DELTAS[item.profile]);
        if (EMERGING_KEYS.has(key) && delta <= 0 && random() < 0.55) delta += 1;
        current = clamp(required - delta, 1, 4);
      }
      if (required - current > 0) gapKeys.push({ key, gap: required - current });
      assessmentDocs.push({
        employee: employee._id,
        competency: competencyId.get(key),
        currentLevel: current,
        requiredLevel: required,
        lastAssessedAt: assessedAt,
        assessedBy: reviewer._id,
        notes: required - current >= 2 ? 'Priority development area agreed in review.' : '',
      });
    }
    gapKeysByCode.set(item.code, gapKeys.sort((a, b) => b.gap - a.gap));
    activity.push({
      type: 'assessment.updated',
      message: `${reviewer.name} updated ${roleRequirements.get(item.title).length} competency ratings for ${employee.name}`,
      actorName: reviewer.name,
      actorRole: reviewer._id.equals(hr._id) ? 'hr' : 'manager',
      employee: employee._id,
      createdAt: assessedAt,
    });
  }
  await EmployeeCompetency.insertMany(assessmentDocs);

  // 5. Training catalogue
  const programDocs = await TrainingProgram.insertMany(
    trainings.map((item) => ({ ...item, competencies: item.competencies.map((key) => competencyId.get(key)) })),
  );
  const programByTitle = new Map(programDocs.map((doc) => [doc.title, doc]));
  for (const doc of programDocs) {
    activity.push({
      type: 'training.created',
      message: `${hr.name} added "${doc.title}" to the training catalogue`,
      actorName: hr.name,
      actorRole: 'hr',
      employee: null,
      createdAt: day(-randInt(170, 200)),
    });
  }

  // 6. Enrolments — relevant programmes for each employee's largest gaps
  const GENERIC = [
    'Client Communication & Presentation Skills',
    'Time & Priority Management for Project Teams',
    'Smart-Building Technology Learning Circle',
  ];
  const enrollmentPlans = [];
  let patternIndex = 0;

  for (const item of employees) {
    if (NO_TRAINING_CODES.has(item.code)) continue;
    const persona = PERSONA_ENROLLMENTS[item.code];
    if (persona) {
      persona.forEach((entry) => enrollmentPlans.push({ code: item.code, ...entry, touched: entry.state === 'Completed' ? entry.completed : -1 }));
      continue;
    }

    const gapKeys = (gapKeysByCode.get(item.code) || []).map((entry) => entry.key);
    const ranked = trainings
      .filter((program) => (program.status || 'Active') === 'Active')
      .filter((program) => !program.targetRoles.length || program.targetRoles.includes(item.title))
      .map((program) => ({
        title: program.title,
        covers: program.competencies.filter((key) => gapKeys.includes(key)).length,
        targeted: program.targetRoles.includes(item.title),
      }))
      .filter((program) => program.covers > 0)
      .sort((a, b) => b.covers - a.covers || Number(b.targeted) - Number(a.targeted) || a.title.localeCompare(b.title));

    const count = item.profile === 'strong' ? 2 : 3;
    const chosen = ranked.slice(0, count).map((program) => program.title);
    for (const title of GENERIC) {
      if (chosen.length >= 2) break;
      if (!chosen.includes(title)) chosen.push(title);
    }

    for (const title of chosen) {
      const state = STATE_PATTERN[patternIndex % STATE_PATTERN.length];
      patternIndex += 1;
      enrollmentPlans.push({ code: item.code, title, state, ...enrollmentDates(state) });
    }
  }

  const enrollmentDocs = [];
  for (const plan of enrollmentPlans) {
    const employee = employeeByCode.get(plan.code);
    const assigner = reviewerFor(plan.code);
    const program = programByTitle.get(plan.title);
    const doc = await TrainingEnrollment.create({
      employee: employee._id,
      program: program._id,
      assignedBy: assigner._id,
      assignedAt: day(plan.assigned),
      dueDate: day(plan.due),
      progress: plan.progress,
      completedAt: plan.state === 'Completed' ? day(plan.completed) : null,
      lastProgressAt: plan.touched !== undefined ? day(plan.touched) : null,
      assessmentScore: plan.state === 'Completed' ? plan.score : null,
      feedback: plan.state === 'Completed' && plan.score >= 85 ? 'Applied learning on a live project; strong assessment.' : undefined,
    });
    enrollmentDocs.push(doc);

    const actorRole = assigner._id.equals(hr._id) ? 'hr' : 'manager';
    activity.push({
      type: 'enrollment.assigned',
      message: `${assigner.name} assigned "${program.title}" to ${employee.name}`,
      actorName: assigner.name,
      actorRole,
      employee: employee._id,
      createdAt: day(plan.assigned),
    });
    if (plan.state === 'Completed') {
      activity.push({
        type: 'enrollment.completed',
        message: `${employee.name} completed "${program.title}"`,
        actorName: employee.name,
        actorRole: 'employee',
        employee: employee._id,
        createdAt: day(plan.completed),
      });
    } else if (plan.progress > 0 && plan.touched !== undefined) {
      activity.push({
        type: 'enrollment.progress',
        message: `${employee.name} updated "${program.title}" to ${plan.progress}%`,
        actorName: employee.name,
        actorRole: 'employee',
        employee: employee._id,
        // Working-hours timestamp on that day, never later than now.
        createdAt: new Date(Math.min(day(plan.touched).getTime() + randInt(9, 18) * 3600 * 1000, Date.now() - randInt(10, 120) * 60 * 1000)),
      });
    }
  }

  // 7. Career / development plans
  for (const plan of careerPlans) {
    const employee = employeeByCode.get(plan.employee);
    const createdAt = day(-randInt(25, 90));
    await CareerPlan.create({
      employee: employee._id,
      currentRole: employee.jobTitle,
      targetRole: plan.targetRole,
      mentor: employeeByCode.get(plan.mentor)?._id || null,
      reviewDate: day(plan.reviewIn),
      notes: plan.notes,
      recommendedTrainings: plan.trainings.map((title) => programByTitle.get(title)._id),
      goals: plan.goals.map((goal) => ({
        title: goal.title,
        competency: competencyId.get(goal.competency),
        targetDate: day(goal.offset),
        status: goal.status,
      })),
    });
    const author = reviewerFor(plan.employee);
    activity.push({
      type: 'career.created',
      message: `${author.name} created a development plan for ${employee.name} (target: ${plan.targetRole})`,
      actorName: author.name,
      actorRole: author._id.equals(hr._id) ? 'hr' : 'manager',
      employee: employee._id,
      createdAt,
    });
  }

  // 8. Activity feed (inserted directly so historical timestamps are preserved)
  await ActivityLog.collection.insertMany(activity);

  // Summary
  const statusCounts = enrollmentDocs.reduce((acc, doc) => ({ ...acc, [doc.status]: (acc[doc.status] || 0) + 1 }), {});
  const gaps = assessmentDocs.filter((doc) => doc.requiredLevel > doc.currentLevel);
  console.log('\n✔ Seed complete — synthetic demonstration data only (not actual Lutron Electronics HR records)\n');
  console.table({
    'Job roles': jobRoles.length,
    Competencies: competencyDocs.length,
    'Fictional employees': employeeDocs.length,
    'Competency ratings': assessmentDocs.length,
    'Skill gaps (required > current)': gaps.length,
    'Priority gaps (≥ 2 levels)': gaps.filter((doc) => doc.requiredLevel - doc.currentLevel >= 2).length,
    'Training programmes': programDocs.length,
    Enrolments: enrollmentDocs.length,
    'Career plans': careerPlans.length,
    'Activity entries': activity.length,
  });
  console.log('Enrolment status mix:', statusCounts);
  console.log('Demo personas: HR/Admin = Ananya Rao, Manager = Meera Kapoor, Employee = Priya Nair\n');

  await disconnectDB();
}

seed().catch(async (error) => {
  console.error('✖ Seed failed:', error);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
