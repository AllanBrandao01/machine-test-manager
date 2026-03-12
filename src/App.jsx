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
import ModalConfirm from './components/ModalConfirm';
import ModalStopMachine from './components/ModalStopMachine';
import ModalResumeMachine from './components/ModalResumeMachine';

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
  const [errors, setErrors] = useState({});
  const [stopModal, setStopModal] = useState({
    open: false,
    machineId: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    machineId: null,
  });
  const [feedback, setFeedback] = useState(null);
  const [machines, dispatch] = useReducer(machinesReducer, []);
  const [resumeModal, setResumeModal] = useState({
    open: false,
    machineId: null,
  });
  const [newShiftModal, setNewShiftModal] = useState(false);

  function showFeedback(type, message) {
    setFeedback({ type, message });
  }

  function clearFieldError(field) {
    setErrors((prev) => {
      if (!prev[field]) return prev;

      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  }

  async function getActiveShiftSessionId() {
    const { data, error } = await supabase
      .from('shift_sessions')
      .select('id')
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar turno ativo:', error);
      return null;
    }

    return data?.id ?? null;
  }

  useEffect(() => {
    async function fetchMachines() {
      const shiftSessionId = await getActiveShiftSessionId();

      if (!shiftSessionId) {
        dispatch({ type: 'SET_MACHINES', payload: [] });
        return;
      }

      const { data, error } = await supabase
        .from('machines')
        .select(
          `
          *,
          tests (*),
          stops (*)
        `,
        )
        .eq('shift_session_id', shiftSessionId);

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

        const completedTimes = (machine.tests || []).map((test) => {
          const date = new Date(test.test_time);

          return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'America/Sao_Paulo',
          });
        });

        return {
          ...machine,
          blocks: [
            {
              startTime: machine.first_test,
              endTime: null,
              tests: schedule.map((time) => ({
                time,
                done: completedTimes.includes(time),
              })),
            },
          ],
          stops: machine.stops || [],
        };
      });

      dispatch({
        type: 'SET_MACHINES',
        payload: machinesFromDB,
      });
    }

    fetchMachines();
  }, []);

  async function handleAddMachine(machineData) {
    try {
      const newErrors = {};

      if (!machineData.code.trim()) {
        newErrors.code = 'Informe o nome da máquina.';
      }

      if (!machineData.material.trim()) {
        newErrors.material = 'Informe o nome do material.';
      }

      if (
        typeof machineData.frequency !== 'number' ||
        machineData.frequency <= 0
      ) {
        newErrors.frequency = 'A frequência deve ser maior que 0.';
      }

      const normalizedFirstTest = formatTimeInput(machineData.firstTest);

      if (!normalizedFirstTest) {
        newErrors.firstTest = 'Horário do primeiro teste inválido.';
      }

      const normalizedCode = machineData.code.trim().toUpperCase();

      const alreadyExists = machines.some(
        (m) => (m.code || '').trim().toUpperCase() === normalizedCode,
      );

      if (alreadyExists) {
        newErrors.code = 'Código da máquina já existe.';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors({});
      setFeedback(null);

      const schedule = generateSchedule(
        normalizedFirstTest,
        machineData.frequency,
        machineData.shift,
      );

      const shiftSessionId = await getActiveShiftSessionId();

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
            shift_session_id: shiftSessionId,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error(error);
        showFeedback('error', 'Erro ao salvar máquina no banco.');
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
      setErrors({});
      showFeedback('success', 'Máquina criada com sucesso.');
    } catch (error) {
      showFeedback('error', error.message || 'Erro ao criar máquina.');
    }
  }

  function handleDeleteMachine(machineId) {
    setDeleteModal({
      open: true,
      machineId,
    });
  }
  function confirmDeleteMachine() {
    dispatch({
      type: 'DELETE_MACHINE',
      payload: deleteModal.machineId,
    });

    setDeleteModal({ open: false, machineId: null });

    showFeedback('success', 'Máquina excluída com sucesso.');
  }

  async function handleStopMachine(machineId, stopTime, reason) {
    const machine = machines.find((m) => m.id === machineId);
    if (!machine) return;

    const lastBlock = machine.blocks[machine.blocks.length - 1];

    if (lastBlock.endTime !== null) {
      showFeedback('warning', 'A máquina já está parada.');
      return;
    }

    const formattedStopTime = formatTimeInput(stopTime);
    if (!formattedStopTime) {
      showFeedback('error', 'Horário de parada inválido.');
      return;
    }

    const now = new Date();
    const [hours, minutes] = formattedStopTime.split(':');

    const stopDate = new Date(now);
    stopDate.setHours(Number(hours), Number(minutes), 0, 0);

    const shiftSessionId = await getActiveShiftSessionId();

    const { error } = await supabase.from('stops').insert([
      {
        machine_id: machineId,
        stop_time: stopDate.toISOString(),
        reason: reason.trim(),
        shift: machine.shift,
        shift_session_id: shiftSessionId,
      },
    ]);

    if (error) {
      console.error(error);
      showFeedback('error', 'Erro ao salvar parada no banco.');
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

    showFeedback('success', 'Máquina parada com sucesso.');
  }

  async function handleResumeMachine(machineId, resumeTime) {
    const machine = machines.find((m) => m.id === machineId);
    if (!machine) return;

    const lastBlock = machine.blocks[machine.blocks.length - 1];

    if (lastBlock.endTime === null) {
      showFeedback('warning', 'A máquina já está em funcionamento.');
      return;
    }

    const formattedResumeTime = formatTimeInput(resumeTime);
    if (!formattedResumeTime) {
      showFeedback('error', 'Horário de retomada inválido.');
      return;
    }

    try {
      const newSchedule = generateSchedule(
        formattedResumeTime,
        machine.frequency,
        machine.shift,
      );

      if (!newSchedule.length) {
        showFeedback(
          'warning',
          'Não há mais testes restantes para este turno.',
        );
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
        showFeedback('error', 'Erro ao buscar parada em aberto.');
        return;
      }

      if (!openStop) {
        showFeedback(
          'warning',
          'Nenhuma parada em aberto encontrada para esta máquina.',
        );
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
        showFeedback('error', 'Erro ao salvar retomada no banco.');
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

      showFeedback('success', 'Máquina retomada com sucesso.');
    } catch (error) {
      showFeedback('error', error.message || 'Erro ao retomar máquina.');
    }
  }

  function handleUpdateMachine(machineId, updates) {
    const machine = machines.find((m) => m.id === machineId);
    if (!machine) return;

    if (typeof updates.frequency === 'number' && updates.frequency <= 0) {
      showFeedback('error', 'A frequência deve ser maior que 0.');
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
        showFeedback('error', error.message);
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

      showFeedback('success', 'Máquina atualizada com sucesso.');
      return;
    }

    dispatch({
      type: 'UPDATE_MACHINE',
      payload: { machineId, updates },
    });

    showFeedback('success', 'Máquina atualizada com sucesso.');
  }

  async function handleCompleteNextTest(machineId) {
    const machine = machines.find((m) => m.id === machineId);
    if (!machine) return;

    const blockIndex = machine.blocks.length - 1;
    const block = machine.blocks[blockIndex];

    if (block.endTime !== null) {
      showFeedback('warning', 'A máquina está parada.');
      return;
    }

    const nextPending = block.tests?.find((t) => !t.done);
    if (!nextPending) {
      showFeedback('warning', 'Todos os testes foram concluídos.');
      return;
    }

    const nowMins = getNowShiftMinutes(machine.shift);
    const nextMins = toShiftMinutes(nextPending.time, machine.shift);

    if (nextMins > nowMins) {
      showFeedback('warning', 'O próximo teste ainda não está no horário.');
      return;
    }

    const now = new Date();
    const [hours, minutes] = nextPending.time.split(':');

    const testDate = new Date(now);
    testDate.setHours(Number(hours), Number(minutes), 0, 0);

    const shiftSessionId = await getActiveShiftSessionId();

    const { error } = await supabase.from('tests').insert([
      {
        machine_id: machineId,
        test_time: testDate.toISOString(),
        shift: machine.shift,
        notes: 'Teste concluído pelo operador',
        shift_session_id: shiftSessionId,
      },
    ]);

    if (error) {
      console.error(error);
      showFeedback('error', 'Erro ao salvar teste no banco.');
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

    showFeedback('success', 'Teste concluído com sucesso.');
  }

  const { runningMachines, stoppedMachines, lateTests, completedTests } =
    getDashboardStats(machines);

  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const filteredMachines = filterMachines(machines, statusFilter);

  async function handleStartNewShift() {
    try {
      const { data: currentShift, error: currentShiftError } = await supabase
        .from('shift_sessions')
        .select('*')
        .eq('is_active', true)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (currentShiftError) {
        console.error(currentShiftError);
        showFeedback('error', 'Erro ao buscar o turno atual.');
        setNewShiftModal(false);
        return;
      }

      if (currentShift) {
        const { error: deactivateError } = await supabase
          .from('shift_sessions')
          .update({ is_active: false })
          .eq('id', currentShift.id);

        if (deactivateError) {
          console.error(deactivateError);
          showFeedback('error', 'Erro ao encerrar o turno atual.');
          setNewShiftModal(false);
          return;
        }
      }

      const now = new Date();
      const shiftName = `Turno ${now.toLocaleString('pt-BR')}`;

      const { error: createError } = await supabase
        .from('shift_sessions')
        .insert([
          {
            name: shiftName,
            is_active: true,
          },
        ]);

      if (createError) {
        console.error(createError);
        showFeedback('error', 'Erro ao criar novo turno.');
        setNewShiftModal(false);
        return;
      }

      dispatch({ type: 'SET_MACHINES', payload: [] });

      setCode('');
      setMaterial('');
      setFrequency(2);
      setFirstTest('06:00');
      setShift('A');
      setErrors({});
      showFeedback('success', 'Novo turno iniciado com sucesso.');
      setNewShiftModal(false);
    } catch (error) {
      console.error(error);
      showFeedback('error', 'Erro ao iniciar novo turno.');
      setNewShiftModal(false);
    }
  }

  function confirmStopMachine(time, reason) {
    handleStopMachine(stopModal.machineId, time, reason);

    setStopModal({
      open: false,
      machineId: null,
    });
  }

  function confirmResumeMachine(time) {
    handleResumeMachine(resumeModal.machineId, time);

    setResumeModal({
      open: false,
      machineId: null,
    });
  }

  return (
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

        {feedback && (
          <div className={`feedbackMessage feedback-${feedback.type}`}>
            <span>{feedback.message}</span>
            <button
              className="feedbackClose"
              onClick={() => setFeedback(null)}
              type="button"
            >
              ×
            </button>
          </div>
        )}

        <Dashboard
          runningMachines={runningMachines}
          stoppedMachines={stoppedMachines}
          lateTests={lateTests}
          completedTests={completedTests}
        />
      </div>

      <div className="sectionBar">
        <button className="resetButton" onClick={() => setNewShiftModal(true)}>
          Iniciar novo turno
        </button>
      </div>

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
          errors={errors}
          clearFieldError={clearFieldError}
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

      <Filters statusFilter={statusFilter} setStatusFilter={setStatusFilter} />

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
              setStopModal({
                open: true,
                machineId: id,
              });
            }}
            onResume={(id) => {
              setResumeModal({
                open: true,
                machineId: id,
              });
            }}
            onUpdate={handleUpdateMachine}
            onCompleteNext={handleCompleteNextTest}
            onDelete={handleDeleteMachine}
          />
        ))}

        <ModalConfirm
          isOpen={deleteModal.open}
          title="Excluir máquina"
          message="Deseja realmente excluir esta máquina?"
          onCancel={() => setDeleteModal({ open: false, machineId: null })}
          onConfirm={confirmDeleteMachine}
        />

        <ModalStopMachine
          isOpen={stopModal.open}
          machineId={stopModal.machineId}
          onClose={() =>
            setStopModal({
              open: false,
              machineId: null,
            })
          }
          onConfirm={confirmStopMachine}
        />

        <ModalResumeMachine
          isOpen={resumeModal.open}
          onClose={() =>
            setResumeModal({
              open: false,
              machineId: null,
            })
          }
          onConfirm={confirmResumeMachine}
        />

        <ModalConfirm
          isOpen={newShiftModal}
          title="Iniciar novo turno"
          message="Deseja realmente iniciar um novo turno?"
          onCancel={() => setNewShiftModal(false)}
          onConfirm={handleStartNewShift}
        />
      </div>
    </div>
  );
}

export default App;
