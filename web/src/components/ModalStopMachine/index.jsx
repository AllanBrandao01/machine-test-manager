import { useState } from 'react';
import FormField from '../FormField';
import { Input } from '../ui/Input';
import {
  Overlay,
  ModalContainer,
  Title,
  Actions,
  CancelButton,
  ConfirmButton,
} from './styles';

function ModalStopMachine({ isOpen, onClose, onConfirm }) {
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  function handleClose() {
    setTime('');
    setReason('');
    onClose();
  }

  function handleConfirm() {
    onConfirm(time, reason);
    setTime('');
    setReason('');
  }

  return (
    <Overlay>
      <ModalContainer>
        <Title>Parar Máquina</Title>

        <FormField label="Horário da parada" htmlFor="stop-time">
          <Input
            id="stop-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </FormField>

        <FormField label="Motivo" htmlFor="stop-reason">
          <Input
            id="stop-reason"
            type="text"
            placeholder="Ex: Troca de material"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </FormField>

        <Actions>
          <CancelButton onClick={handleClose}>Cancelar</CancelButton>

          <ConfirmButton onClick={handleConfirm}>Confirmar</ConfirmButton>
        </Actions>
      </ModalContainer>
    </Overlay>
  );
}

export default ModalStopMachine;
