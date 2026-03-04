import { useState } from 'react';

function App() {
  // --- STATES ---
  const [machines, setMachines] = useState([]);
  const [code, setCode] = useState('');
  const [material, setMaterial] = useState('');
  const [frequency, setFrequency] = useState(2);
  const [firstTest, setFirstTest] = useState('06:00');
  const [shift, setShift] = useState('A');

  // --- FUNÇÕES AUXILIARES ---
  function convertToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  function convertToTimeString(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
  }

  function formatTimeInput(input) {
    if (!input.includes(':')) {
      const hours = input.padStart(2, '0');
      return `${hours}:00`;
    }
    return input;
  }

  function getShiftWindow(shift) {
    if (shift === 'A' || shift === 'C') return { startHour: 6, endHour: 18 };
    return { startHour: 18, endHour: 6 };
  }

  function generateSchedule(firstTest, frequency, shift) {
    const { startHour, endHour } = getShiftWindow(shift);

    let shiftStartInMinutes = startHour * 60;
    let shiftEndInMinutes = endHour * 60;
    if (shiftEndInMinutes <= shiftStartInMinutes) shiftEndInMinutes += 1440;

    let currentTimeInMinutes = convertToMinutes(firstTest);
    if (currentTimeInMinutes < shiftStartInMinutes)
      currentTimeInMinutes += 1440;

    if (
      currentTimeInMinutes < shiftStartInMinutes ||
      currentTimeInMinutes > shiftEndInMinutes
    ) {
      throw new Error('First test time is outside the shift window');
    }

    const frequencyInMinutes = frequency * 60;
    const schedule = [];
    while (currentTimeInMinutes <= shiftEndInMinutes) {
      schedule.push(currentTimeInMinutes);
      currentTimeInMinutes += frequencyInMinutes;
    }
    return schedule.map(convertToTimeString);
  }

  // --- FUNÇÃO ADD MACHINE ---
  function handleAddMachine(machineData) {
    try {
      const schedule = generateSchedule(
        machineData.firstTest,
        machineData.frequency,
        machineData.shift,
      );

      const newMachine = {
        id: crypto.randomUUID(),
        code: machineData.code,
        material: machineData.material,
        frequency: machineData.frequency,
        shift: machineData.shift,
        blocks: [
          {
            startTime: machineData.firstTest,
            endTime: null,
            tests: schedule,
          },
        ],
        stops: [],
      };

      setMachines((prev) => [...prev, newMachine]);

      // Limpar inputs
      setCode('');
      setMaterial('');
      setFrequency(2);
      setFirstTest('06:00');
      setShift('A');
    } catch (error) {
      alert(error.message);
    }
  }

  // --- FUNÇÃO STOP MACHINE ---
  function handleStopMachine(machineId, stopTime, reason) {
    const formattedStopTime = formatTimeInput(stopTime);

    setMachines((prevMachines) =>
      prevMachines.map((machine) => {
        if (machine.id !== machineId) return machine;

        const lastBlock = machine.blocks[machine.blocks.length - 1];
        if (lastBlock.endTime !== null) {
          alert('Machine is already stopped');
          return machine;
        }

        // Truncar horários não feitos
        const newTests = lastBlock.tests.filter((testTime) => {
          const testMinutes = convertToMinutes(testTime);
          const stopMinutes = convertToMinutes(formattedStopTime);
          return testMinutes <= stopMinutes;
        });

        const updatedBlocks = [...machine.blocks];
        updatedBlocks[updatedBlocks.length - 1] = {
          ...lastBlock,
          endTime: formattedStopTime,
          tests: newTests,
        };

        return {
          ...machine,
          blocks: updatedBlocks,
          stops: [
            ...machine.stops,
            {
              stoppedAt: formattedStopTime,
              reason,
            },
          ],
        };
      }),
    );
  }

  // --- FUNÇÃO RESUME MACHINE ---
  function handleResumeMachine(machineId, resumeTime) {
    const formattedResumeTime = formatTimeInput(resumeTime);

    setMachines((prevMachines) =>
      prevMachines.map((machine) => {
        if (machine.id !== machineId) return machine;

        const lastBlock = machine.blocks[machine.blocks.length - 1];
        if (lastBlock.endTime === null) {
          alert('Machine is already running');
          return machine;
        }

        try {
          const { startHour, endHour } = getShiftWindow(machine.shift);
          let shiftStartInMinutes = startHour * 60;
          let shiftEndInMinutes = endHour * 60;
          if (shiftEndInMinutes <= shiftStartInMinutes)
            shiftEndInMinutes += 1440;

          let currentTimeInMinutes = convertToMinutes(formattedResumeTime);
          if (currentTimeInMinutes < shiftStartInMinutes)
            currentTimeInMinutes += 1440;

          const frequencyInMinutes = machine.frequency * 60;
          const newSchedule = [];
          while (currentTimeInMinutes <= shiftEndInMinutes) {
            newSchedule.push(currentTimeInMinutes);
            currentTimeInMinutes += frequencyInMinutes;
          }

          const newBlock = {
            startTime: formattedResumeTime,
            endTime: null,
            tests: newSchedule.map(convertToTimeString),
          };

          return {
            ...machine,
            blocks: [...machine.blocks, newBlock],
          };
        } catch (error) {
          alert(error.message);
          return machine;
        }
      }),
    );
  }

  // --- RETURN ---
  return (
    <>
      {/* BOTÃO LIMPAR TELA / NOVO TURNO */}
      <button
        onClick={() => {
          if (
            window.confirm('Deseja limpar todas as máquinas para o novo turno?')
          ) {
            setMachines([]);
            setCode('');
            setMaterial('');
            setFrequency(2);
            setFirstTest('06:00');
            setShift('A');
          }
        }}
        style={{ marginBottom: '20px' }}
      >
        Limpar Tela / Novo Turno
      </button>

      {/* FORMULÁRIO PARA ADICIONAR MÁQUINA */}
      <div
        style={{
          marginBottom: '20px',
          border: '1px solid #ccc',
          padding: '10px',
        }}
      >
        <h2>Adicionar Máquina</h2>

        <input
          placeholder="Código"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ marginRight: '5px' }}
        />

        <input
          placeholder="Material"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          style={{ marginRight: '5px' }}
        />

        <input
          type="number"
          placeholder="Frequência (horas)"
          value={frequency}
          onChange={(e) => setFrequency(Number(e.target.value))}
          style={{ marginRight: '5px', width: '120px' }}
        />

        <input
          type="time"
          value={firstTest}
          onChange={(e) => setFirstTest(e.target.value)}
          style={{ marginRight: '5px' }}
        />

        <select
          value={shift}
          onChange={(e) => setShift(e.target.value)}
          style={{ marginRight: '5px' }}
        >
          <option value="A">Turma A</option>
          <option value="B">Turma B</option>
          <option value="C">Turma C</option>
          <option value="D">Turma D</option>
        </select>

        <button
          onClick={() =>
            handleAddMachine({
              code,
              material,
              frequency,
              firstTest,
              shift,
            })
          }
        >
          Criar
        </button>
      </div>

      {/* LISTA DE MÁQUINAS */}
      {machines?.map((machine) => (
        <div
          key={machine.id}
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

          {/* HISTÓRICO DE PARADAS */}
          {machine.stops?.length > 0 && (
            <div
              style={{ marginTop: '10px', fontSize: '0.9em', color: '#555' }}
            >
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

          {/* BOTÕES PARAR / RETOMAR */}
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={() => {
                const stopTime = prompt('Digite o horário da parada (HH:MM)');
                const reason = prompt('Motivo da parada?');
                if (stopTime && reason) {
                  handleStopMachine(machine.id, stopTime, reason);
                }
              }}
            >
              Parar Máquina
            </button>

            <button
              onClick={() => {
                const resumeTime = prompt(
                  'Digite o horário de retorno (HH:MM)',
                );
                if (resumeTime) {
                  handleResumeMachine(machine.id, resumeTime);
                }
              }}
              style={{ marginLeft: '10px' }}
            >
              Retomar Máquina
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

export default App;
