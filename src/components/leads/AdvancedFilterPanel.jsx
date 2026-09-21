import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Users, Globe, MapPin, Building2,
  Sparkles, Search, X, ChevronDown, Tag as TagIcon
} from 'lucide-react';
import styles from './AdvancedFilterPanel.module.css';

// Continent/Region mapping dictionary
const REGION_COUNTRIES = {
  'Europe': ['Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'United Kingdom', 'Norway', 'Switzerland', 'Iceland'],
  'Asia': ['India', 'Singapore', 'China', 'Japan', 'South Korea', 'Israel', 'Turkey', 'Saudi Arabia', 'United Arab Emirates', 'Taiwan', 'Hong Kong', 'Thailand', 'Vietnam', 'Indonesia', 'Malaysia', 'Philippines', 'Pakistan', 'Bangladesh'],
  'North America': ['United States', 'Canada', 'Mexico'],
  'South America': ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela', 'Ecuador', 'Uruguay'],
  'Oceania': ['Australia', 'New Zealand'],
  'Africa': ['South Africa', 'Nigeria', 'Egypt', 'Kenya', 'Ghana', 'Morocco', 'Tanzania', 'Ethiopia'],
};

const HEADCOUNT_PRESETS = [
  { key: '', label: 'All' },
  { key: '1-10', label: '1–10' },
  { key: '11-50', label: '11–50' },
  { key: '51-200', label: '51–200' },
  { key: '201-500', label: '201–500' },
  { key: '501-1000', label: '501–1K' },
  { key: '1000+', label: '1K+' },
];

const WEB_STATUS_PRESETS = [
  { key: '', label: 'All' },
  { key: '200', label: '200 OK' },
  { key: 'error', label: 'Offline' },
];

const EMAIL_STATUS_PRESETS = [
  { key: '', label: 'All' },
  { key: 'valid', label: 'Valid' },
  { key: 'invalid', label: 'Invalid' },
];

const DATE_SHORTCUTS = [
  { label: '7d', getRange: () => { const d = new Date(); d.setDate(d.getDate() - 7); return { from: d.toISOString().split('T')[0], to: '' }; } },
  { label: '30d', getRange: () => { const d = new Date(); d.setDate(d.getDate() - 30); return { from: d.toISOString().split('T')[0], to: '' }; } },
  { label: '90d', getRange: () => { const d = new Date(); d.setDate(d.getDate() - 90); return { from: d.toISOString().split('T')[0], to: '' }; } },
  { label: 'All', getRange: () => ({ from: '', to: '' }) },
];

// SearchableSelect - compact reusable dropdown with type-ahead search
function SearchableSelect({ options, value, onChange, placeholder, icon: Icon, groupBy }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lower = searchTerm.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(lower));
  }, [options, searchTerm]);

  // Group by continent if groupBy is set and no search term
  const groupedOptions = useMemo(() => {
    if (!groupBy || searchTerm) return null;
    const groups = {};
    const ungrouped = [];
    filteredOptions.forEach((opt) => {
      const group = Object.keys(REGION_COUNTRIES).find((r) =>
        REGION_COUNTRIES[r].includes(opt)
      );
      if (group) {
        if (!groups[group]) groups[group] = [];
        groups[group].push(opt);
      } else {
        ungrouped.push(opt);
      }
    });
    return { groups, ungrouped };
  }, [filteredOptions, groupBy, searchTerm]);

  return (
    <div className={styles.searchableSelect} ref={wrapperRef}>
      <button
        type="button"
        className={`${styles.selectTrigger} ${isOpen ? styles.selectTriggerOpen : ''} ${value ? styles.selectTriggerActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {Icon && <Icon size={12} className={styles.selectTriggerIcon} />}
        <span className={styles.selectTriggerText}>
          {value || placeholder}
        </span>
        <ChevronDown size={12} className={`${styles.selectChevron} ${isOpen ? styles.selectChevronOpen : ''}`} />
      </button>

      {isOpen && (
        <div className={styles.selectDropdown}>
          {/* Search Input */}
          <div className={styles.selectSearchWrap}>
            <Search size={12} className={styles.selectSearchIcon} />
            <input
              ref={searchInputRef}
              type="text"
              className={styles.selectSearchInput}
              placeholder={`Type to filter ${placeholder?.toLowerCase() || ''}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className={styles.selectSearchClear} onClick={() => setSearchTerm('')}>
                <X size={10} />
              </button>
            )}
          </div>

          {/* Options */}
          <div className={styles.selectOptions}>
            {/* "All" option */}
            <button
              className={`${styles.selectOption} ${!value ? styles.selectOptionActive : ''}`}
              onClick={() => { onChange(''); setIsOpen(false); setSearchTerm(''); }}
            >
              All {placeholder}
            </button>

            {groupedOptions ? (
              // Grouped rendering
              <>
                {Object.entries(groupedOptions.groups).map(([group, items]) => (
                  <div key={group} className={styles.selectGroup}>
                    <div className={styles.selectGroupLabel}>{group}</div>
                    {items.map((opt) => (
                      <button
                        key={opt}
                        className={`${styles.selectOption} ${styles.selectOptionIndented} ${value === opt ? styles.selectOptionActive : ''}`}
                        onClick={() => { onChange(opt); setIsOpen(false); setSearchTerm(''); }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ))}
                {groupedOptions.ungrouped.length > 0 && (
                  <div className={styles.selectGroup}>
                    <div className={styles.selectGroupLabel}>Other</div>
                    {groupedOptions.ungrouped.map((opt) => (
                      <button
                        key={opt}
                        className={`${styles.selectOption} ${styles.selectOptionIndented} ${value === opt ? styles.selectOptionActive : ''}`}
                        onClick={() => { onChange(opt); setIsOpen(false); setSearchTerm(''); }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Flat rendering (filtered by search or non-grouped)
              filteredOptions.map((opt) => (
                <button
                  key={opt}
                  className={`${styles.selectOption} ${value === opt ? styles.selectOptionActive : ''}`}
                  onClick={() => { onChange(opt); setIsOpen(false); setSearchTerm(''); }}
                >
                  {opt}
                </button>
              ))
            )}

            {filteredOptions.length === 0 && (
              <div className={styles.selectEmpty}>No matches for "{searchTerm}"</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdvancedFilterPanel({
  isOpen,
  filters,
  onFilterChange,
  filterOptions = {},
}) {
  const {
    industry = '',
    country = '',
    region = '',
    channel = '',
    headcountRange = '',
    headcountMin = '',
    headcountMax = '',
    websiteStatus = '',
    emailStatus = '',
    dateFrom = '',
    dateTo = '',
    tag = '',
  } = filters || {};

  const publicTags = useMemo(() => {
    const all = filterOptions.tags || [];
    return all.filter((t) => t.type !== 'system');
  }, [filterOptions.tags]);

  const availableCountries = useMemo(() => {
    if (!isOpen) return [];
    const allCountries = filterOptions.countries || [];
    if (!region) return allCountries;
    const regionList = REGION_COUNTRIES[region] || [];
    return allCountries.filter((c) => regionList.includes(c));
  }, [isOpen, filterOptions.countries, region]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    onFilterChange(key, value);
  };

  const handleRegionChange = (newRegion) => {
    handleChange('region', newRegion);
    if (newRegion) {
      const countriesInRegion = REGION_COUNTRIES[newRegion] || [];
      const availableInRegion = countriesInRegion.filter((c) =>
        (filterOptions.countries || []).includes(c)
      );
      handleChange('country', availableInRegion.length > 0 ? availableInRegion.join(',') : '');
    } else {
      handleChange('country', '');
    }
  };

  const handleCountryChange = (newCountry) => {
    handleChange('country', newCountry);
    if (newCountry && !newCountry.includes(',')) {
      const matchedRegion = Object.keys(REGION_COUNTRIES).find((r) =>
        REGION_COUNTRIES[r].includes(newCountry)
      );
      handleChange('region', matchedRegion || '');
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelGrid}>
        {/* ── Block 1: Company Scale (Headcount) ── */}
        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <Users size={13} className={styles.blockIcon} />
            <span className={styles.blockTitle}>Company Size</span>
          </div>
          <div className={styles.chipRow}>
            {HEADCOUNT_PRESETS.map((preset) => {
              const isActive = (headcountRange || '') === preset.key;
              return (
                <button
                  key={preset.key}
                  type="button"
                  className={`${styles.miniChip} ${isActive ? styles.miniChipActive : ''}`}
                  onClick={() => {
                    handleChange('headcountRange', preset.key);
                    handleChange('headcountMin', '');
                    handleChange('headcountMax', '');
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <div className={styles.inlineInputsRow}>
            <span className={styles.inlineLabel}>Custom:</span>
            <input
              type="number"
              min="0"
              placeholder="Min"
              className={styles.compactNumInput}
              value={headcountMin}
              onChange={(e) => {
                handleChange('headcountMin', e.target.value);
                handleChange('headcountRange', '');
              }}
            />
            <span className={styles.toSeparator}>–</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              className={styles.compactNumInput}
              value={headcountMax}
              onChange={(e) => {
                handleChange('headcountMax', e.target.value);
                handleChange('headcountRange', '');
              }}
            />
            <span className={styles.unitLabel}>emp</span>
          </div>
        </div>

        {/* ── Block 2: Location (Region & Country) ── */}
        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <MapPin size={13} className={styles.blockIcon} />
            <span className={styles.blockTitle}>Location</span>
          </div>
          <div className={styles.chipRow}>
            <button
              className={`${styles.miniChip} ${!region ? styles.miniChipActive : ''}`}
              onClick={() => handleRegionChange('')}
            >
              All
            </button>
            {['Europe', 'Asia', 'North America', 'South America', 'Oceania', 'Africa'].map((r) => (
              <button
                key={r}
                className={`${styles.miniChip} ${region === r ? styles.miniChipActive : ''}`}
                onClick={() => handleRegionChange(r)}
              >
                {r === 'North America' ? 'N. America' : r === 'South America' ? 'S. America' : r}
              </button>
            ))}
          </div>
          <SearchableSelect
            options={availableCountries}
            value={country && !country.includes(',') ? country : ''}
            onChange={handleCountryChange}
            placeholder={region ? `Countries in ${region}` : 'Search 200+ Countries...'}
            icon={Globe}
            groupBy={!region}
          />
        </div>

        {/* ── Block 3: Industry & Channel ── */}
        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <Building2 size={13} className={styles.blockIcon} />
            <span className={styles.blockTitle}>Industry & Source</span>
          </div>
          <SearchableSelect
            options={filterOptions.industries || []}
            value={industry}
            onChange={(val) => handleChange('industry', val)}
            placeholder="All Industries"
            icon={Building2}
          />
          <div className={styles.chipRow}>
            {[
              { key: '', label: 'All Sources' },
              ...(filterOptions.channels || ['n8n', 'manual', 'api', 'csv_import']).map((ch) => ({
                key: ch,
                label: ch.toUpperCase(),
              })),
            ].map((preset) => {
              const isActive = (channel || '') === preset.key;
              return (
                <button
                  key={preset.key}
                  type="button"
                  className={`${styles.miniChip} ${isActive ? styles.miniChipActive : ''}`}
                  onClick={() => handleChange('channel', preset.key)}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Block 4: Health & Date Range ── */}
        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <Sparkles size={13} className={styles.blockIcon} />
            <span className={styles.blockTitle}>Health & Date Range</span>
          </div>
          <div className={styles.dualStatusRow}>
            <div className={styles.statusSubGroup}>
              <span className={styles.inlineLabel}>Web:</span>
              {WEB_STATUS_PRESETS.map((preset) => {
                const isActive = (websiteStatus || '') === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    className={`${styles.microChip} ${isActive ? styles.miniChipActive : ''}`}
                    onClick={() => handleChange('websiteStatus', preset.key)}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <div className={styles.statusSubGroup}>
              <span className={styles.inlineLabel}>Email:</span>
              {EMAIL_STATUS_PRESETS.map((preset) => {
                const isActive = (emailStatus || '') === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    className={`${styles.microChip} ${isActive ? styles.miniChipActive : ''}`}
                    onClick={() => handleChange('emailStatus', preset.key)}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className={styles.inlineDateRow}>
            <div className={styles.dateChipsGroup}>
              {DATE_SHORTCUTS.map((shortcut) => {
                const range = shortcut.getRange();
                const isActive = dateFrom === range.from && dateTo === range.to;
                return (
                  <button
                    key={shortcut.label}
                    type="button"
                    className={`${styles.microChip} ${isActive ? styles.miniChipActive : ''}`}
                    onClick={() => {
                      handleChange('dateFrom', range.from);
                      handleChange('dateTo', range.to);
                    }}
                  >
                    {shortcut.label}
                  </button>
                );
              })}
            </div>
            <input
              type="date"
              className={styles.compactDateInput}
              value={dateFrom}
              onChange={(e) => handleChange('dateFrom', e.target.value)}
              title="Date from"
            />
            <span className={styles.toSeparator}>–</span>
            <input
              type="date"
              className={styles.compactDateInput}
              value={dateTo}
              onChange={(e) => handleChange('dateTo', e.target.value)}
              title="Date to"
            />
          </div>
        </div>

        {/* ── Block 5: Public Tags & Segments ── */}
        <div className={styles.fullWidthBlock}>
          <div className={styles.blockHeader}>
            <TagIcon size={13} className={styles.blockIcon} />
            <span className={styles.blockTitle}>Public Tags</span>
          </div>
          <div className={styles.chipRow} style={{ flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`${styles.miniChip} ${!tag ? styles.miniChipActive : ''}`}
              onClick={() => handleChange('tag', '')}
            >
              All Tags
            </button>
            {publicTags.map((t) => {
              const isActive = (tag || '') === t.slug || (tag || '') === t.name;
              return (
                <button
                  key={t.id || t.slug}
                  type="button"
                  className={`${styles.miniChip} ${isActive ? styles.miniChipActive : ''}`}
                  onClick={() => handleChange('tag', isActive ? '' : (t.slug || t.name))}
                  title={t.description || t.name}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: t.color || '#1fa97d',
                      marginRight: '6px',
                    }}
                  />
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
