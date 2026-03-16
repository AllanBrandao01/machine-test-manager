function convertToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function convertToTimeString(minutes) {
  const normalized = minutes % 1440;
  const hours = Math.floor(normalized / 60)
    .toString()
    .padStart(2, '0');
  const mins = (normalized % 60).toString().padStart(2, '0');

  return `${hours}:${mins}`;
}

export { convertToMinutes, convertToTimeString };
