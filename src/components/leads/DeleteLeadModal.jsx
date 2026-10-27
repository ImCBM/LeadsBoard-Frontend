import { useState, useEffect } from 'react';
import { Trash2, ShieldCheck, X, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import styles from './DeleteLeadModal.module.css';

export default function DeleteLeadModal({
  isOpen,
  onClose,
  onConfirm,
  lead = null,
  leadIds = [],
  leadsPreview = [],
  isDeleting = false,
}) {
  const [confirmText, setConfirmText] = useState('');

  // Reset input when opening
  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
    }
  }, [isOpen]);

  // Handle ESC key
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

  const isBulk = leadIds.length > 1 || (!lead && leadIds.length === 1);
  const targetCount = isBulk ? leadIds.length : 1;
  const isTypeConfirmed = !isBulk || confirmText.trim().toUpperCase() === 'DELETE';

  const handleConfirm = () => {
    if (!isTypeConfirmed || isDeleting) return;
    onConfirm(lead ? lead.id : leadIds);
  };

  return (
    <div className={styles.modalOverlay} onClick={isDeleting ? undefined : onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.dangerIconWrapper}>
            <Trash2 size={20} />
          </div>
          <div className={styles.headerText}>
            <h2 className={styles.modalTitle}>
              {isBulk ? `Delete ${targetCount} Leads` : 'Delete Lead'}
            </h2>
            <p className={styles.modalSubtitle}>
              Permanent deletion confirmation
            </p>
          </div>
          {!isDeleting && (
            <button className={styles.closeButton} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Target preview card */}
          {!isBulk && lead ? (
            <div className={styles.targetCard}>
              <div className={styles.targetName}>{lead.full_name}</div>
              <div className={styles.targetMeta}>
                <span><strong>Role:</strong> {lead.job_title || '—'} at {lead.company_name || 'Unknown Company'}</span>
                <span><strong>Email:</strong> {lead.corporate_email || '—'}</span>
                {lead.contact_number && <span><strong>Phone:</strong> {lead.contact_number}</span>}
              </div>
            </div>
          ) : (
            <div className={styles.targetCard}>
              <div className={styles.targetName}>
                {targetCount} {targetCount === 1 ? 'lead' : 'leads'} selected for deletion
              </div>
              {leadsPreview.length > 0 && (
                <div className={styles.previewList}>
                  {leadsPreview.slice(0, 6).map((item) => (
                    <span key={item.id} className={styles.previewPill} title={item.full_name || item.corporate_email}>
                      {item.full_name || item.corporate_email}
                    </span>
                  ))}
                  {leadsPreview.length > 6 && (
                    <span className={styles.previewPill}>+{leadsPreview.length - 6} more</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Plain language explanation */}
          <p className={styles.plainExplanation}>
            {isBulk
              ? `You are about to permanently remove these ${targetCount} people from your leads pipeline.`
              : `This person will be permanently removed from your leads pipeline.`}
            {' '}There is no recycle bin or undo button.
          </p>

          {/* Safety guarantee */}
          <div className={styles.safeNotice}>
            <ShieldCheck size={16} />
            <span>
              <strong>Company data is safe:</strong> Company profiles, website domains, and industry categories will remain saved in your database so other records aren't affected.
            </span>
          </div>

          {/* Type-to-confirm for bulk actions */}
          {isBulk && (
            <div className={styles.confirmBox}>
              <label htmlFor="confirmInput" className={styles.confirmLabel}>
                To confirm deletion of {targetCount} leads, type <strong>DELETE</strong> below:
              </label>
              <input
                id="confirmInput"
                type="text"
                className={styles.confirmInput}
                placeholder="Type DELETE to confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isDeleting}
                autoFocus
              />
            </div>
          )}
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
            onClick={handleConfirm}
            disabled={!isTypeConfirmed || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Deleting…</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>
                  {isBulk ? `Permanently Delete ${targetCount} Leads` : 'Permanently Delete Lead'}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
