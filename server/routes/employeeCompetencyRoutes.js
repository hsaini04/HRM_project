import { Router } from 'express';
import { getEmployeeCompetencies, updateEmployeeCompetencies } from '../controllers/competencyController.js';
import { allowRoles } from '../middleware/demoRole.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = Router();

router.get('/:employeeId', validateObjectId('employeeId'), getEmployeeCompetencies);
router.put('/:employeeId', validateObjectId('employeeId'), allowRoles('hr', 'manager'), updateEmployeeCompetencies);

export default router;
