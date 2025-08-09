// Caminho do arquivo: backend/src/routes/inventory.route.ts

import { Router } from 'express';
import multer from 'multer';
import uploadConfig from '../config/upload';
import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  addInventoryMovement,
  getAllInventoryItemsForBudget,
  getInventoryCategories
} from '../controllers/inventory.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();
const upload = multer(uploadConfig);

router.use(protect);

router.get('/', getInventoryItems);
router.get('/for-budget', getAllInventoryItemsForBudget);
router.get('/categories', getInventoryCategories);
router.post('/', upload.single('image'), createInventoryItem);
router.put('/:id', upload.single('image'), updateInventoryItem);
router.delete('/:id', deleteInventoryItem);

router.post('/:id/movement', addInventoryMovement);

export default router;