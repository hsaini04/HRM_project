import { Router } from 'express';
import { listSkillGaps } from '../controllers/skillsController.js';

const router = Router();

router.get('/gaps', listSkillGaps);

export default router;
