import { useState, useEffect } from 'react';
import { 
  Trash2, AlertTriangle, ShieldCheck, X, Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as leadsApi from '../../api/leads';
import Button from '../ui/Button';
import styles from './CleanupOperationsModal.module.css';

export default function CleanupOperationsModal({
  isOpen,
  onClose,
  onSuccess,
  activeFilters = {},
  totalFilteredCount = 0,
}) {
  const [activeTab, setActiveTab] = useState('filters'); // 'filters' | 'domain' | 'status' | 'wipe'
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Domain tab fields
  const [domainMode, setDomainMode] = useState('exact'); // 'exact' | 'pattern' | 'list'
  const [emailDomain, setEmailDomain] = useState('');
  const [emailPattern, setEmailPattern] = useState('');
  const [emailsText, setEmailsText] = useState('');

  // Status & Date tab fields
  const [statusVal, setStatusVal] = useState('rejected');
  const [channelVal, setChannelVal] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const requiredConfirmation = activeTab === 'wipe' ? 'WIPE ALL LEADS' : 'DELETE';
  const isConfirmed = confirmText.trim().toUpperCase() === requiredConfirmation;

  const handleSubmit = async () => {
    if (!isConfirmed || isDeleting) return;

    let payload = {};

    if (activeTab === 'filters') {
      // Build criteria from active filters
      payload = {
        search: activeFilters.search || undefined,
        status: activeFilters.status || undefined,
        title_tier: activeFilters.titleTier || undefined,
        industry: activeFilters.industry || undefined,
        country: activeFilters.country || undefined,
        channel: activeFilters.channel || undefined,
        date_from: activeFilters.dateFrom || undefined,
        date_to: activeFilters.dateTo || undefined,
      };
    } else if (activeTab === 'domain') {
      if (domainMode === 'exact') {
        if (!emailDomain.trim()) {
          toast.error('Please specify an email domain (e.g. example.com)');
          return;
        }
        payload = { email_domain: emailDomain.trim().replace(/^@/, '') };
      } else if (domainMode === 'pattern') {
        if (!emailPattern.trim()) {
          toast.error('Please specify a wildcard pattern (e.g. %@test%)');
          return;
        }
        payload = { email_pattern: emailPattern.trim() };
      } else if (domainMode === 'list') {
        const list = emailsText
          .split(/[\n,]+/)
          .map((e) => e.trim())
          .filter(Boolean);
        if (list.length === 0) {
          toast.error('Please provide at least one email address');
          return;
        }
        payload = { emails: list };
      }
    } else if (activeTab === 'status') {
      payload = {
        status: statusVal || undefined,
        channel: channelVal || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      };
    } else if (activeTab === 'wipe') {
      payload = {
        confirm: true,
      };
    }

    try {
      setIsDeleting(true);
      const res = await leadsApi.bulkDeleteLeads(payload);
      const deletedCount = res?.deleted_count ?? 0;
      toast.success(`Cleanup complete: ${deletedCount} ${deletedCount === 1 ? 'lead' : 'leads'} permanently removed.`);
      if (onSuccess) onSuccess(deletedCount);
      onClose();
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to complete cleanup operation';
      toast.error(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={isDeleting ? undefined : onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerIcon}>
            <Trash2 size={22} />
          </div>
          <div className={styles.headerContent}>
            <h2 className={styles.modalTitle}>Lead Cleanup Operations</h2>
            <p className={styles.modalSubtitle}>
              Targeted bulk removal and pipeline maintenance
            </p>
          </div>
          {!isDeleting && (
            <button className={styles.closeButton} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className={styles.tabsBar}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'filters' ? styles.active : ''}`}
            onClick={() => setActiveTab('filters')}
          >
            Match Current Filters
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'domain' ? styles.active : ''}`}
            onClick={() => setActiveTab('domain')}
          >
            Email Domain & Pattern
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'status' ? styles.active : ''}`}
            onClick={() => setActiveTab('status')}
          >
            Status & Date Window
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'wipe' ? styles.active : ''}`}
            onClick={() => setActiveTab('wipe')}
          >
            Reset Database
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* TAB 1: CURRENT FILTERS */}
          {activeTab === 'filters' && (
            <>
              <div className={styles.criteriaSummaryCard}>
                <span className={styles.criteriaTitle}>Target Criteria: Current Active Filters</span>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#52584a' }}>
                  Deletes all leads currently matching your pipeline filters:
                </p>
                <div className={styles.criteriaList}>
                  {activeFilters.search && <span className={styles.criteriaBadge}>Search: "{activeFilters.search}"</span>}
                  {activeFilters.status && <span className={styles.criteriaBadge}>Status: {activeFilters.status}</span>}
                  {activeFilters.titleTier && <span className={styles.criteriaBadge}>Tier: {activeFilters.titleTier}</span>}
                  {activeFilters.industry && <span className={styles.criteriaBadge}>Industry: {activeFilters.industry}</span>}
                  {activeFilters.country && <span className={styles.criteriaBadge}>Country: {activeFilters.country}</span>}
                  {activeFilters.channel && <span className={styles.criteriaBadge}>Channel: {activeFilters.channel}</span>}
                  {activeFilters.dateFrom && <span className={styles.criteriaBadge}>From: {activeFilters.dateFrom}</span>}
                  {activeFilters.dateTo && <span className={styles.criteriaBadge}>To: {activeFilters.dateTo}</span>}
                  {!activeFilters.search && !activeFilters.status && !activeFilters.titleTier && !activeFilters.industry && !activeFilters.country && (
                    <span className={styles.criteriaBadge}>All visible pipeline records ({totalFilteredCount})</span>
                  )}
                </div>
              </div>

              <p style={{ fontSize: '0.84rem', color: '#1e2a22', margin: 0 }}>
                This will delete all matching prospects currently filtered in your view.
              </p>
            </>
          )}

          {/* TAB 2: DOMAIN / WILDCARD */}
          {activeTab === 'domain' && (
            <>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Targeting Method</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${domainMode === 'exact' ? styles.active : ''}`}
                    style={{ border: '1px solid #dfd9c4', borderRadius: '6px', padding: '0.4rem 0.75rem' }}
                    onClick={() => setDomainMode('exact')}
                  >
                    Exact Domain
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${domainMode === 'pattern' ? styles.active : ''}`}
                    style={{ border: '1px solid #dfd9c4', borderRadius: '6px', padding: '0.4rem 0.75rem' }}
                    onClick={() => setDomainMode('pattern')}
                  >
                    Wildcard Pattern
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${domainMode === 'list' ? styles.active : ''}`}
                    style={{ border: '1px solid #dfd9c4', borderRadius: '6px', padding: '0.4rem 0.75rem' }}
                    onClick={() => setDomainMode('list')}
                  >
                    Specific Email List
                  </button>
                </div>
              </div>

              {domainMode === 'exact' && (
                <div className={styles.fieldGroup}>
                  <label htmlFor="exactDomainInput" className={styles.fieldLabel}>Exact Email Domain</label>
                  <input
                    id="exactDomainInput"
                    type="text"
                    className={styles.textInput}
                    placeholder="e.g. acmecorp.com"
                    value={emailDomain}
                    onChange={(e) => setEmailDomain(e.target.value)}
                  />
                  <p className={styles.fieldHint}>
                    Deletes all leads with emails ending in this domain. Other extensions (.net, .org) remain safe.
                  </p>
                </div>
              )}

              {domainMode === 'pattern' && (
                <div className={styles.fieldGroup}>
                  <label htmlFor="patternInput" className={styles.fieldLabel}>SQL Wildcard Pattern</label>
                  <input
                    id="patternInput"
                    type="text"
                    className={styles.textInput}
                    placeholder="e.g. %@testleads.%"
                    value={emailPattern}
                    onChange={(e) => setEmailPattern(e.target.value)}
                  />
                  <p className={styles.fieldHint}>
                    Matches emails matching pattern (% = any characters). Example: <code>%@testleads.%</code>
                  </p>
                </div>
              )}

              {domainMode === 'list' && (
                <div className={styles.fieldGroup}>
                  <label htmlFor="emailsTextarea" className={styles.fieldLabel}>Email Addresses (GDPR / Targeted)</label>
                  <textarea
                    id="emailsTextarea"
                    className={styles.textareaInput}
                    rows={4}
                    placeholder="Paste emails separated by newlines or commas..."
                    value={emailsText}
                    onChange={(e) => setEmailsText(e.target.value)}
                  />
                  <p className={styles.fieldHint}>
                    Target specific email addresses for immediate GDPR compliance or privacy removal.
                  </p>
                </div>
              )}
            </>
          )}

          {/* TAB 3: STATUS & DATE WINDOW */}
          {activeTab === 'status' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="statusSelect" className={styles.fieldLabel}>Status</label>
                  <select
                    id="statusSelect"
                    className={styles.selectInput}
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                  >
                    <option value="">Any Status</option>
                    <option value="rejected">Rejected</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="qualified">Qualified</option>
                    <option value="new">New</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="channelSelect" className={styles.fieldLabel}>Source Channel</label>
                  <select
                    id="channelSelect"
                    className={styles.selectInput}
                    value={channelVal}
                    onChange={(e) => setChannelVal(e.target.value)}
                  >
                    <option value="">Any Channel</option>
                    <option value="n8n">n8n Automation</option>
                    <option value="csv_upload">CSV Upload</option>
                    <option value="api">API Ingest</option>
                    <option value="manual">Manual Entry</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="dateFromInput" className={styles.fieldLabel}>Created After</label>
                  <input
                    id="dateFromInput"
                    type="date"
                    className={styles.textInput}
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="dateToInput" className={styles.fieldLabel}>Created Before</label>
                  <input
                    id="dateToInput"
                    type="date"
                    className={styles.textInput}
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* TAB 4: WIPE EVERYTHING */}
          {activeTab === 'wipe' && (
            <div className={styles.warningBox}>
              <AlertTriangle size={20} />
              <div>
                <strong>Complete Database Reset:</strong> This will delete every lead across all channels, statuses, and dates. Use only when preparing a new environment or resetting test data.
              </div>
            </div>
          )}

          {/* Safe Notice */}
          <div className={styles.safeNotice}>
            <ShieldCheck size={16} />
            <span>
              <strong>Company data is safe:</strong> Company profiles, website domains, and industry categories will remain saved in your database so other records aren't affected.
            </span>
          </div>

          {/* Confirmation Box */}
          <div className={styles.confirmBox}>
            <label htmlFor="cleanupConfirmInput" className={styles.confirmLabel}>
              Type <strong>{requiredConfirmation}</strong> below to confirm this cleanup:
            </label>
            <input
              id="cleanupConfirmInput"
              type="text"
              className={styles.confirmInput}
              placeholder={`Type ${requiredConfirmation} to confirm`}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
              autoFocus
            />
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            className={styles.deleteBtn}
            onClick={handleSubmit}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Processing Cleanup…</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Execute Cleanup Operation</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
