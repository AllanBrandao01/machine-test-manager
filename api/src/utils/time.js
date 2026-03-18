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
