import {
  Overlay,
  ModalContainer,
  Title,
  Message,
  Actions,
  CancelButton,
  ConfirmButton,
} from './styles';

function ModalConfirm({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isSubmitting = false,
  confirmingLabel = 'Confirmando...',
}) {
  if (!isOpen) return null;

  return (
    <Overlay>
      <ModalContainer>
        <Title>{title}</Title>

        <Message>{message}</Message>

        <Actions>
          <CancelButton onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </CancelButton>

          <ConfirmButton onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? confirmingLabel : 'Confirmar'}
          </ConfirmButton>
        </Actions>
      </ModalContainer>
    </Overlay>
  );
}

export default ModalConfirm;
