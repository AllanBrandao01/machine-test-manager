import { useState } from 'react';
import styled, { css } from 'styled-components';
import {
  toShiftMinutes,
  getNowShiftMinutes,
  isNowInsideShiftWindow,
} from '../../../../utils/shift';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';

const CardContainer = styled.div`
  background: #ffffff;
  border: 1px solid #d7e6e4;
  border-left: 6px solid #1b6f6a;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 6px 18px rgba(27, 111, 106, 0.08);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  min-width: 0;
  width: 85%;
  box-sizing: border-box;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(27, 111, 106, 0.14);
  }

  ${({ $status }) =>
    $status === 'stopped' &&
    css`
      border-left-color: #c0392b;
      background: #fff6f5;
    `}

  ${({ $status }) =>
    $status === 'late' &&
    css`
      border-left-color: #e53935;
      background: #ffffff;
    `}

  ${({ $status }) =>
    $status === 'warning' &&
    css`
      border-left-color: #facc15;
    `}
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
`;

const Title = styled.h3`
  margin: 0 0 4px;
  color: #1b6f6a;
  font-size: 1.25rem;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #5f6b6a;
  font-size: 0.95rem;
`;

const StatusBadge = styled.span`
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.9rem;
  white-space: nowrap;

  ${({ $status }) =>
    $status === 'stopped'
      ? css`
          background: #fdecec;
          color: #c0392b;
        `
      : $status === 'late'
        ? css`
            background: #fdecea;
            color: #c62828;
          `
        : $status === 'warning'
          ? css`
              background: #fff4cc;
              color: #8a6a00;
            `
          : css`
              background: #e8f3f2;
              color: #1b6f6a;
            `}
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
`;

const InfoText = styled.p`
  margin: 0;
  color: #243534;
  font-size: 0.95rem;
`;

const EditSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 16px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FieldLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
  color: #244240;
  font-size: 0.95rem;
`;

const ActionsRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 12px;
  align-items: stretch;
`;

const SecondaryButton = styled.button`
  flex: 1;
  height: 36px;
  border: none;
  background: #e8f3f2;
  color: #1b6f6a;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;

  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #d9ecea;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled.button`
  width: 120px;
  height: 36px;
  border: none;
  background: #fdecec;
  color: #c0392b;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition:
    background 0.2s ease,
    opacity 0.2s ease;

  &:hover {
    background: #f9d9d6;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EditButton = styled.button`
  width: 120px;
  height: 36px;
  border: none;
  background: #e8f3f2;
  color: #1b6f6a;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition:
    background 0.2s ease,
    opacity 0.2s ease;

  &:hover {
    background: #d9ecea;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DangerButton = styled.button`
  flex: 1;
  height: 40px;
  border: none;
  background: #c0392b;
  color: #ffffff;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;

  &:hover {
    background: #a93226;
  }

  &:disabled {
    background: #e6b8b3;
    cursor: not-allowed;
  }
`;

const PrimaryActionButton = styled.button`
  border: none;
  background: #1b6f6a;
  color: #ffffff;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition:
    background 0.2s ease,
    opacity 0.2s ease;

  &:hover {
    background: #155a55;
  }

  &:disabled {
    background: #9bbdbb;
    cursor: not-allowed;
  }

  ${({ $attention }) =>
    $attention &&
    css`
      background: #d18b16;

      &:hover {
        background: #b7791f;
      }

      &:disabled {
        background: #e7cb98;
      }
    `}
`;

const BlocksSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 12px;
`;

const BlockContainer = styled.div`
  background: #f8fbfb;
  border: 1px solid #d7e6e4;
  border-radius: 12px;
  padding: 14px;
`;

const BlockTitle = styled.strong`
  display: block;
  margin-bottom: 10px;
  color: #1b6f6a;
  font-size: 0.95rem;
`;

const TestList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TestItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e3eceb;

  ${({ $variant }) =>
    $variant === 'done' &&
    css`
      background: #edf8f3;
      border-color: #b9dfcb;
    `}

  ${({ $variant }) =>
    $variant === 'late' &&
    css`
      background: #fff5f4;
      border-color: #efc2bc;
    `}

  ${({ $variant }) =>
    $variant === 'next' &&
    css`
      background: #fff9e8;
      border-color: #ead79b;
    `}
`;

const TestTime = styled.span`
  font-weight: 700;
  color: #244240;

  ${({ $done }) =>
    $done &&
    css`
      color: #4d7c6f;
    `}
`;

const TestMeta = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: #5f6b6a;
`;

const StopText = styled.p`
  margin: 12px 0 0;
  color: #8a3b32;
  font-size: 0.9rem;
  font-weight: 600;
`;

const HistorySection = styled.div`
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #dfe9e7;
`;

const HistoryTitle = styled.strong`
  display: block;
  margin-bottom: 10px;
  color: #1b6f6a;
  font-size: 0.95rem;
`;

const HistoryList = styled.ul`
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const HistoryItem = styled.li`
  color: #465857;
  font-size: 0.92rem;
`;

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
