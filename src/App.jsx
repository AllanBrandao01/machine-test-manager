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

        const lastBlock = machine.blocks[machine.blocks.length - 1];

        if (lastBlock.endTime !== null) return machine;

        const stopMinutes = convertToMinutes(stopTime);
        const truncatedTests = lastBlock.tests.filter((t) => {
          const tMinutes = convertToMinutes(t);
          return tMinutes <= stopMinutes;
        });

        const updatedBlocks = [...machine.blocks];
        updatedBlocks[updatedBlocks.length - 1] = {
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
      const { machineId, newBlock } = action.payload;

      return state.map((machine) => {
        if (machine.id !== machineId) return machine;

        const lastBlock = machine.blocks[machine.blocks.length - 1];

        if (lastBlock.endTime === null) return machine;

        return {
          ...machine,
          blocks: [...machine.blocks, newBlock],
        };
      });
    }

    case 'CLEAR_ALL': {
      return [];
    }

    default:
      return state;
  }
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
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(machines));
  }, [machines]);

  // --- FUNÇÃO ADD MACHINE ---
  function handleAddMachine(machineData) {
    try {
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
            tests: schedule,
          },
        ],
        stops: [],
      };

      dispatch({ type: 'ADD_MACHINE', payload: newMachine });

      // Limpar inputs
      setCode('');
      setMaterial('');
      setFrequency(2);
      setFirstTest('06:00');
      setShift('A');
    } catch (error) {
      alert(error.message);
    }
  }

  // --- FUNÇÃO STOP MACHINE ---
  function handleStopMachine(machineId, stopTime, reason) {
    const machine = machines.find((m) => m.id === machineId);
    if (!machine) return;

    const lastBlock = machine.blocks[machine.blocks.length - 1];

    if (lastBlock.endTime !== null) {
      alert('Machine is already stopped');
      return;
    }

    const formattedStopTime = formatTimeInput(stopTime);

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

  // --- FUNÇÃO RESUME MACHINE ---
  function handleResumeMachine(machineId, resumeTime) {
    const machine = machines.find((m) => m.id === machineId);
    if (!machine) return;

    const lastBlock = machine.blocks[machine.blocks.length - 1];

    if (lastBlock.endTime === null) {
      alert('Machine is already running');
      return;
    }

    const formattedResumeTime = formatTimeInput(resumeTime);

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
        tests: newSchedule,
      };

      dispatch({
        type: 'RESUME_MACHINE',
        payload: { machineId, newBlock },
      });
    } catch (error) {
      alert(error.message);
    }
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

      {/* LISTA */}
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
        />
      ))}
    </>
  );
}

export default App;
