import { useState } from 'react';
import FormField from '../FormField';
import { Select } from '../ui/Select';
import {
  Overlay,
  ModalContainer,
  Title,
  Actions,
  CancelButton,
  ConfirmButton,
  WarningBox,
} from './styles';

function ModalStartShift({ isOpen, onClose, onConfirm, runningMachinesCount = 0 }) {
  const [shift, setShift] = useState('A');
  const [step, setStep] = useState('select');

  if (!isOpen) return null;

  function handleClose() {
    setShift('A');
    setStep('select');
    onClose();
  }

  function handleConfirmClick() {
    if (step === 'select' && runningMachinesCount > 0) {
      setStep('warn');
      return;
    }

    onConfirm(shift);
    setShift('A');
    setStep('select');
  }

  return (
    <Overlay>
      <ModalContainer>
        <Title>Iniciar novo turno</Title>

        {step === 'warn' ? (
          <>
            <WarningBox>
              Existem {runningMachinesCount}{' '}
              {runningMachinesCount === 1
                ? 'máquina rodando'
                : 'máquinas rodando'}{' '}
              no turno atual. Elas deixarão de aparecer na tela ao iniciar um
              novo turno. Deseja continuar mesmo assim?
            </WarningBox>

            <Actions>
              <CancelButton onClick={() => setStep('select')}>
                Voltar
              </CancelButton>

              <ConfirmButton onClick={handleConfirmClick}>
                Sim, iniciar mesmo assim
              </ConfirmButton>
            </Actions>
          </>
        ) : (
          <>
            <FormField label="Turno" htmlFor="new-shift">
              <Select
                id="new-shift"
                value={shift}
                onChange={(e) => setShift(e.target.value)}
              >
                <option value="A">Turno A</option>
                <option value="B">Turno B</option>
                <option value="C">Turno C</option>
                <option value="D">Turno D</option>
              </Select>
            </FormField>

            <Actions>
              <CancelButton onClick={handleClose}>Cancelar</CancelButton>

              <ConfirmButton onClick={handleConfirmClick}>
                Confirmar
              </ConfirmButton>
            </Actions>
          </>
        )}
      </ModalContainer>
    </Overlay>
  );
}

export default ModalStartShift;
