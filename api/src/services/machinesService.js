import prisma from '../lib/prisma.js';
import { buildMachineTimeline } from '../domain/machines/buildMachineTimeline.js';

export async function deleteMachine(id) {
  const machine = await prisma.machine.findUnique({
    where: { id },
  });

  if (!machine) {
    throw new Error('Máquina não encontrada.');
  }

  await prisma.machine.delete({
    where: { id },
  });

  return { success: true };
}

export async function findAllMachines() {
  const machines = await prisma.machine.findMany({
    include: {
      shiftSession: true,
      stops: true,
      tests: true,
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
    throw new Error('Nenhum turno ativo encontrado.');
  }

  const normalizedCode = data.code.trim().toUpperCase();

  const existingMachine = await prisma.machine.findFirst({
    where: {
      code: normalizedCode,
      shiftSessionId: activeShiftSession.id,
    },
  });

  if (existingMachine) {
    throw new Error('Já existe uma máquina com esse código neste turno.');
  }

  if (!data.firstTest || !/^\d{2}:\d{2}$/.test(data.firstTest)) {
    throw new Error('Horário do primeiro teste inválido.');
  }

  const safeFrequency = Number(data.frequency);

  if (!Number.isFinite(safeFrequency) || safeFrequency < 0.5) {
    throw new Error('A frequência mínima é 0.5 (30 minutos).');
  }

  const machine = await prisma.machine.create({
    data: {
      code: normalizedCode,
      material: data.material,
      frequency: safeFrequency,
      firstTest: data.firstTest,
      shift: data.shift,
      shiftSessionId: activeShiftSession.id,
    },
    include: {
      shiftSession: true,
      stops: true,
      tests: true,
    },
  });

  return buildMachineTimeline(machine);
}

export async function stopMachine(machineId, data) {
  const machine = await prisma.machine.findUnique({
    where: {
      id: machineId,
    },
    include: {
      shiftSession: true,
      stops: true,
      tests: true,
    },
  });

  if (!machine) {
    throw new Error('Máquina não encontrada.');
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
    throw new Error('Já existe uma parada em aberto para esta máquina.');
  }

  await prisma.stop.create({
    data: {
      machineId,
      stopTime: data.stopTime,
      reason: data.reason,
    },
  });

  const updatedMachine = await prisma.machine.findUnique({
    where: {
      id: machineId,
    },
    include: {
      shiftSession: true,
      stops: true,
      tests: true,
    },
  });

  return buildMachineTimeline(updatedMachine);
}

export async function resumeMachine(machineId, data) {
  const machine = await prisma.machine.findUnique({
    where: {
      id: machineId,
    },
    include: {
      shiftSession: true,
      stops: true,
      tests: true,
    },
  });

  if (!machine) {
    throw new Error('Máquina não encontrada.');
  }

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
    throw new Error('Nenhuma parada em aberto encontrada para esta máquina.');
  }

  await prisma.stop.update({
    where: {
      id: lastOpenStop.id,
    },
    data: {
      resumeTime: data.resumeTime,
    },
  });

  const updatedMachine = await prisma.machine.findUnique({
    where: {
      id: machineId,
    },
    include: {
      shiftSession: true,
      stops: true,
      tests: true,
    },
  });

  return buildMachineTimeline(updatedMachine);
}

export async function registerMachineTest(machineId, data) {
  const machine = await prisma.machine.findUnique({
    where: {
      id: machineId,
    },
    include: {
      shiftSession: true,
      stops: true,
      tests: true,
    },
  });

  if (!machine) {
    throw new Error('Máquina não encontrada.');
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
    throw new Error('Não é possível registrar teste com a máquina parada.');
  }

  await prisma.test.create({
    data: {
      machineId,
      testTime: data.testTime,
    },
  });

  const updatedMachine = await prisma.machine.findUnique({
    where: {
      id: machineId,
    },
    include: {
      shiftSession: true,
      stops: true,
      tests: true,
    },
  });

  return buildMachineTimeline(updatedMachine);
}

export async function updateMachine(id, data) {
  const machine = await prisma.machine.findUnique({
    where: { id },
    include: {
      shiftSession: true,
      stops: true,
      tests: true,
    },
  });

  if (!machine) {
    throw new Error('Máquina não encontrada.');
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

  if (
    isStopped &&
    typeof data.frequency === 'number' &&
    data.frequency !== machine.frequency
  ) {
    throw new Error(
      'Não é permitido alterar a frequência com a máquina parada. Retome a máquina para aplicar a nova frequência.',
    );
  }

  const safeFrequency = Number(data.frequency);

  if (!Number.isFinite(safeFrequency) || safeFrequency < 0.5) {
    throw new Error('A frequência mínima é 0.5 (30 minutos).');
  }

  const updatedMachine = await prisma.machine.update({
    where: { id },
    data: {
      code: data.code ?? machine.code,
      material: data.material ?? machine.material,
      frequency: data.frequency ?? machine.frequency,
      firstTest: data.firstTest ?? machine.firstTest,
      shift: data.shift ?? machine.shift,
    },
    include: {
      shiftSession: true,
      stops: true,
      tests: true,
    },
  });

  return buildMachineTimeline(updatedMachine);
}
