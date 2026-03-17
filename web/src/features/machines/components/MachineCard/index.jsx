import { useState } from 'react';
import styles from './index.module.css';
import {
  toShiftMinutes,
  getNowShiftMinutes,
  isNowInsideShiftWindow,
} from '../../../../utils/shift';

function MachineCard({
  machine,
  onStop,
  onResume,
  onUpdate,
  onCompleteNext,
  onDelete,
}) {
  const currentBlock = machine.blocks?.[machine.blocks.length - 1];
  const isRunning = currentBlock?.endTime === null;
  const isInsideShiftWindow = isNowInsideShiftWindow(machine.shift);
  const nowMins = isInsideShiftWindow
    ? getNowShiftMinutes(machine.shift)
    : null;

  const [isEditing, setIsEditing] = useState(false);
  const [editMaterial, setEditMaterial] = useState(machine.material || '');
  const [editFrequency, setEditFrequency] = useState(machine.frequency || 2);

  const nextTestTime = currentBlock?.tests?.find((t) => !t.done)?.time ?? null;

  function startEdit() {
    setEditMaterial(machine.material || '');
    setEditFrequency(machine.frequency || 2);
    setIsEditing(true);
  }

  const hasLateTest =
    isRunning &&
    isInsideShiftWindow &&
    (currentBlock?.tests?.some((t) => {
      const tMins = toShiftMinutes(t.time, machine.shift);
      return tMins < nowMins && !t.done;
    }) ??
      false);

  return (
    <div
      className={`${styles.card} ${
        !isRunning
          ? styles.machineStopped
          : hasLateTest
            ? styles.machineAlert
            : styles.machineRunning
      }`}
    >
      <div className={styles.header}>
        <div>
          <h3 className={styles.code}>{machine.code}</h3>
          <p className={styles.shift}>Turma: {machine.shift}</p>
        </div>

        <span
          className={`${styles.statusBadge} ${
            !isRunning
              ? styles.stopped
              : hasLateTest
                ? styles.alert
                : styles.running
          }`}
        >
          {!isRunning ? 'Parada' : hasLateTest ? 'Atrasada' : 'Rodando'}
        </span>
      </div>

      {isEditing ? (
        <div className={styles.editSection}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Material
              <input
                className={styles.input}
                value={editMaterial}
                onChange={(e) => setEditMaterial(e.target.value)}
              />
            </label>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Frequência (horas)
              <input
                className={styles.input}
                type="number"
                value={editFrequency}
                onChange={(e) => setEditFrequency(Number(e.target.value))}
                min={0.5}
                step={0.5}
              />
            </label>
          </div>

          <div className={styles.actionsRow}>
            <button
              className={styles.primaryButton}
              onClick={() => {
                onUpdate(machine.id, {
                  material: editMaterial,
                  frequency: editFrequency,
                });
                setIsEditing(false);
              }}
            >
              Salvar
            </button>

            <button
              className={styles.secondaryButton}
              onClick={() => setIsEditing(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.infoSection}>
          <p className={styles.infoText}>
            <strong>Material:</strong> {machine.material}
          </p>
          <p className={styles.infoText}>
            <strong>Frequência:</strong> {machine.frequency}h
          </p>

          <button className={styles.secondaryButton} onClick={startEdit}>
            Editar
          </button>

          <button
            className={styles.deleteButton}
            onClick={() => onDelete(machine.id)}
          >
            Excluir
          </button>
        </div>
      )}

      <div className={styles.blocksSection}>
        {machine.blocks?.map((block, index) => {
          const blockIsRunning = block.endTime === null;

          return (
            <div key={index} className={styles.block}>
              {index !== 0 && (
                <strong className={styles.blockTitle}>
                  Retorno {block.startTime}
                </strong>
              )}

              <ul className={styles.testList}>
                {block.tests?.map((test, i) => {
                  const testMinutes = toShiftMinutes(test.time, machine.shift);

                  const isPast =
                    isInsideShiftWindow && nowMins !== null
                      ? testMinutes < nowMins
                      : false;

                  const isNext =
                    blockIsRunning &&
                    isRunning &&
                    test.time === nextTestTime &&
                    !test.done;

                  const isLate =
                    blockIsRunning &&
                    isRunning &&
                    isInsideShiftWindow &&
                    isPast &&
                    !test.done;

                  let testClass = styles.testItem;

                  if (test.done) {
                    testClass = `${styles.testItem} ${styles.testDone}`;
                  } else if (isLate) {
                    testClass = `${styles.testItem} ${styles.testLate}`;
                  } else if (isNext) {
                    testClass = `${styles.testItem} ${styles.testNext}`;
                  }

                  return (
                    <li key={i} className={testClass}>
                      <span
                        className={`${styles.testTime} ${
                          test.done ? styles.timeDone : ''
                        }`}
                      >
                        {test.time}
                      </span>

                      <span className={styles.testMeta}>
                        {test.done
                          ? '✓'
                          : isLate
                            ? 'Atrasado'
                            : !blockIsRunning
                              ? 'Não realizado'
                              : isNext
                                ? 'Próximo'
                                : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {block.endTime && (
                <p className={styles.stopText}>Parou às {block.endTime}</p>
              )}
            </div>
          );
        })}
      </div>

      {machine.stops?.length > 0 && (
        <div className={styles.historySection}>
          <strong className={styles.historyTitle}>Histórico de Paradas</strong>
          <ul className={styles.historyList}>
            {machine.stops.map((stop, idx) => (
              <li key={idx} className={styles.historyItem}>
                Parou às {stop.stoppedAt} - Motivo: {stop.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.actionsRow}>
        <button
          className={styles.dangerButton}
          disabled={!isRunning}
          onClick={() => onStop(machine.id)}
        >
          Parar Máquina
        </button>

        <button
          className={styles.secondaryButton}
          disabled={isRunning}
          onClick={() => onResume(machine.id)}
        >
          Retomar Máquina
        </button>

        <button
          className={`${styles.primaryButton} ${
            hasLateTest ? styles.attentionButton : ''
          }`}
          disabled={!isRunning}
          onClick={() => onCompleteNext(machine.id)}
        >
          Concluir próximo teste {hasLateTest ? '⚠' : ''}
        </button>
      </div>
    </div>
  );
}

export default MachineCard;
