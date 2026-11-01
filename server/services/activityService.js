import { ActivityLog } from '../models/index.js';

export async function logActivity({ type, message, actor, employee = null }) {
  try {
    await ActivityLog.create({
      type,
      message,
      actorName: actor?.name || 'System',
      actorRole: actor?.role || null,
      employee,
    });
  } catch (error) {
    // Activity logging must never break the main request.
    console.warn('Could not record activity:', error.message);
  }
}
