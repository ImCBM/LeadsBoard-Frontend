import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import * as leadsApi from '../api/leads';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import StatusBadge from '../components/ui/StatusBadge';
import DeleteLeadModal from '../components/leads/DeleteLeadModal';
import styles from './LeadDetailPage.module.css';

const STATUS_OPTIONS = ['new', 'reviewed', 'qualified', 'rejected'];

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const data = await leadsApi.getLead(id);
        const leadData = data.data || data;
        setLead(leadData);
        setEditStatus(leadData.status || 'new');
        setEditNotes(leadData.notes || '');
      } catch (err) {
        toast.error('Failed to load lead');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await leadsApi.updateLead(id, {
        status: editStatus,
        notes: editNotes,
      });
      const updated = data.data || data;
      setLead(updated);
      toast.success('Lead updated successfully');
    } catch {
      toast.error('Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await leadsApi.deleteLead(id);
      toast.success('Lead deleted');
      navigate('/leads', { replace: true });
    } catch {
      toast.error('Failed to delete lead');
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading lead…</div>;
  }

  if (!lead) {
    return <div className={styles.loading}>Lead not found.</div>;
  }

  const DetailField = ({ label, value, href }) => (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {href && value ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={styles.link}>
          {value} <ExternalLink size={12} style={{ verticalAlign: 'middle' }} />
        </a>
      ) : (
        <span className={styles.fieldValue}>{value || '—'}</span>
      )}
    </div>
  );

  return (
    <div className={styles.page}>
      {/* Back */}
      <Link to="/leads" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to Leads
      </Link>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.name}>{lead.full_name}</h1>
          <p className={styles.subtitle}>
            {lead.job_title} at {lead.company_name}
          </p>
        </div>
        <div className={styles.headerActions}>
          <StatusBadge status={lead.status} />
          <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
            <Trash2 size={14} /> Delete
          </Button>
        </div>
      </div>

      {/* Detail Grid */}
      <div className={styles.grid}>
        {/* Contact Info */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Contact Information</h3>
          <div className={styles.fieldList}>
            <DetailField label="Full Name" value={lead.full_name} />
            <DetailField label="Job Title" value={lead.job_title} />
            <DetailField label="Title Tier" value={lead.title_tier} />
            <DetailField label="Corporate Email" value={lead.corporate_email} href={`mailto:${lead.corporate_email}`} />
            <DetailField label="Contact Number" value={lead.contact_number} href={lead.contact_number ? `tel:${lead.contact_number}` : null} />
            <DetailField label="Email Status" value={lead.email_status} />
            <DetailField label="Executive LinkedIn" value={lead.executive_linkedin_url} href={lead.executive_linkedin_url} />
          </div>
        </div>

        {/* Company Info */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Company Information</h3>
          <div className={styles.fieldList}>
            <DetailField label="Company Name" value={lead.company_name} />
            <DetailField label="Root Domain" value={lead.clean_root_domain} href={`https://${lead.clean_root_domain}`} />
            <DetailField label="Website Status" value={lead.website_status} />
            <DetailField label="Company LinkedIn" value={lead.company_linkedin_page} href={lead.company_linkedin_page} />
            <DetailField label="Industry" value={lead.industry_classification} />
            <DetailField label="Employees" value={lead.employee_headcount?.toLocaleString()} />
          </div>
        </div>

        {/* Location & Meta */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Location & Metadata</h3>
          <div className={styles.fieldList}>
            <DetailField label="HQ Location" value={lead.hq_location} />
            <DetailField label="Country" value={lead.country} />
            <DetailField label="Ingestion Channel" value={lead.ingestion_channel} />
            <DetailField label="Created At" value={new Date(lead.created_at).toLocaleString()} />
            <DetailField label="Updated At" value={new Date(lead.updated_at).toLocaleString()} />
          </div>
        </div>

        {/* Edit Status & Notes */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Review & Notes</h3>
          <div className={styles.editSection}>
            <Input
              as="select"
              label="Status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </Input>
            <Input
              as="textarea"
              label="Notes"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Add review notes…"
              rows={4}
              style={{ resize: 'vertical' }}
            />
            <div className={styles.editActions}>
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteLeadModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        lead={lead}
        isDeleting={deleting}
      />
    </div>
  );
}
