import { Router } from 'express';
import { getHealth, getMeta, getPersonas } from '../controllers/metaController.js';
import { demoContext } from '../middleware/demoRole.js';
import { careerPathRouter, careerPlanRouter } from './careerRoutes.js';
import competencyRoutes from './competencyRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import employeeCompetencyRoutes from './employeeCompetencyRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import enrollmentRoutes from './enrollmentRoutes.js';
import skillRoutes from './skillRoutes.js';
import trainingRoutes from './trainingRoutes.js';

const router = Router();

router.get('/health', getHealth);
router.get('/demo/personas', getPersonas);

router.use(demoContext);
router.get('/meta', getMeta);
router.use('/dashboard', dashboardRoutes);
router.use('/employees', employeeRoutes);
router.use('/competencies', competencyRoutes);
router.use('/employee-competencies', employeeCompetencyRoutes);
router.use('/skills', skillRoutes);
router.use('/trainings', trainingRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/career-plans', careerPlanRouter);
router.use('/career-paths', careerPathRouter);

export default router;
