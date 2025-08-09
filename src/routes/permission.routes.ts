import express from 'express';
import { getAllPermissions } from '../controllers/permission.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Apenas Admins podem ver a lista de todas as permissões
router.get('/', protect, authorize('Admin'), getAllPermissions);

export default router;