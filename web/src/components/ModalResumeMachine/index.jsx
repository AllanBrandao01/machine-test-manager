import { useState } from 'react';
import FormField from '../FormField';
import { Input } from '../ui/Input';
import { Title, Actions, CancelButton, ConfirmButton } from './styles';

function ModalResumeMachine({ isOpen, onClose, onConfirm }) {
  const [time, setTime] = useState('');

  if (!isOpen) return null;

  function handleClose() {
    setTime('');
    onClose();
  }

  function handleConfirm() {
    onConfirm(time);
    setTime('');
  }

  return (
    <Overlay>
      <ModalContainer>
        <Title>Retomar Máquina</Title>

        <FormField label="Horário do retorno" htmlFor="resume-time">
          <Input
            id="resume-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
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

export default ModalResumeMachine;
