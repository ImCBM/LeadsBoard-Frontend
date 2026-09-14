import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  X, ExternalLink, Mail, Phone, Copy, Check, Globe, 
  Building2, MapPin, Users, ArrowRight, ShieldCheck,
  Tag, CheckCircle2, Trash2, Plus
} from 'lucide-react';

const LinkedInIcon = ({ size = 15 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45c-.88 0-1.6.72-1.6 1.6s.72 1.6 1.6 1.6c.88 0 1.6-.72 1.6-1.6s-.72-1.6-1.6-1.6Z"/>
  </svg>
);
import toast from 'react-hot-toast';
import * as leadsApi from '../../api/leads';
import * as tagsApi from '../../api/tags';
import Button from '../ui/Button';
import Input from '../ui/Input';
import StatusBadge from '../ui/StatusBadge';
import DeleteLeadModal from './DeleteLeadModal';
import styles from './LeadDrawer.module.css';

const STATUS_OPTIONS = [
  { key: 'new', label: 'New', color: 'new' },
  { key: 'reviewed', label: 'Reviewed', color: 'reviewed' },
  { key: 'qualified', label: 'Qualified', color: 'qualified' },
  { key: 'rejected', label: 'Rejected', color: 'rejected' },
];

export default function LeadDrawer({ lead, onClose, onLeadUpdated, onLeadDeleted }) {
  const navigate = useNavigate();
  const [copiedField, setCopiedField] = useState(null);
  const [status, setStatus] = useState(lead?.status || 'new');
  const [notes, setNotes] = useState(lead?.notes || '');
  const [assignedTags, setAssignedTags] = useState(lead?.tags || []);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [isTagUpdating, setIsTagUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (lead) {
      setStatus(lead.status || 'new');
      setNotes(lead.notes || '');
      setAssignedTags(lead.tags || []);
    }
  }, [lead]);

  // Fetch available public tags
  const tagsQuery = useQuery({
    queryKey: ['tags', { type: 'public' }],
    queryFn: () => tagsApi.getTags({ type: 'public' }),
    staleTime: 60 * 1000,
  });

  const allTags = (tagsQuery.data?.data || []).filter((t) => t.type !== 'system');
  const publicAssigned = (assignedTags || []).filter((t) => t.type !== 'system');
  const assignedNames = new Set(publicAssigned.map((t) => (t.name || '').toLowerCase()));
  const availableTags = allTags.filter((t) => !assignedNames.has((t.name || '').toLowerCase()));

  const handleAddTag = async (tagToAdd) => {
    try {
      setIsTagUpdating(true);
      setIsTagDropdownOpen(false);
      await leadsApi.bulkTagLeads({
        lead_ids: [lead.id],
        action: 'add_tags',
        add_tags: [tagToAdd.name],
      });
      const nextTags = [...assignedTags, tagToAdd];
      setAssignedTags(nextTags);
      toast.success(`Tag "${tagToAdd.name}" added`);
      if (onLeadUpdated) onLeadUpdated({ ...lead, tags: nextTags });
    } catch {
      toast.error('Failed to add tag');
    } finally {
      setIsTagUpdating(false);
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    try {
      setIsTagUpdating(true);
      await leadsApi.bulkTagLeads({
        lead_ids: [lead.id],
        action: 'remove_tags',
        remove_tags: [tagToRemove.name],
      });
      const nextTags = assignedTags.filter((t) => t.id !== tagToRemove.id && t.name !== tagToRemove.name);
      setAssignedTags(nextTags);
      toast.success(`Tag "${tagToRemove.name}" removed`);
      if (onLeadUpdated) onLeadUpdated({ ...lead, tags: nextTags });
    } catch {
      toast.error('Failed to remove tag');
    } finally {
      setIsTagUpdating(false);
    }
  };

  if (!lead) return null;

  const handleDeleteLead = async () => {
    try {
      setIsDeleting(true);
      await leadsApi.deleteLead(lead.id);
      toast.success('Lead permanently deleted');
      setShowDeleteModal(false);
      onClose();
      if (onLeadDeleted) onLeadDeleted(lead.id);
    } catch {
      toast.error('Failed to delete lead');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = async (customStatus) => {
    setSaving(true);
    const targetStatus = customStatus || status;
    try {
      const res = await leadsApi.updateLead(lead.id, { status: targetStatus, notes });
      const updated = res.data || res;
      toast.success('Lead updated successfully');
      if (onLeadUpdated) onLeadUpdated(updated);
    } catch {
      toast.error('Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatus = async (newStatus) => {
    setStatus(newStatus);
    await handleSave(newStatus);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.nameRow}>
              <h2 className={styles.name}>{lead.full_name}</h2>
              <StatusBadge status={status} />
            </div>
            <p className={styles.titleCompany}>
              {lead.job_title || 'Executive Prospect'} {lead.company_name ? `· ${lead.company_name}` : ''}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close drawer">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.body}>
          {/* Quick Action Bar */}
          <div className={styles.quickBar}>
            {lead.corporate_email && (
              <a 
                href={`mailto:${lead.corporate_email}`} 
                className={styles.quickAction}
                title="Send email"
              >
                <Mail size={15} />
                <span>Send Email</span>
              </a>
            )}
            {lead.contact_number && (
              <a 
                href={`tel:${lead.contact_number}`} 
                className={styles.quickAction}
                title="Call phone"
              >
                <Phone size={15} />
                <span>Call Phone</span>
              </a>
            )}
            {lead.executive_linkedin_url && (
              <a 
                href={lead.executive_linkedin_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.quickAction}
                title="Executive LinkedIn"
              >
                <LinkedInIcon size={15} />
                <span>LinkedIn</span>
              </a>
            )}
            {lead.clean_root_domain && (
              <a 
                href={`https://${lead.clean_root_domain}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.quickAction}
                title="Visit website"
              >
                <Globe size={15} />
                <span>Domain</span>
              </a>
            )}
            {lead.company_linkedin_page && (
              <a 
                href={lead.company_linkedin_page} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.quickAction}
                title="Company LinkedIn"
              >
                <Building2 size={15} />
                <span>Company</span>
              </a>
            )}
          </div>

          {/* Quick Status Transition Buttons */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Pipeline Stage</h4>
            <div className={styles.statusChipsRow}>
              {STATUS_OPTIONS.map((opt) => {
                const isActive = status === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    className={`${styles.statusChipBtn} ${isActive ? styles.statusChipActive : ''}`}
                    onClick={() => handleQuickStatus(opt.key)}
                    disabled={saving}
                  >
                    {isActive && <CheckCircle2 size={14} />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Public Tags Management */}
          <div className={styles.section}>
            <div className={styles.tagsHeaderRow}>
              <h4 className={styles.sectionTitle} style={{ margin: 0 }}>Prospect Tags</h4>
              <div className={styles.addTagWrapper}>
                <button
                  type="button"
                  className={styles.addTagTriggerBtn}
                  onClick={() => setIsTagDropdownOpen((prev) => !prev)}
                  disabled={isTagUpdating}
                  title="Add tag"
                >
                  <Plus size={12} />
                  <span>Add Tag</span>
                </button>
                {isTagDropdownOpen && (
                  <div className={styles.tagDropdownMenu}>
                    {availableTags.length === 0 ? (
                      <div className={styles.tagDropdownEmpty}>No more tags available</div>
                    ) : (
                      availableTags.map((t) => (
                        <button
                          key={t.id || t.slug}
                          type="button"
                          className={styles.tagDropdownItem}
                          onClick={() => handleAddTag(t)}
                        >
                          <span
                            className={styles.tagChipDot}
                            style={{ backgroundColor: t.color || '#1fa97d' }}
                          />
                          <span>{t.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.tagsContainer}>
              <div className={styles.tagsList}>
                {publicAssigned.length === 0 ? (
                  <span className={styles.emptyTagsText}>No public tags attached to this prospect.</span>
                ) : (
                  publicAssigned.map((t) => (
                    <span
                      key={t.id || t.slug}
                      className={styles.tagChip}
                      style={{
                        backgroundColor: `${t.color || '#1fa97d'}18`,
                        color: t.color || '#1fa97d',
                        borderColor: `${t.color || '#1fa97d'}40`,
                      }}
                    >
                      <span
                        className={styles.tagChipDot}
                        style={{ backgroundColor: t.color || '#1fa97d' }}
                      />
                      <span>{t.name}</span>
                      <button
                        type="button"
                        className={styles.tagChipRemove}
                        onClick={() => handleRemoveTag(t)}
                        title={`Remove ${t.name}`}
                        disabled={isTagUpdating}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Contact Intelligence</h4>
            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Corporate Email</span>
                <div className={styles.valueGroup}>
                  <span className={styles.value}>{lead.corporate_email || '—'}</span>
                  {lead.corporate_email && (
                    <button 
                      className={styles.copyBtn} 
                      onClick={() => copyToClipboard(lead.corporate_email, 'Email')}
                      title="Copy email"
                    >
                      {copiedField === 'Email' ? <Check size={13} className={styles.copiedIcon} /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.label}>Contact Number</span>
                <div className={styles.valueGroup}>
                  <span className={styles.value}>{lead.contact_number || '—'}</span>
                  {lead.contact_number && (
                    <button 
                      className={styles.copyBtn} 
                      onClick={() => copyToClipboard(lead.contact_number, 'Phone')}
                      title="Copy phone"
                    >
                      {copiedField === 'Phone' ? <Check size={13} className={styles.copiedIcon} /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>

              {lead.email_status && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Email Deliverability</span>
                  <span className={styles.pillBadge}>
                    <ShieldCheck size={13} /> {lead.email_status}
                  </span>
                </div>
              )}

              <div className={styles.infoRow}>
                <span className={styles.label}>Seniority Tier</span>
                <span className={styles.tierPill}>{lead.title_tier || 'Other'}</span>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Company Intelligence</h4>
            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Company Name</span>
                <span className={styles.valueStrong}>{lead.company_name || '—'}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.label}>Website & Health</span>
                <div className={styles.valueGroup}>
                  {lead.clean_root_domain ? (
                    <a 
                      href={`https://${lead.clean_root_domain}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.domainLink}
                    >
                      {lead.clean_root_domain} <ExternalLink size={12} />
                    </a>
                  ) : '—'}
                  {lead.website_status && (
                    <span className={`${styles.statusDotTag} ${lead.website_status.includes('200') ? styles.statusOk : ''}`}>
                      {lead.website_status}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.label}>Industry</span>
                <span className={styles.value}>{lead.industry_classification || '—'}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.label}>Employee Scale</span>
                <span className={styles.value}>
                  {lead.employee_headcount ? (
                    <span className={styles.headcountBadge}>
                      <Users size={13} /> {lead.employee_headcount.toLocaleString()} employees
                    </span>
                  ) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Location & Ingestion */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Location & Metadata</h4>
            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.label}>HQ Location</span>
                <div className={styles.valueGroup}>
                  <MapPin size={14} className={styles.mutedIcon} />
                  <span className={styles.value}>{lead.hq_location || '—'}</span>
                </div>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.label}>Country</span>
                <span className={styles.countryTag}>{lead.country || '—'}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.label}>Source Channel</span>
                <span className={styles.channelTag}>
                  <Tag size={12} /> {lead.ingestion_channel || 'n8n'}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.label}>Ingested At</span>
                <span className={styles.valueMuted}>
                  {new Date(lead.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Notes Management */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Prospect Notes & Log</h4>
            <div className={styles.reviewForm}>
              <Input
                as="textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Log outreach activity, meeting outcomes, or review notes here..."
                rows={4}
              />

              <div className={styles.saveActionRow}>
                <Button size="sm" onClick={() => handleSave()} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Notes'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/leads/${lead.id}`)}
            className={styles.fullPageBtn}
          >
            <span>Full Profile View</span>
            <ArrowRight size={14} />
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Trash2 size={14} />
            <span>Delete Lead</span>
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteLeadModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteLead}
        lead={lead}
        isDeleting={isDeleting}
      />
    </div>
  );
}
