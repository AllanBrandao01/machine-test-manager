import { useState } from 'react';
import styles from './index.module.css';
import {
  toShiftMinutes,
  getNowShiftMinutes,
  isNowInsideShiftWindow,
} from '../../../../utils/shift';

function toMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function toAbsoluteMinutes(time, shift) {
  let minutes = toMinutes(time);

  const isNightShift = shift === 'B' || shift === 'D';

  if (isNightShift && minutes <= 360) {
    minutes += 1440;
  }

  return minutes;
}

function getNowAbsoluteMinutes(shift) {
  const now = new Date();
  let minutes = now.getHours() * 60 + now.getMinutes();

  const isNightShift = shift === 'B' || shift === 'D';

  if (isNightShift && minutes <= 360) {
    minutes += 1440;
  }

  return minutes;
}

function getMachineStatus(machine) {
  if (machine.isStopped) return 'stopped';

  const nextTest = machine.nextTestTime;
  if (!nextTest) return 'ok';

  const now = getNowAbsoluteMinutes(machine.shift);
  const expected = toAbsoluteMinutes(nextTest, machine.shift);

  const diff = now - expected;

  if (diff >= 30) return 'late';
  if (diff >= 0) return 'warning';

  return 'ok';
}

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
  const [editCode, setEditCode] = useState(machine.code || '');
  const [editMaterial, setEditMaterial] = useState(machine.material || '');
  const [editFrequency, setEditFrequency] = useState(machine.frequency || 2);
  const [editShift, setEditShift] = useState(machine.shift || 'A');
  const [editFirstTest, setEditFirstTest] = useState(machine.firstTest || '');

  const nextTest = machine.nextTestTime;
  const status = getMachineStatus(machine);

  function startEdit() {
    setEditCode(machine.code || '');
    setEditMaterial(machine.material || '');
    setEditFrequency(machine.frequency || 2);
    setEditShift(machine.shift || 'A');
    setEditFirstTest(machine.firstTest || '');
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

  const canExecuteTest = (() => {
    if (!nextTest) return false;
    if (machine.isStopped) return false;

    const now = getNowAbsoluteMinutes(machine.shift);
    const expected = toAbsoluteMinutes(nextTest, machine.shift);

    return now >= expected;
  })();

  return (
    <div
      className={`${styles.card} ${
        status === 'stopped'
          ? styles.machineStopped
          : status === 'late'
            ? styles.machineAlert
            : status === 'warning'
              ? styles.machineWarning
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
            status === 'stopped'
              ? styles.stopped
              : status === 'late'
                ? styles.alert
                : status === 'warning'
                  ? styles.warning
                  : styles.running
          }`}
        >
          {status === 'stopped'
            ? 'Parada'
            : status === 'late'
              ? 'Atrasada'
              : status === 'warning'
                ? 'Atenção'
                : 'Rodando'}
        </span>
      </div>

      {isEditing ? (
        <div className={styles.editSection}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Código
              <input
                className={styles.input}
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
              />
            </label>
          </div>

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

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Turno
              <select
                className={styles.input}
                value={editShift}
                onChange={(e) => setEditShift(e.target.value)}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </label>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Primeiro teste
              <input
                type="time"
                className={styles.input}
                value={editFirstTest}
                onChange={(e) => setEditFirstTest(e.target.value)}
              />
            </label>
          </div>

          <div className={styles.actionsRow}>
            <button
              className={styles.primaryButton}
              onClick={() => {
                onUpdate(machine.id, {
                  code: editCode,
                  material: editMaterial,
                  frequency: editFrequency,
                  shift: editShift,
                  firstTest: editFirstTest,
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
          <p className={styles.infoText}>
            <strong>Primeiro teste:</strong> {machine.firstTest}
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
                    test.time === machine.nextTestTime &&
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
                Parou às {stop.stopTime} - Motivo: {stop.reason}
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
          disabled={!canExecuteTest}
          onClick={() => onCompleteNext(machine.id)}
        >
          Concluir próximo teste {hasLateTest ? '⚠' : ''}
        </button>
      </div>
    </div>
  );
}

export default MachineCard;
