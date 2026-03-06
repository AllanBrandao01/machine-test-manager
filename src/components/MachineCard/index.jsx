import { useState } from 'react';
import styles from './index.module.css';

function MachineCard({
  machine,
  convertToMinutes,
  onStop,
  onResume,
  onUpdate,
  onCompleteNext,
}) {
  // DETECTAR TURNO NOTURNO
  const isNightShift = machine.shift === 'B' || machine.shift === 'D';

  const lastBlock = machine.blocks?.[machine.blocks.length - 1];
  const isRunning = lastBlock?.endTime === null;

  const currentBlock = machine.blocks?.[machine.blocks.length - 1];

  const [isEditing, setIsEditing] = useState(false);
  const [editMaterial, setEditMaterial] = useState(machine.material || '');
  const [editFrequency, setEditFrequency] = useState(machine.frequency || 2);
  const nextTestTime = currentBlock?.tests?.find((t) => !t.done)?.time ?? null;

  function toShiftMinutes(timeString) {
    let mins = convertToMinutes(timeString);

    if (isNightShift && mins < 18 * 60) mins += 1440;

    return mins;
  }

  function nowShiftMinutes() {
    const now = new Date();
    let mins = now.getHours() * 60 + now.getMinutes();

    if (isNightShift && mins < 18 * 60) mins += 1440;

    return mins;
  }

  const nowMins = nowShiftMinutes();

  function startEdit() {
    setEditMaterial(machine.material || '');
    setEditFrequency(machine.frequency || 2);
    setIsEditing(true);
  }

  const hasLateTest =
    currentBlock?.tests?.some((t) => {
      const tMins = toShiftMinutes(t.time);
      return tMins < nowMins && !t.done;
    }) ?? false;

  return (
    <div
      style={{
        border: '1px solid #ccc',
        marginBottom: '20px',
        padding: '10px',
      }}
    >
      <h3>{machine.code}</h3>
      <div style={{ marginBottom: '10px' }}>
        <strong>Status: </strong>
        <span style={{ color: isRunning ? 'green' : 'red' }}>
          {isRunning ? '🟢 Rodando' : '🔴 Parada'}
        </span>
      </div>
      <p>Turma: {machine.shift}</p>

      {isEditing ? (
        <div style={{ marginBottom: '10px' }}>
          <div>
            <label>
              Material:{' '}
              <input
                value={editMaterial}
                onChange={(e) => setEditMaterial(e.target.value)}
              />
            </label>
          </div>

          <div style={{ marginTop: '6px' }}>
            <label>
              Frequência (horas):{' '}
              <input
                type="number"
                value={editFrequency}
                onChange={(e) => setEditFrequency(Number(e.target.value))}
                min={0.5}
                step={0.5}
              />
            </label>
          </div>

          <div style={{ marginTop: '10px' }}>
            <button
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
              onClick={() => setIsEditing(false)}
              style={{ marginLeft: '10px' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '10px' }}>
          <p>Material: {machine.material}</p>
          <p>Frequência: {machine.frequency}h</p>

          <button onClick={startEdit}>Editar</button>
        </div>
      )}

      {machine.blocks?.map((block, index) => (
        <div key={index} style={{ marginTop: '10px' }}>
          <strong>Bloco {index + 1}</strong>

          <ul>
            {block.tests?.map((test, i) => {
              const testMinutes = toShiftMinutes(test.time);
              const isPast = testMinutes < nowMins;

              const isNext = test.time === nextTestTime;
              const isLate = isPast && !test.done;

              return (
                <li
                  key={i}
                  style={{
                    color: test.done ? '#999' : '#000',
                    fontWeight: isNext ? '700' : '400',
                    textDecoration: test.done ? 'line-through' : 'none',
                  }}
                >
                  {test.time}
                  {isNext && !test.done ? ' ← Próximo' : ''}
                  {isLate ? ' ⚠ Atrasado' : ''}
                </li>
              );
            })}
          </ul>

          {block.endTime && (
            <p style={{ color: 'red' }}>⛔ Parou às {block.endTime}</p>
          )}
        </div>
      ))}

      {machine.stops?.length > 0 && (
        <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#555' }}>
          <strong>Histórico de Paradas:</strong>
          <ul>
            {machine.stops.map((stop, idx) => (
              <li key={idx}>
                Parou às {stop.stoppedAt} - Motivo: {stop.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: '10px' }}>
        <button disabled={!isRunning} onClick={() => onStop(machine.id)}>
          Parar Máquina
        </button>

        <button
          disabled={isRunning}
          onClick={() => onResume(machine.id)}
          style={{ marginLeft: '10px' }}
        >
          Retomar Máquina
        </button>

        <button
          disabled={!isRunning}
          onClick={() => onCompleteNext(machine.id)}
          style={{
            marginLeft: '10px',
            fontWeight: hasLateTest ? '700' : '400',
            textDecoration: hasLateTest ? 'underline' : 'none',
          }}
        >
          Concluir próximo teste {hasLateTest ? '⚠' : ''}
        </button>
      </div>
    </div>
  );
}

export default MachineCard;
