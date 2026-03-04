export default function MachineCard({
  machine,
  convertToMinutes,
  onStop,
  onResume,
}) {
  // DETECTAR TURNO NOTURNO
  const isNightShift = machine.shift === 'B' || machine.shift === 'D';
  const lastBlock = machine.blocks?.[machine.blocks.length - 1];
  const isRunning = lastBlock?.endTime === null;
  const currentBlock = machine.blocks?.[machine.blocks.length - 1];

  const nowMins = nowShiftMinutes();

  const nextTest =
    currentBlock?.tests
      ?.map((t) => ({ t, mins: toShiftMinutes(t) }))
      .filter((x) => x.mins >= nowMins)
      .sort((a, b) => a.mins - b.mins)[0]?.t ?? null;

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

  return (
    <div
      style={{
        border: '1px solid #ccc',
        marginBottom: '20px',
        padding: '10px',
      }}
    >
      <h3>{machine.code}</h3>
      <p>Turma: {machine.shift}</p>
      <p>Material: {machine.material}</p>

      {machine.blocks?.map((block, index) => (
        <div key={index} style={{ marginTop: '10px' }}>
          <strong>Bloco {index + 1}</strong>

          <ul>
            {block.tests?.map((testTime, i) => {
              const testMinutes = toShiftMinutes(testTime);
              const isPast = testMinutes < nowMins;

              return (
                <li
                  key={i}
                  style={{
                    color: isPast ? '#999' : '#000',
                    fontWeight: testTime === nextTest ? '700' : '400',
                  }}
                >
                  {testTime} {testTime === nextTest ? '← Próximo' : ''}
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
      </div>
    </div>
  );
}
