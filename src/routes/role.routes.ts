import express from 'express';
import { getAllRoles, createRole, updateRole } from '../controllers/role.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Apenas Admins podem gerenciar cargos e permissões
router.get('/', protect, authorize('Admin'), getAllRoles);
router.post('/', protect, authorize('Admin'), createRole);
router.put('/:id', protect, authorize('Admin'), updateRole);

export default router;