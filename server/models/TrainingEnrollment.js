import mongoose from 'mongoose';
import { ENROLLMENT_STATUSES } from '../config/constants.js';
import { deriveEnrollmentStatus } from '../services/enrollmentStatus.js';
import { startOfUTCDay } from '../utils/dates.js';

const { Schema } = mongoose;

const trainingEnrollmentSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: [true, 'Employee is required'] },
    program: { type: Schema.Types.ObjectId, ref: 'TrainingProgram', required: [true, 'Training programme is required'] },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    assignedAt: { type: Date, default: Date.now },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      validate: {
        validator(value) {
          return !value || !this.assignedAt || startOfUTCDay(value) >= startOfUTCDay(this.assignedAt);
        },
        message: 'Due date cannot be earlier than the assignment date',
      },
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, 'Progress must be between 0 and 100'],
      max: [100, 'Progress must be between 0 and 100'],
      validate: { validator: Number.isInteger, message: 'Progress must be a whole number' },
    },
    status: {
      type: String,
      enum: { values: ENROLLMENT_STATUSES, message: '"{VALUE}" is not a valid status' },
      default: 'Not Started',
    },
    completedAt: { type: Date, default: null },
    lastProgressAt: { type: Date, default: null },
    assessmentScore: {
      type: Number,
      min: [0, 'Assessment score must be between 0 and 100'],
      max: [100, 'Assessment score must be between 0 and 100'],
      default: null,
    },
    feedback: { type: String, trim: true, maxlength: [500, 'Feedback must be at most 500 characters'] },
  },
  { timestamps: true },
);

// Keep status and completion date consistent with progress on every save.
trainingEnrollmentSchema.pre('validate', function syncStatus() {
  this.status = deriveEnrollmentStatus(this.progress, this.dueDate);
  if (this.status === 'Completed') {
    this.completedAt = this.completedAt || new Date();
  } else {
    this.completedAt = null;
  }
});

trainingEnrollmentSchema.index({ employee: 1, program: 1 });
trainingEnrollmentSchema.index({ status: 1, dueDate: 1 });

export const TrainingEnrollment = mongoose.model('TrainingEnrollment', trainingEnrollmentSchema);
