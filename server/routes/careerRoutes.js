import { Router } from 'express';
import {
  createCareerPlan,
  getCareerPlan,
  listCareerPaths,
  listCareerPlans,
  updateCareerPlan,
  updateGoalStatus,
} from '../controllers/careerController.js';
import { allowRoles } from '../middleware/demoRole.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

export const careerPlanRouter = Router();

careerPlanRouter.get('/', listCareerPlans);
careerPlanRouter.post('/', allowRoles('hr', 'manager'), createCareerPlan);
careerPlanRouter.get('/:id', validateObjectId('id'), getCareerPlan);
careerPlanRouter.patch('/:id', validateObjectId('id'), allowRoles('hr', 'manager'), updateCareerPlan);
// Employees may update the status of goals in their own plan; the controller enforces ownership.
careerPlanRouter.patch('/:id/goals/:goalId', validateObjectId('id', 'goalId'), updateGoalStatus);

export const careerPathRouter = Router();

careerPathRouter.get('/', listCareerPaths);
