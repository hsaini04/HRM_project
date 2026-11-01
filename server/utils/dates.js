import { badRequest } from './httpError.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Due dates are stored as calendar dates (UTC midnight), so comparisons use UTC days.
export function startOfUTCDay(date = new Date()) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function addDays(date, days) {
  return new Date(new Date(date).getTime() + days * DAY_MS);
}

export function daysBetween(from, to) {
  return Math.round((startOfUTCDay(to) - startOfUTCDay(from)) / DAY_MS);
}

export function parseDateInput(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw badRequest(`${field} must be a valid date (YYYY-MM-DD)`);
  return date;
}
