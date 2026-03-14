import { useState } from 'react';
import styles from './index.module.css';

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
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>Parar Máquina</h3>

        <div className={styles.field}>
          <label htmlFor="stop-time">Horário da parada</label>
          <input
            id="stop-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="stop-reason">Motivo</label>
          <input
            id="stop-reason"
            type="text"
            placeholder="Ex: Troca de material"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.cancel} onClick={handleClose}>
            Cancelar
          </button>

          <button className={styles.confirm} onClick={handleConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalStopMachine;
