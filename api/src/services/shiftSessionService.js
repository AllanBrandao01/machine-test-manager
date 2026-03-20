import prisma from '../lib/prisma.js';
import { BadRequestError } from '../utils/httpErrors.js';

function isCurrentTimeWithinShift(shift) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const now = formatter.format(new Date());
  const [h, m] = now.split(':').map(Number);
  const minutes = h * 60 + m;

  const isDayShift = shift === 'A' || shift === 'C';

  if (isDayShift) {
    return minutes >= 360 && minutes <= 1079;
  }

  return minutes >= 1080 || minutes <= 359;
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
