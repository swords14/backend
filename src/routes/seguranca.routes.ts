// Ficheiro: backend/src/routes/seguranca.routes.ts
import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  changePassword,
  generateTwoFactorSecret,
  enableTwoFactorAuth,
  disableTwoFactorAuth,
  getActivityLog
} from '../routes/controllers/seguranca.controller';

const router = Router();

// Todas as rotas aqui exigem que o usuário esteja autenticado
router.use(protect);

// Rota para alterar a senha
router.post('/alterar-senha', changePassword);

// Rotas para gerenciar 2FA
router.post('/2fa/gerar', generateTwoFactorSecret);
router.post('/2fa/ativar', enableTwoFactorAuth);
router.post('/2fa/desativar', disableTwoFactorAuth);

// Rota para obter o log de atividades
router.get('/logs-de-atividade', getActivityLog);

export default router;