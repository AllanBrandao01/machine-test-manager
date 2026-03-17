const API = 'http://localhost:3001/api';

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
