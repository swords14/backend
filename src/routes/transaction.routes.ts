// Caminho do arquivo: backend/src/routes/transaction.routes.ts
import { Router } from 'express';
import { 
    getTransactions,
    createTransaction,
    updateTransaction,
    updateTransactionStatus,
    deleteTransaction,
    getTransactionCategories
} from '../controllers/transaction.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protege todas as rotas de transações
router.use(protect);

router.get('/', getTransactions);
router.get('/categories', getTransactionCategories); // Rota para buscar categorias dinamicamente
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);
router.patch('/:id/status', updateTransactionStatus);

export default router;