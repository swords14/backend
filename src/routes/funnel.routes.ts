// Caminho: backend/src/routes/funnel.routes.ts

import { Router } from 'express';
import { getFunnelData } from '../routes/controllers/funnel.controller';
import { updateBudgetStatus } from '../routes/controllers/budget.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect); // Protege todas as rotas do funil

router.get('/', getFunnelData);
router.put('/:budgetId/status', updateBudgetStatus);

export default router;