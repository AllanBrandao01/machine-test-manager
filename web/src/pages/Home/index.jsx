import MachineCard from '../../features/machines/components/MachineCard';
import Filters from '../../features/machines/components/Filters';
import Dashboard from '../../features/machines/components/Dashboard';
import ModalConfirm from '../../components/ModalConfirm';
import ModalStopMachine from '../../components/ModalStopMachine';
import ModalResumeMachine from '../../components/ModalResumeMachine';
import ModalStartShift from '../../components/ModalStartShift';
import ModalCreateMachine from '../../components/ModalCreateMachine';
import { useMachinesController } from '../../features/machines/hooks/useMachinesController';
import { SectionBar, PrimaryButton, AccentButton } from './styles';

function Home() {
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
    activeShift,
    errors,
    feedback,
    clearFeedback,
    handleAddMachine,
    handleCompleteNextTest,
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
  } = useMachinesController();
  {
    return (
      <div className="appContainer">
        <div>
          <div className="appHeader">
            <div>
              <h1 className="appTitle">Controle de testes de qualidade</h1>
              <p className="appSubtitle">Machine Test Scheduler</p>
            </div>

            <div className="appInfo">
              <span>Turno atual: {activeShift ?? '—'}</span>
              <span>{today}</span>
            </div>
          </div>

          {feedback.message && (
            <div className={`feedbackMessage feedback-${feedback.type}`}>
              <span>{feedback.message}</span>
              <button
                className="feedbackClose"
                onClick={clearFeedback}
                type="button"
              >
                ×
              </button>
            </div>
          )}

          {undoTest && (
            <div className="feedbackMessage feedback-success">
              <span>Teste das {undoTest.testTime} registrado.</span>
              <button
                className="undoAction"
                onClick={handleUndoTest}
                type="button"
              >
                Desfazer
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

        <SectionBar>
          <PrimaryButton
            disabled={isSubmitting}
            onClick={() => setCreateMachineModal(true)}
          >
            Nova máquina
          </PrimaryButton>

          <AccentButton
            disabled={isSubmitting}
            onClick={() => setNewShiftModal(true)}
          >
            Iniciar novo turno
          </AccentButton>
        </SectionBar>

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
              onStop={(id) =>
                setStopModal({
                  open: true,
                  machineId: id,
                })
              }
              onResume={(id) =>
                setResumeModal({
                  open: true,
                  machineId: id,
                })
              }
              onUpdate={handleUpdateMachine}
              onCompleteNext={handleCompleteNextTest}
              onDelete={handleDeleteMachine}
              isSubmitting={isSubmitting}
            />
          ))}

          <ModalConfirm
            isOpen={deleteModal.open}
            title="Excluir máquina"
            message="Deseja realmente excluir esta máquina?"
            onCancel={() => setDeleteModal({ open: false, machineId: null })}
            onConfirm={confirmDeleteMachine}
            isSubmitting={isSubmitting}
            confirmingLabel="Excluindo..."
          />

          <ModalStopMachine
            isOpen={stopModal.open}
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

          <ModalStartShift
            isOpen={newShiftModal}
            onClose={() => setNewShiftModal(false)}
            onConfirm={handleStartNewShift}
            runningMachinesCount={runningMachines}
            isSubmitting={isSubmitting}
          />

          <ModalCreateMachine
            isOpen={createMachineModal}
            onClose={closeCreateMachineModal}
            code={code}
            setCode={setCode}
            material={material}
            setMaterial={setMaterial}
            frequency={frequency}
            setFrequency={setFrequency}
            firstTest={firstTest}
            setFirstTest={setFirstTest}
            errors={errors}
            isSubmitting={isSubmitting}
            onCreate={() =>
              handleAddMachine({
                code,
                material,
                frequency,
                firstTest,
              })
            }
          />
        </div>
      </div>
    );
  }
}

export default Home;
