import { useState, useEffect } from 'react';
import { 
  X, Filter, RotateCcw, Check, Sparkles, Building2, 
  Globe, Mail, Users, MapPin, Tag, Calendar 
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import styles from './AdvancedFilterModal.module.css';

export default function AdvancedFilterModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
  filterOptions = {},
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    onResetFilters();
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
                    onClick={() => handleChange('headcountRange', preset.key)}
                  >
                    {preset.label}
                  </button>
                );
              })}
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

          {/* Section: Industry & Country Dropdowns */}
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
                <MapPin size={14} className={styles.labelIcon} />
                <span>Target Country</span>
              </label>
              <Input
                as="select"
                value={localFilters.country || ''}
                onChange={(e) => handleChange('country', e.target.value)}
              >
                <option value="">All Countries</option>
                {(filterOptions.countries || []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Input>
            </div>
          </div>

          {/* Section: Title Tier & Ingestion Channel */}
          <div className={styles.gridTwoCols}>
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
          </div>

          {/* Section: Date Range */}
          <div className={styles.section}>
            <label className={styles.sectionLabel}>
              <Calendar size={14} className={styles.labelIcon} />
              <span>Date Range Ingested</span>
            </label>
            <div className={styles.dateRow}>
              <Input
                type="date"
                label="From Date"
                value={localFilters.dateFrom || ''}
                onChange={(e) => handleChange('dateFrom', e.target.value)}
              />
              <Input
                type="date"
                label="To Date"
                value={localFilters.dateTo || ''}
                onChange={(e) => handleChange('dateTo', e.target.value)}
              />
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
