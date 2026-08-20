import { X } from 'lucide-react';
import styles from './Chip.module.css';

export default function Chip({ children, active = false, onRemove, onClick, className = '' }) {
  return (
    <button
      className={`${styles.chip} ${active ? styles.active : styles.inactive} ${onRemove ? styles.removable : ''} ${className}`}
      onClick={onClick}
      type="button"
    >
      {children}
      {onRemove && active && (
        <span
          className={styles.removeIcon}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          role="button"
          tabIndex={0}
        >
          <X size={12} />
        </span>
      )}
    </button>
  );
}
