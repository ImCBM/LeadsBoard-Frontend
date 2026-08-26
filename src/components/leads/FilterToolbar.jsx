import { useState, useRef, useEffect } from 'react';
import {
  Search, X, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  RotateCcw, ChevronDown, Loader2
} from 'lucide-react';
import styles from './FilterToolbar.module.css';

const STATUS_TABS = [
  { key: '', label: 'All Leads' },
  { key: 'new', label: 'New' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'rejected', label: 'Rejected' },
];

const TIER_SHORTCUTS = [
  { key: '', label: 'All Tiers' },
  { key: 'C-Level', label: 'C-Level' },
  { key: 'VP-Level', label: 'VP-Level' },
  { key: 'Director-Level', label: 'Director' },
];

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest First' },
  { value: 'created_at:asc', label: 'Oldest First' },
  { value: 'full_name:asc', label: 'Name A → Z' },
  { value: 'full_name:desc', label: 'Name Z → A' },
  { value: 'company_name:asc', label: 'Company A → Z' },
  { value: 'company_name:desc', label: 'Company Z → A' },
  { value: 'employee_headcount:asc', label: 'Headcount: Low → High' },
  { value: 'employee_headcount:desc', label: 'Headcount: High → Low' },
  { value: 'industry_classification:asc', label: 'Industry A → Z' },
  { value: 'country:asc', label: 'Country A → Z' },
  { value: 'status:asc', label: 'Status A → Z' },
  { value: 'job_title:asc', label: 'Job Title A → Z' },
];

export default function FilterToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  titleTier,
  onTitleTierChange,
  sortBy,
  sortDir,
  onSortChange,
  activeAdvancedCount,
  isAdvancedOpen,
  onToggleAdvanced,
  hasAnyFilters,
  onClearAll,
  activeFilters,
  onRemoveFilter,
  isSearching,
  isFetching,
}) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentSortLabel = SORT_OPTIONS.find(
    (o) => o.value === `${sortBy}:${sortDir}`
  )?.label || 'Newest First';

  return (
    <div className={styles.toolbar}>
      {/* ── Row 1: Search + Sort ── */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrapper}>
          <div className={styles.searchIconWrap}>
            {isSearching ? (
              <Loader2 size={18} className={styles.searchSpinner} />
            ) : (
              <Search size={18} className={styles.searchIcon} />
            )}
          </div>
          <input
            type="text"
            className={styles.searchInput}
            placeholder='Search by name, company, email, role — use commas for multi-search (e.g. "John, TechCorp, London")'
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button
              className={styles.searchClear}
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Sort Control */}
        <div className={styles.sortContainer} ref={sortRef}>
          <button
            className={styles.sortButton}
            onClick={() => setSortOpen((prev) => !prev)}
            title="Change sort order"
          >
            <ArrowUpDown size={14} />
            <span className={styles.sortLabel}>{currentSortLabel}</span>
            <ChevronDown
              size={13}
              className={`${styles.sortChevron} ${sortOpen ? styles.sortChevronOpen : ''}`}
            />
          </button>

          {sortOpen && (
            <div className={styles.sortDropdown}>
              <div className={styles.sortDropdownHeader}>Sort Leads By</div>
              {SORT_OPTIONS.map((opt) => {
                const isActive = `${sortBy}:${sortDir}` === opt.value;
                return (
                  <button
                    key={opt.value}
                    className={`${styles.sortOption} ${isActive ? styles.sortOptionActive : ''}`}
                    onClick={() => {
                      const [field, direction] = opt.value.split(':');
                      onSortChange(field, direction);
                      setSortOpen(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {isActive && (
                      <span className={styles.sortCheck}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Quick Filter Chips ── */}
      <div className={styles.quickFiltersRow}>
        {/* Status Tabs */}
        <div className={styles.chipGroup}>
          <span className={styles.chipGroupLabel}>Status</span>
          <div className={styles.chipGroupItems}>
            {STATUS_TABS.map((tab) => {
              const isActive = status === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`${styles.filterChip} ${isActive ? styles.filterChipActive : ''}`}
                  onClick={() => onStatusChange(tab.key)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.chipDivider} />

        {/* Tier Shortcuts */}
        <div className={styles.chipGroup}>
          <span className={styles.chipGroupLabel}>Seniority</span>
          <div className={styles.chipGroupItems}>
            {TIER_SHORTCUTS.map((t) => {
              const isActive = titleTier === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  className={`${styles.tierChip} ${isActive ? styles.tierChipActive : ''}`}
                  onClick={() => onTitleTierChange(t.key)}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.chipDivider} />

        {/* Advanced Filter Toggle */}
        <button
          type="button"
          className={`${styles.advancedToggle} ${isAdvancedOpen ? styles.advancedToggleOpen : ''} ${activeAdvancedCount > 0 ? styles.advancedToggleActive : ''}`}
          onClick={onToggleAdvanced}
        >
          <Filter size={14} />
          <span>{isAdvancedOpen ? 'Hide Filters' : 'More Filters'}</span>
          {activeAdvancedCount > 0 && (
            <span className={styles.advancedBadge}>{activeAdvancedCount}</span>
          )}
        </button>
      </div>

      {/* ── Row 3: Active Criteria Bar ── */}
      {hasAnyFilters && (
        <div className={styles.activeCriteriaBar}>
          {isFetching && <div className={styles.fetchingBar} />}
          <span className={styles.criteriaLabel}>Active Criteria:</span>

          <div className={styles.criteriaChips}>
            {activeFilters.map((filter, i) => (
              <span key={`${filter.key}-${i}`} className={styles.criteriaChip}>
                <span className={styles.criteriaChipCategory}>{filter.category}:</span>
                <span className={styles.criteriaChipValue}>{filter.label}</span>
                <button
                  className={styles.criteriaChipRemove}
                  onClick={() => onRemoveFilter(filter.key)}
                  title={`Remove ${filter.category} filter`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>

          <button className={styles.resetAllBtn} onClick={onClearAll}>
            <RotateCcw size={12} />
            <span>Reset all</span>
          </button>
        </div>
      )}
    </div>
  );
}
