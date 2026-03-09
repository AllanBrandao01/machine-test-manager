import { toShiftMinutes, getNowShiftMinutes } from './shift';

export function filterMachines(machines, statusFilter) {
  return machines.filter((machine) => {
    const lastBlock = machine.blocks?.[machine.blocks.length - 1];
    const isRunning = lastBlock?.endTime === null;

    const currentBlock = machine.blocks?.[machine.blocks.length - 1];

    const nowMins = getNowShiftMinutes(machine.shift);

    const hasLateTest =
      isRunning &&
      currentBlock?.tests?.some((test) => {
        const testMins = toShiftMinutes(test.time, machine.shift);
        return testMins < nowMins && !test.done;
      });

    if (statusFilter === 'running') return isRunning;
    if (statusFilter === 'stopped') return !isRunning;
    if (statusFilter === 'late') return hasLateTest;

    return true;
  });
}
