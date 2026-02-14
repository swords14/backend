// Ficheiro: backend/src/routes/company.routes.ts

import express from 'express';
import { getCompanyData, updateCompanyData } from '../controllers/company.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Rota para buscar os dados da empresa
// Todos os usuários logados podem ver
router.get('/', protect, getCompanyData);

// Rota para atualizar os dados da empresa
// Apenas Admins podem atualizar
router.put('/', protect, authorize('Admin'), updateCompanyData);

export default router;