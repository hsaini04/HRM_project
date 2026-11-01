import { Router } from 'express';
import {
  createCompetency,
  getCompetencyMatrix,
  listCompetencies,
  updateCompetency,
} from '../controllers/competencyController.js';
import { allowRoles } from '../middleware/demoRole.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = Router();

router.get('/', listCompetencies);
router.get('/matrix', getCompetencyMatrix);
router.post('/', allowRoles('hr'), createCompetency);
router.patch('/:id', validateObjectId('id'), allowRoles('hr'), updateCompetency);

export default router;
