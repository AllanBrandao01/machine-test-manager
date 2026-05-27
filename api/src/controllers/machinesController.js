import {
  findAllMachines,
  createMachine,
  stopMachine,
  resumeMachine,
  registerMachineTest,
  updateMachine,
  deleteMachine,
} from '../services/machinesService.js';

function handleControllerError(error, res) {
  console.error(error);

  return res.status(error.statusCode || 500).json({
    error: error.message || 'Erro interno do servidor.',
  });
}

export async function getMachines(req, res) {
  try {
    const machines = await findAllMachines();
    return res.status(200).json(machines);
  } catch (error) {
    return handleControllerError(error, res);
  }
}

export async function postMachine(req, res) {
  try {
    const machine = await createMachine(req.body);
    return res.status(201).json(machine);
  } catch (error) {
    return handleControllerError(error, res);
  }
}

export async function postStopMachine(req, res) {
  try {
    const { id } = req.params;
    const machine = await stopMachine(id, req.body);

    return res.status(200).json(machine);
  } catch (error) {
    return handleControllerError(error, res);
  }
}

export async function postResumeMachine(req, res) {
  try {
    const { id } = req.params;
    const machine = await resumeMachine(id, req.body);

    return res.status(200).json(machine);
  } catch (error) {
    return handleControllerError(error, res);
  }
}

export async function postMachineTest(req, res) {
  try {
    const { id } = req.params;
    const machine = await registerMachineTest(id, req.body);

    return res.status(200).json(machine);
  } catch (error) {
    return handleControllerError(error, res);
  }
}

export async function updateMachineController(req, res) {
  try {
    const { id } = req.params;
    const machine = await updateMachine(id, req.body);

    return res.status(200).json(machine);
  } catch (error) {
    return handleControllerError(error, res);
  }
}

export async function deleteMachineController(req, res) {
  try {
    const { id } = req.params;
    const result = await deleteMachine(id);

    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res);
  }
}
