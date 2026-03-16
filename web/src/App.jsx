import Home from './pages/Home';
import { useMachinesController } from './features/machines/hooks/useMachinesController';

function App() {
  const {
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
  } = useMachinesController();

  return (
    <Home
      filteredMachines={filteredMachines}
      runningMachines={runningMachines}
      stoppedMachines={stoppedMachines}
      lateTests={lateTests}
      completedTests={completedTests}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
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
      feedback={feedback}
      setFeedback={setFeedback}
      handleAddMachine={handleAddMachine}
      handleCompleteNextTest={handleCompleteNextTest}
      handleUpdateMachine={handleUpdateMachine}
      handleDeleteMachine={handleDeleteMachine}
      stopModal={stopModal}
      setStopModal={setStopModal}
      resumeModal={resumeModal}
      setResumeModal={setResumeModal}
      deleteModal={deleteModal}
      setDeleteModal={setDeleteModal}
      confirmDeleteMachine={confirmDeleteMachine}
      newShiftModal={newShiftModal}
      setNewShiftModal={setNewShiftModal}
      handleStartNewShift={handleStartNewShift}
      confirmStopMachine={confirmStopMachine}
      confirmResumeMachine={confirmResumeMachine}
      today={today}
    />
  );
}

export default App;
