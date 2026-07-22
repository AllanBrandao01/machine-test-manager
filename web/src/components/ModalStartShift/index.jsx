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
  FieldWithHelp,
  HelpIcon,
  Tooltip,
} from './styles';

function ModalStartShift({
  isOpen,
  onClose,
  onConfirm,
  runningMachinesCount = 0,
  isSubmitting = false,
}) {
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
              <CancelButton
                onClick={() => setStep('select')}
                disabled={isSubmitting}
              >
                Voltar
              </CancelButton>

              <ConfirmButton
                onClick={handleConfirmClick}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Iniciando...' : 'Sim, iniciar mesmo assim'}
              </ConfirmButton>
            </Actions>
          </>
        ) : (
          <>
            <FieldWithHelp>
              <FormField label="Turno" htmlFor="new-shift">
                <Select
                  id="new-shift"
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="A">Turno A</option>
                  <option value="B">Turno B</option>
                  <option value="C">Turno C</option>
                  <option value="D">Turno D</option>
                </Select>
              </FormField>

              <HelpIcon tabIndex={0} aria-label="Ajuda sobre horário de turno">
                ?
                <Tooltip>
                  Turno A/C (diurno): 06:00–18:00 · Turno B/D (noturno):
                  18:00–06:00. Só é possível iniciar um turno dentro do
                  horário correspondente.
                </Tooltip>
              </HelpIcon>
            </FieldWithHelp>

            <Actions>
              <CancelButton onClick={handleClose} disabled={isSubmitting}>
                Cancelar
              </CancelButton>

              <ConfirmButton
                onClick={handleConfirmClick}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Iniciando...' : 'Confirmar'}
              </ConfirmButton>
            </Actions>
          </>
        )}
      </ModalContainer>
    </Overlay>
  );
}

export default ModalStartShift;
