import { useState } from 'react';
import styles from './index.module.css';

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
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>Retomar Máquina</h3>

        <div className={styles.field}>
          <label htmlFor="resume-time">Horário de retorno</label>
          <input
            id="resume-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
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

export default ModalResumeMachine;
