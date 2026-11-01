import mongoose from 'mongoose';
import { isProduction, isTest } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

// Central error handler: converts known error types into consistent JSON responses.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = 500;
  let message = 'Something went wrong on the server';
  let details;

  if (err instanceof HttpError) {
    status = err.status;
    message = err.message;
    details = err.details;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Validation failed';
    details = Object.fromEntries(
      Object.entries(err.errors).map(([field, error]) => [
        field,
        error instanceof mongoose.Error.CastError ? `Invalid value for ${field}` : error.message,
      ]),
    );
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err?.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || err.keyPattern || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
    details = { [field]: message };
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  } else if (err?.status >= 400 && err.status < 500) {
    // Other client errors raised by Express internals (e.g. static file lookups).
    status = err.status;
    message = err.expose ? err.message : 'Request could not be processed';
  }

  if (status >= 500 && !isTest) console.error(err);

  res.status(status).json({
    error: {
      message,
      ...(details ? { details } : {}),
      ...(status >= 500 && !isProduction ? { debug: err?.message } : {}),
    },
  });
}
