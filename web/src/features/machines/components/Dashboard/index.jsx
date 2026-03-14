import styles from './index.module.css';

function Dashboard({
  runningMachines,
  stoppedMachines,
  lateTests,
  completedTests,
}) {
  return (
    <div className={styles.dashboardSummary}>
      <div className={`${styles.summaryCard} ${styles.summaryCardRunning}`}>
        <span className={styles.summaryLabel}>Máquinas rodando</span>
        <strong className={styles.summaryValue}>{runningMachines}</strong>
      </div>

      <div className={`${styles.summaryCard} ${styles.summaryCardStopped}`}>
        <span className={styles.summaryLabel}>Máquinas paradas</span>
        <strong className={styles.summaryValue}>{stoppedMachines}</strong>
      </div>

      <div className={`${styles.summaryCard} ${styles.summaryCardLate}`}>
        <span className={styles.summaryLabel}>Testes atrasados</span>
        <strong className={styles.summaryValue}>{lateTests}</strong>
      </div>

      <div className={`${styles.summaryCard} ${styles.summaryCardDone}`}>
        <span className={styles.summaryLabel}>Testes concluídos</span>
        <strong className={styles.summaryValue}>{completedTests}</strong>
      </div>
    </div>
  );
}

export default Dashboard;
