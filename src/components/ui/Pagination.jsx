import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Pagination.module.css';

export default function Pagination({ currentPage, lastPage, total, from, to, onPageChange }) {
  if (lastPage <= 1) return null;

  // Build page numbers to show
  const pages = [];
  const range = 2; // show 2 pages on each side of current
  for (let i = 1; i <= lastPage; i++) {
    if (i === 1 || i === lastPage || (i >= currentPage - range && i <= currentPage + range)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className={styles.pagination}>
      <button
        className={styles.pageBtn}
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((page, idx) =>
        page === '...' ? (
          <span key={`dots-${idx}`} className={styles.info}>…</span>
        ) : (
          <button
            key={page}
            className={`${styles.pageBtn} ${page === currentPage ? styles.active : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ),
      )}

      <button
        className={styles.pageBtn}
        disabled={currentPage >= lastPage}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>

      {total != null && (
        <span className={styles.info}>
          {from}–{to} of {total}
        </span>
      )}
    </div>
  );
}
