import { findAllMachines } from '../services/machinesService.js';

export async function getMachines(req, res) {
  try {
    const machines = await findAllMachines();
    return res.json(machines);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
