import styles from './index.module.css';

function Filters({ statusFilter, setStatusFilter }) {
  return (
    <>
      <div className={styles.filtersHeader}>
        <span>Filtrar máquinas:</span>
      </div>

      <div className={styles.filtersBar}>
        <button
          className={
            statusFilter === 'all'
              ? `${styles.filterButton} ${styles.activeFilter}`
              : styles.filterButton
          }
          onClick={() => setStatusFilter('all')}
        >
          Todas
        </button>

        <button
          className={
            statusFilter === 'running'
              ? `${styles.filterButton} ${styles.activeFilter}`
              : styles.filterButton
          }
          onClick={() => setStatusFilter('running')}
        >
          Rodando
        </button>

        <button
          className={
            statusFilter === 'stopped'
              ? `${styles.filterButton} ${styles.activeFilter}`
              : styles.filterButton
          }
          onClick={() => setStatusFilter('stopped')}
        >
          Parada
        </button>

        <button
          className={
            statusFilter === 'late'
              ? `${styles.filterButton} ${styles.activeFilter}`
              : styles.filterButton
          }
          onClick={() => setStatusFilter('late')}
        >
          Atrasado
        </button>
      </div>
    </>
  );
}

export default Filters;
