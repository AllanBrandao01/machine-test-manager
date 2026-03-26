import { formatTimeInput } from '../../../../utils/time';
import FormField from '../../../../components/FormField';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Button } from '../../../../components/ui/Button';
import { FormCard, Header, Title, Subtitle, FormGrid, Actions } from './styles';

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
    <FormCard>
      <Header>
        <div>
          <Title>Cadastro de máquina</Title>
          <Subtitle>
            Informe os dados da máquina para gerar o cronograma de testes do
            turno.
          </Subtitle>
        </div>
      </Header>

      <FormGrid>
        <FormField label="Máquina" htmlFor="machine-code" error={errors?.code}>
          <Input
            id="machine-code"
            placeholder="Ex: JAC1"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={() => setCode(code.trim().toUpperCase())}
          />
        </FormField>

        <FormField
          label="Material"
          htmlFor="machine-material"
          error={errors?.material}
        >
          <Input
            id="machine-material"
            placeholder="Ex: T1B98BR24"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            onBlur={() => {
              const value = material.trim().toUpperCase();
              setMaterial(value);
            }}
          />
        </FormField>

        <FormField label="Frequência (horas)" htmlFor="machine-frequency">
          <Input
            id="machine-frequency"
            type="number"
            placeholder="Ex: 2"
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
            min={0.5}
            step={0.5}
          />
        </FormField>

        <FormField
          label="Primeiro teste"
          htmlFor="machine-first-test"
          error={errors?.firstTest}
        >
          <Input
            id="machine-first-test"
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

        <FormField label="Turma" htmlFor="machine-shift">
          <Select
            id="machine-shift"
            value={shift}
            onChange={(e) => setShift(e.target.value)}
          >
            <option value="A">Turma A</option>
            <option value="B">Turma B</option>
            <option value="C">Turma C</option>
            <option value="D">Turma D</option>
          </Select>
        </FormField>
      </FormGrid>

      <Actions>
        <Button onClick={onCreate}>Criar máquina</Button>
      </Actions>
    </FormCard>
  );
}

export default MachineForm;
