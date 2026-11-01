export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const forbidden = (message) => new HttpError(403, message);
export const notFound = (entity = 'Resource') => new HttpError(404, `${entity} not found`);
export const conflict = (message, details) => new HttpError(409, message, details);
