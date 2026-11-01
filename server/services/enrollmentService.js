import { TrainingEnrollment } from '../models/index.js';
import { startOfUTCDay } from '../utils/dates.js';

/**
 * Status depends on the calendar as well as progress: an "In Progress" item becomes
 * "Overdue" once its due date passes. Run before reading enrolment data so reports
 * always reflect today's date.
 */
export async function refreshOverdueStatuses() {
  const result = await TrainingEnrollment.updateMany(
    { status: { $in: ['Not Started', 'In Progress'] }, dueDate: { $lt: startOfUTCDay() } },
    { $set: { status: 'Overdue' } },
  );
  return result.modifiedCount;
}
