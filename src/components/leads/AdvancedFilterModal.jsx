import { useState, useEffect } from 'react';
import { 
  X, Filter, RotateCcw, Check, Building2, 
  Globe, Mail, Users, MapPin, Tag, Calendar, Sparkles
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import styles from './AdvancedFilterModal.module.css';

// Continent/Region mapping dictionary
const REGION_COUNTRIES = {
  'Europe': ['Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'United Kingdom', 'Norway', 'Switzerland', 'Iceland'],
  'Asia': ['India', 'Singapore', 'China', 'Japan', 'South Korea', 'Israel', 'Turkey', 'Saudi Arabia', 'United Arab Emirates', 'Taiwan', 'Hong Kong'],
  'North America': ['United States', 'Canada', 'Mexico'],
  'South America': ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru'],
  'Oceania': ['Australia', 'New Zealand'],
  'Africa': ['South Africa', 'Nigeria', 'Egypt', 'Kenya']
};

export default function AdvancedFilterModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
  filterOptions = {},
}) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [selectedRegion, setSelectedRegion] = useState('');

  // Sync state when filters open
  useEffect(() => {
    setLocalFilters(filters);
    // Auto-detect region if country matches a region's list
    if (filters.country) {
      const foundRegion = Object.keys(REGION_COUNTRIES).find(region => 
        REGION_COUNTRIES[region].includes(filters.country)
      );
      setSelectedRegion(foundRegion || '');
    } else if (filters.region) {
      setSelectedRegion(filters.region);
    } else {
      setSelectedRegion('');
    }
  }, [filters, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegionChange = (region) => {
    setSelectedRegion(region);
    if (region) {
      // Set country value to comma-separated list of countries in this region
      const countriesInRegion = REGION_COUNTRIES[region] || [];
      // Filter list based on what countries are actually available in filterOptions
      const availableInRegion = countriesInRegion.filter(c => 
        (filterOptions.countries || []).includes(c)
      );
      
      // If we have countries in this region, query them as comma-separated values
      if (availableInRegion.length > 0) {
        handleChange('country', availableInRegion.join(','));
      } else {
        handleChange('country', '');
      }
      handleChange('region', region);
    } else {
      // Clear region constraint
      handleChange('country', '');
      handleChange('region', '');
    }
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    onResetFilters();
    setSelectedRegion('');
    onClose();
  };

  const headcountPresets = [
    { key: '', label: 'Any Size' },
    { key: '1-10', label: '1–10 (Startup)' },
    { key: '11-50', label: '11–50 (Small)' },
    { key: '51-200', label: '51–200 (Mid-Market)' },
    { key: '201-500', label: '201–500 (Upper Mid)' },
    { key: '501-1000', label: '501–1,000 (Large)' },
    { key: '1000+', label: '1,000+ (Enterprise)' },
  ];

  const webStatusPresets = [
    { key: '', label: 'All Domains' },
    { key: '200', label: 'Active (200 OK)' },
    { key: 'error', label: 'Offline / Issues' },
  ];

  const emailStatusPresets = [
    { key: '', label: 'All Emails' },
    { key: 'valid', label: 'Verified (Valid)' },
    { key: 'invalid', label: 'Invalid / Catch-all' },
  ];

  // Group available countries by continent for the select options
  const getGroupedCountries = () => {
    const allAvailable = filterOptions.countries || [];
    const grouped = {};
    const unmapped = [];

    allAvailable.forEach(country => {
      const region = Object.keys(REGION_COUNTRIES).find(r => 
        REGION_COUNTRIES[r].includes(country)
      );
      if (region) {
        if (!grouped[region]) grouped[region] = [];
        grouped[region].push(country);
      } else {
        unmapped.push(country);
      }
    });

    return { grouped, unmapped };
  };

  const { grouped, unmapped } = getGroupedCountries();

  // Filter country dropdown list options if specific region is selected
  const availableCountriesFiltered = selectedRegion 
    ? (grouped[selectedRegion] || []) 
    : filterOptions.countries || [];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.iconCircle}>
              <Filter size={18} />
            </div>
            <div>
              <h2 className={styles.title}>Advanced Filtering</h2>
              <p className={styles.subtitle}>
                Filter across multiple categories in any order to find high-value executive prospects.
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {/* Section: Company Scale / Headcount */}
          <div className={styles.section}>
            <label className={styles.sectionLabel}>
              <Users size={14} className={styles.labelIcon} />
              <span>Company Size (Employee Headcount)</span>
            </label>
            <div className={styles.presetGrid}>
              {headcountPresets.map((preset) => {
                const isActive = (localFilters.headcountRange || '') === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    className={`${styles.presetChip} ${isActive ? styles.presetActive : ''}`}
                    onClick={() => {
                      handleChange('headcountRange', preset.key);
                      // Clear custom min/max when preset is chosen to avoid confusion
                      handleChange('headcountMin', '');
                      handleChange('headcountMax', '');
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Min/Max range input */}
            <div className={styles.customHeadcountRow}>
              <div className={styles.customInputWrapper}>
                <span className={styles.inputLabelHint}>Min Employees</span>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 25"
                  className={styles.numInput}
                  value={localFilters.headcountMin || ''}
                  onChange={(e) => {
                    handleChange('headcountMin', e.target.value);
                    handleChange('headcountRange', ''); // Clear preset if custom min is entered
                  }}
                />
              </div>
              <span className={styles.rangeDivider}>to</span>
              <div className={styles.customInputWrapper}>
                <span className={styles.inputLabelHint}>Max Employees</span>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 500"
                  className={styles.numInput}
                  value={localFilters.headcountMax || ''}
                  onChange={(e) => {
                    handleChange('headcountMax', e.target.value);
                    handleChange('headcountRange', ''); // Clear preset if custom max is entered
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section: Website Status & Email Status */}
          <div className={styles.gridTwoCols}>
            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                <Globe size={14} className={styles.labelIcon} />
                <span>Website Status</span>
              </label>
              <div className={styles.presetGrid}>
                {webStatusPresets.map((preset) => {
                  const isActive = (localFilters.websiteStatus || '') === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      className={`${styles.presetChip} ${isActive ? styles.presetActive : ''}`}
                      onClick={() => handleChange('websiteStatus', preset.key)}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                <Mail size={14} className={styles.labelIcon} />
                <span>Email Verification</span>
              </label>
              <div className={styles.presetGrid}>
                {emailStatusPresets.map((preset) => {
                  const isActive = (localFilters.emailStatus || '') === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      className={`${styles.presetChip} ${isActive ? styles.presetActive : ''}`}
                      onClick={() => handleChange('emailStatus', preset.key)}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section: Continent/Region & Specific Country Selector */}
          <div className={styles.gridTwoCols}>
            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                <MapPin size={14} className={styles.labelIcon} />
                <span>Geographic Region / Continent</span>
              </label>
              <select
                className={styles.selectInput}
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
              >
                <option value="">All Regions</option>
                {Object.keys(REGION_COUNTRIES).map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                <Globe size={14} className={styles.labelIcon} />
                <span>Target Country</span>
              </label>
              <select
                className={styles.selectInput}
                value={localFilters.country && !localFilters.country.includes(',') ? localFilters.country : ''}
                onChange={(e) => {
                  handleChange('country', e.target.value);
                  // Sync region dropdown if specific country is picked
                  if (e.target.value) {
                    const matchedRegion = Object.keys(REGION_COUNTRIES).find(r => 
                      REGION_COUNTRIES[r].includes(e.target.value)
                    );
                    setSelectedRegion(matchedRegion || '');
                    handleChange('region', matchedRegion || '');
                  }
                }}
              >
                <option value="">
                  {selectedRegion ? `All Countries in ${selectedRegion}` : 'All Countries'}
                </option>
                
                {selectedRegion ? (
                  availableCountriesFiltered.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))
                ) : (
                  <>
                    {Object.keys(grouped).map(region => (
                      <optgroup key={region} label={region}>
                        {grouped[region].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                    ))}
                    {unmapped.length > 0 && (
                      <optgroup label="Other Locations">
                        {unmapped.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </optgroup>
                    )}
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Section: Industry & Seniority Tier */}
          <div className={styles.gridTwoCols}>
            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                <Building2 size={14} className={styles.labelIcon} />
                <span>Industry Classification</span>
              </label>
              <Input
                as="select"
                value={localFilters.industry || ''}
                onChange={(e) => handleChange('industry', e.target.value)}
              >
                <option value="">All Industries</option>
                {(filterOptions.industries || []).map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </Input>
            </div>

            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                <Tag size={14} className={styles.labelIcon} />
                <span>Seniority Tier</span>
              </label>
              <Input
                as="select"
                value={localFilters.titleTier || ''}
                onChange={(e) => handleChange('titleTier', e.target.value)}
              >
                <option value="">All Tiers</option>
                {(filterOptions.title_tiers || ['C-Level', 'VP-Level', 'Director-Level', 'Other']).map((tier) => (
                  <option key={tier} value={tier}>{tier}</option>
                ))}
              </Input>
            </div>
          </div>

          {/* Section: Ingestion Source & Date Range */}
          <div className={styles.gridTwoCols}>
            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                <Sparkles size={14} className={styles.labelIcon} />
                <span>Ingestion Source</span>
              </label>
              <Input
                as="select"
                value={localFilters.channel || ''}
                onChange={(e) => handleChange('channel', e.target.value)}
              >
                <option value="">All Channels</option>
                {(filterOptions.channels || ['n8n', 'manual', 'api', 'csv_import']).map((ch) => (
                  <option key={ch} value={ch}>{ch.toUpperCase()}</option>
                ))}
              </Input>
            </div>

            <div className={styles.section}>
              <label className={styles.sectionLabel}>
                <Calendar size={14} className={styles.labelIcon} />
                <span>Date Range Ingested</span>
              </label>
              <div className={styles.dateRow}>
                <Input
                  type="date"
                  value={localFilters.dateFrom || ''}
                  onChange={(e) => handleChange('dateFrom', e.target.value)}
                />
                <Input
                  type="date"
                  value={localFilters.dateTo || ''}
                  onChange={(e) => handleChange('dateTo', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={styles.footer}>
          <Button 
            variant="outline" 
            size="md" 
            onClick={handleReset}
            className={styles.resetBtn}
          >
            <RotateCcw size={15} />
            <span>Reset All</span>
          </Button>

          <div className={styles.footerRight}>
            <Button variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleApply}>
              <Check size={16} />
              <span>Apply Filters</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
