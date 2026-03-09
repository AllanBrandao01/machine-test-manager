import { convertToMinutes } from './time';

export function filterMachines(machines, statusFilter) {
  return machines.filter((machine) => {
    const lastBlock = machine.blocks?.[machine.blocks.length - 1];
    const isRunning = lastBlock?.endTime === null;

    const isNightShift = machine.shift === 'B' || machine.shift === 'D';

    function toShiftMinutes(timeString) {
      let mins = convertToMinutes(timeString);
      if (isNightShift && mins < 18 * 60) mins += 1440;
      return mins;
    }

    const now = new Date();
    let nowMins = now.getHours() * 60 + now.getMinutes();

    if (isNightShift && nowMins < 18 * 60) {
      nowMins += 1440;
    }

    const currentBlock = machine.blocks?.[machine.blocks.length - 1];

    const hasLateTest =
      isRunning &&
      currentBlock?.tests?.some((test) => {
        const testMins = toShiftMinutes(test.time);
        return testMins < nowMins && !test.done;
      });

    if (statusFilter === 'running') return isRunning;
    if (statusFilter === 'stopped') return !isRunning;
    if (statusFilter === 'late') return hasLateTest;

    return true;
  });
}
