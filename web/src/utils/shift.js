import { convertToMinutes } from './time';

export function isNightShift(shift) {
  return shift === 'B' || shift === 'D';
}

export function toShiftMinutes(timeString, shift) {
  let mins = convertToMinutes(timeString);

  if (isNightShift(shift) && mins < 18 * 60) {
    mins += 1440;
  }

  return mins;
}

export function getNowShiftMinutes(shift) {
  const now = new Date();
  let mins = now.getHours() * 60 + now.getMinutes();

  if (isNightShift(shift) && mins < 18 * 60) {
    mins += 1440;
  }

  return mins;
}

export function isNowInsideShiftWindow(shift) {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();

  if (isNightShift(shift)) {
    return mins >= 18 * 60 || mins <= 6 * 60;
  }

  return true;
}
