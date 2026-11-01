import mongoose from 'mongoose';
import { CAREER_PLAN_STATUSES, GOAL_STATUSES } from '../config/constants.js';

const { Schema } = mongoose;

const goalSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    minlength: [3, 'Goal title must be at least 3 characters'],
    maxlength: [160, 'Goal title must be at most 160 characters'],
  },
  competency: { type: Schema.Types.ObjectId, ref: 'Competency', default: null },
  targetDate: { type: Date, default: null },
  status: {
    type: String,
    enum: { values: GOAL_STATUSES, message: '"{VALUE}" is not a valid goal status' },
    default: 'Not Started',
  },
});

const careerPlanSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: [true, 'Employee is required'], unique: true },
    currentRole: { type: String, required: [true, 'Current role is required'], trim: true },
    targetRole: { type: String, required: [true, 'Target role is required'], trim: true },
    goals: {
      type: [goalSchema],
      validate: {
        validator: (items) => items.length <= 10,
        message: 'A development plan can have at most 10 goals',
      },
    },
    recommendedTrainings: [{ type: Schema.Types.ObjectId, ref: 'TrainingProgram' }],
    mentor: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    reviewDate: { type: Date, default: null },
    status: {
      type: String,
      enum: { values: CAREER_PLAN_STATUSES, message: '"{VALUE}" is not a valid plan status' },
      default: 'Active',
    },
    notes: { type: String, trim: true, maxlength: [600, 'Notes must be at most 600 characters'] },
  },
  { timestamps: true },
);

export const CareerPlan = mongoose.model('CareerPlan', careerPlanSchema);
