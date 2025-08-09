// Caminho do arquivo: backend/src/routes/budget.routes.ts
import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getBudgets, createBudget, getBudgetById, updateBudget, deleteBudget, updateBudgetStatus } from '../controllers/budget.controller';

const router = Router();

// Todas as rotas de orçamento devem ser protegidas
router.use(protect);

router.get('/', getBudgets);
router.post('/', createBudget);
router.get('/:budgetId', getBudgetById);
router.put('/:budgetId', updateBudget);
router.delete('/:budgetId', deleteBudget);
router.patch('/:budgetId/status', updateBudgetStatus); // Rota para ação rápida de mudança de status

export default router;