import { forwardRef } from 'react';
import styles from './Input.module.css';

const Input = forwardRef(function Input(
  { label, error, className = '', type = 'text', as = 'input', ...props },
  ref,
) {
  const Component = as === 'select' ? 'select' : as === 'textarea' ? 'textarea' : 'input';

  const inputClasses = [
    styles.input,
    as === 'select' ? styles.select : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={`${styles.field} ${error ? styles.error : ''}`}>
      {label && <label className={styles.label}>{label}</label>}
      <Component ref={ref} type={Component === 'input' ? type : undefined} className={inputClasses} {...props} />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
});

export default Input;
