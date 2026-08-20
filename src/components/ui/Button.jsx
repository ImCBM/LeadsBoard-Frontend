import styles from './Button.module.css';

/**
 * @param {'primary'|'secondary'|'ghost'|'outline'|'danger'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} pill — use pill radius
 * @param {boolean} fullWidth
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  pill = false,
  fullWidth = false,
  className = '',
  ...props
}) {
  const classes = [
    styles.btn,
    styles[variant],
    size !== 'md' ? styles[size] : '',
    pill ? styles.pill : '',
    fullWidth ? styles.fullWidth : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
