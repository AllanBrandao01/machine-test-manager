import prisma from '../lib/prisma.js';

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getNextExpectedTest(firstTest, frequency, completedTestsCount) {
  const firstTestMinutes = timeToMinutes(firstTest);
  const nextTestMinutes = firstTestMinutes + frequency * completedTestsCount;

  return minutesToTime(nextTestMinutes);
}

function mapMachineState(machine) {
  const lastStop = machine.stops.length
    ? machine.stops[machine.stops.length - 1]
    : null;

  const isStopped = lastStop ? !lastStop.resumeTime : false;

  const nextExpectedTest = getNextExpectedTest(
    machine.firstTest,
    machine.frequency,
    machine.tests.length,
  );

  return {
    ...machine,
    status: isStopped ? 'stopped' : 'running',
    isStopped,
    lastStop,
    completedTestsCount: machine.tests.length,
    nextExpectedTest,
  };
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

  return machines.map(mapMachineState);
}

export async function createMachine(data) {
  const activeShiftSession = await prisma.shiftSession.create({
    data: {
      shift: data.shift,
    },
  });

  const machine = await prisma.machine.create({
    data: {
      code: data.code,
      material: data.material,
      frequency: Number(data.frequency),
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

  return machine;
}

export async function stopMachine(machineId, data) {
  const stop = await prisma.stop.create({
    data: {
      machineId: Number(machineId),
      stopTime: data.stopTime,
      reason: data.reason,
    },
  });

  return stop;
}

export async function resumeMachine(machineId, data) {
  const lastOpenStop = await prisma.stop.findFirst({
    where: {
      machineId: Number(machineId),
      resumeTime: null,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (!lastOpenStop) {
    throw new Error('No open stop found for this machine');
  }

  const updatedStop = await prisma.stop.update({
    where: {
      id: lastOpenStop.id,
    },
    data: {
      resumeTime: data.resumeTime,
    },
  });

  return updatedStop;
}

export async function registerMachineTest(machineId, data) {
  const test = await prisma.test.create({
    data: {
      machineId: Number(machineId),
      testTime: data.testTime,
    },
  });

  return test;
}
