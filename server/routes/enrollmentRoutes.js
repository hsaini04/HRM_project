import { Router } from 'express';
import {
  createEnrollments,
  deleteEnrollment,
  getEnrollment,
  listEnrollments,
  updateEnrollment,
  updateEnrollmentProgress,
} from '../controllers/enrollmentController.js';
import { allowRoles } from '../middleware/demoRole.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = Router();

router.get('/', listEnrollments);
router.post('/', allowRoles('hr', 'manager'), createEnrollments);
router.get('/:id', validateObjectId('id'), getEnrollment);
// Employees may update their own progress; the controller enforces ownership.
router.patch('/:id/progress', validateObjectId('id'), updateEnrollmentProgress);
router.patch('/:id', validateObjectId('id'), allowRoles('hr', 'manager'), updateEnrollment);
router.delete('/:id', validateObjectId('id'), allowRoles('hr', 'manager'), deleteEnrollment);

export default router;
