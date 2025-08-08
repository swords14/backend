// Ficheiro: backend/src/routes/company.routes.ts

import express from 'express';
// CORREÇÃO NO CAMINHO: O controller está em '../controllers', não em '../routes/controllers'
import { getCompanyData, updateCompanyData } from '../routes/controllers/company.controller';
// 1. IMPORTE A FUNÇÃO 'authorize'
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Rota para buscar os dados da empresa
// Todos os usuários logados podem ver
router.get('/', protect, getCompanyData);

// Rota para atualizar os dados da empresa
// Apenas Admins podem atualizar
// 2. DESCOMENTE O MIDDLEWARE 'authorize'
router.put('/', protect, authorize('Admin'), updateCompanyData);

export default router;