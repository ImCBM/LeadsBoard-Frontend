import { useState, useEffect } from 'react';
import { 
  Trash2, Tag as TagIcon, AlertTriangle, ShieldCheck, X 
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
  // Operation mode: 'delete' (Delete Leads) or 'tag' (Retroactive Bulk Tagging)
  const [actionType, setActionType] = useState('delete');

  // Active criteria tab
  const [activeTab, setActiveTab] = useState('filters'); // 'filters' | 'id_ranges' | 'domain' | 'tag_target' | 'status' | 'wipe'
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // ID Ranges tab fields
  const [idRangesText, setIdRangesText] = useState('');
  const [idFrom, setIdFrom] = useState('');
  const [idTo, setIdTo] = useState('');

  // Domain tab fields
  const [domainMode, setDomainMode] = useState('exact'); // 'exact' | 'pattern' | 'list'
  const [emailDomain, setEmailDomain] = useState('');
  const [emailPattern, setEmailPattern] = useState('');
  const [emailsText, setEmailsText] = useState('');

  // Tag Target tab fields
  const [targetTag, setTargetTag] = useState('');

  // Status & Date tab fields
  const [statusVal, setStatusVal] = useState('rejected');
  const [channelVal, setChannelVal] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Tag Action fields (for 'tag' mode)
  const [tagOpMode, setTagOpMode] = useState('add'); // 'add' | 'remove' | 'sync'
  const [tagsToApplyText, setTagsToApplyText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
    }
  }, [isOpen, activeTab, actionType]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen) return null;

  const isDeleteMode = actionType === 'delete';
  const requiredConfirmation = activeTab === 'wipe' ? 'WIPE ALL LEADS' : 'DELETE';
  const isConfirmed = !isDeleteMode || confirmText.trim().toUpperCase() === requiredConfirmation;

  const buildCriteria = () => {
    let payload = {};

    if (activeTab === 'filters') {
      payload = {
        search: activeFilters.search || undefined,
        status: activeFilters.status || undefined,
        title_tier: activeFilters.titleTier || undefined,
        industry: activeFilters.industry || undefined,
        country: activeFilters.country || undefined,
        channel: activeFilters.channel || undefined,
        tag: activeFilters.tag || undefined,
        date_from: activeFilters.dateFrom || undefined,
        date_to: activeFilters.dateTo || undefined,
      };
    } else if (activeTab === 'id_ranges') {
      const ranges = idRangesText
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (ranges.length > 0) {
        payload.id_ranges = ranges;
      }
      if (idFrom) payload.id_from = parseInt(idFrom, 10);
      if (idTo) payload.id_to = parseInt(idTo, 10);
    } else if (activeTab === 'domain') {
      if (domainMode === 'exact') {
        if (!emailDomain.trim()) {
          toast.error('Please specify an email domain (e.g. example.com)');
          return null;
        }
        payload.email_domain = emailDomain.trim().replace(/^@/, '');
      } else if (domainMode === 'pattern') {
        if (!emailPattern.trim()) {
          toast.error('Please specify a wildcard pattern (e.g. %@test%)');
          return null;
        }
        payload.email_pattern = emailPattern.trim();
      } else if (domainMode === 'list') {
        const list = emailsText
          .split(/[\n,]+/)
          .map((e) => e.trim())
          .filter(Boolean);
        if (list.length === 0) {
          toast.error('Please provide at least one email address');
          return null;
        }
        payload.emails = list;
      }
    } else if (activeTab === 'tag_target') {
      if (!targetTag.trim()) {
        toast.error('Please specify a tag name or slug (e.g. test, demo, legacy)');
        return null;
      }
      payload.tag = targetTag.trim();
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

    return payload;
  };

  const handleSubmit = async () => {
    if (!isConfirmed || isProcessing) return;

    const criteria = buildCriteria();
    if (!criteria) return;

    // Check if empty criteria (excluding wipe)
    if (activeTab !== 'wipe' && Object.keys(criteria).length === 0) {
      toast.error('Please specify at least one targeting condition');
      return;
    }

    try {
      setIsProcessing(true);

      if (isDeleteMode) {
        const res = await leadsApi.bulkDeleteLeads(criteria);
        const count = res?.deleted_count ?? 0;
        toast.success(`Cleanup complete: ${count} ${count === 1 ? 'lead' : 'leads'} permanently removed.`);
        if (onSuccess) onSuccess(count);
        onClose();
      } else {
        // Tagging Mode
        const tags = tagsToApplyText
          .split(/[\n,]+/)
          .map((t) => t.trim())
          .filter(Boolean);

        if (tags.length === 0) {
          toast.error('Please specify at least one tag to apply');
          setIsProcessing(false);
          return;
        }

        const tagPayload = { ...criteria };
        if (tagOpMode === 'add') tagPayload.add_tags = tags;
        if (tagOpMode === 'remove') tagPayload.remove_tags = tags;
        if (tagOpMode === 'sync') tagPayload.sync_tags = tags;

        const res = await leadsApi.bulkTagLeads(tagPayload);
        const count = res?.updated_count ?? 0;
        toast.success(`Bulk tagging complete: ${count} ${count === 1 ? 'lead' : 'leads'} updated.`);
        if (onSuccess) onSuccess(count);
        onClose();
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.response?.data?.error || 'Operation failed';
      toast.error(errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={isProcessing ? undefined : onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={`${styles.headerIcon} ${isDeleteMode ? styles.deleteMode : styles.tagMode}`}>
            {isDeleteMode ? <Trash2 size={22} /> : <TagIcon size={22} />}
          </div>
          <div className={styles.headerContent}>
            <h2 className={styles.modalTitle}>
              {isDeleteMode ? 'Lead Cleanup Operations' : 'Retroactive Bulk Tagging'}
            </h2>
            <p className={styles.modalSubtitle}>
              {isDeleteMode
                ? 'Targeted bulk removal and staging database maintenance'
                : 'Backfill or manage tags across matching lead segments'}
            </p>
          </div>
          {!isProcessing && (
            <button className={styles.closeButton} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Operation Bar (Toggle between Delete and Tag) */}
        <div className={styles.operationBar}>
          <span className={styles.operationLabel}>Action:</span>
          <button
            type="button"
            className={`${styles.opTypeBtn} ${isDeleteMode ? styles.activeDelete : ''}`}
            onClick={() => {
              setActionType('delete');
              if (activeTab === 'wipe') setActiveTab('filters');
            }}
          >
            <Trash2 size={13} />
            <span>Bulk Delete Leads</span>
          </button>
          <button
            type="button"
            className={`${styles.opTypeBtn} ${!isDeleteMode ? styles.activeTag : ''}`}
            onClick={() => {
              setActionType('tag');
              if (activeTab === 'wipe') setActiveTab('filters');
            }}
          >
            <TagIcon size={13} />
            <span>Bulk Tag / Backfill</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className={styles.tabsBar}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'filters' ? (isDeleteMode ? styles.active : styles.activeTagTab) : ''}`}
            onClick={() => setActiveTab('filters')}
          >
            Match Active Filters
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'id_ranges' ? (isDeleteMode ? styles.active : styles.activeTagTab) : ''}`}
            onClick={() => setActiveTab('id_ranges')}
          >
            ID Ranges & Bounds
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'domain' ? (isDeleteMode ? styles.active : styles.activeTagTab) : ''}`}
            onClick={() => setActiveTab('domain')}
          >
            Email & Domain
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'tag_target' ? (isDeleteMode ? styles.active : styles.activeTagTab) : ''}`}
            onClick={() => setActiveTab('tag_target')}
          >
            Target by Tag
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'status' ? (isDeleteMode ? styles.active : styles.activeTagTab) : ''}`}
            onClick={() => setActiveTab('status')}
          >
            Status, Channel & Date
          </button>
          {isDeleteMode && (
            <button
              className={`${styles.tabBtn} ${activeTab === 'wipe' ? styles.active : ''}`}
              onClick={() => setActiveTab('wipe')}
            >
              Reset Database
            </button>
          )}
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* TAB 1: CURRENT ACTIVE FILTERS */}
          {activeTab === 'filters' && (
            <>
              <div className={styles.criteriaSummaryCard}>
                <span className={styles.criteriaTitle}>Target Criteria: Current Active Filters</span>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#52584a' }}>
                  Targets all prospects matching your current pipeline view:
                </p>
                <div className={styles.criteriaList}>
                  {activeFilters.search && <span className={styles.criteriaBadge}>Search: "{activeFilters.search}"</span>}
                  {activeFilters.status && <span className={styles.criteriaBadge}>Status: {activeFilters.status}</span>}
                  {activeFilters.titleTier && <span className={styles.criteriaBadge}>Tier: {activeFilters.titleTier}</span>}
                  {activeFilters.industry && <span className={styles.criteriaBadge}>Industry: {activeFilters.industry}</span>}
                  {activeFilters.country && <span className={styles.criteriaBadge}>Country: {activeFilters.country}</span>}
                  {activeFilters.channel && <span className={styles.criteriaBadge}>Channel: {activeFilters.channel}</span>}
                  {activeFilters.tag && <span className={styles.criteriaBadge}>Tag: {activeFilters.tag}</span>}
                  {activeFilters.dateFrom && <span className={styles.criteriaBadge}>From: {activeFilters.dateFrom}</span>}
                  {activeFilters.dateTo && <span className={styles.criteriaBadge}>To: {activeFilters.dateTo}</span>}
                  {!activeFilters.search && !activeFilters.status && !activeFilters.titleTier && !activeFilters.industry && !activeFilters.country && !activeFilters.tag && (
                    <span className={styles.criteriaBadge}>All visible pipeline records ({totalFilteredCount})</span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: ID RANGES & BOUNDS */}
          {activeTab === 'id_ranges' && (
            <>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>ID Range Strings</label>
                <textarea
                  className={styles.textareaInput}
                  rows={2}
                  placeholder="e.g. 101-199, 250-255"
                  value={idRangesText}
                  onChange={(e) => setIdRangesText(e.target.value)}
                />
                <p className={styles.fieldHint}>
                  Specify discrete ID ranges separated by commas or newlines (e.g. <code>101-199, 250-255</code>).
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Min ID Bound (id_from)</label>
                  <input
                    type="number"
                    min="1"
                    className={styles.textInput}
                    placeholder="e.g. 100"
                    value={idFrom}
                    onChange={(e) => setIdFrom(e.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Max ID Bound (id_to)</label>
                  <input
                    type="number"
                    min="1"
                    className={styles.textInput}
                    placeholder="e.g. 500"
                    value={idTo}
                    onChange={(e) => setIdTo(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* TAB 3: DOMAIN / WILDCARD */}
          {activeTab === 'domain' && (
            <>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Domain Matching Mode</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${domainMode === 'exact' ? (isDeleteMode ? styles.active : styles.activeTagTab) : ''}`}
                    style={{ border: '1px solid #dfd9c4', borderRadius: '6px', padding: '0.4rem 0.75rem' }}
                    onClick={() => setDomainMode('exact')}
                  >
                    Exact Domain
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${domainMode === 'pattern' ? (isDeleteMode ? styles.active : styles.activeTagTab) : ''}`}
                    style={{ border: '1px solid #dfd9c4', borderRadius: '6px', padding: '0.4rem 0.75rem' }}
                    onClick={() => setDomainMode('pattern')}
                  >
                    Wildcard Pattern
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${domainMode === 'list' ? (isDeleteMode ? styles.active : styles.activeTagTab) : ''}`}
                    style={{ border: '1px solid #dfd9c4', borderRadius: '6px', padding: '0.4rem 0.75rem' }}
                    onClick={() => setDomainMode('list')}
                  >
                    Specific Emails List
                  </button>
                </div>
              </div>

              {domainMode === 'exact' && (
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Exact Email Domain</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    placeholder="e.g. acmecorp.com"
                    value={emailDomain}
                    onChange={(e) => setEmailDomain(e.target.value)}
                  />
                  <p className={styles.fieldHint}>
                    Matches emails ending in this exact domain. Other extensions (.net, .org) are protected.
                  </p>
                </div>
              )}

              {domainMode === 'pattern' && (
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>SQL Wildcard Pattern</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    placeholder="e.g. %@testleads.%"
                    value={emailPattern}
                    onChange={(e) => setEmailPattern(e.target.value)}
                  />
                  <p className={styles.fieldHint}>
                    Matches emails containing pattern (% = any characters). Example: <code>%@testleads.%</code>
                  </p>
                </div>
              )}

              {domainMode === 'list' && (
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Email Addresses (Specific / Targeted)</label>
                  <textarea
                    className={styles.textareaInput}
                    rows={4}
                    placeholder="Paste emails separated by newlines or commas..."
                    value={emailsText}
                    onChange={(e) => setEmailsText(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {/* TAB 4: TARGET BY TAG */}
          {activeTab === 'tag_target' && (
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Target Tag</label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="e.g. test, demo, legacy-import"
                value={targetTag}
                onChange={(e) => setTargetTag(e.target.value)}
              />
              <p className={styles.fieldHint}>
                Target leads currently tagged with this tag. Ideal for purging automated test leads (<code>test</code>) or relabeling existing tags.
              </p>
            </div>
          )}

          {/* TAB 5: STATUS & DATE WINDOW */}
          {activeTab === 'status' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Pipeline Status</label>
                  <select
                    className={styles.selectInput}
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                  >
                    <option value="">Any Status</option>
                    <option value="rejected">Rejected Only</option>
                    <option value="new">New Only</option>
                    <option value="reviewed">Reviewed Only</option>
                    <option value="qualified">Qualified Only</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Ingestion Channel</label>
                  <select
                    className={styles.selectInput}
                    value={channelVal}
                    onChange={(e) => setChannelVal(e.target.value)}
                  >
                    <option value="">Any Channel</option>
                    <option value="n8n">n8n Automation</option>
                    <option value="csv_import">CSV Import</option>
                    <option value="manual">Manual Entry</option>
                    <option value="api">Direct API</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Created After (date_from)</label>
                  <input
                    type="date"
                    className={styles.textInput}
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Created Before (date_to)</label>
                  <input
                    type="date"
                    className={styles.textInput}
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                  <p className={styles.fieldHint}>
                    Use a cutoff date (e.g. <code>2026-08-20</code>) to target older leads created before the tag system.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* TAB 6: RESET DATABASE (DELETE MODE ONLY) */}
          {activeTab === 'wipe' && isDeleteMode && (
            <div className={styles.warningBox}>
              <AlertTriangle size={20} />
              <div>
                <strong>Complete Database Reset:</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>
                  This will wipe ALL prospects and their tag pivot links from the database. Company records and system configuration are retained.
                </p>
              </div>
            </div>
          )}

          {/* ── TAGGING CONTROLS (WHEN IN TAG MODE) ── */}
          {!isDeleteMode && (
            <div style={{ borderTop: '1px solid #dfd9c4', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Tagging Operation</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${tagOpMode === 'add' ? styles.activeTagTab : ''}`}
                    style={{ border: '1px solid #dfd9c4', borderRadius: '6px', padding: '0.35rem 0.75rem' }}
                    onClick={() => setTagOpMode('add')}
                  >
                    Add Tags
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${tagOpMode === 'remove' ? styles.activeTagTab : ''}`}
                    style={{ border: '1px solid #dfd9c4', borderRadius: '6px', padding: '0.35rem 0.75rem' }}
                    onClick={() => setTagOpMode('remove')}
                  >
                    Remove Tags
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${tagOpMode === 'sync' ? styles.activeTagTab : ''}`}
                    style={{ border: '1px solid #dfd9c4', borderRadius: '6px', padding: '0.35rem 0.75rem' }}
                    onClick={() => setTagOpMode('sync')}
                  >
                    Sync (Overwrite)
                  </button>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Tags to Apply / Remove *</label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g. legacy-import, q3-campaign (comma-separated)"
                  value={tagsToApplyText}
                  onChange={(e) => setTagsToApplyText(e.target.value)}
                />
                <p className={styles.fieldHint}>
                  Tags that don't exist yet will be automatically created.
                </p>
              </div>
            </div>
          )}

          {/* Safety notices and confirmations for DELETE mode */}
          {isDeleteMode && (
            <>
              <div className={styles.safeNotice}>
                <ShieldCheck size={16} />
                <span>
                  <strong>Safety Protection:</strong> Deletions remove matching lead records and tag links. Normalized company profiles and domains are preserved.
                </span>
              </div>

              <div className={styles.confirmBox}>
                <label className={styles.confirmLabel}>
                  Type <strong style={{ color: 'var(--error)' }}>{requiredConfirmation}</strong> to proceed:
                </label>
                <input
                  type="text"
                  className={styles.confirmInput}
                  placeholder={requiredConfirmation}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>

          {isDeleteMode ? (
            <Button
              size="sm"
              className={styles.deleteBtn}
              onClick={handleSubmit}
              disabled={!isConfirmed || isProcessing}
            >
              {isProcessing ? 'Deleting…' : 'Execute Cleanup Deletion'}
            </Button>
          ) : (
            <Button
              size="sm"
              className={styles.tagActionBtn}
              onClick={handleSubmit}
              disabled={isProcessing || !tagsToApplyText.trim()}
            >
              {isProcessing ? 'Updating…' : 'Apply Tags to Matching Leads'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
