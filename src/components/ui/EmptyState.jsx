import { Inbox } from 'lucide-react';
import styles from './EmptyState.module.css';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data found',
  description = 'There is nothing to display yet.',
  children,
}) {
  return (
    <div className={styles.empty}>
      <div className={styles.icon}>
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {children}
    </div>
  );
}
