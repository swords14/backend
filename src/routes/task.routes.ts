// Caminho: backend/src/routes/task.routes.ts

import { Router } from 'express';
import { 
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask
} from '../controllers/task.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Todas as rotas de tarefas são protegidas, exigindo autenticação.
router.post('/', protect, createTask);
router.get('/', protect, getAllTasks);
router.get('/:id', protect, getTaskById);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, deleteTask);

export default router;