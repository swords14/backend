// Caminho: backend/src/routes/feedback.routes.ts

import { Router } from 'express';
import { 
    getEventsForFeedback, 
    createFeedbackRecord,
    getFeedbackById,
    submitFeedback 
} from '../routes/controllers/feedback.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// --- ROTAS PÚBLICAS (Acesso sem autenticação) ---
// Acessadas pelo cliente externo para preencher o formulário.
router.get('/:feedbackId', getFeedbackById);
router.post('/submit/:feedbackId', submitFeedback);

// --- ROTAS PROTEGIDAS (Acesso apenas com autenticação) ---
// Acessadas pelo usuário do ERP na tela de Avaliações.
router.get('/', protect, getEventsForFeedback);
router.post('/record', protect, createFeedbackRecord);

export default router;