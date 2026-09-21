import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Tag as TagIcon, Plus, Search, Trash2, ArrowRight, 
  Users, Check, X, AlertTriangle, Layers, Sparkles,
  LayoutGrid, List, Copy, ArrowUpDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as tagsApi from '../api/tags';
import Button from '../components/ui/Button';
import styles from './TagsPage.module.css';

const PRESET_COLORS = [
  { hex: '#1fa97d', name: 'Mint Green' },
  { hex: '#10b981', name: 'Emerald' },
  { hex: '#6366f1', name: 'Indigo' },
  { hex: '#8b5cf6', name: 'Violet' },
  { hex: '#06b6d4', name: 'Cyan' },
  { hex: '#3b82f6', name: 'Ocean Blue' },
  { hex: '#e8724a', name: 'Coral' },
  { hex: '#f59e0b', name: 'Amber Gold' },
  { hex: '#f43f5e', name: 'Rose Red' },
  { hex: '#64748b', name: 'Slate' },
];

const STARTER_TEMPLATES = [
  {
    name: 'VIP Account',
    color: '#f59e0b',
    description: 'High-value enterprise accounts requiring priority executive outreach.',
    badge: '⭐ VIP',
  },
  {
    name: 'Hot Prospect',
    color: '#f43f5e',
    description: 'High-intent leads ready for immediate sales contact and demo scheduling.',
    badge: '🔥 Hot',
  },
  {
    name: 'Enterprise Tier',
    color: '#6366f1',
    description: 'Large corporate organizations with 500+ employee scale.',
    badge: '🏢 Enterprise',
  },
  {
    name: 'Decision Maker',
    color: '#8b5cf6',
    description: 'C-Suite, VP, and Director-level executives with purchasing power.',
    badge: '🎯 C-Level',
  },
  {
    name: 'Needs Follow-Up',
    color: '#06b6d4',
    description: 'Prospects requiring callback, email re-engagement, or touchpoint.',
    badge: '📞 Follow-Up',
  },
  {
    name: 'Q4 Priority',
    color: '#10b981',
    description: 'Key accounts targeted for active quarterly sales cycle closing.',
    badge: '🚀 Q4 Target',
  },
];

export default function TagsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Search & Filtering
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('leads_count'); // 'leads_count' | 'name' | 'newest'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [copiedSlug, setCopiedSlug] = useState(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);

  // Form state
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0].hex);
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
      toast.success(`Tag "${res.data?.name || 'New Tag'}" created successfully`);
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['leadsFilters'] });
      setIsCreateOpen(false);
      setNewTagName('');
      setNewTagDesc('');
      setNewTagColor(PRESET_COLORS[0].hex);
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

  // Sort & Filter
  const filteredTags = useMemo(() => {
    let result = [...tags];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.slug?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'leads_count') {
      result.sort((a, b) => (b.leads_count || 0) - (a.leads_count || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return result;
  }, [tags, search, sortBy]);

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

  const handleApplyTemplate = (template) => {
    // Check if tag with same name already exists
    const exists = tags.some((t) => t.name.toLowerCase() === template.name.toLowerCase());
    if (exists) {
      toast('A tag with this name already exists.', { icon: 'ℹ️' });
      return;
    }
    createMutation.mutate({
      name: template.name,
      color: template.color,
      description: template.description,
      type: 'public',
    });
  };

  const handleSelectTemplateForModal = (template) => {
    setNewTagName(template.name);
    setNewTagColor(template.color);
    setNewTagDesc(template.description);
  };

  const handleCopySlug = (slug) => {
    navigator.clipboard.writeText(slug);
    setCopiedSlug(slug);
    toast.success(`Copied #${slug}`);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleViewLeads = (slug) => {
    navigate(`/leads?tag=${encodeURIComponent(slug)}`);
  };

  return (
    <div className={styles.page}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            <div className={styles.headerIconBadge}>
              <TagIcon size={20} />
            </div>
            <h1 className={styles.pageTitle}>Tag Management</h1>
            <span className={styles.countBadge}>
              {tags.length} {tags.length === 1 ? 'Public Tag' : 'Public Tags'}
            </span>
          </div>
          <p className={styles.pageSubtitle}>
            Create color-coded segments to organize executive prospects, track campaigns, and apply laser-targeted bulk actions.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Button onClick={() => setIsCreateOpen(true)} size="sm" className={styles.createBtn}>
            <Plus size={16} />
            <span>Create Tag</span>
          </Button>
        </div>
      </div>

      {/* ── Summary KPI Cards ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.mint}`}>
            <TagIcon size={22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Active Public Tags</span>
            <span className={styles.statValue}>{tags.length}</span>
            <span className={styles.statHint}>Available for pipeline filtering</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.violet}`}>
            <Users size={22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Tagged Prospects</span>
            <span className={styles.statValue}>{totalTaggedLeads.toLocaleString()}</span>
            <span className={styles.statHint}>Across all pipeline stages</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.sky}`}>
            <Layers size={22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Most Active Tag</span>
            <span className={styles.statValue} title={topTag?.name}>
              {topTag ? topTag.name : '—'}
            </span>
            <span className={styles.statHint}>
              {topTag ? `${topTag.leads_count || 0} prospects attached` : 'No tags assigned yet'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Toolbar: Search, Sort & View Mode ── */}
      {tags.length > 0 && (
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search tags by name, slug, or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                className={styles.searchClearBtn} 
                onClick={() => setSearch('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className={styles.toolbarRight}>
            {/* Sort Selector */}
            <div className={styles.sortSelectWrapper}>
              <ArrowUpDown size={14} className={styles.sortIcon} />
              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="leads_count">Most Prospects</option>
                <option value="name">Name (A – Z)</option>
                <option value="newest">Recently Created</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className={styles.viewModeGroup}>
              <button
                type="button"
                className={`${styles.viewModeBtn} ${viewMode === 'grid' ? styles.viewModeActive : ''}`}
                onClick={() => setViewMode('grid')}
                title="Cards Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                className={`${styles.viewModeBtn} ${viewMode === 'table' ? styles.viewModeActive : ''}`}
                onClick={() => setViewMode('table')}
                title="Compact List View"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content Area ── */}
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Loading public tags…</p>
        </div>
      ) : tags.length === 0 ? (
        /* ── Rich Empty State with Starter Templates ── */
        <div className={styles.emptyContainer}>
          <div className={styles.emptyHeroCard}>
            <div className={styles.emptyIconCircle}>
              <Sparkles size={28} />
            </div>
            <h2 className={styles.emptyTitle}>Segment & Organize Your Pipeline</h2>
            <p className={styles.emptyDesc}>
              Tags help you classify executive leads by deal size, campaign origin, or outreach priority. 
              Get started by creating a custom tag or select from our curated starter kit below.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} size="md" className={styles.emptyCtaBtn}>
              <Plus size={16} />
              <span>Create Your First Tag</span>
            </Button>
          </div>

          {/* Starter Kit Section */}
          <div className={styles.starterSection}>
            <div className={styles.starterHeader}>
              <h3 className={styles.starterTitle}>One-Click Starter Kit</h3>
              <span className={styles.starterSubtitle}>
                Add common sales & marketing tags with pre-configured color palettes:
              </span>
            </div>

            <div className={styles.starterGrid}>
              {STARTER_TEMPLATES.map((tmpl) => {
                const isAdding = createMutation.isPending && createMutation.variables?.name === tmpl.name;
                return (
                  <div key={tmpl.name} className={styles.starterCard}>
                    <div className={styles.starterTopRow}>
                      <span 
                        className={styles.starterBadge}
                        style={{
                          backgroundColor: `${tmpl.color}18`,
                          color: tmpl.color,
                          borderColor: `${tmpl.color}40`,
                        }}
                      >
                        <span className={styles.tagDot} style={{ backgroundColor: tmpl.color }} />
                        <span>{tmpl.name}</span>
                      </span>
                    </div>
                    <p className={styles.starterCardDesc}>{tmpl.description}</p>
                    <button
                      type="button"
                      className={styles.starterAddBtn}
                      onClick={() => handleApplyTemplate(tmpl)}
                      disabled={isAdding}
                    >
                      <Plus size={13} />
                      <span>{isAdding ? 'Adding…' : 'Add Tag'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : filteredTags.length === 0 ? (
        /* Search Empty State */
        <div className={styles.searchEmptyCard}>
          <Search size={32} className={styles.searchEmptyIcon} />
          <h3>No tags match "{search}"</h3>
          <p>Try searching for a different keyword or slug, or clear your search query.</p>
          <Button variant="outline" size="sm" onClick={() => setSearch('')}>
            Clear Search
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Cards Grid View ── */
        <div className={styles.tagsGrid}>
          {filteredTags.map((tag) => {
            const tagColor = tag.color || '#1fa97d';
            return (
              <div 
                key={tag.id} 
                className={styles.tagCard}
                style={{ '--tag-accent': tagColor }}
              >
                {/* Colored Top Accent Stripe */}
                <div className={styles.cardAccentBar} style={{ backgroundColor: tagColor }} />

                <div className={styles.cardBody}>
                  <div className={styles.tagCardTop}>
                    <div className={styles.tagBadgeWrapper}>
                      <span 
                        className={styles.tagPill}
                        style={{
                          backgroundColor: `${tagColor}16`,
                          color: tagColor,
                          borderColor: `${tagColor}40`,
                        }}
                      >
                        <span className={styles.tagDot} style={{ backgroundColor: tagColor }} />
                        <span>{tag.name}</span>
                      </span>
                    </div>

                    <button
                      className={styles.deleteTagBtn}
                      onClick={() => setTagToDelete(tag)}
                      title={`Delete tag "${tag.name}"`}
                      aria-label="Delete tag"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Slug Pill */}
                  <div className={styles.slugRow}>
                    <button
                      type="button"
                      className={styles.slugChip}
                      onClick={() => handleCopySlug(tag.slug)}
                      title="Click to copy slug"
                    >
                      <span>#{tag.slug}</span>
                      {copiedSlug === tag.slug ? (
                        <Check size={11} className={styles.copiedGreen} />
                      ) : (
                        <Copy size={11} className={styles.copySlugIcon} />
                      )}
                    </button>
                  </div>

                  <p className={styles.tagDesc} title={tag.description}>
                    {tag.description || 'No description provided for this tag segment.'}
                  </p>
                </div>

                {/* Card Footer */}
                <div className={styles.tagCardFooter}>
                  <div className={styles.leadsCountBadge}>
                    <Users size={12} />
                    <span>
                      <strong>{(tag.leads_count || 0).toLocaleString()}</strong> {tag.leads_count === 1 ? 'prospect' : 'prospects'}
                    </span>
                  </div>

                  <button
                    className={styles.viewLeadsBtn}
                    onClick={() => handleViewLeads(tag.slug)}
                    title={`View prospects tagged "${tag.name}"`}
                  >
                    <span>View Prospects</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Table / List View ── */
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tag</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Prospects</th>
                <th className={styles.tableActionsTh}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTags.map((tag) => {
                const tagColor = tag.color || '#1fa97d';
                return (
                  <tr key={tag.id} className={styles.tableRow}>
                    <td>
                      <span 
                        className={styles.tableTagPill}
                        style={{
                          backgroundColor: `${tagColor}16`,
                          color: tagColor,
                          borderColor: `${tagColor}40`,
                        }}
                      >
                        <span className={styles.tagDot} style={{ backgroundColor: tagColor }} />
                        <span>{tag.name}</span>
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.slugChip}
                        onClick={() => handleCopySlug(tag.slug)}
                        title="Copy slug"
                      >
                        <span>#{tag.slug}</span>
                        {copiedSlug === tag.slug ? <Check size={11} className={styles.copiedGreen} /> : <Copy size={11} />}
                      </button>
                    </td>
                    <td className={styles.tableDescCell}>
                      {tag.description || <span className={styles.mutedText}>—</span>}
                    </td>
                    <td>
                      <span className={styles.tableProspectsCount}>
                        <Users size={12} />
                        <span>{(tag.leads_count || 0).toLocaleString()}</span>
                      </span>
                    </td>
                    <td>
                      <div className={styles.tableRowActions}>
                        <button
                          className={styles.viewLeadsBtnSmall}
                          onClick={() => handleViewLeads(tag.slug)}
                          title={`View prospects tagged "${tag.name}"`}
                        >
                          <span>Filter</span>
                          <ArrowRight size={11} />
                        </button>
                        <button
                          className={styles.deleteTagBtn}
                          onClick={() => setTagToDelete(tag)}
                          title="Delete tag"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create Tag Modal with Live Preview ── */}
      {isCreateOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div className={styles.modalIconBadge}>
                  <TagIcon size={18} />
                </div>
                <div>
                  <h2 className={styles.modalTitle}>Create Public Tag</h2>
                  <p className={styles.modalSubtitle}>
                    Public tags are shared across your team to segment leads and drive campaign workflows.
                  </p>
                </div>
              </div>
              <button className={styles.closeButton} onClick={() => setIsCreateOpen(false)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className={styles.modalBody}>
                {/* Starter Suggestions Pills */}
                <div className={styles.suggestionBlock}>
                  <span className={styles.suggestionLabel}>Quick Templates:</span>
                  <div className={styles.suggestionChipsRow}>
                    {STARTER_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.name}
                        type="button"
                        className={styles.suggestionChip}
                        onClick={() => handleSelectTemplateForModal(tmpl)}
                        title={`Use "${tmpl.name}" template`}
                      >
                        <span className={styles.suggestionDot} style={{ backgroundColor: tmpl.color }} />
                        <span>{tmpl.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tag Name */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tag Name *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Enterprise Tier, High Priority, Q4 Inbound"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                {/* Color Selection */}
                <div className={styles.formGroup}>
                  <div className={styles.colorHeaderRow}>
                    <label className={styles.formLabel} style={{ margin: 0 }}>Color Theme</label>
                    <span className={styles.selectedHexBadge} style={{ color: newTagColor }}>
                      {newTagColor.toUpperCase()}
                    </span>
                  </div>
                  <div className={styles.colorSwatchesRow}>
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        className={`${styles.colorSwatchBtn} ${newTagColor === c.hex ? styles.activeSwatch : ''}`}
                        style={{ backgroundColor: c.hex }}
                        onClick={() => setNewTagColor(c.hex)}
                        title={c.name}
                      >
                        {newTagColor === c.hex && <Check size={14} className={styles.checkIcon} />}
                      </button>
                    ))}
                    {/* Custom Native Color Input */}
                    <div className={styles.customColorPickerWrapper} title="Pick custom color">
                      <input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className={styles.customColorInput}
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description (Optional)</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Describe how or when sales reps should attach this tag..."
                    value={newTagDesc}
                    onChange={(e) => setNewTagDesc(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* ── Interactive Live Preview ── */}
                <div className={styles.livePreviewContainer}>
                  <span className={styles.previewHeaderLabel}>Live Visual Preview</span>
                  <div className={styles.previewCardDisplay}>
                    <div className={styles.previewLeadHeader}>
                      <div className={styles.previewAvatar}>JD</div>
                      <div className={styles.previewLeadInfo}>
                        <span className={styles.previewLeadName}>Jane Doe · VP of Growth</span>
                        <span className={styles.previewLeadCompany}>Acme Systems · 1,200 emp</span>
                      </div>
                    </div>
                    <div className={styles.previewTagsRow}>
                      <span 
                        className={styles.previewTagPill}
                        style={{
                          backgroundColor: `${newTagColor || '#1fa97d'}18`,
                          color: newTagColor || '#1fa97d',
                          borderColor: `${newTagColor || '#1fa97d'}40`,
                        }}
                      >
                        <span className={styles.tagDot} style={{ backgroundColor: newTagColor || '#1fa97d' }} />
                        <span>{newTagName.trim() || 'New Tag'}</span>
                      </span>
                    </div>
                  </div>
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

      {/* ── Delete Confirmation Modal ── */}
      {tagToDelete && (
        <div className={styles.modalOverlay} onClick={() => setTagToDelete(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div className={`${styles.modalIconBadge} ${styles.dangerBadge}`}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h2 className={styles.modalTitle}>Delete Tag</h2>
                  <p className={styles.modalSubtitle}>This action permanently removes this public tag.</p>
                </div>
              </div>
              <button className={styles.closeButton} onClick={() => setTagToDelete(null)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.deleteConfirmPrompt}>
                Are you sure you want to delete the public tag <strong>"{tagToDelete.name}"</strong>?
              </p>

              {(tagToDelete.leads_count || 0) > 0 && (
                <div className={styles.deleteWarningBox}>
                  <AlertTriangle size={18} className={styles.warningIcon} />
                  <div>
                    <strong>{tagToDelete.leads_count} {tagToDelete.leads_count === 1 ? 'prospect is' : 'prospects are'} currently tagged.</strong>
                    <p className={styles.warningSubtext}>
                      Deleting this tag will safely detach it from all prospects without deleting any prospect records.
                    </p>
                  </div>
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
