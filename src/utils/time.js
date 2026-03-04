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
  if (!input.includes(':')) {
    const hours = input.padStart(2, '0');
    return `${hours}:00`;
  }
  return input;
}
