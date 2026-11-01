import { Router } from 'express';
import {
  createTraining,
  deleteTraining,
  getTraining,
  listTrainings,
  updateTraining,
} from '../controllers/trainingController.js';
import { allowRoles } from '../middleware/demoRole.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = Router();

router.get('/', listTrainings);
router.post('/', allowRoles('hr'), createTraining);
router.get('/:id', validateObjectId('id'), getTraining);
router.patch('/:id', validateObjectId('id'), allowRoles('hr'), updateTraining);
router.delete('/:id', validateObjectId('id'), allowRoles('hr'), deleteTraining);

export default router;
