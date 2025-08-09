// Ficheiro: backend/src/routes/auth.routes.ts

import { Router } from 'express';
import { 
    loginUser, 
    registerUser, 
    getAuthUser, 
    getUsers,
    verifyTwoFactorToken
} from '../controllers/auth.controller'; // <-- ESTA É A CORREÇÃO
import { protect } from '../middleware/auth.middleware';


const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/login/verify-2fa', verifyTwoFactorToken); 

router.get('/me', protect, getAuthUser);
router.get('/users', protect, getUsers);

export default router;