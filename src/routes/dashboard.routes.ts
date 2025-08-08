// Caminho: backend/src/routes/dashboard.routes.ts

import { Router } from 'express';
import { getDashboardData, saveUserDashboardLayout } from '../routes/controllers/dashboard.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protect, getDashboardData);
router.put('/layout', protect, saveUserDashboardLayout);

export default router;