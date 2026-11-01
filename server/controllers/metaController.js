import {
  CA1_CONTEXT,
  CAREER_PLAN_STATUSES,
  COMPETENCY_CATEGORIES,
  DATA_NOTICE,
  DELIVERY_MODES,
  DEMO_PERSONA_CODES,
  DEMO_ROLE_LABELS,
  DEPARTMENTS,
  EMPLOYMENT_STATUSES,
  ENROLLMENT_STATUSES,
  GOAL_STATUSES,
  PRIORITY_GAP_THRESHOLD,
  PROFICIENCY_SCALE,
  TRAINING_LEVELS,
  TRAINING_STATUSES,
} from '../config/constants.js';
import { databaseState } from '../config/db.js';
import { Employee, JobRole } from '../models/index.js';
import { headcountByRole } from '../services/frameworkService.js';

export function getHealth(req, res) {
  const database = databaseState();
  res.status(database === 'connected' ? 200 : 503).json({
    status: database === 'connected' ? 'ok' : 'degraded',
    service: 'lutron-skillbridge-api',
    database,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    notice: DATA_NOTICE,
  });
}

export async function getMeta(req, res) {
  const [roles, headcounts] = await Promise.all([
    JobRole.find().sort({ department: 1, trackLevel: 1, title: 1 }).lean(),
    headcountByRole(),
  ]);

  res.json({
    data: {
      departments: DEPARTMENTS,
      employmentStatuses: EMPLOYMENT_STATUSES,
      competencyCategories: COMPETENCY_CATEGORIES,
      proficiencyScale: PROFICIENCY_SCALE,
      priorityGapThreshold: PRIORITY_GAP_THRESHOLD,
      deliveryModes: DELIVERY_MODES,
      trainingLevels: TRAINING_LEVELS,
      trainingStatuses: TRAINING_STATUSES,
      enrollmentStatuses: ENROLLMENT_STATUSES,
      careerPlanStatuses: CAREER_PLAN_STATUSES,
      goalStatuses: GOAL_STATUSES,
      jobRoles: roles.map((role) => ({
        title: role.title,
        department: role.department,
        track: role.track,
        trackLevel: role.trackLevel,
        isFocusRole: role.isFocusRole,
        headcount: headcounts.get(role.title) || 0,
      })),
      dataNotice: DATA_NOTICE,
      ca1Context: CA1_CONTEXT,
    },
  });
}

export async function getPersonas(req, res) {
  const codes = Object.values(DEMO_PERSONA_CODES);
  const employees = await Employee.find({ employeeCode: { $in: codes } })
    .select('name employeeCode jobTitle department')
    .lean();
  const byCode = new Map(employees.map((employee) => [employee.employeeCode, employee]));

  res.json({
    data: Object.entries(DEMO_PERSONA_CODES).map(([role, code]) => ({
      role,
      label: DEMO_ROLE_LABELS[role],
      employee: byCode.get(code) || null,
    })),
  });
}
