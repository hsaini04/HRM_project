import mongoose from 'mongoose';

const { Schema } = mongoose;

export const ACTIVITY_TYPES = [
  'employee.created',
  'employee.updated',
  'employee.deleted',
  'competency.created',
  'competency.updated',
  'assessment.updated',
  'training.created',
  'training.updated',
  'enrollment.assigned',
  'enrollment.progress',
  'enrollment.completed',
  'enrollment.updated',
  'enrollment.removed',
  'career.created',
  'career.updated',
];

// Audit-style feed that powers "Recent activity". Seeded entries mirror the seeded records.
const activityLogSchema = new Schema(
  {
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    message: { type: String, required: true, trim: true },
    actorName: { type: String, trim: true, default: 'System' },
    actorRole: { type: String, trim: true, default: null },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ employee: 1, createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
