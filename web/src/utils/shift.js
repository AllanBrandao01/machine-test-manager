import { convertToMinutes } from './time';

export function isNightShift(shift) {
  return shift === 'B' || shift === 'D';
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
 * Verifica se o horário atual está dentro da janela do turno.
 * Turno diurno (A/C): 06:00–18:00
 * Turno noturno (B/D): 18:00–06:00 (atravessa meia-noite)
 */
export function isNowInsideShiftWindow(shift) {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();

  if (isNightShift(shift)) {
    return mins >= 18 * 60 || mins <= 6 * 60;
  }

  // Turno diurno: 06:00 (360) até 18:00 (1080)
  return mins >= 6 * 60 && mins <= 18 * 60;
}
