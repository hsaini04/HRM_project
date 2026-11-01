import mongoose from 'mongoose';
import { DEPARTMENTS } from '../config/constants.js';

const { Schema } = mongoose;

// Proposed role definitions for the prototype — not Lutron's official job architecture.
const jobRoleSchema = new Schema(
  {
    title: { type: String, required: [true, 'Role title is required'], unique: true, trim: true },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: { values: DEPARTMENTS, message: '"{VALUE}" is not a recognised department' },
    },
    summary: { type: String, trim: true, maxlength: 600 },
    responsibilities: [{ type: String, trim: true }],
    // Illustrative career track this role belongs to (e.g. "Lighting Design") and its step on that track.
    track: { type: String, trim: true, default: null },
    trackLevel: { type: Number, min: 1, max: 5, default: null },
    isFocusRole: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const JobRole = mongoose.model('JobRole', jobRoleSchema);
