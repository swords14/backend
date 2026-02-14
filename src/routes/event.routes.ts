// Ficheiro: backend/src/routes/event.routes.ts
import { Router } from 'express';

import {
    createEvent,
    deleteEvent,
    getEvents,
    updateEvent,
    createEventFromBudget, // <-- Adicionado para importar a função de criação a partir do orçamento
    finalizeEvent // <-- Adicionado para importar a nova função de finalizar evento
    } from '../controllers/event.controller'; // Verifique se o caminho está correto: '../controllers/' ou './controllers/'
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protege TODAS as rotas neste arquivo.
// Qualquer requisição para /api/events/* passará primeiro pelo middleware 'protect'.
router.use(protect);

// Rota GET para listar eventos
router.get('/', getEvents);

// Outras rotas de CRUD de evento
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

// Adicionada a rota para criar evento a partir de um orçamento
router.post('/from-budget', createEventFromBudget); // <-- NOVA ROTA PARA O SEU CASO

// Rota para finalizar um evento
router.patch('/:eventId/finalize', finalizeEvent); // <-- NOVA ROTA

export default router;