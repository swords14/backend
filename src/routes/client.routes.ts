// Caminho: backend/src/routes/client.routes.ts

import { Router } from 'express';
import { 
  getClients, 
  getClientById,
  createClient,
  updateClient,
  deleteClient
} from '../controllers/client.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// --- ROTAS PARA CRUD DE CLIENTES ---
router.get('/', protect, getClients);
router.get('/:id', protect, getClientById);
router.post('/', protect, createClient);
router.put('/:id', protect, updateClient);
router.delete('/:id', protect, deleteClient);

export default router;