import {
  getActiveShiftSession,
  startNewShiftSession,
  deactivateShiftSession,
} from '../services/shiftSessionService.js';

export async function getActiveShiftSessionController(req, res) {
  try {
    const session = await getActiveShiftSession();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function startNewShiftSessionController(req, res) {
  try {
    const { shift } = req.body;
    const session = await startNewShiftSession(shift);
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deactivateShiftSessionController(req, res) {
  try {
    const { id } = req.params;
    const session = await deactivateShiftSession(id);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
