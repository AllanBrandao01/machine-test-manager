import prisma from '../lib/prisma.js';
import { buildMachineTimeline } from '../domain/machines/buildMachineTimeline.js';
import { toMinutes } from '../utils/time.js';
import { BadRequestError, NotFoundError } from '../utils/httpErrors.js';

function getCurrentTimeInSaoPaulo() {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return formatter.format(new Date());
}

function isTimeWithinShift(time, shift) {
  const minutes = toMinutes(time);

  const isDayShift = shift === 'A' || shift === 'C';

  if (isDayShift) {
    return minutes >= 360 && minutes <= 1079; // 06:00 → 17:59
  }

  return minutes >= 1080 || minutes <= 359; // 18:00 → 05:59
}

function getCurrentAbsoluteMinutesForShift(shift) {
  const nowTime = getCurrentTimeInSaoPaulo();
  return toAbsoluteMinutes(nowTime, shift);
}

function isValidTime(value) {
  return /^\d{2}:\d{2}$/.test(value);
}

function assertValidTime(value, fieldLabel) {
  if (!isValidTime(value)) {
    throw new BadRequestError(`${fieldLabel} inválido.`);
  }

  const [hours, minutes] = value.split(':').map(Number);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new BadRequestError(`${fieldLabel} inválido.`);
  }
}

function assertValidShift(shift) {
  if (!['A', 'B', 'C', 'D'].includes(shift)) {
    throw new BadRequestError('Turno inválido.');
  }
}

function assertValidFrequency(frequency) {
  const safeFrequency = Number(frequency);

  if (!Number.isFinite(safeFrequency) || safeFrequency < 0.5) {
    throw new BadRequestError('A frequência mínima é 0.5 (30 minutos).');
  }

  return safeFrequency;
}

function assertValidMachinePayload(data) {
  if (!data.code?.trim()) {
    throw new BadRequestError('Código da máquina é obrigatório.');
  }

  if (!data.material?.trim()) {
    throw new BadRequestError('Material é obrigatório.');
  }

  assertValidShift(data.shift);
  assertValidTime(data.firstTest, 'Horário do primeiro teste');

  if (!isTimeWithinShift(data.firstTest, data.shift)) {
    throw new BadRequestError(
      'Horário do primeiro teste não pertence ao turno selecionado.',
    );
  }

  return assertValidFrequency(data.frequency);
}

function toAbsoluteMinutes(time, shift) {
  let minutes = toMinutes(time);
  const isNightShift = shift === 'B' || shift === 'D';

  if (isNightShift && minutes <= 6 * 60) {
    minutes += 24 * 60;
  }

  return minutes;
}

async function findMachineWithRelations(id) {
  return prisma.machine.findUnique({
    where: { id },
    include: {
      shiftSession: true,
      stops: {
        orderBy: {
          stopTime: 'asc',
        },
      },
      tests: {
        orderBy: {
          testTime: 'asc',
        },
      },
    },
  });
}

export async function deleteMachine(id) {
  const machine = await prisma.machine.findUnique({
    where: { id },
  });

  if (!machine) {
    throw new NotFoundError('Máquina não encontrada.');
  }

  await prisma.machine.delete({
    where: { id },
  });

  return { success: true };
}

export async function findAllMachines() {
  const activeShiftSession = await prisma.shiftSession.findFirst({
    where: {
      endedAt: null,
    },
    orderBy: {
      startedAt: 'desc',
    },
  });

  if (!activeShiftSession) {
    return [];
  }

  const machines = await prisma.machine.findMany({
    where: {
      shiftSessionId: activeShiftSession.id,
    },
    include: {
      shiftSession: true,
      stops: {
        orderBy: {
          stopTime: 'asc',
        },
      },
      tests: {
        orderBy: {
          testTime: 'asc',
        },
      },
    },
    orderBy: {
      id: 'asc',
    },
  });

  return machines.map(buildMachineTimeline);
}

export async function createMachine(data) {
  const activeShiftSession = await prisma.shiftSession.findFirst({
    where: {
      endedAt: null,
    },
    orderBy: {
      startedAt: 'desc',
    },
  });

  if (!activeShiftSession) {
    throw new NotFoundError('Nenhum turno ativo encontrado.');
  }

  const safeFrequency = assertValidMachinePayload(data);
  const normalizedCode = data.code.trim().toUpperCase();
  const normalizedMaterial = data.material.trim();

  if (data.shift !== activeShiftSession.shift) {
    throw new BadRequestError('O turno da máquina deve ser igual ao turno ativo.');
  }

  const existingMachine = await prisma.machine.findFirst({
    where: {
      code: normalizedCode,
      shiftSessionId: activeShiftSession.id,
    },
  });

  if (existingMachine) {
    throw new BadRequestError('Já existe uma máquina com esse código neste turno.');
  }

  const machine = await prisma.machine.create({
    data: {
      code: normalizedCode,
      material: normalizedMaterial,
      frequency: safeFrequency,
      firstTest: data.firstTest,
      shift: data.shift,
      shiftSessionId: activeShiftSession.id,
    },
    include: {
      shiftSession: true,
      stops: {
        orderBy: {
          stopTime: 'asc',
        },
      },
      tests: {
        orderBy: {
          testTime: 'asc',
        },
      },
    },
  });

  return buildMachineTimeline(machine);
}

export async function stopMachine(machineId, data) {
  const machine = await findMachineWithRelations(machineId);

  if (!machine) {
    throw new NotFoundError('Máquina não encontrada.');
  }

  assertValidTime(data.stopTime, 'Horário de parada');

  if (!data.reason?.trim()) {
    throw new Error('Motivo da parada é obrigatório.');
  }

  const openStop = await prisma.stop.findFirst({
    where: {
      machineId,
      resumeTime: null,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (openStop) {
    throw new BadRequestError('Já existe uma parada em aberto para esta máquina.');
  }

  const lastTest = machine.tests[machine.tests.length - 1];

  if (
    lastTest &&
    toAbsoluteMinutes(data.stopTime, machine.shift) <
      toAbsoluteMinutes(lastTest.testTime, machine.shift)
  ) {
    throw new BadRequestError(
      'Horário de parada não pode ser menor que o último teste realizado.',
    );
  }

  await prisma.stop.create({
    data: {
      machineId,
      stopTime: data.stopTime,
      reason: data.reason.trim(),
    },
  });

  const updatedMachine = await findMachineWithRelations(machineId);

  return buildMachineTimeline(updatedMachine);
}

export async function resumeMachine(machineId, data) {
  const machine = await findMachineWithRelations(machineId);

  if (!machine) {
    throw new NotFoundError('Máquina não encontrada.');
  }

  assertValidTime(data.resumeTime, 'Horário de retorno');

  const lastOpenStop = await prisma.stop.findFirst({
    where: {
      machineId,
      resumeTime: null,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (!lastOpenStop) {
    throw new NotFoundError('Nenhuma parada em aberto encontrada para esta máquina.');
  }

  if (
    toAbsoluteMinutes(data.resumeTime, machine.shift) <=
    toAbsoluteMinutes(lastOpenStop.stopTime, machine.shift)
  ) {
    throw new BadRequestError(
      'Horário de retorno deve ser maior que o horário de parada.',
    );
  }

  await prisma.stop.update({
    where: {
      id: lastOpenStop.id,
    },
    data: {
      resumeTime: data.resumeTime,
    },
  });

  const updatedMachine = await findMachineWithRelations(machineId);

  return buildMachineTimeline(updatedMachine);
}

export async function registerMachineTest(machineId, data) {
  const machine = await findMachineWithRelations(machineId);

  if (!machine) {
    throw new NotFoundError('Máquina não encontrada.');
  }

  assertValidTime(data.testTime, 'Horário de teste');

  const openStop = await prisma.stop.findFirst({
    where: {
      machineId,
      resumeTime: null,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (openStop) {
    throw new BadRequestError('Não é possível registrar teste com a máquina parada.');
  }

  const hydratedMachine = buildMachineTimeline(machine);

  const pendingTests = hydratedMachine.blocks
    .flatMap((block) => block.tests)
    .filter((t) => !t.done);

  if (pendingTests.length === 0) {
    throw new BadRequestError('Nenhum teste pendente.');
  }

  const nextExpectedTest = pendingTests[0];

  if (data.testTime !== nextExpectedTest.time) {
    throw new BadRequestError(
      `Ainda não é o horário deste teste. Próximo teste às ${nextExpectedTest.time}.`,
    );
  }

  const nowAbsoluteMinutes = getCurrentAbsoluteMinutesForShift(machine.shift);
  const expectedAbsoluteMinutes = toAbsoluteMinutes(
    nextExpectedTest.time,
    machine.shift,
  );

  if (nowAbsoluteMinutes < expectedAbsoluteMinutes) {
    throw new BadRequestError(
      `Ainda não é o horário deste teste. Próximo teste às ${nextExpectedTest.time}.`,
    );
  }

  const lastTest = machine.tests[machine.tests.length - 1];

  if (
    lastTest &&
    toAbsoluteMinutes(data.testTime, machine.shift) <=
      toAbsoluteMinutes(lastTest.testTime, machine.shift)
  ) {
    throw new BadRequestError(
      'Horário de teste deve ser maior que o último teste realizado.',
    );
  }

  const duplicatedTest = machine.tests.some(
    (test) => test.testTime === data.testTime,
  );

  if (duplicatedTest) {
    throw new BadRequestError('Já existe um teste registrado neste horário.');
  }

  await prisma.test.create({
    data: {
      machineId,
      testTime: data.testTime,
    },
  });

  const updatedMachine = await findMachineWithRelations(machineId);

  return buildMachineTimeline(updatedMachine);
}

export async function updateMachine(id, data) {
  const machine = await findMachineWithRelations(id);

  if (!machine) {
    throw new NotFoundError('Máquina não encontrada.');
  }

  const openStop = await prisma.stop.findFirst({
    where: {
      machineId: id,
      resumeTime: null,
    },
    orderBy: {
      id: 'desc',
    },
  });

  const isStopped = Boolean(openStop);

  const nextFrequency =
    data.frequency !== undefined
      ? assertValidFrequency(data.frequency)
      : machine.frequency;

  const nextCode =
    data.code !== undefined ? data.code.trim().toUpperCase() : machine.code;

  const nextMaterial =
    data.material !== undefined ? data.material.trim() : machine.material;

  const nextFirstTest =
    data.firstTest !== undefined ? data.firstTest : machine.firstTest;

  const nextShift = data.shift !== undefined ? data.shift : machine.shift;

  if (!nextCode) {
    throw new BadRequestError('Código da máquina é obrigatório.');
  }

  if (!nextMaterial) {
    throw new BadRequestError('Material é obrigatório.');
  }

  assertValidShift(nextShift);
  assertValidTime(nextFirstTest, 'Horário do primeiro teste');

  if (!isTimeWithinShift(nextFirstTest, nextShift)) {
    throw new BadRequestError(
      'Horário do primeiro teste não pertence ao turno selecionado.',
    );
  }

  if (isStopped && nextFrequency !== machine.frequency) {
    throw new BadRequestError(
      'Não é permitido alterar a frequência com a máquina parada. Retome a máquina para aplicar a nova frequência.',
    );
  }

  const duplicatedMachine = await prisma.machine.findFirst({
    where: {
      code: nextCode,
      shiftSessionId: machine.shiftSessionId,
      NOT: {
        id,
      },
    },
  });

  if (duplicatedMachine) {
    throw new BadRequestError('Já existe uma máquina com esse código neste turno.');
  }

  const updatedMachine = await prisma.machine.update({
    where: { id },
    data: {
      code: nextCode,
      material: nextMaterial,
      frequency: nextFrequency,
      firstTest: nextFirstTest,
      shift: nextShift,
    },
    include: {
      shiftSession: true,
      stops: {
        orderBy: {
          stopTime: 'asc',
        },
      },
      tests: {
        orderBy: {
          testTime: 'asc',
        },
      },
    },
  });

  return buildMachineTimeline(updatedMachine);
}
