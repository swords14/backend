// Ficheiro: backend/src/routes/audit.routes.ts

import { Router } from 'express';
import { getAuditLogs } from '../routes/controllers/audit.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Aplica o middleware de proteção diretamente na rota
router.get('/', protect, getAuditLogs);

export default router;