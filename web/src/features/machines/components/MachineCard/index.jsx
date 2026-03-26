import { useState } from 'react';
import {
  toShiftMinutes,
  getNowShiftMinutes,
  isNowInsideShiftWindow,
} from '../../../../utils/shift';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import {
  CardContainer,
  Header,
  Title,
  Subtitle,
  StatusBadge,
  InfoSection,
  InfoText,
  EditSection,
  FieldGroup,
  FieldLabel,
  ActionsRow,
  SecondaryButton,
  DeleteButton,
  EditButton,
  DangerButton,
  PrimaryActionButton,
  BlocksSection,
  BlockContainer,
  BlockTitle,
  TestList,
  TestItem,
  TestTime,
  TestMeta,
  StopText,
  HistoryItem,
  HistoryList,
  HistorySection,
  HistoryTitle,
} from './styles';

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
    <CardContainer $status={status}>
      <Header>
        <div>
          <Title>{machine.code}</Title>
          <Subtitle>Turma: {machine.shift}</Subtitle>
        </div>

        <StatusBadge $status={status}>
          {status === 'stopped'
            ? 'Parada'
            : status === 'late'
              ? 'Atrasado'
              : status === 'warning'
                ? 'Atenção'
                : 'Rodando'}
        </StatusBadge>
      </Header>

      {isEditing ? (
        <EditSection>
          <FieldGroup>
            <FieldLabel>
              Código
              <Input
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
              />
            </FieldLabel>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>
              Material
              <Input
                value={editMaterial}
                onChange={(e) => setEditMaterial(e.target.value)}
              />
            </FieldLabel>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>
              Frequência (horas)
              <Input
                type="number"
                value={editFrequency}
                onChange={(e) => setEditFrequency(Number(e.target.value))}
                min={0.5}
                step={0.5}
              />
            </FieldLabel>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>
              Turno
              <Select
                value={editShift}
                onChange={(e) => setEditShift(e.target.value)}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </Select>
            </FieldLabel>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>
              Primeiro teste
              <Input
                type="time"
                value={editFirstTest}
                onChange={(e) => setEditFirstTest(e.target.value)}
              />
            </FieldLabel>
          </FieldGroup>

          <ActionsRow>
            <Button
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
            </Button>

            <Button onClick={() => setIsEditing(false)}>Cancelar</Button>
          </ActionsRow>
        </EditSection>
      ) : (
        <InfoSection>
          <InfoText>
            <strong>Material:</strong> {machine.material}
          </InfoText>
          <InfoText>
            <strong>Frequência:</strong> {machine.frequency}h
          </InfoText>
          <InfoText>
            <strong>Primeiro teste:</strong> {machine.firstTest}
          </InfoText>

          <ActionsRow>
            <EditButton onClick={startEdit}>Editar</EditButton>

            <DeleteButton onClick={() => onDelete(machine.id)}>
              Excluir
            </DeleteButton>
          </ActionsRow>
        </InfoSection>
      )}

      <BlocksSection>
        {machine.blocks?.map((block, index) => {
          const blockIsRunning = block.endTime === null;

          return (
            <BlockContainer key={index}>
              {index !== 0 && (
                <BlockTitle>Retorno {block.startTime}</BlockTitle>
              )}

              <TestList>
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

                  const variant = test.done
                    ? 'done'
                    : isLate
                      ? 'late'
                      : isNext
                        ? 'next'
                        : 'default';

                  return (
                    <TestItem key={i} $variant={variant}>
                      <TestTime $done={test.done}>{test.time}</TestTime>

                      <TestMeta>
                        {test.done
                          ? '✓'
                          : isLate
                            ? 'Atrasado'
                            : !blockIsRunning
                              ? 'Não realizado'
                              : isNext
                                ? 'Próximo'
                                : ''}
                      </TestMeta>
                    </TestItem>
                  );
                })}
              </TestList>

              {block.endTime && <StopText>Parou às {block.endTime}</StopText>}
            </BlockContainer>
          );
        })}
      </BlocksSection>

      {machine.stops?.length > 0 && (
        <HistorySection>
          <HistoryTitle>Histórico de Paradas</HistoryTitle>
          <HistoryList>
            {machine.stops.map((stop, idx) => (
              <HistoryItem key={idx}>
                Parou às {stop.stopTime} - Motivo: {stop.reason}
              </HistoryItem>
            ))}
          </HistoryList>
        </HistorySection>
      )}

      <ActionsRow>
        <DangerButton disabled={!isRunning} onClick={() => onStop(machine.id)}>
          Parar Máquina
        </DangerButton>

        <SecondaryButton
          disabled={isRunning}
          onClick={() => onResume(machine.id)}
        >
          Retomar Máquina
        </SecondaryButton>

        <PrimaryActionButton
          $attention={hasLateTest}
          disabled={!canExecuteTest}
          onClick={() => onCompleteNext(machine.id)}
        >
          Concluir próximo teste {hasLateTest ? '⚠' : ''}
        </PrimaryActionButton>
      </ActionsRow>
    </CardContainer>
  );
}

export default MachineCard;
