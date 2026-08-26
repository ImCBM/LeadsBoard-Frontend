import styles from './LeadSkeleton.module.css';

export default function LeadSkeleton({ viewMode = 'table', count = 8 }) {
  if (viewMode === 'cards') {
    return (
      <div className={styles.cardsGrid}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.cardSkeleton}>
            <div className={styles.cardHeader}>
              <div className={styles.avatarShimmer} />
              <div className={styles.headerTextShimmer}>
                <div className={styles.lineMedium} />
                <div className={styles.lineShort} />
              </div>
              <div className={styles.badgeShimmer} />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.lineLong} />
              <div className={styles.tagsRow}>
                <div className={styles.tagShimmer} />
                <div className={styles.tagShimmer} />
                <div className={styles.tagShimmer} />
              </div>
            </div>
            <div className={styles.cardFooter}>
              <div className={styles.btnShimmer} />
              <div className={styles.iconBtnShimmer} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.tableSkeleton}>
      <div className={styles.tableHeaderShimmer}>
        <div className={styles.headerCellShimmer} />
        <div className={styles.headerCellShimmer} />
        <div className={styles.headerCellShimmer} />
        <div className={styles.headerCellShimmer} />
        <div className={styles.headerCellShimmer} />
        <div className={styles.headerCellShimmer} />
      </div>
      <div className={styles.tableBodyShimmer}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.rowShimmer}>
            <div className={styles.cellShimmerWide}>
              <div className={styles.lineMedium} />
              <div className={styles.lineShort} />
            </div>
            <div className={styles.cellShimmerWide}>
              <div className={styles.lineMedium} />
              <div className={styles.lineShort} />
            </div>
            <div className={styles.cellShimmer}>
              <div className={styles.lineMedium} />
            </div>
            <div className={styles.cellShimmer}>
              <div className={styles.lineMedium} />
            </div>
            <div className={styles.cellShimmerSmall}>
              <div className={styles.badgeShimmer} />
            </div>
            <div className={styles.cellShimmerSmall}>
              <div className={styles.actionsShimmer} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
