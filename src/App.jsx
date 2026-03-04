import { useEffect, useState } from 'react';
import {
  convertToMinutes,
  convertToTimeString,
  formatTimeInput,
} from './utils/time';
import { generateSchedule, getShiftWindow } from './utils/schedule';
import MachineForm from './components/MachineForm';
import MachineCard from './components/MachineCard';

function App() {
  const STORAGE_KEY = 'machine-test-manager:machines';
  const [code, setCode] = useState('');
  const [material, setMaterial] = useState('');
  const [frequency, setFrequency] = useState(2);
  const [firstTest, setFirstTest] = useState('06:00');
  const [shift, setShift] = useState('A');
  const [machines, setMachines] = useState(() => {
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

      setMachines((prev) => [...prev, newMachine]);

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
    const formattedStopTime = formatTimeInput(stopTime);

    setMachines((prevMachines) =>
      prevMachines.map((machine) => {
        if (machine.id !== machineId) return machine;

        const lastBlock = machine.blocks[machine.blocks.length - 1];
        if (lastBlock.endTime !== null) {
          alert('Machine is already stopped');
          return machine;
        }

        // Truncar horários não feitos
        const newTests = lastBlock.tests.filter((testTime) => {
          const testMinutes = convertToMinutes(testTime);
          const stopMinutes = convertToMinutes(formattedStopTime);
          return testMinutes <= stopMinutes;
        });

        const updatedBlocks = [...machine.blocks];
        updatedBlocks[updatedBlocks.length - 1] = {
          ...lastBlock,
          endTime: formattedStopTime,
          tests: newTests,
        };

        return {
          ...machine,
          blocks: updatedBlocks,
          stops: [
            ...machine.stops,
            {
              stoppedAt: formattedStopTime,
              reason,
            },
          ],
        };
      }),
    );
  }

  // --- FUNÇÃO RESUME MACHINE ---
  function handleResumeMachine(machineId, resumeTime) {
    const formattedResumeTime = formatTimeInput(resumeTime);

    setMachines((prevMachines) =>
      prevMachines.map((machine) => {
        if (machine.id !== machineId) return machine;

        const lastBlock = machine.blocks[machine.blocks.length - 1];
        if (lastBlock.endTime === null) {
          alert('Machine is already running');
          return machine;
        }

        try {
          const { startHour, endHour } = getShiftWindow(machine.shift);
          let shiftStartInMinutes = startHour * 60;
          let shiftEndInMinutes = endHour * 60;
          if (shiftEndInMinutes <= shiftStartInMinutes)
            shiftEndInMinutes += 1440;

          let currentTimeInMinutes = convertToMinutes(formattedResumeTime);
          if (currentTimeInMinutes < shiftStartInMinutes)
            currentTimeInMinutes += 1440;

          const frequencyInMinutes = machine.frequency * 60;
          const newSchedule = [];
          while (currentTimeInMinutes <= shiftEndInMinutes) {
            newSchedule.push(currentTimeInMinutes);
            currentTimeInMinutes += frequencyInMinutes;
          }

          const newBlock = {
            startTime: formattedResumeTime,
            endTime: null,
            tests: newSchedule.map(convertToTimeString),
          };

          return {
            ...machine,
            blocks: [...machine.blocks, newBlock],
          };
        } catch (error) {
          alert(error.message);
          return machine;
        }
      }),
    );
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
            setMachines([]);
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
