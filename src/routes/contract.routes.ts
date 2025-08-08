// Caminho: backend/src/routes/contract.routes.ts

import { Router } from 'express';
import { 
    createContract, 
    createContractFromBudget, 
    getAllContracts, 
    getContractById, 
    updateContractStatus,
    deleteContract,
    updateContract // NOVO: Importa o novo controlador
} from '../routes/controllers/contract.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', getAllContracts);
router.get('/:id', getContractById);
router.post('/', createContract);
router.post('/from-budget', createContractFromBudget);
router.put('/:id', updateContract); // NOVO: Rota para atualizar o contrato completo
router.patch('/:id/status', updateContractStatus);
router.delete('/:id', deleteContract);

export default router;