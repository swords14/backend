import { Router } from 'express';
import { LayoutController } from '../routes/controllers/LayoutController';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Aplicar middleware de autenticação a todas as rotas de layout
router.use(protect);

// router.use(authMiddleware); 

router.post('/layouts', LayoutController.create);
router.get('/layouts', LayoutController.list);
router.get('/layouts/:id', LayoutController.getById);
router.put('/layouts/:id', LayoutController.update);
// Adicione a rota de DELETE se desejar

export { router as layoutRoutes };