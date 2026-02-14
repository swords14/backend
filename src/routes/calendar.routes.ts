import { Router } from 'express';

import { getCalendarEvents, getFutureEventItemReservations } from '../controllers/calendar.controler';


import { protect } from '../middleware/auth.middleware'; // Assumindo que este caminho está correto

const router = Router();

// Protege todas as rotas do calendário
router.use(protect);

// Rota para buscar todos os eventos com detalhes de equipe para o calendário
router.get('/events', getCalendarEvents);

// Rota para buscar reservas de itens (movida para o controller de calendário)
router.get('/future-reservations', getFutureEventItemReservations);

export default router;