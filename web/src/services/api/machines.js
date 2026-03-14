export async function fetchMachines() {
  const response = await fetch('http://localhost:3001/api/machines');

  if (!response.ok) {
    throw new Error('Erro ao buscar máquinas');
  }

  return response.json();
}
