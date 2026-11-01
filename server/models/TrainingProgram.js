import mongoose from 'mongoose';
import { DELIVERY_MODES, TRAINING_LEVELS, TRAINING_STATUSES } from '../config/constants.js';

const { Schema } = mongoose;

const trainingProgramSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      unique: true,
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [1000, 'Description must be at most 1000 characters'],
    },
    competencies: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Competency' }],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'Select at least one competency covered by this programme',
      },
    },
    targetRoles: [{ type: String, trim: true }],
    deliveryMode: {
      type: String,
      required: [true, 'Delivery mode is required'],
      enum: { values: DELIVERY_MODES, message: '"{VALUE}" is not a valid delivery mode' },
    },
    durationHours: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [0.5, 'Duration must be at least 0.5 hours'],
      max: [200, 'Duration must be at most 200 hours'],
    },
    level: {
      type: String,
      required: [true, 'Level is required'],
      enum: { values: TRAINING_LEVELS, message: '"{VALUE}" is not a valid level' },
    },
    status: {
      type: String,
      enum: { values: TRAINING_STATUSES, message: '"{VALUE}" is not a valid status' },
      default: 'Active',
    },
    provider: { type: String, trim: true, default: 'Internal L&D (proposed)', maxlength: 80 },
  },
  { timestamps: true },
);

trainingProgramSchema.index({ status: 1, deliveryMode: 1, level: 1 });
trainingProgramSchema.index({ competencies: 1 });

export const TrainingProgram = mongoose.model('TrainingProgram', trainingProgramSchema);
