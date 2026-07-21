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
} from './styles';

function ModalStartShift({ isOpen, onClose, onConfirm }) {
  const [shift, setShift] = useState('A');

  if (!isOpen) return null;

  function handleClose() {
    setShift('A');
    onClose();
  }

  function handleConfirm() {
    onConfirm(shift);
    setShift('A');
  }

  return (
    <Overlay>
      <ModalContainer>
        <Title>Iniciar novo turno</Title>

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

          <ConfirmButton onClick={handleConfirm}>Confirmar</ConfirmButton>
        </Actions>
      </ModalContainer>
    </Overlay>
  );
}

export default ModalStartShift;
