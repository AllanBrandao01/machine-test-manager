import { formatTimeInput } from '../../utils/time';
import FormField from '../FormField';
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
  errors,
  onCreate,
}) {
  return (
    <div className={styles.formCard}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Cadastro de máquina</h2>
          <p className={styles.subtitle}>
            Informe os dados da máquina para gerar o cronograma de testes do
            turno.
          </p>
        </div>
      </div>

      <div className={styles.formGrid}>
        {/* MÁQUINA */}
        <FormField label="Máquina" htmlFor="machine-code" error={errors?.code}>
          <input
            id="machine-code"
            className={styles.input}
            placeholder="Ex: JAC1"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={() => setCode(code.trim().toUpperCase())}
          />
        </FormField>

        {/* MATERIAL */}
        <FormField
          label="Material"
          htmlFor="machine-material"
          error={errors?.material}
        >
          <input
            id="machine-material"
            className={styles.input}
            placeholder="Ex: T1B98BR24"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            onBlur={() => {
              const value = material.trim().toUpperCase();
              setMaterial(value);
            }}
          />
        </FormField>

        {/* FREQUÊNCIA */}
        <FormField label="Frequência (horas)" htmlFor="machine-frequency">
          <input
            id="machine-frequency"
            className={styles.input}
            type="number"
            placeholder="Ex: 2"
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
            min={0.5}
            step={0.5}
          />
        </FormField>

        {/* PRIMEIRO TESTE */}
        <FormField
          label="Primeiro teste"
          htmlFor="machine-first-test"
          error={errors?.firstTest}
        >
          <input
            id="machine-first-test"
            className={styles.input}
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
          />
        </FormField>

        {/* TURMA */}
        <FormField label="Turma" htmlFor="machine-shift">
          <select
            id="machine-shift"
            className={styles.select}
            value={shift}
            onChange={(e) => setShift(e.target.value)}
          >
            <option value="A">Turma A</option>
            <option value="B">Turma B</option>
            <option value="C">Turma C</option>
            <option value="D">Turma D</option>
          </select>
        </FormField>
      </div>

      <div className={styles.actions}>
        <button className={styles.primaryButton} onClick={onCreate}>
          Criar máquina
        </button>
      </div>
    </div>
  );
}

export default MachineForm;
