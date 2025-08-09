// Ficheiro: backend/src/routes/calendar.routes.ts
import { Router } from 'express';
// Ajuste o caminho de importação do controller conforme a sua estrutura real
// Ex: Se calendar.controller.ts estiver em src/controllers/
import { getCalendarEvents, getFutureEventItemReservations } from '../controllers/calendar.controler';
// Ou se estiver em src/routes/controllers/ (menos comum)
// import { getCalendarEvents, getFutureEventItemReservations } from './controllers/calendar.controller';

import { protect } from '../middleware/auth.middleware'; // Assumindo que este caminho está correto

const router = Router();

// Protege todas as rotas do calendário
router.use(protect);

// Rota para buscar todos os eventos com detalhes de equipe para o calendário
router.get('/events', getCalendarEvents);

// Rota para buscar reservas de itens (movida para o controller de calendário)
router.get('/future-reservations', getFutureEventItemReservations);

export default router;