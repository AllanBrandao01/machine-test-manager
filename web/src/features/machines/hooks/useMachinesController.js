import { useEffect, useReducer, useState } from 'react';
import { formatTimeInput } from '../../../utils/time';
import { filterMachines } from '../utils/filters';
import { getDashboardStats } from '../utils/dashboard';
import machinesReducer from '../reducer/machinesReducer';
import { fetchMachines } from '../../../services/api/machines';
import {
  insertMachine,
  insertStop,
  updateStopResume,
  insertTest,
  getActiveShiftSession,
  deactivateShiftSession,
  startNewShiftSession,
  updateMachineRequest,
  deleteMachineRequest,
} from '../../../services/machinesDataService';

function normalizeMachineFromApi(machine) {
  return {
    id: machine.id,
    code: machine.code ?? '',
    material: machine.material ?? '',
    frequency: Number(machine.frequency ?? 0),
    firstTest: machine.firstTest ?? '00:00',
    shift: machine.shift ?? 'A',

    stops: machine.stops ?? [],
    tests: machine.tests ?? [],
    blocks: machine.blocks ?? [],

    nextTestTime: machine.nextTestTime ?? null,
    status: machine.status ?? 'on_time',
    isStopped: machine.isStopped ?? false,
  };
}

export function useMachinesController() {
  const [code, setCode] = useState('');
  const [material, setMaterial] = useState('');
  const [frequency, setFrequency] = useState(2);
  const [firstTest, setFirstTest] = useState('');
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

  function resetMachineForm() {
    setCode('');
    setMaterial('');
    setFrequency(2);
    setFirstTest('');
    setErrors({});
  }

  function validateMachineForm(machineData) {
    const newErrors = {};

    if (!machineData.code.trim()) {
      newErrors.code = 'Informe o nome da máquina.';
    }

    if (!machineData.material.trim()) {
      newErrors.material = 'Informe o nome do material.';
    }

    if (
      typeof machineData.frequency !== 'number' ||
      machineData.frequency < 0.5
    ) {
      newErrors.frequency = 'A frequência mínima é 0.5 (30 minutos).';
    }

    const normalizedFirstTest = formatTimeInput(machineData.firstTest);

    if (!normalizedFirstTest) {
      newErrors.firstTest = 'Horário do primeiro teste inválido.';
    }

    const normalizedCode = machineData.code.trim().toUpperCase();

    return {
      errors: newErrors,
      normalizedCode,
      normalizedFirstTest,
    };
  }

  async function handleStartNewShift() {
    try {
      if (!shift) {
        showFeedback(
          'error',
          'Selecione a turma antes de iniciar um novo turno.',
        );
        setNewShiftModal(false);
        return;
      }

      await startNewShiftFlow(shift);

      dispatch({ type: 'SET_MACHINES', payload: [] });

      resetMachineForm();
      showFeedback('success', 'Novo turno iniciado com sucesso.');
      setNewShiftModal(false);
    } catch (error) {
      console.error(error);
      showFeedback('error', error.message || 'Erro ao iniciar novo turno.');
      setNewShiftModal(false);
    }
  }

  async function stopMachineFlow(machineId, stopData) {
    try {
      const response = await insertStop(machineId, stopData);

      dispatch({
        type: 'REPLACE_MACHINE',
        payload: normalizeMachineFromApi(response),
      });

      showFeedback('success', 'Máquina parada com sucesso.');
    } catch (error) {
      showFeedback('error', error.message || 'Erro ao parar máquina.');
      throw error;
    }
  }

  async function resumeMachineFlow(machineId, resumeData) {
    try {
      const response = await updateStopResume(machineId, resumeData);

      dispatch({
        type: 'REPLACE_MACHINE',
        payload: normalizeMachineFromApi(response),
      });

      showFeedback('success', 'Máquina retomada com sucesso.');
    } catch (error) {
      showFeedback('error', error.message || 'Erro ao retomar máquina.');
      throw error;
    }
  }

  async function completeNextTestFlow(machineId, testValue) {
    try {
      const machine = machines.find((m) => m.id === machineId);
      if (!machine) {
        showFeedback('error', 'Máquina não encontrada.');
        return;
      }

      const currentBlock = machine.blocks?.[machine.blocks.length - 1];

      if (!currentBlock || currentBlock.endTime !== null) {
        showFeedback('warning', 'A máquina está parada.');
        return;
      }

      const nextPendingTest = currentBlock.tests?.find((test) => !test.done);

      const rawTestTime =
        typeof testValue === 'string'
          ? testValue
          : testValue?.time ||
            testValue?.testTime ||
            nextPendingTest?.time ||
            '';

      const formattedTestTime = formatTimeInput(rawTestTime);

      if (!formattedTestTime) {
        showFeedback('error', 'Horário de teste inválido.');
        return;
      }

      const response = await insertTest(machineId, {
        testTime: formattedTestTime,
      });

      dispatch({
        type: 'REPLACE_MACHINE',
        payload: normalizeMachineFromApi(response),
      });

      showFeedback('success', 'Teste registrado com sucesso.');
    } catch (error) {
      showFeedback('error', error.message || 'Erro ao registrar teste.');
      throw error;
    }
  }

  useEffect(() => {
    async function loadMachines() {
      try {
        const data = await fetchMachines();

        dispatch({
          type: 'SET_MACHINES',
          payload: data.map(normalizeMachineFromApi),
        });
      } catch (error) {
        console.error('Erro ao buscar máquinas:', error);
        showFeedback('error', error.message || 'Erro ao buscar máquinas.');
      }
    }

    loadMachines();
  }, []);

  async function handleAddMachine(machineData) {
    try {
      const {
        errors: newErrors,
        normalizedCode,
        normalizedFirstTest,
      } = validateMachineForm(machineData);

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors({});
      setFeedback(null);

      const data = await insertMachine({
        code: normalizedCode,
        material: machineData.material.trim(),
        frequency: machineData.frequency,
        firstTest: normalizedFirstTest,
        shift: machineData.shift,
      });

      dispatch({
        type: 'ADD_MACHINE',
        payload: normalizeMachineFromApi(data),
      });

      resetMachineForm();
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

  async function confirmDeleteMachine() {
    try {
      await deleteMachineRequest(deleteModal.machineId);

      dispatch({
        type: 'DELETE_MACHINE',
        payload: deleteModal.machineId,
      });

      setDeleteModal({ open: false, machineId: null });
      showFeedback('success', 'Máquina excluída com sucesso.');
    } catch (error) {
      showFeedback('error', error.message || 'Erro ao excluir máquina.');
    }
  }

  async function handleStopMachine(machineId, stopTime, reason) {
    const machine = machines.find((m) => m.id === machineId);
    if (!machine) return;

    const lastBlock = machine.blocks?.[machine.blocks.length - 1];

    if (!lastBlock) {
      showFeedback('error', 'Bloco atual da máquina não encontrado.');
      return;
    }

    if (lastBlock.endTime !== null) {
      showFeedback('warning', 'A máquina já está parada.');
      return;
    }

    const formattedStopTime = formatTimeInput(stopTime);
    if (!formattedStopTime) {
      showFeedback('error', 'Horário de parada inválido.');
      return;
    }

    await stopMachineFlow(machineId, {
      stopTime: formattedStopTime,
      reason,
    });
  }

  function confirmStopMachine(time, reason) {
    handleStopMachine(stopModal.machineId, time, reason);

    setStopModal({
      open: false,
      machineId: null,
    });
  }

  async function handleResumeMachine(machineId, resumeTime) {
    const machine = machines.find((m) => m.id === machineId);
    if (!machine) return;

    const lastBlock = machine.blocks?.[machine.blocks.length - 1];

    if (!lastBlock) {
      showFeedback('error', 'Bloco atual da máquina não encontrado.');
      return;
    }

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
      await resumeMachineFlow(machineId, {
        resumeTime: formattedResumeTime,
      });
    } catch (error) {
      if (error.message === 'Não há mais testes restantes para este turno.') {
        showFeedback('warning', error.message);
      }
    }
  }

  function confirmResumeMachine(time) {
    handleResumeMachine(resumeModal.machineId, time);

    setResumeModal({
      open: false,
      machineId: null,
    });
  }

  async function handleUpdateMachine(machineId, updates) {
    const machine = machines.find((m) => m.id === machineId);
    if (!machine) return;

    if (typeof updates.frequency === 'number' && updates.frequency < 0.5) {
      showFeedback('error', 'A frequência mínima é 0.5 (30 minutos).');
      return;
    }

    try {
      const response = await updateMachineRequest(machineId, updates);

      dispatch({
        type: 'REPLACE_MACHINE',
        payload: normalizeMachineFromApi(response),
      });

      showFeedback('success', 'Máquina atualizada com sucesso.');
    } catch (error) {
      showFeedback('error', error.message || 'Erro ao atualizar máquina.');
    }
  }

  async function startNewShiftFlow(currentShiftValue) {
    if (!currentShiftValue) {
      throw new Error('Turma inválida para iniciar turno.');
    }

    const currentShift = await getActiveShiftSession();

    if (currentShift?.id) {
      await deactivateShiftSession(currentShift.id);
    }

    return startNewShiftSession(currentShiftValue);
  }

  const { runningMachines, stoppedMachines, lateTests, completedTests } =
    getDashboardStats(machines);

  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const filteredMachines = filterMachines(machines, statusFilter);

  return {
    filteredMachines,
    runningMachines,
    stoppedMachines,
    lateTests,
    completedTests,
    statusFilter,
    setStatusFilter,
    code,
    setCode,
    material,
    setMaterial,
    frequency,
    setFrequency,
    firstTest,
    setFirstTest,
    shift,
    setShift,
    errors,
    feedback,
    setFeedback,
    handleAddMachine,
    handleCompleteNextTest: completeNextTestFlow,
    handleUpdateMachine,
    handleDeleteMachine,
    stopModal,
    setStopModal,
    resumeModal,
    setResumeModal,
    deleteModal,
    setDeleteModal,
    confirmDeleteMachine,
    newShiftModal,
    setNewShiftModal,
    handleStartNewShift,
    confirmStopMachine,
    confirmResumeMachine,
    today,
  };
}
