import mongoose from 'mongoose';
import { COMPETENCY_CATEGORIES, MAX_LEVEL, MIN_LEVEL } from '../config/constants.js';

const { Schema } = mongoose;

const levelField = {
  type: Number,
  required: [true, 'Required level is required'],
  min: [MIN_LEVEL, `Level must be between ${MIN_LEVEL} and ${MAX_LEVEL}`],
  max: [MAX_LEVEL, `Level must be between ${MIN_LEVEL} and ${MAX_LEVEL}`],
  validate: { validator: Number.isInteger, message: 'Level must be a whole number' },
};

const roleRequirementSchema = new Schema(
  {
    jobTitle: { type: String, required: [true, 'Job title is required'], trim: true },
    requiredLevel: levelField,
  },
  { _id: false },
);

const competencySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Competency name is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [90, 'Name must be at most 90 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: COMPETENCY_CATEGORIES, message: 'Category must be Core, Functional or Behavioural' },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [500, 'Description must be at most 500 characters'],
    },
    assessmentMethod: { type: String, trim: true, maxlength: 200 },
    // Expected proficiency for each job role this competency applies to.
    roleRequirements: {
      type: [roleRequirementSchema],
      validate: {
        validator: (items) => new Set(items.map((item) => item.jobTitle)).size === items.length,
        message: 'Each job role can only appear once per competency',
      },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

competencySchema.virtual('applicableRoles').get(function applicableRoles() {
  return (this.roleRequirements || []).map((item) => item.jobTitle);
});

competencySchema.index({ category: 1, name: 1 });
competencySchema.index({ 'roleRequirements.jobTitle': 1 });

export const Competency = mongoose.model('Competency', competencySchema);
