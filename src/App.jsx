import { supabase } from './services/supabase/supabaseClient';
import { useEffect, useReducer, useState } from 'react';
import { formatTimeInput, convertToTimeString } from './utils/time';
import { toShiftMinutes, getNowShiftMinutes } from './utils/shift';
import MachineForm from './components/MachineForm';
import MachineCard from './components/MachineCard';
import { generateSchedule } from './utils/schedule';
import Filters from './components/Filters';
import { filterMachines } from './utils/filters';
import Dashboard from './components/Dashboard';
import { getDashboardStats } from './utils/dashboard';

const STORAGE_KEY = 'machine-test-manager:machines';

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

function App() {
  const [code, setCode] = useState('');
  const [material, setMaterial] = useState('');
  const [frequency, setFrequency] = useState(2);
  const [firstTest, setFirstTest] = useState('06:00');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shift, setShift] = useState('A');
  const [machines, dispatch] = useReducer(machinesReducer, []);

  useEffect(() => {
    async function fetchMachines() {
      const { data, error } = await supabase.from('machines').select('*');

      if (error) {
        console.error('Erro ao buscar máquinas:', error);
        return;
      }

      const machinesFromDB = data.map((machine) => {
        const schedule = generateSchedule(
          machine.first_test,
          machine.frequency,
          machine.shift,
        );

        return {
          ...machine,
          blocks: [
            {
              startTime: machine.first_test,
              endTime: null,
              tests: schedule.map((t) => ({ time: t, done: false })),
            },
          ],
          stops: [],
        };
      });

      dispatch({
        type: 'SET_MACHINES',
        payload: machinesFromDB,
      });
    }

    fetchMachines();
  }, []);

  // add machine
  async function handleAddMachine(machineData) {
    try {
      if (!machineData.code.trim()) {
        alert('Informe o nome da máquina.');
        return;
      }

      if (!machineData.material.trim()) {
        alert('Informe o nome do material.');
        return;
      }

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
        alert('Código da Máquina já existe');
        return;
      }

      const schedule = generateSchedule(
        normalizedFirstTest,
        machineData.frequency,
        machineData.shift,
      );

      const { data, error } = await supabase
        .from('machines')
        .insert([
          {
            name: normalizedCode,
            code: normalizedCode,
            material: machineData.material.trim(),
            frequency: machineData.frequency,
            first_test: normalizedFirstTest,
            shift: machineData.shift,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) {
        alert('Erro ao salvar máquina no banco.');
        console.error(error);
        return;
      }

      const newMachine = {
        ...data,
        blocks: [
          {
            startTime: normalizedFirstTest,
            endTime: null,
            tests: schedule.map((t) => ({ time: t, done: false })),
          },
        ],
        stops: [],
      };

      dispatch({ type: 'ADD_MACHINE', payload: newMachine });

      setCode('');
      setMaterial('');
      setFrequency(2);
      setFirstTest('06:00');
      setShift('A');
    } catch (error) {
      alert(error.message);
    }
  }

  function handleDeleteMachine(machineId) {
    const confirmed = window.confirm(
      'Deseja realmente excluir esta máquina do controle?',
    );

    if (!confirmed) return;

    dispatch({
      type: 'DELETE_MACHINE',
      payload: machineId,
    });
  }

  // function for stoped machine
  async function handleStopMachine(machineId, stopTime, reason) {
    const machine = machines.find((m) => m.id === machineId);
    if (!machine) return;

    const lastBlock = machine.blocks[machine.blocks.length - 1];

    if (lastBlock.endTime !== null) {
      alert('A máquina já está parada');
      return;
    }

    const formattedStopTime = formatTimeInput(stopTime);
    if (!formattedStopTime) {
      alert('Horário de parada inválido');
      return;
    }

    const now = new Date();
    const [hours, minutes] = formattedStopTime.split(':');

    const stopDate = new Date(now);
    stopDate.setHours(Number(hours), Number(minutes), 0, 0);

    const { error } = await supabase.from('stops').insert([
      {
        machine_id: machineId,
        stop_time: stopDate.toISOString(),
        reason: reason.trim(),
        shift: machine.shift,
      },
    ]);

    if (error) {
      alert('Erro ao salvar parada no banco');
      console.error(error);
      return;
    }

    dispatch({
      type: 'STOP_MACHINE',
      payload: {
        machineId,
        stopTime: formattedStopTime,
        reason,
      },
    });
  }

  async function handleResumeMachine(machineId, resumeTime) {
    const machine = machines.find((m) => m.id === machineId);
    if (!machine) return;

    const lastBlock = machine.blocks[machine.blocks.length - 1];

    if (lastBlock.endTime === null) {
      alert('A máquina já está em funcionamento');
      return;
    }

    const formattedResumeTime = formatTimeInput(resumeTime);
    if (!formattedResumeTime) {
      alert('Horário de retomada inválido');
      return;
    }

    try {
      const newSchedule = generateSchedule(
        formattedResumeTime,
        machine.frequency,
        machine.shift,
      );

      if (!newSchedule.length) {
        alert('Não há mais testes restantes para este turno');
        return;
      }

      const now = new Date();
      const [hours, minutes] = formattedResumeTime.split(':');

      const resumeDate = new Date(now);
      resumeDate.setHours(Number(hours), Number(minutes), 0, 0);

      const { data: openStop, error: fetchError } = await supabase
        .from('stops')
        .select('*')
        .eq('machine_id', machineId)
        .is('resume_time', null)
        .order('stop_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error(fetchError);
        alert('Erro ao buscar parada em aberto');
        return;
      }

      if (!openStop) {
        alert('Nenhuma parada em aberto encontrada para esta máquina');
        return;
      }

      const { error: updateError } = await supabase
        .from('stops')
        .update({
          resume_time: resumeDate.toISOString(),
        })
        .eq('id', openStop.id);

      if (updateError) {
        console.error(updateError);
        alert('Erro ao salvar retomada no banco');
        return;
      }

      const newBlock = {
        startTime: formattedResumeTime,
        endTime: null,
        tests: newSchedule.map((t) => ({ time: t, done: false })),
      };

      dispatch({
        type: 'RESUME_MACHINE',
        payload: { machineId, newBlock },
      });
    } catch (error) {
      alert(error.message);
    }
  }

  function handleUpdateMachine(machineId, updates) {
    const machine = machines.find((m) => m.id === machineId);
    if (!machine) return;

    if (typeof updates.frequency === 'number' && updates.frequency <= 0) {
      alert('A frequência deve ser maior que 0');
      return;
    }

    const lastBlockIndex = machine.blocks.length - 1;
    const lastBlock = machine.blocks[lastBlockIndex];
    const isRunning = lastBlock?.endTime === null;

    const freqChanged =
      typeof updates.frequency === 'number' &&
      updates.frequency !== machine.frequency;

    if (isRunning && freqChanged) {
      const nowMins = getNowShiftMinutes(machine.shift);
      const nowStr = convertToTimeString(nowMins % 1440);

      const pastTests = (lastBlock.tests || []).filter(
        (test) => toShiftMinutes(test.time, machine.shift) < nowMins,
      );

      let futureTests = [];

      try {
        futureTests = generateSchedule(nowStr, updates.frequency, machine.shift)
          .filter((time) => toShiftMinutes(time, machine.shift) >= nowMins)
          .map((time) => ({ time, done: false }));
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

    if (block.endTime !== null) {
      alert('A máquina está parada');
      return;
    }

    const nextPending = block.tests?.find((t) => !t.done);
    if (!nextPending) {
      alert('Todos os testes foram concluídos');
      return;
    }

    const nowMins = getNowShiftMinutes(machine.shift);
    const nextMins = toShiftMinutes(nextPending.time, machine.shift);

    if (nextMins > nowMins) {
      alert('O próximo teste ainda não está no horário');
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

  const { runningMachines, stoppedMachines, lateTests, completedTests } =
    getDashboardStats(machines);

  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const filteredMachines = filterMachines(machines, statusFilter);

  // --- RETURN ---
  return (
    <>
      <div className="appContainer">
        <div>
          <div className="appHeader">
            <div>
              <h1 className="appTitle">Controle de testes de qualidade</h1>
              <p className="appSubtitle">Machine Test Scheduler</p>
            </div>

            <div className="appInfo">
              <span>Turno atual: {shift}</span>
              <span>{today}</span>
            </div>
          </div>
          <Dashboard
            runningMachines={runningMachines}
            stoppedMachines={stoppedMachines}
            lateTests={lateTests}
            completedTests={completedTests}
          />
        </div>

        {/* BOTÃO LIMPAR TELA */}
        <div className="sectionBar">
          <button
            className="resetButton"
            onClick={() => {
              if (
                window.confirm(
                  'Deseja limpar todas as máquinas para o novo turno?',
                )
              ) {
                dispatch({ type: 'CLEAR_ALL' });
                setCode('');
                setMaterial('');
                setFrequency(2);
                setFirstTest('06:00');
                setShift('A');
              }
            }}
          >
            Iniciar novo turno
          </button>
        </div>

        {/* FORMULÁRIO */}
        <div className="formSection">
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
        </div>
        <Filters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        <div className="sectionHeader">
          <h2 className="sectionTitle">Máquinas em monitoramento</h2>
          <p className="sectionSubtitle">Acompanhe o status dos testes.</p>
        </div>

        <div className="machinesGrid">
          {filteredMachines?.map((machine) => (
            <MachineCard
              key={machine.id}
              machine={machine}
              onStop={(id) => {
                const stopTime = prompt('Digite o horário da parada (HH:MM)');
                const reason = prompt('Motivo da parada?');

                if (stopTime && reason) {
                  handleStopMachine(id, stopTime, reason);
                }
              }}
              onResume={(id) => {
                const resumeTime = prompt(
                  'Digite o horário de retorno (HH:MM)',
                );
                if (resumeTime) {
                  handleResumeMachine(id, resumeTime);
                }
              }}
              onUpdate={handleUpdateMachine}
              onCompleteNext={handleCompleteNextTest}
              onDelete={handleDeleteMachine}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
