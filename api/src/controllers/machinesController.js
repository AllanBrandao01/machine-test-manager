import {
  findAllMachines,
  createMachine,
  stopMachine,
  resumeMachine,
  registerMachineTest,
} from '../services/machinesService.js';

export async function getMachines(req, res) {
  try {
    const machines = await findAllMachines();
    return res.json(machines);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function postMachine(req, res) {
  try {
    const machine = await createMachine(req.body);
    return res.status(201).json(machine);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function postStopMachine(req, res) {
  try {
    const { id } = req.params;

    const stop = await stopMachine(id, req.body);

    return res.status(201).json(stop);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function postResumeMachine(req, res) {
  try {
    const { id } = req.params;

    const stop = await resumeMachine(id, req.body);

    return res.status(200).json(stop);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function postMachineTest(req, res) {
  try {
    const { id } = req.params;

    const test = await registerMachineTest(id, req.body);

    return res.status(201).json(test);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
