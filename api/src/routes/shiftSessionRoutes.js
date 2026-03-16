import { Router } from 'express';
import {
  getActiveShiftSessionController,
  startNewShiftSessionController,
  deactivateShiftSessionController,
} from '../controllers/shiftSessionController.js';

const router = Router();

router.get('/active', getActiveShiftSessionController);
router.post('/start', startNewShiftSessionController);
router.post('/:id/deactivate', deactivateShiftSessionController);

export default router;
