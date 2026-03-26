import styled from 'styled-components';

import MachineForm from '../../features/machines/components/MachineForm';
import MachineCard from '../../features/machines/components/MachineCard';
import Filters from '../../features/machines/components/Filters';
import Dashboard from '../../features/machines/components/Dashboard';

import ModalConfirm from '../../components/ModalConfirm';
import ModalStopMachine from '../../components/ModalStopMachine';
import ModalResumeMachine from '../../components/ModalResumeMachine';

const SectionBar = styled.div`
  margin-bottom: 28px;
`;

const ResetButton = styled.button`
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 700;
  background: #e8f3f2;
  color: #1b6f6a;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #d6ebe9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

function Home({
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
  clearFeedback,
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
}) {
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

        <Dashboard
          runningMachines={runningMachines}
          stoppedMachines={stoppedMachines}
          lateTests={lateTests}
          completedTests={completedTests}
        />
      </div>

      <SectionBar>
        <ResetButton onClick={() => setNewShiftModal(true)}>
          Iniciar novo turno
        </ResetButton>
      </SectionBar>

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

export default Home;
