import { convertToMinutes, convertToTimeString } from './time';

export function getShiftWindow(shift) {
  // A/C: 06:00–18:00 | B/D: 18:00–06:00
  if (shift === 'A' || shift === 'C') return { startHour: 6, endHour: 18 };
  return { startHour: 18, endHour: 6 };
}

export function generateSchedule(firstTest, frequency, shift) {
  const { startHour, endHour } = getShiftWindow(shift);

  const shiftStartInMinutes = startHour * 60;
  let shiftEndInMinutes = endHour * 60;

  // Night shift crosses midnight
  if (shiftEndInMinutes <= shiftStartInMinutes) shiftEndInMinutes += 1440;

  let currentTimeInMinutes = convertToMinutes(firstTest);

  // If it's night shift and time is after midnight, push to next day
  if (currentTimeInMinutes < shiftStartInMinutes) currentTimeInMinutes += 1440;

  if (
    currentTimeInMinutes < shiftStartInMinutes ||
    currentTimeInMinutes > shiftEndInMinutes
  ) {
    throw new Error('First test time is outside the shift window');
  }

  const frequencyInMinutes = frequency * 60;
  const schedule = [];

  while (currentTimeInMinutes <= shiftEndInMinutes) {
    schedule.push(currentTimeInMinutes);
    currentTimeInMinutes += frequencyInMinutes;
  }

  return schedule.map(convertToTimeString);
}
