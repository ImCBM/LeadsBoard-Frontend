import styles from './Card.module.css';

export default function Card({
  children,
  title,
  headerRight,
  hoverable = false,
  padding = 'default',
  className = '',
  ...props
}) {
  const classes = [
    styles.card,
    hoverable ? styles.hoverable : '',
    padding === 'compact' ? styles.compact : '',
    padding === 'spacious' ? styles.spacious : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {(title || headerRight) && (
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}
