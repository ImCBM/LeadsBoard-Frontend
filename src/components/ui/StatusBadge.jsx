import styles from './StatusBadge.module.css';

const STATUS_LABELS = {
  new: 'New',
  reviewed: 'Reviewed',
  qualified: 'Qualified',
  rejected: 'Rejected',
};

export default function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase();
  return (
    <span className={`${styles.badge} ${styles[normalized] || ''}`}>
      {STATUS_LABELS[normalized] || status}
    </span>
  );
}
