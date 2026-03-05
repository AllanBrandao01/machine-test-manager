import { useEffect, useReducer, useState } from 'react';
import { convertToMinutes, formatTimeInput } from './utils/time';
import MachineForm from './components/MachineForm';
import MachineCard from './components/MachineCard';
import { generateSchedule } from './utils/schedule';

const STORAGE_KEY = 'machine-test-manager:machines';

function machinesReducer(state, action) {
  switch (action.type) {
    case 'ADD_MACHINE': {
      return [...state, action.payload];
    }

    case 'STOP_MACHINE': {
      const { machineId, stopTime, reason, convertToMinutes } = action.payload;

      return state.map((machine) => {
        if (machine.id !== machineId) return machine;

        const lastBlockIndex = machine.blocks.length - 1;
        const lastBlock = machine.blocks[lastBlockIndex];

        // already stopped
        if (lastBlock.endTime !== null) return machine;

        const isNightShift = machine.shift === 'B' || machine.shift === 'D';

        function toShiftMinutes(timeString) {
          let mins = convertToMinutes(timeString);
          if (isNightShift && mins < 18 * 60) mins += 1440;
          return mins;
        }

        const stopMinutes = toShiftMinutes(stopTime);

        //truncate pending tests correctly (shift-aware)
        const truncatedTests = (lastBlock.tests || []).filter((t) => {
          const tMinutes = toShiftMinutes(t.time);
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

    case 'RESUME_MACHINE': {
      const { machineId, newBlock, convertToMinutes } = action.payload;

      return state.map((machine) => {
        if (machine.id !== machineId) return machine;

        const lastBlockIndex = machine.blocks.length - 1;
        const lastBlock = machine.blocks[lastBlockIndex];

        // already running
        if (lastBlock.endTime === null) return machine;

        const isNightShift = machine.shift === 'B' || machine.shift === 'D';

        function toShiftMinutes(timeString) {
          let mins = convertToMinutes(timeString);
          if (isNightShift && mins < 18 * 60) mins += 1440;
          return mins;
        }

        //guarantee truncation using lastBlock.endTime (shift-aware)
        const stopMinutes = toShiftMinutes(lastBlock.endTime);

        const truncatedTests = (lastBlock.tests || []).filter((t) => {
          const tMinutes = toShiftMinutes(t.time);
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

    case 'UPDATE_MACHINE': {
      const { machineId, updates } = action.payload;

      return state.map((machine) => {
        if (machine.id !== machineId) return machine;

        return {
          ...machine,
          ...updates,
        };
      });
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

function normalizeMachines(data) {
  if (!Array.isArray(data)) return [];

  return data.map((m) => ({
    ...m,
    blocks: (m.blocks || []).map((b) => ({
      ...b,
      tests: (b.tests || []).map((t) =>
        typeof t === 'string' ? { time: t, done: false } : t,
      ),
    })),
  }));
}

function App() {
  const [code, setCode] = useState('');
  const [material, setMaterial] = useState('');
  const [frequency, setFrequency] = useState(2);
  const [firstTest, setFirstTest] = useState('06:00');
  const [shift, setShift] = useState('A');
  const [machines, dispatch] = useReducer(machinesReducer, undefined, () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    try {
      const parsed = JSON.parse(saved);
      return normalizeMachines(parsed);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(machines));
  }, [machines]);

  // add machine
  function handleAddMachine(machineData) {
    try {
      const normalizedFirstTest = formatTimeInput(machineData.firstTest);
      if (!normalizedFirstTest) {
        alert('Invalid first test time');
        return;
      }
      const normalizedCode = machineData.code.trim().toUpperCase();

      const alreadyExists = machines.some(
        (m) => (m.code || '').trim().toUpperCase() === normalizedCode,
      );

      if (alreadyExists) {
        alert('Machine code already exists');
        return;
      }
      const schedule = generateSchedule(
        machineData.firstTest,
        machineData.frequency,
        machineData.shift,
      );

      const newMachine = {
        id: crypto.randomUUID(),
        code: machineData.code,
        material: machineData.material,
        frequency: machineData.frequency,
        shift: machineData.shift,
        blocks: [
          {
            startTime: machineData.firstTest,
            endTime: null,
            tests: schedule.map((t) => ({ time: t, done: false })),
          },
        ],
        stops: [],
      };

      dispatch({ type: 'ADD_MACHINE', payload: newMachine });

      // clean inputs
      setCode('');
      setMaterial('');
      setFrequency(2);
      setFirstTest('06:00');
      setShift('A');
    } catch (error) {
      alert(error.message);
    }
  }

  // function for stoped machine
  function handleStopMachine(machineId, stopTime, reason) {
    const machine = machines.find((m) => m.id === machineId);
    if (!machine) return;

    const lastBlock = machine.blocks[machine.blocks.length - 1];

    if (lastBlock.endTime !== null) {
      alert('Machine is already stopped');
      return;
    }

    const formattedStopTime = formatTimeInput(stopTime);
    if (!formattedStopTime) {
      alert('Invalid stop time');
      return;
    }

    dispatch({
      type: 'STOP_MACHINE',
      payload: {
        machineId,
        stopTime: formattedStopTime,
        reason,
        convertToMinutes,
      },
    });
  }

  function handleResumeMachine(machineId, resumeTime) {
    const machine = machines.find((m) => m.id === machineId);
    if (!machine) return;

    const lastBlock = machine.blocks[machine.blocks.length - 1];

    if (lastBlock.endTime === null) {
      alert('Machine is already running');
      return;
    }

    const formattedResumeTime = formatTimeInput(resumeTime);
    if (!formattedResumeTime) {
      alert('Invalid resume time');
      return;
    }

    try {
      const newSchedule = generateSchedule(
        formattedResumeTime,
        machine.frequency,
        machine.shift,
      );

      if (!newSchedule.length) {
        alert('No remaining tests for this shift');
        return;
      }

      const newBlock = {
        startTime: formattedResumeTime,
        endTime: null,
        tests: newSchedule.map((t) => ({ time: t, done: false })),
      };

      dispatch({
        type: 'RESUME_MACHINE',
        payload: { machineId, newBlock, convertToMinutes },
      });
    } catch (error) {
      alert(error.message);
    }
  }

  function handleUpdateMachine(machineId, updates) {
    const machine = machines.find((m) => m.id === machineId);
    if (!machine) return;

    if (typeof updates.frequency === 'number' && updates.frequency <= 0) {
      alert('Frequency must be greater than 0');
      return;
    }

    const lastBlockIndex = machine.blocks.length - 1;
    const lastBlock = machine.blocks[lastBlockIndex];
    const isRunning = lastBlock?.endTime === null;

    // Helper: normalize minutes for night shift comparisons
    const isNightShift = machine.shift === 'B' || machine.shift === 'D';
    function toShiftMinutes(timeString) {
      let mins = convertToMinutes(timeString);
      if (isNightShift && mins < 18 * 60) mins += 1440;
      return mins;
    }

    // If frequency changed AND machine is running -> recalc remaining tests in current block
    const freqChanged =
      typeof updates.frequency === 'number' &&
      updates.frequency !== machine.frequency;

    if (isRunning && freqChanged) {
      const now = new Date();
      const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes(),
      ).padStart(2, '0')}`;

      const nowMins = toShiftMinutes(nowStr);

      // Keep past tests
      const pastTests = (lastBlock.tests || []).filter(
        (t) => toShiftMinutes(t) < nowMins,
      );

      // Generate new future tests from "now" using the NEW frequency
      let futureTests = [];
      try {
        futureTests = generateSchedule(
          nowStr,
          updates.frequency,
          machine.shift,
        ).filter((t) => toShiftMinutes(t) >= nowMins);
      } catch (error) {
        alert(error.message);
        return;
      }

      const updatedLastBlock = {
        ...lastBlock,
        tests: [...pastTests, ...futureTests],
      };

      const updatedBlocks = [...machine.blocks];
      updatedBlocks[lastBlockIndex] = updatedLastBlock;

      dispatch({
        type: 'UPDATE_MACHINE',
        payload: {
          machineId,
          updates: {
            ...updates,
            blocks: updatedBlocks,
          },
        },
      });

      return;
    }

    dispatch({
      type: 'UPDATE_MACHINE',
      payload: { machineId, updates },
    });
  }

  function handleCompleteNextTest(machineId) {
    const machine = machines.find((m) => m.id === machineId);
    if (!machine) return;

    const blockIndex = machine.blocks.length - 1;
    const block = machine.blocks[blockIndex];

    // só faz sentido concluir se estiver rodando
    if (block.endTime !== null) {
      alert('Machine is stopped');
      return;
    }

    const nextPending = block.tests?.find((t) => !t.done);
    if (!nextPending) {
      alert('All tests are done');
      return;
    }

    // shift-aware compare (igual usamos antes)
    const isNightShift = machine.shift === 'B' || machine.shift === 'D';
    function toShiftMinutes(timeString) {
      let mins = convertToMinutes(timeString);
      if (isNightShift && mins < 18 * 60) mins += 1440;
      return mins;
    }

    const now = new Date();
    const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes(),
    ).padStart(2, '0')}`;

    const nowMins = toShiftMinutes(nowStr);
    const nextMins = toShiftMinutes(nextPending.time);

    // não deixa concluir teste “no futuro”
    if (nextMins > nowMins) {
      alert('Next test is not due yet');
      return;
    }

    dispatch({
      type: 'SET_TEST_DONE',
      payload: {
        machineId,
        blockIndex,
        time: nextPending.time,
        done: true,
      },
    });
  }

  // --- RETURN ---
  return (
    <>
      {/* BOTÃO LIMPAR TELA / NOVO TURNO */}
      <button
        onClick={() => {
          if (
            window.confirm('Deseja limpar todas as máquinas para o novo turno?')
          ) {
            dispatch({ type: 'CLEAR_ALL' });
            setCode('');
            setMaterial('');
            setFrequency(2);
            setFirstTest('06:00');
            setShift('A');
          }
        }}
        style={{ marginBottom: '20px' }}
      >
        Limpar Tela / Novo Turno
      </button>

      {/* FORMULÁRIO */}
      <MachineForm
        code={code}
        setCode={setCode}
        material={material}
        setMaterial={setMaterial}
        frequency={frequency}
        setFrequency={setFrequency}
        firstTest={firstTest}
        setFirstTest={setFirstTest}
        shift={shift}
        setShift={setShift}
        onCreate={() =>
          handleAddMachine({
            code,
            material,
            frequency,
            firstTest,
            shift,
          })
        }
      />

      {machines?.map((machine) => (
        <MachineCard
          key={machine.id}
          machine={machine}
          convertToMinutes={convertToMinutes}
          onStop={(id) => {
            const stopTime = prompt('Digite o horário da parada (HH:MM)');
            const reason = prompt('Motivo da parada?');

            if (stopTime && reason) {
              handleStopMachine(id, stopTime, reason);
            }
          }}
          onResume={(id) => {
            const resumeTime = prompt('Digite o horário de retorno (HH:MM)');
            if (resumeTime) {
              handleResumeMachine(id, resumeTime);
            }
          }}
          onUpdate={handleUpdateMachine}
          onCompleteNext={handleCompleteNextTest}
        />
      ))}
    </>
  );
}

export default App;
