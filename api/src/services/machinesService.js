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

  const machine = await prisma.machine.findUnique({
    where: {
      id: Number(machineId),
    },
    include: {
      shiftSession: true,
      stops: true,
      tests: true,
    },
  });

  const schedule = generateSchedule(
    data.resumeTime,
    machine.frequency,
    machine.shift,
  );

  return {
    updatedStop,
    newBlock: {
      startTime: data.resumeTime,
      endTime: null,
      tests: schedule.map((time) => ({
        time,
        done: false,
      })),
    },
  };
}

export async function updateMachine(machineId, data) {
  const machine = await prisma.machine.findUnique({
    where: {
      id: Number(machineId),
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

  const updatedMachine = await prisma.machine.update({
    where: {
      id: Number(machineId),
    },
    data: {
      code: data.code ?? machine.code,
      material: data.material ?? machine.material,
      frequency:
        typeof data.frequency === 'number' ? data.frequency : machine.frequency,
      firstTest: data.firstTest ?? machine.firstTest,
      shift: data.shift ?? machine.shift,
    },
    include: {
      shiftSession: true,
      stops: true,
      tests: true,
    },
  });

  let rebuiltBlock = null;

  const frequencyChanged =
    typeof data.frequency === 'number' && data.frequency !== machine.frequency;

  if (frequencyChanged) {
    const schedule = generateSchedule(
      updatedMachine.firstTest,
      updatedMachine.frequency,
      updatedMachine.shift,
    );

    rebuiltBlock = {
      startTime: updatedMachine.firstTest,
      endTime: null,
      tests: schedule.map((time) => ({
        time,
        done: false,
      })),
    };
  }

  return {
    ...updatedMachine,
    rebuiltBlock,
  };
}
