import mongoose from 'mongoose';
import { DEMO_EMAIL_PATTERN, DEPARTMENTS, EMPLOYMENT_STATUSES } from '../config/constants.js';

const { Schema } = mongoose;

const employeeSchema = new Schema(
  {
    employeeCode: {
      type: String,
      required: [true, 'Employee code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9-]{4,20}$/, 'Employee code must be 4–20 letters, numbers or hyphens (e.g. DEMO-1024)'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name must be at most 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        DEMO_EMAIL_PATTERN,
        'Use a reserved demo address ending in @example.com, @example.org or @example.net — this prototype must not store real personal data',
      ],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: { values: DEPARTMENTS, message: '"{VALUE}" is not a recognised department' },
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    manager: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
      validate: {
        validator: (value) => !value || value <= new Date(),
        message: 'Joining date cannot be in the future',
      },
    },
    employmentStatus: {
      type: String,
      enum: { values: EMPLOYMENT_STATUSES, message: '"{VALUE}" is not a valid employment status' },
      default: 'Active',
    },
    location: { type: String, trim: true, default: 'Gurugram — DLF Cyber City (simulated)' },
  },
  { timestamps: true },
);

employeeSchema.index({ department: 1, jobTitle: 1 });
employeeSchema.index({ manager: 1 });

export const Employee = mongoose.model('Employee', employeeSchema);
