import { generateSchedule } from '../schedule/generateSchedule.js';

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function isNightShift(shift) {
  return shift === 'B' || shift === 'D';
}

function toShiftMinutes(time, shift) {
  let minutes = toMinutes(time);

  if (isNightShift(shift) && minutes < 18 * 60) {
    minutes += 24 * 60;
  }

  return minutes;
}

export function buildMachineTimeline(machine) {
  const safeFrequency = Number(machine.frequency);

  const normalizedStops = (machine.stops || [])
    .map((stop) => ({
      stoppedAt: stop.stopTime,
      resumedAt: stop.resumeTime ?? null,
      reason: stop.reason,
    }))
    .sort(
      (a, b) =>
        toShiftMinutes(a.stoppedAt, machine.shift) -
        toShiftMinutes(b.stoppedAt, machine.shift),
    );

  const doneTimes = (machine.tests || []).map((test) => test.testTime);
  const doneTimesSet = new Set(doneTimes);

  function getDoneTimesInRange(startTime, endTime = null) {
    const startMins = toShiftMinutes(startTime, machine.shift);

    return doneTimes
      .filter((time) => {
        const timeMins = toShiftMinutes(time, machine.shift);

        if (timeMins < startMins) {
          return false;
        }

        if (endTime !== null) {
          return timeMins <= toShiftMinutes(endTime, machine.shift);
        }

        return true;
      })
      .sort(
        (a, b) =>
          toShiftMinutes(a, machine.shift) - toShiftMinutes(b, machine.shift),
      );
  }

  function buildClosedBlockTests(startTime, endTime) {
    const plannedTimes = generateSchedule(
      startTime,
      safeFrequency,
      machine.shift,
    );

    const visibleTimes = plannedTimes.filter(
      (time) =>
        toShiftMinutes(time, machine.shift) <=
        toShiftMinutes(endTime, machine.shift),
    );

    return visibleTimes.map((time) => ({
      time,
      done: doneTimesSet.has(time),
    }));
  }

  function buildOpenBlockTests(startTime) {
    const doneInBlock = getDoneTimesInRange(startTime, null);

    const scheduleBase =
      doneInBlock.length > 0 ? doneInBlock[doneInBlock.length - 1] : startTime;

    let futureTimes = generateSchedule(
      scheduleBase,
      safeFrequency,
      machine.shift,
    );

    if (doneInBlock.length > 0) {
      futureTimes = futureTimes.filter(
        (time) => time !== doneInBlock[doneInBlock.length - 1],
      );
    }

    const mergedTimes = [...new Set([...doneInBlock, ...futureTimes])].sort(
      (a, b) =>
        toShiftMinutes(a, machine.shift) - toShiftMinutes(b, machine.shift),
    );

    return mergedTimes.map((time) => ({
      time,
      done: doneTimesSet.has(time),
    }));
  }

  const blocks = [];
  let currentStart = machine.firstTest;

  for (const stop of normalizedStops) {
    if (!currentStart) break;

    blocks.push({
      startTime: currentStart,
      endTime: stop.stoppedAt,
      tests: buildClosedBlockTests(currentStart, stop.stoppedAt),
    });

    currentStart = stop.resumedAt ?? null;
  }

  if (currentStart) {
    blocks.push({
      startTime: currentStart,
      endTime: null,
      tests: buildOpenBlockTests(currentStart),
    });
  }

  if (blocks.length === 0) {
    blocks.push({
      startTime: machine.firstTest,
      endTime: null,
      tests: buildOpenBlockTests(machine.firstTest),
    });
  }

  return {
    ...machine,
    frequency: safeFrequency,
    stops: normalizedStops,
    tests: machine.tests ?? [],
    blocks,
  };
}
