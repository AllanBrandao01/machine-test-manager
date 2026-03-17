const API = 'http://localhost:3001/api';

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

  if (!data) {
    throw new Error('Resposta vazia da API.');
  }

  return data;
}

export async function getActiveShiftSessionId() {
  const response = await fetch(`${API}/shift-session/active`);

  if (!response.ok) {
    throw new Error('Erro ao buscar turno ativo');
  }

  const data = await response.json();
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
  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || 'Erro ao buscar turno atual');
  }

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function deactivateShiftSession(id) {
  const response = await fetch(`${API}/shift-session/${id}/deactivate`, {
    method: 'POST',
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || 'Erro ao encerrar turno atual');
  }

  return text ? JSON.parse(text) : true;
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
