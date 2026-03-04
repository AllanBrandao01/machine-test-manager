export default function MachineCard({
  machine,
  convertToMinutes,
  onStop,
  onResume,
}) {
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
              const testMinutes = convertToMinutes(testTime);
              const now = new Date();
              const nowMinutes = now.getHours() * 60 + now.getMinutes();
              const isPast = testMinutes < nowMinutes;

              return (
                <li key={i} style={{ color: isPast ? '#999' : '#000' }}>
                  {testTime}
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
        <button onClick={() => onStop(machine.id)}>Parar Máquina</button>

        <button
          onClick={() => onResume(machine.id)}
          style={{ marginLeft: '10px' }}
        >
          Retomar Máquina
        </button>
      </div>
    </div>
  );
}
