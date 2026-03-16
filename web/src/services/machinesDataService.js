const API = 'http://localhost:3001/api';

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

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao salvar máquina: ${text}`);
  }

  return await response.json();
}

export async function insertStop(machineId, stopTime, reason) {
  const response = await fetch(`${API}/machines/${machineId}/stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      stopTime,
      reason,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao salvar parada: ${text}`);
  }

  return await response.json();
}

export async function updateStopResume(machineId, resumeTime) {
  const response = await fetch(`${API}/machines/${machineId}/resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resumeTime,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao salvar retomada: ${text}`);
  }

  return await response.json();
}

export async function insertTest(machineId, testTime) {
  const response = await fetch(`${API}/machines/${machineId}/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      testTime,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao salvar teste: ${text}`);
  }

  return await response.json();
}

export async function getActiveShiftSession() {
  const response = await fetch(`${API}/shift-session/active`);

  if (!response.ok) {
    throw new Error('Erro ao buscar turno atual');
  }

  return await response.json();
}

export async function deactivateShiftSession(id) {
  const response = await fetch(`${API}/shift-session/${id}/deactivate`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Erro ao encerrar turno atual');
  }
}

export async function startNewShiftSession(shift) {
  const response = await fetch(`${API}/shift-session/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ shift }),
  });

  if (!response.ok) {
    throw new Error('Erro ao criar novo turno');
  }

  return await response.json();
}

export async function updateMachineRequest(machineId, updates) {
  const response = await fetch(`${API}/machines/${machineId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao atualizar máquina: ${text}`);
  }

  return await response.json();
}
