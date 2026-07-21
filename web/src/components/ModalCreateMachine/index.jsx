import MachineForm from '../../features/machines/components/MachineForm';
import { Overlay } from './styles';

function ModalCreateMachine({ isOpen, onClose, ...formProps }) {
  if (!isOpen) return null;

  return (
    <Overlay>
      <MachineForm {...formProps} onClose={onClose} />
    </Overlay>
  );
}

export default ModalCreateMachine;
