// Ficheiro: backend/src/routes/user.routes.ts
import express from 'express';
import { 
  getMe, 
  updateMe, 
  updateUserAvatar,
  getAllUsers,
  createUser, // Mudou de inviteUser para createUser
  updateUser, // Nova rota
  deleteUser
} from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// --- ROTAS PARA O PRÓPRIO USUÁRIO ---
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.post('/me/avatar', protect, updateUserAvatar);


// --- ROTAS PARA GERENCIAMENTO DE EQUIPE (ADMIN) ---
router.get('/', protect, authorize('Admin'), getAllUsers);
router.post('/', protect, authorize('Admin'), createUser); // Mudou de /invite para /
router.put('/:id', protect, authorize('Admin'), updateUser); // Nova rota para editar
router.delete('/:id', protect, authorize('Admin'), deleteUser);


export default router;
