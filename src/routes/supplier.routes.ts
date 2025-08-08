// Caminho do arquivo: backend/src/routes/supplier.routes.ts
import { Router } from 'express';
import { 
    getSuppliers, createSupplier, updateSupplier, deleteSupplier, getSupplierCategories 
} from '../routes/controllers/supplier.controller'; 
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protege todas as rotas de fornecedores
router.use(protect);

router.get('/', getSuppliers);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);
router.get('/categories', getSupplierCategories);

export default router;