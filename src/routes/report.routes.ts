import { Router } from 'express';
import { getReportData } from '../routes/controllers/report.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protege a rota de relatórios, garantindo que apenas usuários logados possam acessá-la
router.use(protect);

// Rota principal que recebe o nome do relatório como parâmetro
router.get('/:reportName', getReportData);

export default router;