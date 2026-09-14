import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Tag as TagIcon, Plus, Search, Trash2, ArrowRight, 
  Users, Check, X, AlertTriangle, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as tagsApi from '../api/tags';
import Button from '../components/ui/Button';
import styles from './TagsPage.module.css';

const PRESET_COLORS = [
  '#1fa97d', // Mint
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan / Sky
  '#3b82f6', // Blue
  '#e8724a', // Coral
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#6366f1', // Indigo
  '#64748b', // Slate
];

export default function TagsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);

  // Form state
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [newTagDesc, setNewTagDesc] = useState('');

  // Fetch only public tags
  const { data: tagsRes, isLoading } = useQuery({
    queryKey: ['tags', 'public'],
    queryFn: () => tagsApi.getTags({ type: 'public' }),
  });

  const tags = useMemo(() => {
    const raw = tagsRes?.data || [];
    // Ensure strict client-side guarantee of public-only tags
    return raw.filter((t) => t.type !== 'system');
  }, [tagsRes]);

  // Create Tag Mutation
  const createMutation = useMutation({
    mutationFn: (payload) => tagsApi.createTag(payload),
    onSuccess: (res) => {
      toast.success(`Tag '${res.data?.name || 'New Tag'}' created successfully`);
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['leadsFilters'] });
      setIsCreateOpen(false);
      setNewTagName('');
      setNewTagDesc('');
      setNewTagColor(PRESET_COLORS[0]);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to create tag';
      toast.error(msg);
    },
  });

  // Delete Tag Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => tagsApi.deleteTag(id),
    onSuccess: () => {
      toast.success('Tag deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['leadsFilters'] });
      setTagToDelete(null);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to delete tag';
      toast.error(msg);
    },
  });

  const filteredTags = useMemo(() => {
    if (!search.trim()) return tags;
    const q = search.toLowerCase();
    return tags.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.slug?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    );
  }, [tags, search]);

  const totalTaggedLeads = useMemo(() => {
    return tags.reduce((acc, t) => acc + (t.leads_count || 0), 0);
  }, [tags]);

  const topTag = useMemo(() => {
    if (tags.length === 0) return null;
    return [...tags].sort((a, b) => (b.leads_count || 0) - (a.leads_count || 0))[0];
  }, [tags]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newTagName.trim()) {
      toast.error('Tag name is required');
      return;
    }
    createMutation.mutate({
      name: newTagName.trim(),
      color: newTagColor,
      description: newTagDesc.trim() || undefined,
      type: 'public',
    });
  };

  const handleViewLeads = (slug) => {
    navigate(`/leads?tag=${encodeURIComponent(slug)}`);
  };

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>Tag Management</h1>
            <span className={styles.countBadge}>
              {tags.length} {tags.length === 1 ? 'Tag' : 'Tags'}
            </span>
          </div>
          <p className={styles.pageSubtitle}>
            Organize prospects with custom public tags, color-coding, and quick segment filters.
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} size="sm">
          <Plus size={16} />
          <span>Create Tag</span>
        </Button>
      </div>

      {/* ── Summary Cards ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.mint}`}>
            <TagIcon size={22} />
          </div>
          <div>
            <span className={styles.statLabel}>Active Public Tags</span>
            <span className={styles.statValue}>{tags.length}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.violet}`}>
            <Users size={22} />
          </div>
          <div>
            <span className={styles.statLabel}>Tagged Prospects</span>
            <span className={styles.statValue}>{totalTaggedLeads.toLocaleString()}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.sky}`}>
            <Layers size={22} />
          </div>
          <div>
            <span className={styles.statLabel}>Most Active Tag</span>
            <span className={styles.statValue}>
              {topTag ? `${topTag.name} (${topTag.leads_count || 0})` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Search & Actions Bar ── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search tags by name or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Tags Grid ── */}
      {isLoading ? (
        <div className={styles.loadingState}>Loading tags…</div>
      ) : filteredTags.length === 0 ? (
        <div className={styles.emptyState}>
          {search ? 'No tags match your search query.' : 'No public tags created yet. Click "Create Tag" to get started.'}
        </div>
      ) : (
        <div className={styles.tagsGrid}>
          {filteredTags.map((tag) => {
            const tagColor = tag.color || '#1fa97d';
            return (
              <div key={tag.id} className={styles.tagCard}>
                <div>
                  <div className={styles.tagCardTop}>
                    <div className={styles.tagPillWrapper}>
                      <span className={styles.tagPill} style={{ backgroundColor: tagColor }}>
                        <span className={styles.tagDot} />
                        <span>{tag.name}</span>
                      </span>
                      <span className={styles.slugText}>#{tag.slug}</span>
                    </div>

                    <button
                      className={styles.deleteTagBtn}
                      onClick={() => setTagToDelete(tag)}
                      title={`Delete tag ${tag.name}`}
                      aria-label="Delete tag"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <p className={styles.tagDesc} title={tag.description}>
                    {tag.description || 'No description provided for this tag.'}
                  </p>
                </div>

                <div className={styles.tagCardFooter}>
                  <span className={styles.leadsCountBadge}>
                    <Users size={12} />
                    <span>{(tag.leads_count || 0).toLocaleString()} prospects</span>
                  </span>

                  <button
                    className={styles.viewLeadsBtn}
                    onClick={() => handleViewLeads(tag.slug)}
                    title={`View leads tagged ${tag.name}`}
                  >
                    <span>View Prospects</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Tag Modal ── */}
      {isCreateOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <TagIcon size={18} color="var(--primary)" />
                <h2 className={styles.modalTitle}>Create Public Tag</h2>
              </div>
              <button className={styles.closeButton} onClick={() => setIsCreateOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tag Name *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. VIP Enterprise, Q4 Priority"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Color Accent</label>
                  <div className={styles.colorSwatchesRow}>
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`${styles.colorSwatchBtn} ${newTagColor === c ? styles.active : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setNewTagColor(c)}
                        title={`Select color ${c}`}
                      >
                        {newTagColor === c && <Check size={14} />}
                      </button>
                    ))}
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      title="Custom color picker"
                      style={{
                        width: '28px',
                        height: '28px',
                        padding: 0,
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Brief description of this segment or campaign"
                    value={newTagDesc}
                    onChange={(e) => setNewTagDesc(e.target.value)}
                  />
                </div>

                <div className={styles.previewCard}>
                  <span className={styles.previewLabel}>Live Preview:</span>
                  <span
                    className={styles.tagPill}
                    style={{ backgroundColor: newTagColor || '#1fa97d' }}
                  >
                    <span className={styles.tagDot} />
                    <span>{newTagName.trim() || 'Sample Tag'}</span>
                  </span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating…' : 'Create Tag'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Tag Confirmation Modal ── */}
      {tagToDelete && (
        <div className={styles.modalOverlay} onClick={() => setTagToDelete(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <AlertTriangle size={18} color="var(--error)" />
                <h2 className={styles.modalTitle}>Delete Tag</h2>
              </div>
              <button className={styles.closeButton} onClick={() => setTagToDelete(null)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--on-surface)', lineHeight: 1.5 }}>
                Are you sure you want to delete the tag <strong>{tagToDelete.name}</strong>?
              </p>
              {(tagToDelete.leads_count || 0) > 0 && (
                <div style={{
                  background: 'var(--error-container)',
                  color: 'var(--on-error-container)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <AlertTriangle size={16} flexShrink={0} />
                  <span>
                    This tag is currently attached to <strong>{tagToDelete.leads_count}</strong> {tagToDelete.leads_count === 1 ? 'prospect' : 'prospects'}. Deleting it will detach it from all of them.
                  </span>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <Button variant="outline" size="sm" onClick={() => setTagToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteMutation.mutate(tagToDelete.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete Tag'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
