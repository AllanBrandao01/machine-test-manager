import { getNextTestTime } from '../../utils/schedule.js';
import { toMinutes, toTimeString } from '../../utils/time.js';

function getShiftEndMinutes(shift) {
  return shift === 'B' || shift === 'D' ? 30 * 60 : 18 * 60;
}

function normalizeMinutesForShift(time, shift) {
  let minutes = toMinutes(time);

  if ((shift === 'B' || shift === 'D') && minutes <= 6 * 60) {
    minutes += 24 * 60;
  }

  return minutes;
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

function getMachineStatus(nextTestTime, shift, isStopped) {
  if (isStopped) return 'stopped';
  if (!nextTestTime) return 'on_time';

  const now = new Date();
  let currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [h, m] = nextTestTime.split(':').map(Number);
  let nextMinutes = h * 60 + m;

  const isNightShift = shift === 'B' || shift === 'D';

  if (isNightShift) {
    if (currentMinutes < 6 * 60) {
      currentMinutes += 24 * 60;
    }

    if (nextMinutes < 6 * 60) {
      nextMinutes += 24 * 60;
    }
  }

  const diff = currentMinutes - nextMinutes;

  if (diff < 0) return 'on_time';
  if (diff <= 10) return 'warning';

  return 'late';
}

export function buildMachineTimeline(machine) {
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

  const status = getMachineStatus(nextTestTime, machine.shift, isStopped);

  return {
    ...machine,
    tests,
    stops,
    blocks: hydratedBlocks,
    nextTestTime,
    status,
    isStopped,
  };
}
