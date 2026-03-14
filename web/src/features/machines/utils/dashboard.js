import { convertToMinutes } from '../../../utils/time';

function isNightShift(shift) {
  return shift === 'B' || shift === 'D';
}

function toShiftMinutes(timeString, shift) {
  let mins = convertToMinutes(timeString);

  if (isNightShift(shift) && mins < 18 * 60) {
    mins += 1440;
  }

  return mins;
}

function getNowShiftMinutes(shift) {
  const now = new Date();
  let mins = now.getHours() * 60 + now.getMinutes();

  if (isNightShift(shift) && mins < 18 * 60) {
    mins += 1440;
  }

  return mins;
}

export function getDashboardStats(machines) {
  const runningMachines = machines.filter((machine) => {
    const lastBlock = machine.blocks?.[machine.blocks.length - 1];
    return lastBlock?.endTime === null;
  }).length;

  const stoppedMachines = machines.filter((machine) => {
    const lastBlock = machine.blocks?.[machine.blocks.length - 1];
    return lastBlock?.endTime !== null;
  }).length;

  const lateTests = machines.reduce((total, machine) => {
    const currentBlock = machine.blocks?.[machine.blocks.length - 1];

    if (!currentBlock || currentBlock.endTime !== null) {
      return total;
    }

    const nowMins = getNowShiftMinutes(machine.shift);

    const machineLateTests =
      currentBlock.tests?.filter((test) => {
        const testMins = toShiftMinutes(test.time, machine.shift);
        return testMins < nowMins && !test.done;
      }).length || 0;

    return total + machineLateTests;
  }, 0);

  const completedTests = machines.reduce((total, machine) => {
    const machineDone =
      machine.blocks?.reduce((blockTotal, block) => {
        const doneCount = block.tests?.filter((test) => test.done).length || 0;
        return blockTotal + doneCount;
      }, 0) || 0;

    return total + machineDone;
  }, 0);

  return {
    runningMachines,
    stoppedMachines,
    lateTests,
    completedTests,
  };
}
