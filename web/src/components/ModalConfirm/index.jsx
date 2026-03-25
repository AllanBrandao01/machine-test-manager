import {
  Overlay,
  ModalContainer,
  Title,
  Message,
  Actions,
  CancelButton,
  ConfirmButton,
} from './styles';

function ModalConfirm({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <Overlay>
      <ModalContainer>
        <Title>{title}</Title>

        <Message>{message}</Message>

        <Actions>
          <CancelButton onClick={onCancel}>Cancelar</CancelButton>

          <ConfirmButton onClick={onConfirm}>Confirmar</ConfirmButton>
        </Actions>
      </ModalContainer>
    </Overlay>
  );
}

export default ModalConfirm;
