import { Router } from 'express';
import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  listEmployees,
  updateEmployee,
} from '../controllers/employeeController.js';
import { allowRoles } from '../middleware/demoRole.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = Router();

router.get('/', listEmployees);
router.post('/', allowRoles('hr'), createEmployee);
router.get('/:id', validateObjectId('id'), getEmployee);
router.patch('/:id', validateObjectId('id'), allowRoles('hr'), updateEmployee);
router.delete('/:id', validateObjectId('id'), allowRoles('hr'), deleteEmployee);

export default router;
