const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function parseResponse(response, fallbackMessage) {
  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(text || fallbackMessage);
  }

  if (!response.ok) {
    throw new Error(data?.error || fallbackMessage);
  }

  return data;
}

export async function getActiveShiftSessionId() {
  const data = await getActiveShiftSession();
  return data?.id ?? null;
}

export async function insertMachine(machineData) {
  const response = await fetch(`${API}/machines`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(machineData),
  });

  return parseResponse(response, 'Erro ao salvar máquina.');
}

export async function insertStop(machineId, data) {
  const response = await fetch(`${API}/machines/${machineId}/stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      stopTime: data.stopTime,
      reason: data.reason,
    }),
  });

  return parseResponse(response, 'Erro ao salvar parada.');
}

export async function updateStopResume(machineId, data) {
  const response = await fetch(`${API}/machines/${machineId}/resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resumeTime: data.resumeTime,
    }),
  });

  return parseResponse(response, 'Erro ao salvar retomada.');
}

export async function insertTest(machineId, data) {
  const response = await fetch(`${API}/machines/${machineId}/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      testTime: data.testTime,
    }),
  });

  return parseResponse(response, 'Erro ao salvar teste.');
}

export async function getActiveShiftSession() {
  const response = await fetch(`${API}/shift-session/active`);
  return parseResponse(response, 'Erro ao buscar turno atual.');
}

export async function deactivateShiftSession(id) {
  const response = await fetch(`${API}/shift-session/${id}/deactivate`, {
    method: 'POST',
  });

  return parseResponse(response, 'Erro ao encerrar turno atual.');
}

export async function startNewShiftSession(shift) {
  const response = await fetch(`${API}/shift-session/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ shift }),
  });

  return parseResponse(response, 'Erro ao criar novo turno.');
}

export async function updateMachineRequest(machineId, updates) {
  const response = await fetch(`${API}/machines/${machineId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  return parseResponse(response, 'Erro ao atualizar máquina.');
}

export async function deleteMachineRequest(machineId) {
  const response = await fetch(`${API}/machines/${machineId}`, {
    method: 'DELETE',
  });

  return parseResponse(response, 'Erro ao excluir máquina.');
}

export async function fetchMachines() {
  const response = await fetch(`${API}/machines`);
  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(text || 'Erro ao buscar máquinas');
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Erro ao buscar máquinas');
  }

  if (!Array.isArray(data)) {
    throw new Error('Resposta inválida ao buscar máquinas.');
  }

  return data;
}
