import { Router } from 'express';
import { getAlerts, getSummary, getTrainingAnalytics } from '../controllers/dashboardController.js';

const router = Router();

router.get('/summary', getSummary);
router.get('/training-analytics', getTrainingAnalytics);
router.get('/alerts', getAlerts);

export default router;
