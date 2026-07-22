import prisma from '../lib/prisma.js';
import { getCurrentTimeInSaoPaulo } from '../utils/time.js';
import { isTimeWithinShift } from '../utils/shift.js';
import { BadRequestError } from '../utils/httpErrors.js';

function isCurrentTimeWithinShift(shift) {
  return isTimeWithinShift(getCurrentTimeInSaoPaulo(), shift);
}

function assertValidShift(shift) {
  if (!['A', 'B', 'C', 'D'].includes(shift)) {
    throw new BadRequestError('Turma inválida.');
  }
}

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
    throw new BadRequestError('Turma é obrigatória para iniciar um turno.');
  }

  assertValidShift(shift);

  if (!isCurrentTimeWithinShift(shift)) {
    throw new BadRequestError(
      'Não é possível iniciar este turno neste horário.',
    );
  }

  const activeShiftSession = await getActiveShiftSession();

  if (activeShiftSession) {
    await prisma.shiftSession.update({
      where: {
        id: activeShiftSession.id,
      },
      data: {
        endedAt: new Date(),
      },
    });
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
