import express from 'express';
import {
  getMachines,
  postMachine,
  postStopMachine,
  postResumeMachine,
  postMachineTest,
  deleteMachineTestController,
  updateMachineController,
  deleteMachineController,
} from '../controllers/machinesController.js';

const router = express.Router();

router.get('/machines', getMachines);
router.post('/machines', postMachine);
router.post('/machines/:id/stop', postStopMachine);
router.post('/machines/:id/resume', postResumeMachine);
router.post('/machines/:id/test', postMachineTest);
router.delete('/machines/:id/tests/:testId', deleteMachineTestController);
router.put('/machines/:id', updateMachineController);
router.delete('/machines/:id', deleteMachineController);

export default router;
