import { useState } from 'react';
import { 
  Mail, Copy, Check, Globe, ExternalLink, MapPin, 
  Users, Eye, Building2, ShieldCheck, Sparkles 
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../ui/StatusBadge';
import styles from './LeadCard.module.css';

const LinkedInIcon = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45c-.88 0-1.6.72-1.6 1.6s.72 1.6 1.6 1.6c.88 0 1.6-.72 1.6-1.6s-.72-1.6-1.6-1.6Z"/>
  </svg>
);

export default function LeadCard({ lead, onSelect, isSelected }) {
  const [copied, setCopied] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'LD';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleCopyEmail = (e) => {
    e.stopPropagation();
    if (!lead.corporate_email) return;
    navigator.clipboard.writeText(lead.corporate_email);
    setCopied(true);
    toast.success('Email copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const getTierClass = (tier) => {
    // Follows JobBoard-design.md: Role/tier labels use neutral Surface-Container-High
    return styles.tierNeutral;
  };

  return (
    <div 
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
      onClick={() => onSelect(lead)}
    >
      {/* Top Header */}
      <div className={styles.header}>
        <div className={styles.avatar}>
          {getInitials(lead.full_name)}
        </div>
        <div className={styles.leadInfo}>
          <div className={styles.nameRow}>
            <h3 className={styles.leadName} title={lead.full_name}>
              {lead.full_name}
            </h3>
            {lead.title_tier && (
              <span className={`${styles.tierBadge} ${getTierClass(lead.title_tier)}`}>
                {lead.title_tier}
              </span>
            )}
          </div>
          <p className={styles.jobTitle} title={lead.job_title}>
            {lead.job_title || 'Executive Lead'}
          </p>
        </div>
        <div className={styles.statusWrap}>
          <StatusBadge status={lead.status} />
        </div>
      </div>

      {/* Company Section */}
      <div className={styles.companyBox}>
        <div className={styles.companyHeader}>
          <Building2 size={15} className={styles.companyIcon} />
          <span className={styles.companyName} title={lead.company_name}>
            {lead.company_name || 'Unknown Company'}
          </span>
        </div>

        {lead.clean_root_domain && (
          <div className={styles.domainRow}>
            <a 
              href={`https://${lead.clean_root_domain}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={styles.domainLink}
              title={`Visit ${lead.clean_root_domain}`}
            >
              <Globe size={12} />
              <span>{lead.clean_root_domain}</span>
              <ExternalLink size={10} />
            </a>
            {lead.website_status && (
              <span className={`${styles.webBadge} ${lead.website_status.includes('200') ? styles.webBadgeOk : ''}`}>
                {lead.website_status.includes('200') ? '200 OK' : lead.website_status}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Intelligence Badges */}
      <div className={styles.metaRow}>
        {lead.industry_classification && (
          <span className={styles.metaChip} title={`Industry: ${lead.industry_classification}`}>
            {lead.industry_classification}
          </span>
        )}

        {lead.employee_headcount && (
          <span className={`${styles.metaChip} ${styles.headcountChip}`} title="Employee scale">
            <Users size={12} />
            <span>{lead.employee_headcount.toLocaleString()} emp</span>
          </span>
        )}

        {(lead.hq_location || lead.country) && (
          <span className={styles.metaChip} title={`Location: ${lead.hq_location || lead.country}`}>
            <MapPin size={12} />
            <span>{lead.country || lead.hq_location}</span>
          </span>
        )}
      </div>

      {/* Footer & Direct Actions */}
      <div className={styles.footer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.contactGroup}>
          {lead.corporate_email ? (
            <button 
              className={`${styles.emailBtn} ${copied ? styles.emailBtnCopied : ''}`}
              onClick={handleCopyEmail}
              title="Click to copy email address"
            >
              {copied ? <Check size={13} /> : <Mail size={13} />}
              <span className={styles.emailText}>{lead.corporate_email}</span>
              <span className={styles.copyHint}>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          ) : (
            <span className={styles.noEmail}>No email</span>
          )}
        </div>

        <div className={styles.actionIcons}>
          {lead.executive_linkedin_url && (
            <a 
              href={lead.executive_linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.iconBtn}
              title="Executive LinkedIn"
            >
              <LinkedInIcon size={14} />
            </a>
          )}

          {lead.company_linkedin_page && (
            <a 
              href={lead.company_linkedin_page}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.iconBtn}
              title="Company LinkedIn"
            >
              <Building2 size={14} />
            </a>
          )}

          <button 
            className={`${styles.iconBtn} ${styles.viewBtn}`}
            onClick={() => onSelect(lead)}
            title="Inspect & Review Lead"
          >
            <Eye size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
