import mongoose from 'mongoose';
import { MAX_LEVEL, MIN_LEVEL } from '../config/constants.js';

const { Schema } = mongoose;

const level = (label) => ({
  type: Number,
  required: [true, `${label} is required`],
  min: [MIN_LEVEL, `${label} must be between ${MIN_LEVEL} and ${MAX_LEVEL}`],
  max: [MAX_LEVEL, `${label} must be between ${MIN_LEVEL} and ${MAX_LEVEL}`],
  validate: { validator: Number.isInteger, message: `${label} must be a whole number` },
});

const employeeCompetencySchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    competency: { type: Schema.Types.ObjectId, ref: 'Competency', required: true },
    currentLevel: level('Current level'),
    requiredLevel: level('Required level'),
    lastAssessedAt: { type: Date, default: Date.now },
    assessedBy: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    notes: { type: String, trim: true, maxlength: [500, 'Notes must be at most 500 characters'] },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// Gap is never negative: exceeding the requirement is a strength, not a deficiency.
employeeCompetencySchema.virtual('gap').get(function gap() {
  return Math.max(0, (this.requiredLevel || 0) - (this.currentLevel || 0));
});

employeeCompetencySchema.index({ employee: 1, competency: 1 }, { unique: true });
employeeCompetencySchema.index({ competency: 1 });

export const EmployeeCompetency = mongoose.model('EmployeeCompetency', employeeCompetencySchema);
