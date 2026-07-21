import { useState } from 'react';
import {
  toShiftMinutes,
  getNowShiftMinutes,
  isNowInsideShiftWindow,
} from '../../../../utils/shift';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import {
  CardContainer,
  Header,
  Title,
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

function getMachineStatus(machine) {
  if (machine.isStopped) return 'stopped';

  const nextTest = machine.nextTestTime;
  if (!nextTest) return 'ok';

  const now = getNowShiftMinutes(machine.shift);
  const expected = toShiftMinutes(nextTest, machine.shift);
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
  isSubmitting = false,
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
  const [editFirstTest, setEditFirstTest] = useState(machine.firstTest || '');

  const nextTest = machine.nextTestTime;
  const status = getMachineStatus(machine);

  function startEdit() {
    setEditCode(machine.code || '');
    setEditMaterial(machine.material || '');
    setEditFrequency(machine.frequency || 2);
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

    const now = getNowShiftMinutes(machine.shift);
    const expected = toShiftMinutes(nextTest, machine.shift);

    return now >= expected;
  })();

  return (
    <CardContainer $status={status}>
      <Header>
        <div>
          <Title>{machine.code}</Title>
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
              disabled={isSubmitting}
              onClick={async () => {
                const success = await onUpdate(machine.id, {
                  code: editCode,
                  material: editMaterial,
                  frequency: editFrequency,
                  firstTest: editFirstTest,
                });

                if (success) {
                  setIsEditing(false);
                }
              }}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>

            <Button disabled={isSubmitting} onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
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

          <ActionsRow>
            <EditButton disabled={isSubmitting} onClick={startEdit}>
              Editar
            </EditButton>

            <DeleteButton
              disabled={isSubmitting}
              onClick={() => onDelete(machine.id)}
            >
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
        {isRunning ? (
          <DangerButton disabled={isSubmitting} onClick={() => onStop(machine.id)}>
            Parar Máquina
          </DangerButton>
        ) : (
          <SecondaryButton
            disabled={isSubmitting}
            onClick={() => onResume(machine.id)}
          >
            Retomar Máquina
          </SecondaryButton>
        )}

        <PrimaryActionButton
          $attention={hasLateTest}
          disabled={!canExecuteTest || isSubmitting}
          onClick={() => onCompleteNext(machine.id)}
        >
          {isSubmitting
            ? 'Concluindo...'
            : `Concluir teste ${hasLateTest ? '⚠' : ''}`}
        </PrimaryActionButton>
      </ActionsRow>
    </CardContainer>
  );
}

export default MachineCard;
