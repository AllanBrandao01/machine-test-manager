export function convertToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

export function convertToTimeString(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
}

export function formatTimeInput(input) {
  if (input == null) return '';

  const raw = String(input).trim();
  if (!raw) return '';

  // Accept "H", "HH", "H:M", "HH:MM" etc.
  const match = raw.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
  if (!match) return '';

  const hours = Number(match[1]);
  let minutes = match[2] == null ? 0 : Number(match[2]);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return '';

  // Validate hours/minutes range
  if (hours < 0 || hours > 23) return '';
  if (minutes < 0 || minutes > 59) return '';

  // Normalize minutes:
  if (match[2] != null && match[2].length === 1) {
    minutes = minutes * 10; // "3" -> 30
    if (minutes > 59) return '';
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
