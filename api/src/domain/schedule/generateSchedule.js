function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function toTimeString(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = String(Math.floor(normalized / 60)).padStart(2, '0');
  const minutes = String(normalized % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function isNightShift(shift) {
  return shift === 'B' || shift === 'D';
}

function getShiftEndMinutes(shift) {
  return isNightShift(shift) ? 30 * 60 : 18 * 60;
}

export function generateSchedule(startTime, frequency, shift) {
  const startMinutesBase = toMinutes(startTime);
  const frequencyMinutes = Math.round(Number(frequency) * 60);

  if (!startTime || Number.isNaN(startMinutesBase)) {
    throw new Error(`Horário inicial inválido: ${startTime}`);
  }

  if (!Number.isFinite(frequencyMinutes) || frequencyMinutes < 30) {
    throw new Error(`Frequência inválida: ${frequency}`);
  }

  let startMinutes = startMinutesBase;

  if (isNightShift(shift) && startMinutes < 18 * 60) {
    startMinutes += 1440;
  }

  const shiftEndMinutes = getShiftEndMinutes(shift);

  if (startMinutes > shiftEndMinutes) {
    return [];
  }

  const times = [];
  let current = startMinutes;

  while (current <= shiftEndMinutes) {
    times.push(toTimeString(current));
    current += frequencyMinutes;
  }

  return times;
}
