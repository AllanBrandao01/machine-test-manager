import { toShiftMinutes } from '../../../utils/shift';

function machinesReducer(state, action) {
  switch (action.type) {
    case 'SET_MACHINES': {
      return action.payload;
    }
    case 'ADD_MACHINE': {
      return [...state, action.payload];
    }

    case 'STOP_MACHINE': {
      const { machineId, stopTime, reason } = action.payload;

      return state.map((machine) => {
        if (machine.id !== machineId) return machine;

        const lastBlockIndex = machine.blocks.length - 1;
        const lastBlock = machine.blocks[lastBlockIndex];

        if (lastBlock.endTime !== null) return machine;

        const stopMinutes = toShiftMinutes(stopTime, machine.shift);

        const truncatedTests = (lastBlock.tests || []).filter((t) => {
          const tMinutes = toShiftMinutes(t.time, machine.shift);
          return tMinutes <= stopMinutes;
        });

        const updatedBlocks = [...machine.blocks];
        updatedBlocks[lastBlockIndex] = {
          ...lastBlock,
          endTime: stopTime,
          tests: truncatedTests,
        };

        return {
          ...machine,
          blocks: updatedBlocks,
          stops: [...machine.stops, { stoppedAt: stopTime, reason }],
        };
      });
    }

    case 'REPLACE_MACHINE': {
      return state.map((machine) =>
        machine.id === action.payload.id ? action.payload : machine,
      );
    }

    case 'RESUME_MACHINE': {
      const { machineId, newBlock } = action.payload;

      return state.map((machine) => {
        if (machine.id !== machineId) return machine;

        const lastBlockIndex = machine.blocks.length - 1;
        const lastBlock = machine.blocks[lastBlockIndex];

        if (lastBlock.endTime === null) return machine;

        const stopMinutes = toShiftMinutes(lastBlock.endTime, machine.shift);

        const truncatedTests = (lastBlock.tests || []).filter((t) => {
          const tMinutes = toShiftMinutes(t.time, machine.shift);
          return tMinutes <= stopMinutes;
        });

        const updatedBlocks = [...machine.blocks];
        updatedBlocks[lastBlockIndex] = {
          ...lastBlock,
          tests: truncatedTests,
        };

        return {
          ...machine,
          blocks: [...updatedBlocks, newBlock],
        };
      });
    }

    case 'CLEAR_ALL': {
      return [];
    }

    case 'DELETE_MACHINE': {
      return state.filter((machine) => machine.id !== action.payload);
    }
    case 'SET_TEST_DONE': {
      const { machineId, blockIndex, time, done } = action.payload;

      return state.map((machine) => {
        if (machine.id !== machineId) return machine;

        const updatedBlocks = machine.blocks.map((block, idx) => {
          if (idx !== blockIndex) return block;

          return {
            ...block,
            tests: (block.tests || []).map((t) =>
              t.time === time ? { ...t, done } : t,
            ),
          };
        });

        return { ...machine, blocks: updatedBlocks };
      });
    }

    default:
      return state;
  }
}

export default machinesReducer;
