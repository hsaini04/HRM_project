import { badRequest } from '../utils/httpError.js';
import { isObjectId } from '../utils/query.js';

export const validateObjectId =
  (...params) =>
  (req, res, next) => {
    for (const param of params) {
      if (!isObjectId(req.params[param])) {
        return next(badRequest(`Invalid ${param}: expected a 24-character MongoDB ObjectId`));
      }
    }
    return next();
  };
