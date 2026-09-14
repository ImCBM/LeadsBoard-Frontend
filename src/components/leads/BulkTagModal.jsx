import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tag as TagIcon, X, Plus, Loader2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import * as leadsApi from '../../api/leads';
import * as tagsApi from '../../api/tags';
import Button from '../ui/Button';
import styles from './BulkTagModal.module.css';

export default function BulkTagModal({
  isOpen,
  onClose,
  onSuccess,
  leadIds = [],
}) {
  const [mode, setMode] = useState('add'); // 'add' | 'remove' | 'sync'
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTagName, setCustomTagName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch public tags only
  const { data: tagsRes } = useQuery({
    queryKey: ['tags', 'public'],
    queryFn: () => tagsApi.getTags({ type: 'public' }),
    enabled: isOpen,
  });

  const availableTags = useMemo(() => {
    const raw = tagsRes?.data || [];
    return raw.filter((t) => t.type !== 'system');
  }, [tagsRes]);

  if (!isOpen) return null;

  const handleAddTag = (tagName) => {
    const trimmed = tagName.trim();
    if (!trimmed) return;
    if (!selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
    }
    setCustomTagName('');
  };

  const handleRemoveTag = (tagName) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagName));
  };

  const handleSubmit = async () => {
    if (selectedTags.length === 0) {
      toast.error('Please select or specify at least one tag');
      return;
    }

    if (leadIds.length === 0) {
      toast.error('No prospects selected');
      return;
    }

    const payload = {
      lead_ids: leadIds,
    };

    if (mode === 'add') {
      payload.add_tags = selectedTags;
    } else if (mode === 'remove') {
      payload.remove_tags = selectedTags;
    } else if (mode === 'sync') {
      payload.sync_tags = selectedTags;
    }

    try {
      setIsSubmitting(true);
      const res = await leadsApi.bulkTagLeads(payload);
      const count = res.updated_count ?? leadIds.length;
      toast.success(
        `Successfully updated tags on ${count} ${count === 1 ? 'prospect' : 'prospects'}`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update tags on selected leads';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTagColor = (name) => {
    const matched = availableTags.find((t) => t.name.toLowerCase() === name.toLowerCase() || t.slug === name.toLowerCase());
    return matched?.color || '#1fa97d';
  };

  return (
    <div className={styles.modalOverlay} onClick={isSubmitting ? undefined : onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <TagIcon size={18} color="var(--primary)" />
            <h2 className={styles.modalTitle}>Bulk Tag Prospects</h2>
          </div>
          {!isSubmitting && (
            <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <div className={styles.selectionInfo}>
            <Users size={16} />
            <span>
              Targeting <span className={styles.selectionCount}>{leadIds.length}</span> {leadIds.length === 1 ? 'selected prospect' : 'selected prospects'}
            </span>
          </div>

          {/* Mode Selector */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tag Operation</label>
            <div className={styles.modeSelector}>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === 'add' ? styles.active : ''}`}
                onClick={() => setMode('add')}
              >
                Add Tags
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === 'remove' ? styles.active : ''}`}
                onClick={() => setMode('remove')}
              >
                Remove Tags
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === 'sync' ? styles.active : ''}`}
                onClick={() => setMode('sync')}
              >
                Sync (Overwrite)
              </button>
            </div>
            <p className={styles.fieldHint}>
              {mode === 'add' && 'Attaches tags to the selected leads without affecting any existing tags.'}
              {mode === 'remove' && 'Detaches the specified tags from the selected leads.'}
              {mode === 'sync' && 'Replaces all tags on the selected leads with exactly this set.'}
            </p>
          </div>

          {/* Selected Tags Display */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {mode === 'remove' ? 'Tags to Detach' : 'Tags to Apply'}
            </label>
            <div className={styles.selectedChips}>
              {selectedTags.length === 0 ? (
                <span className={styles.emptyChipsText}>
                  {mode === 'remove' ? 'Select tags to remove below…' : 'Select public tags below or type a new one…'}
                </span>
              ) : (
                selectedTags.map((tagName) => (
                  <span
                    key={tagName}
                    className={styles.tagChip}
                    style={{ backgroundColor: getTagColor(tagName) }}
                  >
                    <span>{tagName}</span>
                    <button
                      type="button"
                      className={styles.removeChipBtn}
                      onClick={() => handleRemoveTag(tagName)}
                      title={`Remove ${tagName}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Quick Select Available Public Tags */}
          {availableTags.length > 0 && (
            <div className={styles.formGroup}>
              <span className={styles.availableTagsTitle}>Select from Public Tags</span>
              <div className={styles.availableTagsList}>
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.name);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={`${styles.availableTagPill} ${isSelected ? styles.selected : ''}`}
                      onClick={() => handleAddTag(tag.name)}
                    >
                      <span className={styles.colorDot} style={{ backgroundColor: tag.color || '#1fa97d' }} />
                      <span>{tag.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Tag Input (for adding/syncing) */}
          {mode !== 'remove' && (
            <div className={styles.formGroup}>
              <span className={styles.availableTagsTitle}>Add Custom / New Tag</span>
              <div className={styles.customTagRow}>
                <input
                  type="text"
                  className={styles.customTagInput}
                  placeholder="Type tag name and press Add…"
                  value={customTagName}
                  onChange={(e) => setCustomTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(customTagName);
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => handleAddTag(customTagName)}
                  disabled={!customTagName.trim()}
                >
                  <Plus size={14} />
                  <span>Add</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || selectedTags.length === 0}>
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="spin" />
                <span>Applying…</span>
              </>
            ) : (
              <span>Apply to {leadIds.length} {leadIds.length === 1 ? 'Prospect' : 'Prospects'}</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
