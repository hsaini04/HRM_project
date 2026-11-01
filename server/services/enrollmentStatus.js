import { startOfUTCDay } from '../utils/dates.js';

/**
 * Single source of truth for an enrolment's status.
 * Status is never set directly — it is derived from progress and due date:
 *   100%                      → Completed
 *   due date before today     → Overdue
 *   1–99%                     → In Progress
 *   0%                        → Not Started
 */
export function deriveEnrollmentStatus(progress, dueDate, now = new Date()) {
  if (progress >= 100) return 'Completed';
  if (dueDate && startOfUTCDay(dueDate) < startOfUTCDay(now)) return 'Overdue';
  if (progress > 0) return 'In Progress';
  return 'Not Started';
}
