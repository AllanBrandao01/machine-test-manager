import { toMinutes } from './time.js';

export function isDayShift(shift) {
  return shift === 'A' || shift === 'C';
}

export function isNightShift(shift) {
  return shift === 'B' || shift === 'D';
}

export function isTimeWithinShift(time, shift) {
  const minutes = toMinutes(time);

  if (isDayShift(shift)) {
    return minutes >= 360 && minutes <= 1079; // 06:00 → 17:59
  }

  return minutes >= 1080 || minutes <= 359; // 18:00 → 05:59
}

export function toAbsoluteMinutes(time, shift) {
  let minutes = toMinutes(time);

  if (isNightShift(shift) && minutes <= 360) {
    minutes += 1440;
  }

  return minutes;
}

export function getShiftEndMinutes(shift) {
  return isNightShift(shift) ? 1800 : 1080;
}
