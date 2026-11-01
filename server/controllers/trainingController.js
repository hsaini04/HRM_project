import { DELIVERY_MODES, TRAINING_LEVELS, TRAINING_STATUSES } from '../config/constants.js';
import { getActor } from '../middleware/demoRole.js';
import { Competency, JobRole, TrainingEnrollment, TrainingProgram } from '../models/index.js';
import { logActivity } from '../services/activityService.js';
import { badRequest, conflict, notFound } from '../utils/httpError.js';
import {
  assertOneOf,
  escapeRegex,
  isObjectId,
  optionalObjectId,
  paginationMeta,
  parsePagination,
  pick,
} from '../utils/query.js';

const EDITABLE_FIELDS = [
  'title',
  'description',
  'competencies',
  'targetRoles',
  'deliveryMode',
  'durationHours',
  'level',
  'status',
  'provider',
];

async function validateReferences(payload) {
  const errors = {};
  if (payload.competencies !== undefined) {
    if (!Array.isArray(payload.competencies) || payload.competencies.some((id) => !isObjectId(id))) {
      errors.competencies = 'Competencies must be a list of valid competency ids';
    } else {
      const found = await Competency.countDocuments({ _id: { $in: payload.competencies } });
      if (found !== new Set(payload.competencies.map(String)).size) {
        errors.competencies = 'One or more selected competencies do not exist';
      }
    }
  }
  if (payload.targetRoles !== undefined) {
    if (!Array.isArray(payload.targetRoles)) {
      errors.targetRoles = 'Target roles must be a list';
    } else {
      const known = await JobRole.find({ title: { $in: payload.targetRoles } }).distinct('title');
      const unknown = payload.targetRoles.filter((title) => !known.includes(title));
      if (unknown.length) errors.targetRoles = `Unknown job role(s): ${unknown.join(', ')}`;
    }
  }
  if (Object.keys(errors).length) throw badRequest('Validation failed', errors);
}

async function enrollmentStats(programIds) {
  const rows = await TrainingEnrollment.aggregate([
    { $match: { program: { $in: programIds } } },
    {
      $group: {
        _id: '$program',
        enrollments: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        active: { $sum: { $cond: [{ $ne: ['$status', 'Completed'] }, 1, 0] } },
      },
    },
  ]);
  const byId = new Map(rows.map((row) => [String(row._id), row]));
  return (id) => {
    const row = byId.get(String(id));
    return { enrollments: row?.enrollments || 0, completed: row?.completed || 0, active: row?.active || 0 };
  };
}

export async function listTrainings(req, res) {
  const { search, deliveryMode, level, status, competency, targetRole } = req.query;
  const filter = {};
  if (deliveryMode) filter.deliveryMode = assertOneOf(deliveryMode, DELIVERY_MODES, 'deliveryMode');
  if (level) filter.level = assertOneOf(level, TRAINING_LEVELS, 'level');
  if (status) filter.status = assertOneOf(status, TRAINING_STATUSES, 'status');
  if (competency) filter.competencies = optionalObjectId(competency, 'competency');
  if (targetRole) filter.targetRoles = String(targetRole);
  if (search) {
    const pattern = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  const pagination = parsePagination(req.query, { defaultLimit: 50, maxLimit: 100 });
  const [items, total] = await Promise.all([
    TrainingProgram.find(filter)
      .populate('competencies', 'name category')
      .sort({ status: 1, title: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    TrainingProgram.countDocuments(filter),
  ]);
  const stats = await enrollmentStats(items.map((item) => item._id));

  res.json({
    data: items.map((item) => ({ ...item, stats: stats(item._id) })),
    meta: paginationMeta(pagination, total),
  });
}

export async function getTraining(req, res) {
  const program = await TrainingProgram.findById(req.params.id).populate('competencies', 'name category').lean();
  if (!program) throw notFound('Training programme');
  const stats = await enrollmentStats([program._id]);
  res.json({ data: { ...program, stats: stats(program._id) } });
}

export async function createTraining(req, res) {
  const payload = pick(req.body, EDITABLE_FIELDS);
  await validateReferences(payload);
  const program = await TrainingProgram.create(payload);

  const actor = await getActor(req);
  await logActivity({
    type: 'training.created',
    message: `${actor.name} added "${program.title}" to the training catalogue`,
    actor,
  });
  res.status(201).json({ data: program });
}

export async function updateTraining(req, res) {
  const program = await TrainingProgram.findById(req.params.id);
  if (!program) throw notFound('Training programme');

  const payload = pick(req.body, EDITABLE_FIELDS);
  await validateReferences(payload);
  program.set(payload);
  await program.save();

  const actor = await getActor(req);
  await logActivity({
    type: 'training.updated',
    message: `${actor.name} updated the programme "${program.title}"`,
    actor,
  });
  res.json({ data: program });
}

export async function deleteTraining(req, res) {
  const program = await TrainingProgram.findById(req.params.id);
  if (!program) throw notFound('Training programme');

  const enrollments = await TrainingEnrollment.countDocuments({ program: program._id });
  if (enrollments > 0) {
    throw conflict(
      `"${program.title}" has ${enrollments} enrolment(s). Set its status to Archived instead of deleting it.`,
    );
  }
  await program.deleteOne();
  res.status(204).end();
}
