import express from 'express';
// O caminho para o controller foi corrigido aqui
// Update the path below if your controller is in a different location
import { getAllTemplates, createTemplate, updateTemplate, deleteTemplate } from '../controllers/documentTemplate.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Todas as rotas de modelos requerem permissão de Admin
router.get('/', protect, authorize('Admin'), getAllTemplates);
router.post('/', protect, authorize('Admin'), createTemplate);
router.put('/:id', protect, authorize('Admin'), updateTemplate);
router.delete('/:id', protect, authorize('Admin'), deleteTemplate);

export default router;
