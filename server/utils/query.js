import mongoose from 'mongoose';
import { badRequest } from './httpError.js';

export function parsePagination(query, { defaultLimit = 10, maxLimit = 100 } = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const rawLimit = Number.parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.min(Math.max(1, rawLimit), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

export function paginationMeta({ page, limit }, total) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function pick(source, keys) {
  const out = {};
  for (const key of keys) {
    if (source && Object.prototype.hasOwnProperty.call(source, key)) out[key] = source[key];
  }
  return out;
}

export const isObjectId = (value) => mongoose.isValidObjectId(value) && /^[a-f\d]{24}$/i.test(String(value));

export function assertObjectId(value, field = 'id') {
  if (!isObjectId(value)) throw badRequest(`Invalid ${field}: expected a 24-character MongoDB ObjectId`);
  return value;
}

export function optionalObjectId(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  return assertObjectId(value, field);
}

export function assertOneOf(value, allowed, field) {
  if (value === undefined || value === '') return undefined;
  if (!allowed.includes(value)) {
    throw badRequest(`Invalid ${field}. Allowed values: ${allowed.join(', ')}`);
  }
  return value;
}
