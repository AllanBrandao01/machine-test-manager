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
} from '../../../services/machinesDataService';

export function useMachinesController() {
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

  function resetMachineForm() {
    setCode('');
    setMaterial('');
    setFrequency(2);
    setFirstTest('06:00');
    setShift('A');
    setErrors({});
  }

  function validateMachineForm(machineData, currentMachines) {
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

    const alreadyExists = currentMachines.some(
      (m) => (m.code || '').trim().toUpperCase() === normalizedCode,
    );

    if (alreadyExists) {
      newErrors.code = 'Código da máquina já existe.';
    }

    return {
      errors: newErrors,
      normalizedCode,
      normalizedFirstTest,
    };
  }

  async function startNewShiftFlow(currentShiftValue) {
    const currentShift = await getActiveShiftSession();

    if (currentShift) {
      await deactivateShiftSession(currentShift.id);
    }

    await startNewShiftSession(currentShiftValue);
  }

  async function stopMachineFlow(machineId, formattedStopTime, reason) {
    await insertStop(machineId, formattedStopTime, reason.trim());

    return {
      machineId,
      stopTime: formattedStopTime,
      reason,
    };
  }

  async function resumeMachineFlow(machineId, formattedResumeTime) {
    const response = await updateStopResume(machineId, formattedResumeTime);
    const newBlock = response.newBlock;

    if (!newBlock?.tests?.length) {
      throw new Error('Não há mais testes restantes para este turno.');
    }

    return newBlock;
  }

  async function completeNextTestFlow(machineId, testTime) {
    await insertTest(machineId, testTime);

    return {
      machineId,
      time: testTime,
    };
  }

  useEffect(() => {
    async function loadMachines() {
      try {
        const data = await fetchMachines();

        dispatch({
          type: 'SET_MACHINES',
          payload: data,
        });
      } catch (error) {
        console.error('Erro ao buscar máquinas:', error);
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
      } = validateMachineForm(machineData, machines);

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
        payload: data,
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

    try {
      const payload = await stopMachineFlow(
        machineId,
        formattedStopTime,
        reason,
      );

      dispatch({
        type: 'STOP_MACHINE',
        payload,
      });

      showFeedback('success', 'Máquina parada com sucesso.');
    } catch (error) {
      showFeedback('error', error.message || 'Erro ao parar máquina.');
    }
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
      const newBlock = await resumeMachineFlow(machineId, formattedResumeTime);

      dispatch({
        type: 'RESUME_MACHINE',
        payload: { machineId, newBlock },
      });

      showFeedback('success', 'Máquina retomada com sucesso.');
    } catch (error) {
      if (error.message === 'Não há mais testes restantes para este turno.') {
        showFeedback('warning', error.message);
        return;
      }

      showFeedback('error', error.message || 'Erro ao retomar máquina.');
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

    if (typeof updates.frequency === 'number' && updates.frequency <= 0) {
      showFeedback('error', 'A frequência deve ser maior que 0.');
      return;
    }

    try {
      const response = await updateMachineRequest(machineId, updates);

      const finalUpdates = response.rebuiltBlock
        ? {
            ...updates,
            blocks: [response.rebuiltBlock],
            frequency: response.frequency,
            firstTest: response.firstTest,
            shift: response.shift,
            code: response.code,
            material: response.material,
          }
        : updates;

      dispatch({
        type: 'UPDATE_MACHINE',
        payload: {
          machineId,
          updates: finalUpdates,
        },
      });

      showFeedback('success', 'Máquina atualizada com sucesso.');
    } catch (error) {
      showFeedback('error', error.message || 'Erro ao atualizar máquina.');
    }
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

    try {
      await completeNextTestFlow(machineId, nextPending.time);

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
    } catch (error) {
      showFeedback('error', error.message || 'Erro ao concluir teste.');
    }
  }

  async function handleStartNewShift() {
    try {
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
    handleCompleteNextTest,
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
