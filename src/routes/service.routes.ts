import express from 'express';
import { getAllServices } from '../routes/controllers/service.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', protect, getAllServices);

export default router;
