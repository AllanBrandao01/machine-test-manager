import {
  toShiftMinutes,
  getNowShiftMinutes,
  isNowInsideShiftWindow,
} from '../../../utils/shift';

export function getDashboardStats(machines) {
  const runningMachines = machines.filter((machine) => {
    const lastBlock = machine.blocks?.[machine.blocks.length - 1];
    return lastBlock && lastBlock.endTime === null;
  }).length;

  const stoppedMachines = machines.filter((machine) => {
    const lastBlock = machine.blocks?.[machine.blocks.length - 1];
    return lastBlock && lastBlock.endTime !== null;
  }).length;

  const lateTests = machines.reduce((total, machine) => {
    const currentBlock = machine.blocks?.[machine.blocks.length - 1];

    if (!currentBlock || currentBlock.endTime !== null) {
      return total;
    }

    if (!isNowInsideShiftWindow(machine.shift)) {
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
