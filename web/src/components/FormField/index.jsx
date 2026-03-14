import styles from './index.module.css';

function FormField({ label, htmlFor, error, children }) {
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
      </label>

      {children}

      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

export default FormField;
