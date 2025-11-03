import { Router } from 'express';
import { ItemController } from '../controllers/item.controller';
import {
  readOperationsLimiter,
  writeOperationsLimiter,
  batchOperationsLimiter,
} from '../middleware/rate-limiter.middleware';

const router = Router();

// GET routes with read rate limiting
router.get('/', readOperationsLimiter, ItemController.getAll);
router.get('/:id', readOperationsLimiter, ItemController.getById);

// POST routes with write rate limiting
router.post('/', writeOperationsLimiter, ItemController.create);

// Batch operations with stricter rate limiting
router.post('/batch', batchOperationsLimiter, ItemController.createMultiple);

// PUT and DELETE routes with write rate limiting
router.put('/:id', writeOperationsLimiter, ItemController.update);
router.delete('/:id', writeOperationsLimiter, ItemController.delete);

export default router;
