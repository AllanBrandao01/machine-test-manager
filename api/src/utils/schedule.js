import { toMinutes, toTimeString } from './time.js';

export function getNextTestTime({ machine, tests, stops }) {
  const frequencyMinutes = Math.round(machine.frequency * 60);

  let baseTime;

  // 1. Último teste executado
  if (tests.length > 0) {
    baseTime = tests[tests.length - 1].testTime;
  }
  // 2. Último resume (se existir)
  else if (stops.length > 0) {
    const lastStop = stops[stops.length - 1];

    if (lastStop.resumeTime) {
      baseTime = lastStop.resumeTime;
    } else {
      baseTime = machine.firstTest;
    }
  }
  // 3. Sem histórico
  else {
    baseTime = machine.firstTest;
  }

  const nextMinutes = toMinutes(baseTime) + frequencyMinutes;

  return toTimeString(nextMinutes);
}
