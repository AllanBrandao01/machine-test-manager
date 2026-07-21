import { useEffect, useReducer, useRef, useState } from 'react';
import { formatTimeInput } from '../../../utils/time';
import { filterMachines } from '../utils/filters';
import { getDashboardStats } from '../utils/dashboard';
import machinesReducer from '../reducer/machinesReducer';
import { fetchMachines } from '../../../services/machinesDataService';
import {
  insertMachine,
  insertStop,
  updateStopResume,
  insertTest,
  undoMachineTest,
  getActiveShiftSession,
  startNewShiftSession,
  updateMachineRequest,
  deleteMachineRequest,
} from '../../../services/machinesDataService';

const UNDO_TEST_WINDOW_MS = 6000;

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

function isTimeWithinShift(time, shift) {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  const isDayShift = shift === 'A' || shift === 'C';

  if (isDayShift) {
    return totalMinutes >= 360 && totalMinutes <= 1079;
  }

  return totalMinutes >= 1080 || totalMinutes <= 359;
}

export function useMachinesController() {
  const [code, setCode] = useState('');
  const [material, setMaterial] = useState('');
  const [frequency, setFrequency] = useState(2);
  const [firstTest, setFirstTest] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeShift, setActiveShift] = useState(null);
  const [errors, setErrors] = useState({});
  const [stopModal, setStopModal] = useState({
    open: false,
    machineId: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    machineId: null,
  });
  const [feedback, setFeedback] = useState({
    type: '',
    message: '',
  });
  const [machines, dispatch] = useReducer(machinesReducer, []);
  const [resumeModal, setResumeModal] = useState({
    open: false,
    machineId: null,
  });
  const [newShiftModal, setNewShiftModal] = useState(false);
  const [createMachineModal, setCreateMachineModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [undoTest, setUndoTest] = useState(null);
  const feedbackTimerRef = useRef(null);
  const undoTestTimerRef = useRef(null);

  function clearFeedback() {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    setFeedback({ type: '', message: '' });
  }

  function showFeedback(type, message) {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedback({ type, message });
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback({ type: '', message: '' });
      feedbackTimerRef.current = null;
    }, 3000);
  }

  function clearUndoTest() {
    if (undoTestTimerRef.current) {
      clearTimeout(undoTestTimerRef.current);
      undoTestTimerRef.current = null;
    }
    setUndoTest(null);
  }

  function resetMachineForm() {
    setCode('');
    setMaterial('');
    setFrequency(2);
    setFirstTest('');
    setErrors({});
  }

  function closeCreateMachineModal() {
    resetMachineForm();
    setCreateMachineModal(false);
  }

  function validateMachineForm(machineData, shift) {
    const newErrors = {};

    if (!machineData.code?.trim()) {
      newErrors.code = 'Informe o nome da máquina.';
    }

    if (!machineData.material?.trim()) {
      newErrors.material = 'Informe o nome do material.';
    }

    if (
      typeof machineData.frequency !== 'number' ||
      Number.isNaN(machineData.frequency) ||
      machineData.frequency < 0.5
    ) {
      newErrors.frequency = 'A frequência mínima é 0.5 (30 minutos).';
    }

    const normalizedFirstTest = formatTimeInput(machineData.firstTest);

    if (!normalizedFirstTest) {
      newErrors.firstTest = 'Horário do primeiro teste inválido.';
    } else if (!isTimeWithinShift(normalizedFirstTest, shift)) {
      newErrors.firstTest =
        'Horário do primeiro teste não pertence ao turno selecionado.';
    }

    const normalizedCode = machineData.code?.trim().toUpperCase() ?? '';

    return {
      errors: newErrors,
      normalizedCode,
      normalizedFirstTest,
    };
  }

  async function handleStartNewShift(selectedShift) {
    if (!selectedShift) {
      showFeedback(
        'error',
        'Selecione o turno antes de iniciar um novo turno.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await startNewShiftSession(selectedShift);

      dispatch({ type: 'SET_MACHINES', payload: [] });
      resetMachineForm();
      clearUndoTest();
      setActiveShift(session?.shift ?? selectedShift);
      showFeedback('success', 'Novo turno iniciado com sucesso.');
    } catch (error) {
      console.error(error);
      showFeedback('error', error.message || 'Erro ao iniciar novo turno.');
    } finally {
      setIsSubmitting(false);
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
        : testValue?.time || testValue?.testTime || nextPendingTest?.time || '';

    const formattedTestTime = formatTimeInput(rawTestTime);

    if (!formattedTestTime) {
      showFeedback('error', 'Horário de teste inválido.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await insertTest(machineId, {
        testTime: formattedTestTime,
      });

      dispatch({
        type: 'REPLACE_MACHINE',
        payload: normalizeMachineFromApi(response),
      });

      const insertedTest = [...(response.tests || [])].sort(
        (a, b) => b.id - a.id,
      )[0];

      clearUndoTest();

      if (insertedTest) {
        setUndoTest({
          machineId,
          testId: insertedTest.id,
          testTime: formattedTestTime,
        });

        undoTestTimerRef.current = setTimeout(() => {
          setUndoTest(null);
          undoTestTimerRef.current = null;
        }, UNDO_TEST_WINDOW_MS);
      }
    } catch (error) {
      showFeedback('error', error.message || 'Erro ao registrar teste.');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUndoTest() {
    if (!undoTest) return;

    const { machineId, testId } = undoTest;
    clearUndoTest();

    try {
      const response = await undoMachineTest(machineId, testId);

      dispatch({
        type: 'REPLACE_MACHINE',
        payload: normalizeMachineFromApi(response),
      });

      showFeedback('success', 'Teste desfeito.');
    } catch (error) {
      showFeedback('error', error.message || 'Erro ao desfazer teste.');
    }
  }

  useEffect(() => {
    async function loadMachines() {
      try {
        const [data, activeSession] = await Promise.all([
          fetchMachines(),
          getActiveShiftSession(),
        ]);

        dispatch({
          type: 'SET_MACHINES',
          payload: data.map(normalizeMachineFromApi),
        });
        setActiveShift(activeSession?.shift ?? null);
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
      } = validateMachineForm(machineData, activeShift);

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors({});
      clearFeedback();
      setIsSubmitting(true);

      const data = await insertMachine({
        code: normalizedCode,
        material: machineData.material.trim(),
        frequency: machineData.frequency,
        firstTest: normalizedFirstTest,
      });

      dispatch({
        type: 'ADD_MACHINE',
        payload: normalizeMachineFromApi(data),
      });

      resetMachineForm();
      setCreateMachineModal(false);
      showFeedback('success', 'Máquina criada com sucesso.');
    } catch (error) {
      showFeedback('error', error.message || 'Erro ao criar máquina.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDeleteMachine(machineId) {
    setDeleteModal({
      open: true,
      machineId,
    });
  }

  async function confirmDeleteMachine() {
    setIsSubmitting(true);

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
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStopMachine(machineId, stopTime, reason) {
    const machine = machines.find((m) => m.id === machineId);
    if (!machine) {
      showFeedback('error', 'Máquina não encontrada.');
      return;
    }

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
    if (!machine) {
      showFeedback('error', 'Máquina não encontrada.');
      return;
    }

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

    if (!machine) {
      showFeedback('error', 'Máquina não encontrada.');
      return false;
    }

    if (typeof updates.frequency === 'number' && updates.frequency < 0.5) {
      showFeedback('error', 'A frequência mínima é 0.5 (30 minutos).');
      return false;
    }

    if (updates.firstTest) {
      const normalizedFirstTest = formatTimeInput(updates.firstTest);

      if (!normalizedFirstTest) {
        showFeedback('error', 'Horário do primeiro teste inválido.');
        return false;
      }

      if (!isTimeWithinShift(normalizedFirstTest, machine.shift)) {
        showFeedback(
          'error',
          'Horário do primeiro teste não pertence ao turno selecionado.',
        );
        return false;
      }

      updates = {
        ...updates,
        firstTest: normalizedFirstTest,
      };
    }

    if (updates.code !== undefined) {
      updates = {
        ...updates,
        code: updates.code.trim().toUpperCase(),
      };
    }

    if (updates.material !== undefined) {
      updates = {
        ...updates,
        material: updates.material.trim(),
      };
    }

    setIsSubmitting(true);

    try {
      const response = await updateMachineRequest(machineId, updates);

      dispatch({
        type: 'REPLACE_MACHINE',
        payload: normalizeMachineFromApi(response),
      });

      showFeedback('success', 'Máquina atualizada com sucesso.');
      return true;
    } catch (error) {
      showFeedback('error', error.message || 'Erro ao atualizar máquina.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
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
    activeShift,
    errors,
    feedback,
    clearFeedback,
    handleAddMachine,
    handleCompleteNextTest: completeNextTestFlow,
    undoTest,
    handleUndoTest,
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
    createMachineModal,
    setCreateMachineModal,
    closeCreateMachineModal,
    isSubmitting,
    confirmStopMachine,
    confirmResumeMachine,
    today,
  };
}
