import {
  findAllMachines,
  createMachine,
  stopMachine,
  resumeMachine,
  registerMachineTest,
  updateMachine,
  deleteMachine,
} from '../services/machinesService.js';

function getStatusCode(error) {
  const message = error.message || '';

  if (
    message.includes('não encontrada') ||
    message.includes('Nenhuma parada em aberto')
  ) {
    return 404;
  }

  if (
    message.includes('inválido') ||
    message.includes('obrigatório') ||
    message.includes('Já existe') ||
    message.includes('não é permitido') ||
    message.includes('não pode') ||
    message.includes('deve ser igual') ||
    message.includes('Não é possível registrar teste com a máquina parada')
  ) {
    return 400;
  }

  return 500;
}

function handleControllerError(res, error) {
  const status = error.statusCode || 500;

  return res.status(status).json({
    error: error.message || 'Erro interno do servidor.',
  });
}

export async function getMachines(req, res) {
  try {
    const machines = await findAllMachines();
    return res.status(200).json(machines);
  } catch (error) {
    return handleControllerError(res, error);
  }
}

export async function postMachine(req, res) {
  try {
    const machine = await createMachine(req.body);
    return res.status(201).json(machine);
  } catch (error) {
    return handleControllerError(res, error);
  }
}

export async function postStopMachine(req, res) {
  try {
    const { id } = req.params;
    const machine = await stopMachine(id, req.body);

    return res.status(200).json(machine);
  } catch (error) {
    return handleControllerError(res, error);
  }
}

export async function postResumeMachine(req, res) {
  try {
    const { id } = req.params;
    const machine = await resumeMachine(id, req.body);

    return res.status(200).json(machine);
  } catch (error) {
    return handleControllerError(res, error);
  }
}

export async function postMachineTest(req, res) {
  try {
    const { id } = req.params;
    const machine = await registerMachineTest(id, req.body);

    return res.status(200).json(machine);
  } catch (error) {
    return handleControllerError(res, error);
  }
}

export async function updateMachineController(req, res) {
  try {
    const { id } = req.params;
    const machine = await updateMachine(id, req.body);

    return res.status(200).json(machine);
  } catch (error) {
    return handleControllerError(res, error);
  }
}

export async function deleteMachineController(req, res) {
  try {
    const { id } = req.params;
    const result = await deleteMachine(id);

    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(res, error);
  }
}
