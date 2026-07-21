const STORAGE_KEY = 'machine-test-scheduler:demo:v1';

function getInitialState() {
  return {
    shiftSessions: [],
    machines: [],
    stops: [],
    tests: [],
    counters: {
      shiftSession: 1,
      stop: 1,
      test: 1,
    },
  };
}

function readState() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return getInitialState();
  }

  try {
    return {
      ...getInitialState(),
      ...JSON.parse(raw),
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return getInitialState();
  }
}

function writeState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error(
        '[DEMO] localStorage está cheio. Os dados desta operação não foram salvos.',
        error,
      );
    }
    throw error;
  }
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `machine-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nextCounter(state, key) {
  const value = state.counters[key];

  state.counters = {
    ...state.counters,
    [key]: value + 1,
  };

  return value;
}

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function toTimeString(totalMinutes) {
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = String(Math.floor(normalizedMinutes / 60)).padStart(2, '0');
  const minutes = String(normalizedMinutes % 60).padStart(2, '0');

  return `${hours}:${minutes}`;
}

function normalizeMinutesForShift(time, shift) {
  let minutes = toMinutes(time);

  if ((shift === 'B' || shift === 'D') && minutes <= 6 * 60) {
    minutes += 24 * 60;
  }

  return minutes;
}

function getShiftEndMinutes(shift) {
  return shift === 'B' || shift === 'D' ? 30 * 60 : 18 * 60;
}

function isTimeWithinShift(time, shift) {
  const minutes = toMinutes(time);
  const isDayShift = shift === 'A' || shift === 'C';

  if (isDayShift) {
    return minutes >= 360 && minutes <= 1079;
  }

  return minutes >= 1080 || minutes <= 359;
}

function isCurrentTimeWithinShift(shift) {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const isDayShift = shift === 'A' || shift === 'C';

  if (isDayShift) {
    return minutes >= 360 && minutes <= 1079;
  }

  return minutes >= 1080 || minutes <= 359;
}

function isTimeWithinBlock(time, startTime, endTime, shift) {
  const value = normalizeMinutesForShift(time, shift);
  const start = normalizeMinutesForShift(startTime, shift);
  const end =
    endTime === null
      ? getShiftEndMinutes(shift)
      : normalizeMinutesForShift(endTime, shift);

  return value >= start && value <= end;
}

function assertValidTime(value, fieldLabel) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error(`${fieldLabel} inválido.`);
  }

  const [hours, minutes] = value.split(':').map(Number);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`${fieldLabel} inválido.`);
  }
}

function assertValidShift(shift) {
  if (!['A', 'B', 'C', 'D'].includes(shift)) {
    throw new Error('Turno inválido.');
  }
}

function assertValidFrequency(frequency) {
  const safeFrequency = Number(frequency);

  if (!Number.isFinite(safeFrequency) || safeFrequency < 0.5) {
    throw new Error('A frequência mínima é 0.5 (30 minutos).');
  }

  return safeFrequency;
}

function getMachineRelations(state, machine) {
  return {
    ...machine,
    shiftSession:
      state.shiftSessions.find(
        (session) => session.id === machine.shiftSessionId,
      ) || null,
    stops: state.stops
      .filter((stop) => stop.machineId === machine.id)
      .sort(
        (a, b) =>
          normalizeMinutesForShift(a.stopTime, machine.shift) -
          normalizeMinutesForShift(b.stopTime, machine.shift),
      ),
    tests: state.tests
      .filter((test) => test.machineId === machine.id)
      .sort(
        (a, b) =>
          normalizeMinutesForShift(a.testTime, machine.shift) -
          normalizeMinutesForShift(b.testTime, machine.shift),
      ),
  };
}

function getClosedBlockTests({ block, allTests, shift }) {
  return allTests
    .filter((test) =>
      isTimeWithinBlock(test.testTime, block.startTime, block.endTime, shift),
    )
    .map((test) => ({
      time: test.testTime,
      done: true,
    }));
}

function getOpenBlockPendingTests({ block, machine, allTests }) {
  const frequencyMinutes = Math.round(machine.frequency * 60);
  const shiftEndMinutes = getShiftEndMinutes(machine.shift);
  const doneTimes = new Set(allTests.map((test) => test.testTime));

  const blockDoneTests = allTests.filter((test) =>
    isTimeWithinBlock(
      test.testTime,
      block.startTime,
      block.endTime,
      machine.shift,
    ),
  );

  let cursorMinutes =
    blockDoneTests.length > 0
      ? normalizeMinutesForShift(
          blockDoneTests[blockDoneTests.length - 1].testTime,
          machine.shift,
        ) + frequencyMinutes
      : normalizeMinutesForShift(block.startTime, machine.shift);

  const pending = [];

  while (cursorMinutes <= shiftEndMinutes) {
    const time = toTimeString(cursorMinutes % (24 * 60));

    if (!doneTimes.has(time)) {
      pending.push({
        time,
        done: false,
      });
    }

    cursorMinutes += frequencyMinutes;
  }

  return pending;
}

function getNextTestTime({ machine, tests }) {
  if (tests.length === 0) {
    return machine.firstTest;
  }

  const frequencyMinutes = Math.round(machine.frequency * 60);
  const lastTest = tests[tests.length - 1];

  return toTimeString(toMinutes(lastTest.testTime) + frequencyMinutes);
}

function getMachineStatus(nextTestTime, shift, isStopped) {
  if (isStopped) return 'stopped';
  if (!nextTestTime) return 'on_time';

  const now = new Date();
  let currentMinutes = now.getHours() * 60 + now.getMinutes();
  let nextMinutes = toMinutes(nextTestTime);

  if (shift === 'B' || shift === 'D') {
    if (currentMinutes < 6 * 60) currentMinutes += 24 * 60;
    if (nextMinutes < 6 * 60) nextMinutes += 24 * 60;
  }

  const diff = currentMinutes - nextMinutes;

  if (diff < 0) return 'on_time';
  if (diff <= 10) return 'warning';

  return 'late';
}

function buildMachineTimeline(machine) {
  const tests = [...(machine.tests || [])].sort(
    (a, b) =>
      normalizeMinutesForShift(a.testTime, machine.shift) -
      normalizeMinutesForShift(b.testTime, machine.shift),
  );

  const stops = [...(machine.stops || [])].sort(
    (a, b) =>
      normalizeMinutesForShift(a.stopTime, machine.shift) -
      normalizeMinutesForShift(b.stopTime, machine.shift),
  );

  const blocks = [];
  let currentStart = machine.firstTest;

  for (const stop of stops) {
    if (!currentStart) break;

    blocks.push({
      startTime: currentStart,
      endTime: stop.stopTime,
    });

    currentStart = stop.resumeTime || null;
  }

  if (currentStart) {
    blocks.push({
      startTime: currentStart,
      endTime: null,
    });
  }

  if (blocks.length === 0) {
    blocks.push({
      startTime: machine.firstTest,
      endTime: null,
    });
  }

  const hydratedBlocks = blocks.map((block) => {
    const doneTests = getClosedBlockTests({
      block,
      allTests: tests,
      shift: machine.shift,
    });

    if (block.endTime !== null) {
      return {
        ...block,
        tests: doneTests,
      };
    }

    const pendingTests = getOpenBlockPendingTests({
      block,
      machine,
      allTests: tests,
    });

    return {
      ...block,
      tests: [...doneTests, ...pendingTests].sort(
        (a, b) =>
          normalizeMinutesForShift(a.time, machine.shift) -
          normalizeMinutesForShift(b.time, machine.shift),
      ),
    };
  });

  const openStop = stops.find((stop) => !stop.resumeTime);
  const isStopped = Boolean(openStop);

  const nextTestTime = isStopped
    ? null
    : getNextTestTime({
        machine,
        tests,
        stops,
      });

  return {
    ...machine,
    tests,
    stops,
    blocks: hydratedBlocks,
    nextTestTime,
    status: getMachineStatus(nextTestTime, machine.shift, isStopped),
    isStopped,
  };
}

function findActiveShiftSession(state) {
  return (
    state.shiftSessions
      .filter((session) => session.endedAt === null)
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))[0] || null
  );
}

function findMachineOrThrow(state, machineId) {
  const machine = state.machines.find((item) => item.id === machineId);

  if (!machine) {
    throw new Error('Máquina não encontrada.');
  }

  return getMachineRelations(state, machine);
}

function findOpenStop(state, machineId) {
  return (
    state.stops
      .filter(
        (stop) => stop.machineId === machineId && stop.resumeTime === null,
      )
      .sort((a, b) => b.id - a.id)[0] || null
  );
}

export async function getActiveShiftSession() {
  return findActiveShiftSession(readState());
}

export async function getActiveShiftSessionId() {
  const activeShiftSession = await getActiveShiftSession();
  return activeShiftSession?.id ?? null;
}

export async function fetchMachines() {
  const state = readState();
  const activeShiftSession = findActiveShiftSession(state);

  if (!activeShiftSession) {
    return [];
  }

  return state.machines
    .filter((machine) => machine.shiftSessionId === activeShiftSession.id)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .map((machine) =>
      buildMachineTimeline(getMachineRelations(state, machine)),
    );
}

export async function startNewShiftSession(shift) {
  assertValidShift(shift);

  if (!isCurrentTimeWithinShift(shift)) {
    throw new Error('Não é possível iniciar este turno neste horário.');
  }

  const state = readState();
  const now = new Date().toISOString();

  state.shiftSessions = state.shiftSessions.map((session) =>
    session.endedAt === null
      ? {
          ...session,
          endedAt: now,
        }
      : session,
  );

  const shiftSession = {
    id: nextCounter(state, 'shiftSession'),
    shift,
    startedAt: now,
    endedAt: null,
    createdAt: now,
  };

  state.shiftSessions.push(shiftSession);
  writeState(state);

  return shiftSession;
}

export async function deactivateShiftSession(id) {
  const state = readState();
  const numericId = Number(id);

  state.shiftSessions = state.shiftSessions.map((session) =>
    session.id === numericId
      ? {
          ...session,
          endedAt: new Date().toISOString(),
        }
      : session,
  );

  writeState(state);

  return (
    state.shiftSessions.find((session) => session.id === numericId) || null
  );
}

export async function insertMachine(machineData) {
  const state = readState();
  const activeShiftSession = findActiveShiftSession(state);

  if (!activeShiftSession) {
    throw new Error('Nenhum turno ativo encontrado.');
  }

  assertValidTime(machineData.firstTest, 'Horário do primeiro teste');

  const frequency = assertValidFrequency(machineData.frequency);
  const code = machineData.code.trim().toUpperCase();
  const material = machineData.material.trim();

  if (!code) throw new Error('Código da máquina é obrigatório.');
  if (!material) throw new Error('Material é obrigatório.');

  if (!isTimeWithinShift(machineData.firstTest, activeShiftSession.shift)) {
    throw new Error(
      'Horário do primeiro teste não pertence ao turno selecionado.',
    );
  }

  const duplicatedMachine = state.machines.some(
    (machine) =>
      machine.code === code && machine.shiftSessionId === activeShiftSession.id,
  );

  if (duplicatedMachine) {
    throw new Error('Já existe uma máquina com esse código neste turno.');
  }

  const now = new Date().toISOString();
  const machine = {
    id: createId(),
    code,
    material,
    frequency,
    firstTest: machineData.firstTest,
    shift: activeShiftSession.shift,
    shiftSessionId: activeShiftSession.id,
    createdAt: now,
  };

  state.machines.push(machine);
  writeState(state);

  return buildMachineTimeline(getMachineRelations(state, machine));
}

export async function insertStop(machineId, data) {
  const state = readState();
  const machine = findMachineOrThrow(state, machineId);

  assertValidTime(data.stopTime, 'Horário de parada');

  if (!data.reason?.trim()) {
    throw new Error('Motivo da parada é obrigatório.');
  }

  if (findOpenStop(state, machineId)) {
    throw new Error('Já existe uma parada em aberto para esta máquina.');
  }

  const lastTest = machine.tests[machine.tests.length - 1];

  if (
    lastTest &&
    normalizeMinutesForShift(data.stopTime, machine.shift) <
      normalizeMinutesForShift(lastTest.testTime, machine.shift)
  ) {
    throw new Error(
      'Horário de parada não pode ser menor que o último teste realizado.',
    );
  }

  state.stops.push({
    id: nextCounter(state, 'stop'),
    machineId,
    stopTime: data.stopTime,
    reason: data.reason.trim(),
    resumeTime: null,
    createdAt: new Date().toISOString(),
  });

  writeState(state);

  return buildMachineTimeline(findMachineOrThrow(state, machineId));
}

export async function updateStopResume(machineId, data) {
  const state = readState();
  const machine = findMachineOrThrow(state, machineId);

  assertValidTime(data.resumeTime, 'Horário de retorno');

  const openStop = findOpenStop(state, machineId);

  if (!openStop) {
    throw new Error('Nenhuma parada em aberto encontrada para esta máquina.');
  }

  if (
    normalizeMinutesForShift(data.resumeTime, machine.shift) <=
    normalizeMinutesForShift(openStop.stopTime, machine.shift)
  ) {
    throw new Error(
      'Horário de retorno deve ser maior que o horário de parada.',
    );
  }

  state.stops = state.stops.map((stop) =>
    stop.id === openStop.id
      ? {
          ...stop,
          resumeTime: data.resumeTime,
        }
      : stop,
  );

  writeState(state);

  return buildMachineTimeline(findMachineOrThrow(state, machineId));
}

export async function insertTest(machineId, data) {
  const state = readState();
  const machine = findMachineOrThrow(state, machineId);

  assertValidTime(data.testTime, 'Horário de teste');

  if (findOpenStop(state, machineId)) {
    throw new Error('Não é possível registrar teste com a máquina parada.');
  }

  const hydratedMachine = buildMachineTimeline(machine);
  const pendingTests = hydratedMachine.blocks
    .flatMap((block) => block.tests)
    .filter((test) => !test.done);

  if (pendingTests.length === 0) {
    throw new Error('Nenhum teste pendente.');
  }

  const nextExpectedTest = pendingTests[0];

  if (data.testTime !== nextExpectedTest.time) {
    throw new Error(
      `Ainda não é o horário deste teste. Próximo teste às ${nextExpectedTest.time}.`,
    );
  }

  const now = new Date();
  let nowMinutes = now.getHours() * 60 + now.getMinutes();
  let expectedMinutes = normalizeMinutesForShift(
    nextExpectedTest.time,
    machine.shift,
  );

  if ((machine.shift === 'B' || machine.shift === 'D') && nowMinutes < 6 * 60) {
    nowMinutes += 24 * 60;
  }

  if (nowMinutes < expectedMinutes) {
    throw new Error(
      `Ainda não é o horário deste teste. Próximo teste às ${nextExpectedTest.time}.`,
    );
  }

  const lastTest = machine.tests[machine.tests.length - 1];

  if (
    lastTest &&
    normalizeMinutesForShift(data.testTime, machine.shift) <=
      normalizeMinutesForShift(lastTest.testTime, machine.shift)
  ) {
    throw new Error(
      'Horário de teste deve ser maior que o último teste realizado.',
    );
  }

  const duplicatedTest = machine.tests.some(
    (test) => test.testTime === data.testTime,
  );

  if (duplicatedTest) {
    throw new Error('Já existe um teste registrado neste horário.');
  }

  state.tests.push({
    id: nextCounter(state, 'test'),
    machineId,
    testTime: data.testTime,
    createdAt: new Date().toISOString(),
  });

  writeState(state);

  return buildMachineTimeline(findMachineOrThrow(state, machineId));
}

const UNDO_TEST_WINDOW_MS = 60 * 1000;

export async function undoMachineTest(machineId, testId) {
  const state = readState();
  const machine = findMachineOrThrow(state, machineId);

  const lastTest = machine.tests[machine.tests.length - 1];

  if (!lastTest || lastTest.id !== testId) {
    throw new Error('Só é possível desfazer o último teste registrado.');
  }

  if (Date.now() - new Date(lastTest.createdAt).getTime() > UNDO_TEST_WINDOW_MS) {
    throw new Error('O prazo para desfazer este teste expirou.');
  }

  state.tests = state.tests.filter((test) => test.id !== testId);
  writeState(state);

  return buildMachineTimeline(findMachineOrThrow(state, machineId));
}

export async function updateMachineRequest(machineId, updates) {
  const state = readState();
  const machine = findMachineOrThrow(state, machineId);
  const openStop = findOpenStop(state, machineId);

  const nextFrequency =
    updates.frequency !== undefined
      ? assertValidFrequency(updates.frequency)
      : machine.frequency;

  const nextCode =
    updates.code !== undefined
      ? updates.code.trim().toUpperCase()
      : machine.code;

  const nextMaterial =
    updates.material !== undefined ? updates.material.trim() : machine.material;

  const nextFirstTest =
    updates.firstTest !== undefined ? updates.firstTest : machine.firstTest;

  if (!nextCode) throw new Error('Código da máquina é obrigatório.');
  if (!nextMaterial) throw new Error('Material é obrigatório.');

  assertValidTime(nextFirstTest, 'Horário do primeiro teste');

  if (!isTimeWithinShift(nextFirstTest, machine.shift)) {
    throw new Error(
      'Horário do primeiro teste não pertence ao turno selecionado.',
    );
  }

  if (openStop && nextFrequency !== machine.frequency) {
    throw new Error(
      'Não é permitido alterar a frequência com a máquina parada. Retome a máquina para aplicar a nova frequência.',
    );
  }

  const duplicatedMachine = state.machines.some(
    (item) =>
      item.id !== machineId &&
      item.code === nextCode &&
      item.shiftSessionId === machine.shiftSessionId,
  );

  if (duplicatedMachine) {
    throw new Error('Já existe uma máquina com esse código neste turno.');
  }

  state.machines = state.machines.map((item) =>
    item.id === machineId
      ? {
          ...item,
          code: nextCode,
          material: nextMaterial,
          frequency: nextFrequency,
          firstTest: nextFirstTest,
        }
      : item,
  );

  writeState(state);

  return buildMachineTimeline(findMachineOrThrow(state, machineId));
}

export async function deleteMachineRequest(machineId) {
  const state = readState();
  const exists = state.machines.some((machine) => machine.id === machineId);

  if (!exists) {
    throw new Error('Máquina não encontrada.');
  }

  state.machines = state.machines.filter((machine) => machine.id !== machineId);
  state.stops = state.stops.filter((stop) => stop.machineId !== machineId);
  state.tests = state.tests.filter((test) => test.machineId !== machineId);

  writeState(state);

  return { success: true };
}
