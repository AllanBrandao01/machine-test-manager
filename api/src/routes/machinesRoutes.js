import express from 'express';
import { getMachines } from '../controllers/machinesController.js';

const router = express.Router();

router.get('/machines', getMachines);

export default router;
