import { convertToMinutes } from './time';

export function isNightShift(shift) {
  return shift === 'B' || shift === 'D';
}

function isMinutesWithinShift(mins, shift) {
  if (isNightShift(shift)) {
    return mins >= 18 * 60 || mins <= 359;
  }

  return mins >= 6 * 60 && mins <= 1079;
}

/**
 * Converte um horário HH:MM para minutos absolutos do turno.
 * Para turnos noturnos (B/D), horários de meia-noite a 06:00 recebem +1440
 * para que sejam maiores que os horários do início do turno (18:00+).
 */
export function toShiftMinutes(timeString, shift) {
  let mins = convertToMinutes(timeString);

  if (isNightShift(shift) && mins <= 6 * 60) {
    mins += 1440;
  }

  return mins;
}

/**
 * Retorna os minutos atuais normalizados para o turno.
 */
export function getNowShiftMinutes(shift) {
  const now = new Date();
  let mins = now.getHours() * 60 + now.getMinutes();

  if (isNightShift(shift) && mins <= 6 * 60) {
    mins += 1440;
  }

  return mins;
}

/**
 * Verifica se um horário HH:MM pertence à janela do turno.
 * Turno diurno (A/C): 06:00–17:59
 * Turno noturno (B/D): 18:00–05:59 (atravessa meia-noite)
 */
export function isTimeWithinShift(timeString, shift) {
  return isMinutesWithinShift(convertToMinutes(timeString), shift);
}

/**
 * Verifica se o horário atual está dentro da janela do turno.
 */
export function isNowInsideShiftWindow(shift) {
  const now = new Date();
  return isMinutesWithinShift(now.getHours() * 60 + now.getMinutes(), shift);
}
