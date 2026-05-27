import {
  getActiveShiftSession,
  startNewShiftSession,
  deactivateShiftSession,
} from '../services/shiftSessionService.js';

function handleControllerError(error, res) {
  console.error(error);

  return res.status(error.statusCode || 500).json({
    error: error.message || 'Erro interno do servidor.',
  });
}

export async function getActiveShiftSessionController(req, res) {
  try {
    const session = await getActiveShiftSession();
    res.json(session);
  } catch (error) {
    return handleControllerError(error, res);
  }
}

export async function startNewShiftSessionController(req, res) {
  try {
    const { shift } = req.body;
    const session = await startNewShiftSession(shift);
    res.status(201).json(session);
  } catch (error) {
    return handleControllerError(error, res);
  }
}

export async function deactivateShiftSessionController(req, res) {
  try {
    const { id } = req.params;
    const session = await deactivateShiftSession(id);
    res.json(session);
  } catch (error) {
    return handleControllerError(error, res);
  }
}
