import { formatTimeInput } from '../utils/time';
import styles from './index.module.css';

function MachineForm({
  code,
  setCode,
  material,
  setMaterial,
  frequency,
  setFrequency,
  firstTest,
  setFirstTest,
  shift,
  setShift,
  onCreate,
}) {
  return (
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
        onBlur={() => setCode(code.trim().toUpperCase())}
        style={{ marginRight: '5px' }}
      />

      <input
        placeholder="Material"
        value={material}
        onChange={(e) => setMaterial(e.target.value)}
        onBlur={() => {
          const value = material.trim().toUpperCase();
          if (!value) {
            alert('Material não pode ficar vazio');
            return;
          }
          setMaterial(value);
        }}
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
        onBlur={() => {
          const normalized = formatTimeInput(firstTest);
          if (!normalized) {
            alert('Horário inválido');
            setFirstTest('06:00');
            return;
          }
          setFirstTest(normalized);
        }}
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

      <button onClick={onCreate}>Criar</button>
    </div>
  );
}

export default MachineForm;
