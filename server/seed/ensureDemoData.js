import { DEMO_PERSONA_CODES, DEMO_ROLE_LABELS } from '../config/constants.js';
import { Employee } from '../models/index.js';
import { emailFor, employees } from './data/employees.js';
import { jobRoles } from './data/jobRoles.js';
import { DEMO_MODELS, seedDemoData } from './seedDemoData.js';

const personaRecord = (code) => employees.find((item) => item.code === code);

/** Role, sign-in ID and fictional persona for each default demo account. */
export function demoAccountTable() {
  return Object.entries(DEMO_PERSONA_CODES).map(([role, code]) => ({
    Role: DEMO_ROLE_LABELS[role],
    'Sign-in ID': code,
    Persona: personaRecord(code).name,
    Email: emailFor(personaRecord(code).name),
  }));
}

/**
 * Makes sure the default HR, Manager and Employee accounts exist so the sign-in page always works.
 *
 * - An empty database (a fresh install where `npm run seed` was never run) gets the full demo dataset.
 * - A database that already holds records only gets the missing accounts, so nothing is deleted.
 */
export async function ensureDemoData() {
  const codes = Object.values(DEMO_PERSONA_CODES);
  const existing = await Employee.find({ employeeCode: { $in: codes } }).select('employeeCode').lean();
  if (existing.length === codes.length) return { action: 'none' };

  const counts = await Promise.all(DEMO_MODELS.map((model) => model.estimatedDocumentCount()));
  if (counts.every((count) => count === 0)) {
    await seedDemoData();
    return { action: 'seeded' };
  }

  const found = new Set(existing.map((doc) => doc.employeeCode));
  const created = [];
  // Managers first, so the Employee persona can be linked to the Manager persona.
  for (const code of [DEMO_PERSONA_CODES.manager, DEMO_PERSONA_CODES.hr, DEMO_PERSONA_CODES.employee]) {
    if (found.has(code)) continue;
    const record = personaRecord(code);
    const manager = record.manager ? await Employee.findOne({ employeeCode: record.manager }).select('_id').lean() : null;
    await Employee.create({
      employeeCode: code,
      name: record.name,
      email: emailFor(record.name),
      department: jobRoles.find((role) => role.title === record.title).department,
      jobTitle: record.title,
      joiningDate: new Date(record.joined),
      manager: manager?._id || null,
    });
    created.push(code);
  }
  return { action: 'accounts', created };
}
