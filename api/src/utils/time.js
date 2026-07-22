export function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function toTimeString(totalMinutes) {
  const normalized = totalMinutes % (24 * 60);

  const hours = Math.floor(normalized / 60)
    .toString()
    .padStart(2, '0');

  const minutes = (normalized % 60).toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function getCurrentTimeInSaoPaulo() {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return formatter.format(new Date());
}
