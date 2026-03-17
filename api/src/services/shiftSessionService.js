import prisma from '../lib/prisma.js';

export async function getActiveShiftSession() {
  return prisma.shiftSession.findFirst({
    where: {
      endedAt: null,
    },
    orderBy: {
      startedAt: 'desc',
    },
  });
}

export async function startNewShiftSession(shift) {
  if (!shift) {
    throw new Error('Turma é obrigatória paro iniciar um turno.');
  }

  return prisma.shiftSession.create({
    data: {
      shift,
    },
  });
}

export async function deactivateShiftSession(id) {
  return prisma.shiftSession.update({
    where: {
      id: Number(id),
    },
    data: {
      endedAt: new Date(),
    },
  });
}
