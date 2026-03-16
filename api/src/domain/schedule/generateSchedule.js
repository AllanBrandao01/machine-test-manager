import { convertToMinutes, convertToTimeString } from '../time/timeUtils.js';

function getShiftWindow(shift) {
  if (shift === 'A' || shift === 'C') {
    return { startHour: 6, endHour: 18 };
  }

  return { startHour: 18, endHour: 6 };
}

function generateSchedule(firstTest, frequency, shift) {
  const { startHour, endHour } = getShiftWindow(shift);

  const shiftStartInMinutes = startHour * 60;
  let shiftEndInMinutes = endHour * 60;

  if (shiftEndInMinutes <= shiftStartInMinutes) {
    shiftEndInMinutes += 1440;
  }

  let currentTimeInMinutes = convertToMinutes(firstTest);

  if (currentTimeInMinutes < shiftStartInMinutes) {
    currentTimeInMinutes += 1440;
  }

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

export { generateSchedule };
