import { useState } from 'react';
import styled from 'styled-components';
import FormField from '../FormField';
import { Input } from '../ui/Input';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  width: 360px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
`;

const Title = styled.h3`
  margin: 0 0 20px;
  color: #1b6f6a;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const CancelButton = styled.button`
  border: none;
  background: #e8f3f2;
  color: #1b6f6a;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
`;

const ConfirmButton = styled.button`
  border: none;
  background: #1b6f6a;
  color: #ffffff;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
`;

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
