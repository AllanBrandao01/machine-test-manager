import {
  DashboardSummary,
  SummaryCard,
  SummaryLabel,
  SummaryValue,
} from './styles';

function Dashboard({
  runningMachines,
  stoppedMachines,
  lateTests,
  completedTests,
}) {
  return (
    <DashboardSummary>
      <SummaryCard $variant="running">
        <SummaryLabel>Máquinas rodando</SummaryLabel>
        <SummaryValue $variant="running">{runningMachines}</SummaryValue>
      </SummaryCard>

      <SummaryCard $variant="stopped">
        <SummaryLabel>Máquinas paradas</SummaryLabel>
        <SummaryValue $variant="stopped">{stoppedMachines}</SummaryValue>
      </SummaryCard>

      <SummaryCard $variant="late">
        <SummaryLabel>Testes atrasados</SummaryLabel>
        <SummaryValue $variant="late">{lateTests}</SummaryValue>
      </SummaryCard>

      <SummaryCard $variant="done">
        <SummaryLabel>Testes concluídos</SummaryLabel>
        <SummaryValue $variant="done">{completedTests}</SummaryValue>
      </SummaryCard>
    </DashboardSummary>
  );
}

export default Dashboard;
