import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Key, Plus, Trash2, Copy, RotateCw, Shield, Eye, EyeOff,
  Activity, Clock, Check, X, AlertTriangle, ChevronDown, ChevronUp,
  Search, Filter, Globe, Lock, Unlock, Zap, RefreshCw, ArrowUpDown,
  CheckCircle2, XCircle, Info, Layers, Code2
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as developerApi from '../api/developer';
import Button from '../components/ui/Button';
import styles from './DeveloperPage.module.css';

// ── Available scopes matching the backend ApiScope enum ──
const ALL_SCOPES = [
  { value: 'leads:read', label: 'Leads Read', resource: 'leads', action: 'read' },
  { value: 'leads:write', label: 'Leads Write', resource: 'leads', action: 'write' },
  { value: 'leads:delete', label: 'Leads Delete', resource: 'leads', action: 'delete' },
  { value: 'leads:export', label: 'Leads Export', resource: 'leads', action: 'export' },
  { value: 'leads:import', label: 'Leads Import', resource: 'leads', action: 'import' },
  { value: 'tags:read', label: 'Tags Read', resource: 'tags', action: 'read' },
  { value: 'tags:write', label: 'Tags Write', resource: 'tags', action: 'write' },
  { value: 'tags:delete', label: 'Tags Delete', resource: 'tags', action: 'delete' },
  { value: 'stats:read', label: 'Stats Read', resource: 'stats', action: 'read' },
  { value: 'webhooks:post', label: 'Webhooks Post', resource: 'webhooks', action: 'post' },
];

const SCOPE_PRESETS = [
  { value: 'read-only', label: 'Read Only', description: 'leads:read, tags:read, stats:read, leads:export' },
  { value: 'write-only', label: 'Write Only', description: 'leads:write, leads:delete, leads:import, tags:write, tags:delete, webhooks:post' },
  { value: 'full', label: 'Full Access', description: 'All permitted scopes for your tier ceiling' },
];

const READ_SCOPES = ['leads:read', 'tags:read', 'stats:read', 'leads:export'];
const WRITE_SCOPES = ['leads:write', 'leads:delete', 'leads:import', 'tags:write', 'tags:delete', 'webhooks:post'];

// Public keys cannot have mutation or import scopes
const PUBLIC_FORBIDDEN_SCOPES = [
  'leads:write',
  'leads:delete',
  'leads:import',
  'tags:write',
  'tags:delete',
  'webhooks:post',
];

const HTTP_METHOD_COLORS = {
  GET: 'var(--primary)',
  POST: 'var(--tertiary)',
  PUT: '#8b5cf6',
  PATCH: '#f59e0b',
  DELETE: 'var(--error)',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

function statusCodeClass(code) {
  if (code >= 200 && code < 300) return 'success';
  if (code >= 300 && code < 400) return 'redirect';
  if (code >= 400 && code < 500) return 'clientError';
  return 'serverError';
}

// ═══════════════════════════════════════════════
//  Main Developer Page
// ═══════════════════════════════════════════════

export default function DeveloperPage() {
  const [activeTab, setActiveTab] = useState('keys');

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <Code2 size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Developer</h1>
            <p className={styles.pageSubtitle}>Manage API keys, monitor usage, and explore request traces</p>
          </div>
        </div>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'keys' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('keys')}
        >
          <Key size={16} />
          API Keys
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'traces' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('traces')}
        >
          <Activity size={16} />
          Request Traces
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'keys' && <ApiKeysPanel />}
        {activeTab === 'traces' && <TracesPanel />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  API Keys Panel
// ═══════════════════════════════════════════════

function ApiKeysPanel() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedKeyId, setExpandedKeyId] = useState(null);
  const [revealedKey, setRevealedKey] = useState(null); // { id, plainTextKey }

  const { data: keysData, isLoading } = useQuery({
    queryKey: ['developer', 'api-keys'],
    queryFn: developerApi.getApiKeys,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => developerApi.deleteApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developer', 'api-keys'] });
      toast.success('API key revoked successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to revoke key'),
  });

  const rotateMutation = useMutation({
    mutationFn: (id) => developerApi.rotateApiKey(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['developer', 'api-keys'] });
      setRevealedKey({ id: result.data.id, plainTextKey: result.plain_text_key });
      toast.success('Key rotated — copy the new key now!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to rotate key'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => developerApi.updateApiKey(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developer', 'api-keys'] });
      toast.success('Key status updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update key'),
  });

  const keys = keysData?.data || [];
  const meta = keysData?.meta || {};

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleDelete = (key) => {
    if (window.confirm(`Revoke "${key.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(key.id);
    }
  };

  const handleRotate = (key) => {
    if (window.confirm(`Rotate "${key.name}"? The current key will be immediately invalidated.`)) {
      rotateMutation.mutate(key.id);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading API keys…</div>;
  }

  return (
    <div className={styles.panel}>
      {/* Summary bar */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryStats}>
          <div className={styles.summaryStat}>
            <span className={styles.summaryValue}>{meta.active_keys_count ?? meta.total ?? keys.length}</span>
            <span className={styles.summaryLabel}>Active Keys</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryStat}>
            <span className={styles.summaryValue}>{meta.max_keys ?? '∞'}</span>
            <span className={styles.summaryLabel}>Max Allowed</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryStat}>
            <span className={`${styles.summaryValue} ${styles.tierBadge}`}>{meta.tier_name ?? meta.tier ?? 'developer'}</span>
            <span className={styles.summaryLabel}>Plan Tier</span>
          </div>
          {meta.rate_limit_per_minute && (
            <>
              <div className={styles.summaryDivider} />
              <div className={styles.summaryStat}>
                <span className={styles.summaryValue}>{meta.rate_limit_per_minute}/m</span>
                <span className={styles.summaryLabel}>Rate Limit</span>
              </div>
            </>
          )}
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          disabled={meta.max_keys && (meta.active_keys_count ?? keys.length) >= meta.max_keys}
          title={meta.max_keys && (meta.active_keys_count ?? keys.length) >= meta.max_keys ? 'Max API keys limit reached for your plan' : 'Create new API key'}
        >
          <Plus size={16} />
          {meta.max_keys && (meta.active_keys_count ?? keys.length) >= meta.max_keys ? 'Plan Limit Reached' : 'Create API Key'}
        </Button>
      </div>

      {/* Keys list */}
      {keys.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><Key size={40} /></div>
          <h3>No API Keys Yet</h3>
          <p>Create your first API key to start integrating with the LeadsBoard API.</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Create Your First Key
          </Button>
        </div>
      ) : (
        <div className={styles.keysList}>
          {keys.map((key) => (
            <KeyCard
              key={key.id}
              apiKey={key}
              expanded={expandedKeyId === key.id}
              onToggleExpand={() => setExpandedKeyId(expandedKeyId === key.id ? null : key.id)}
              onCopy={handleCopy}
              onDelete={() => handleDelete(key)}
              onRotate={() => handleRotate(key)}
              onToggleActive={(active) => toggleMutation.mutate({ id: key.id, is_active: active })}
              revealedKey={revealedKey?.id === key.id ? revealedKey.plainTextKey : null}
              onDismissRevealed={() => setRevealedKey(null)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateKeyModal
          tierInfo={meta}
          onClose={() => setShowCreateModal(false)}
          onCreated={(result) => {
            queryClient.invalidateQueries({ queryKey: ['developer', 'api-keys'] });
            setRevealedKey({ id: result.data.id, plainTextKey: result.plain_text_key });
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

// ── Key Card ──

function KeyCard({ apiKey, expanded, onToggleExpand, onCopy, onDelete, onRotate, onToggleActive, revealedKey, onDismissRevealed }) {
  const isPublic = apiKey.key_type === 'public';
  const TypeIcon = isPublic ? Globe : Lock;

  return (
    <div className={`${styles.keyCard} ${!apiKey.is_active ? styles.keyInactive : ''}`}>
      <div className={styles.keyCardHeader} onClick={onToggleExpand}>
        <div className={styles.keyCardLeft}>
          <div className={`${styles.keyTypeIcon} ${isPublic ? styles.keyTypePublic : styles.keyTypeSecret}`}>
            <TypeIcon size={16} />
          </div>
          <div className={styles.keyCardInfo}>
            <div className={styles.keyCardName}>
              {apiKey.name}
              {!apiKey.is_active && <span className={styles.inactiveBadge}>Inactive</span>}
            </div>
            <div className={styles.keyCardMeta}>
              <span className={`${styles.keyTypeBadge} ${isPublic ? styles.badgePublic : styles.badgeSecret}`}>
                {isPublic ? 'Public' : 'Secret'}
              </span>
              <span className={styles.keyPrefix}>{apiKey.prefix}••••••</span>
              <span className={styles.keySeparator}>·</span>
              <span className={styles.keyDate}>Created {formatDate(apiKey.created_at)}</span>
              {apiKey.last_used_at && (
                <>
                  <span className={styles.keySeparator}>·</span>
                  <span className={styles.keyLastUsed}>Last used {timeAgo(apiKey.last_used_at)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className={styles.keyCardRight}>
          <div className={styles.scopeCount}>
            <Shield size={14} />
            {apiKey.scopes?.includes('*') ? 'Full' : `${apiKey.scopes?.length ?? 0} scopes`}
          </div>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Revealed key banner */}
      {revealedKey && (
        <div className={styles.revealedKeyBanner}>
          <div className={styles.revealedKeyHeader}>
            <div className={styles.revealedKeyHeaderLeft}>
              <AlertTriangle size={16} />
              <strong>Save this key now — it won't be shown again</strong>
            </div>
            {onDismissRevealed && (
              <button
                type="button"
                className={styles.dismissBtn}
                onClick={onDismissRevealed}
                title="Dismiss key alert"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className={styles.revealedKeyValue}>
            <code>{revealedKey}</code>
            <button className={styles.copyBtn} onClick={() => onCopy(revealedKey)} title="Copy key">
              <Copy size={14} />
            </button>
          </div>
        </div>
      )}

      {expanded && (
        <div className={styles.keyCardBody}>
          {/* Scopes */}
          <div className={styles.detailSection}>
            <h4 className={styles.detailLabel}>Scopes</h4>
            <div className={styles.scopesList}>
              {apiKey.scopes?.map((scope) => (
                <span key={scope} className={styles.scopeChip}>{scope}</span>
              ))}
            </div>
          </div>

          {/* Details grid */}
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>Rate Limit</span>
              <span className={styles.detailItemValue}>
                {apiKey.rate_limit_per_minute ? `${apiKey.rate_limit_per_minute}/min` : 'Tier default'}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>Tier</span>
              <span className={styles.detailItemValue}>{apiKey.tier ?? 'developer'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>Expires</span>
              <span className={styles.detailItemValue}>
                {apiKey.expires_at ? formatDate(apiKey.expires_at) : 'Never'}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailItemLabel}>Last Used</span>
              <span className={styles.detailItemValue}>{timeAgo(apiKey.last_used_at)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.keyActions}>
            <button
              className={`${styles.actionBtn} ${styles.actionToggle}`}
              onClick={() => onToggleActive(!apiKey.is_active)}
            >
              {apiKey.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
              {apiKey.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button className={`${styles.actionBtn} ${styles.actionRotate}`} onClick={onRotate}>
              <RotateCw size={14} /> Rotate
            </button>
            <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={onDelete}>
              <Trash2 size={14} /> Revoke
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Create Key Modal ──

function CreateKeyModal({ onClose, onCreated, tierInfo }) {
  const [name, setName] = useState('');
  const [keyType, setKeyType] = useState('secret');
  const [selectedScopes, setSelectedScopes] = useState([]);
  const [usePreset, setUsePreset] = useState('');
  const [rateLimit, setRateLimit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const availableScopes = useMemo(() => {
    if (keyType === 'public') {
      return ALL_SCOPES.filter((s) => !PUBLIC_FORBIDDEN_SCOPES.includes(s.value));
    }
    return ALL_SCOPES;
  }, [keyType]);

  const isScopeAllowed = (scopeValue) => {
    if (!tierInfo?.allowed_scopes) return true;
    if (tierInfo.allowed_scopes.includes('*')) return true;
    return tierInfo.allowed_scopes.includes(scopeValue);
  };

  const isPresetAllowed = (preset) => {
    if (!tierInfo?.allowed_scopes) return true;
    if (preset === 'read-only') {
      return READ_SCOPES.some(isScopeAllowed);
    }
    if (preset === 'write-only') {
      return keyType === 'secret' && WRITE_SCOPES.some(isScopeAllowed);
    }
    if (preset === 'full') {
      return availableScopes.some((s) => isScopeAllowed(s.value));
    }
    return true;
  };

  const handlePresetChange = (preset) => {
    setUsePreset(preset);
    if (preset === 'read-only') {
      const readAllowed = availableScopes
        .filter((s) => READ_SCOPES.includes(s.value) && isScopeAllowed(s.value))
        .map((s) => s.value);
      setSelectedScopes(readAllowed);
    } else if (preset === 'write-only') {
      const writeAllowed = availableScopes
        .filter((s) => WRITE_SCOPES.includes(s.value) && isScopeAllowed(s.value))
        .map((s) => s.value);
      setSelectedScopes(writeAllowed);
    } else if (preset === 'full') {
      const fullAllowed = availableScopes
        .filter((s) => isScopeAllowed(s.value))
        .map((s) => s.value);
      setSelectedScopes(fullAllowed);
    } else {
      setSelectedScopes([]);
    }
  };

  const toggleScope = (scopeValue) => {
    setUsePreset('');
    setSelectedScopes((prev) =>
      prev.includes(scopeValue)
        ? prev.filter((s) => s !== scopeValue)
        : [...prev.filter((s) => s !== '*'), scopeValue]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        key_type: keyType,
        scopes: selectedScopes.length > 0 ? selectedScopes : undefined,
      };

      if (rateLimit) {
        const parsed = parseInt(rateLimit, 10);
        if (isNaN(parsed) || parsed < 1) {
          setError('Rate limit override must be a positive number');
          setSubmitting(false);
          return;
        }
        if (tierInfo?.rate_limit_per_minute && parsed > tierInfo.rate_limit_per_minute) {
          setError(`Rate limit override cannot exceed your plan maximum of ${tierInfo.rate_limit_per_minute} req/min`);
          setSubmitting(false);
          return;
        }
        payload.rate_limit_per_minute = parsed;
      }

      const result = await developerApi.createApiKey(payload);
      onCreated(result);
      toast.success('API key created — copy it now!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create key');
    } finally {
      setSubmitting(false);
    }
  };

  // Group scopes by resource
  const groupedScopes = useMemo(() => {
    const groups = {};
    availableScopes.forEach((s) => {
      if (!groups[s.resource]) groups[s.resource] = [];
      groups[s.resource].push(s);
    });
    return groups;
  }, [availableScopes]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Create API Key</h2>
          <button className={styles.modalClose} onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {tierInfo && (
            <div className={styles.tierCeilingBanner}>
              <div className={styles.tierCeilingTitle}>
                <Layers size={14} />
                <span>{tierInfo.tier_name || tierInfo.tier} Plan Entitlements</span>
              </div>
              <div className={styles.tierCeilingStats}>
                Limit: {tierInfo.rate_limit_per_minute ?? 60} req/min · Keys: {tierInfo.active_keys_count ?? tierInfo.total ?? 0}/{tierInfo.max_keys ?? '∞'}
              </div>
            </div>
          )}

          {error && (
            <div className={styles.formError}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {/* Name */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Key Name</label>
            <input
              className={styles.formInput}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production Backend, N8N Integration"
              required
              maxLength={100}
            />
          </div>

          {/* Key Type */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Key Type</label>
            <div className={styles.typeSelector}>
              <button
                type="button"
                className={`${styles.typeOption} ${keyType === 'secret' ? styles.typeSelected : ''}`}
                onClick={() => { setKeyType('secret'); setSelectedScopes([]); setUsePreset(''); }}
              >
                <Lock size={18} />
                <div>
                  <div className={styles.typeOptionTitle}>Secret Key</div>
                  <div className={styles.typeOptionDesc}>Full read/write access · Server-side only</div>
                </div>
              </button>
              <button
                type="button"
                className={`${styles.typeOption} ${keyType === 'public' ? styles.typeSelected : ''}`}
                onClick={() => { setKeyType('public'); setSelectedScopes([]); setUsePreset(''); }}
              >
                <Globe size={18} />
                <div>
                  <div className={styles.typeOptionTitle}>Public Key</div>
                  <div className={styles.typeOptionDesc}>Read-only access · Safe for client-side</div>
                </div>
              </button>
            </div>
          </div>

          {/* Scope Presets */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Scope Presets</label>
            <div className={styles.presetSelector}>
              {SCOPE_PRESETS.filter((p) => (keyType === 'secret' || p.value === 'read-only') && isPresetAllowed(p.value)).map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={`${styles.presetChip} ${usePreset === preset.value ? styles.presetActive : ''}`}
                  onClick={() => handlePresetChange(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                className={`${styles.presetChip} ${usePreset === '' && selectedScopes.length > 0 ? styles.presetActive : ''}`}
                onClick={() => handlePresetChange('')}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Individual Scopes */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Scopes</label>
            <div className={styles.scopesGrid}>
              {Object.entries(groupedScopes).map(([resource, scopes]) => (
                <div key={resource} className={styles.scopeGroup}>
                  <div className={styles.scopeGroupLabel}>{resource}</div>
                  <div className={styles.scopeGroupItems}>
                    {scopes.map((scope) => {
                      const allowed = isScopeAllowed(scope.value);
                      const isWildcardSelected = selectedScopes.includes('*');
                      const isChecked = allowed && (selectedScopes.includes(scope.value) || isWildcardSelected);

                      return (
                        <label
                          key={scope.value}
                          className={`${styles.scopeCheckbox} ${!allowed ? styles.scopeLocked : ''}`}
                          title={!allowed ? `Locked: '${scope.value}' requires a higher tier plan` : undefined}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={!allowed || (isWildcardSelected && scope.value !== '*')}
                            onChange={() => allowed && toggleScope(scope.value)}
                          />
                          <span className={styles.scopeCheckboxLabel}>{scope.action}</span>
                          {!allowed && (
                            <span className={styles.scopeLockedBadge}>
                              <Lock size={10} />
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rate Limit */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Rate Limit Override
              <span className={styles.formHint}>
                (optional, max {tierInfo?.rate_limit_per_minute ?? 60} req/min for your plan)
              </span>
            </label>
            <input
              className={styles.formInput}
              type="number"
              value={rateLimit}
              onChange={(e) => setRateLimit(e.target.value)}
              placeholder={`Default: ${tierInfo?.rate_limit_per_minute ?? 60} req/min`}
              min={1}
              max={tierInfo?.rate_limit_per_minute || undefined}
            />
          </div>

          <div className={styles.modalFooter}>
            <Button type="button" onClick={onClose} className={styles.btnSecondary}>Cancel</Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? 'Creating…' : 'Create Key'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  Traces Panel
// ═══════════════════════════════════════════════

function TracesPanel() {
  const [filters, setFilters] = useState({
    method: '',
    status_code: '',
    path: '',
    per_page: 25,
    page: 1,
  });
  const [expandedTraceId, setExpandedTraceId] = useState(null);

  // Fetch API keys to populate the filter dropdown
  const { data: keysData } = useQuery({
    queryKey: ['developer', 'api-keys'],
    queryFn: developerApi.getApiKeys,
  });

  const { data: tracesData, isLoading, refetch } = useQuery({
    queryKey: ['developer', 'traces', filters],
    queryFn: () => {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      return developerApi.getTraces(params);
    },
  });

  const traces = tracesData?.data || [];
  const pagination = {
    currentPage: tracesData?.current_page || 1,
    lastPage: tracesData?.last_page || 1,
    total: tracesData?.total || 0,
    perPage: tracesData?.per_page || 25,
  };

  const keys = keysData?.data || [];

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div className={styles.panel}>
      {/* Filters bar */}
      <div className={styles.tracesToolbar}>
        <div className={styles.traceFilters}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Method</label>
            <select
              className={styles.filterSelect}
              value={filters.method}
              onChange={(e) => updateFilter('method', e.target.value)}
            >
              <option value="">All</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Status</label>
            <select
              className={styles.filterSelect}
              value={filters.status_code}
              onChange={(e) => updateFilter('status_code', e.target.value)}
            >
              <option value="">All</option>
              <option value="200">200 OK</option>
              <option value="201">201 Created</option>
              <option value="401">401 Unauthorized</option>
              <option value="403">403 Forbidden</option>
              <option value="404">404 Not Found</option>
              <option value="422">422 Validation</option>
              <option value="429">429 Rate Limited</option>
              <option value="500">500 Server Error</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>API Key</label>
            <select
              className={styles.filterSelect}
              value={filters.api_key_id || ''}
              onChange={(e) => updateFilter('api_key_id', e.target.value)}
            >
              <option value="">All Keys</option>
              {keys.map((k) => (
                <option key={k.id} value={k.id}>{k.name} ({k.prefix}…)</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Path</label>
            <div className={styles.filterInputWrap}>
              <Search size={14} />
              <input
                className={styles.filterInput}
                type="text"
                placeholder="/leads, /tags…"
                value={filters.path}
                onChange={(e) => updateFilter('path', e.target.value)}
              />
            </div>
          </div>
        </div>

        <button className={styles.refreshBtn} onClick={() => refetch()} title="Refresh traces">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Results summary */}
      <div className={styles.tracesSummary}>
        <span>{pagination.total} trace{pagination.total !== 1 ? 's' : ''} found</span>
      </div>

      {/* Traces table */}
      {isLoading ? (
        <div className={styles.loading}>Loading traces…</div>
      ) : traces.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><Activity size={40} /></div>
          <h3>No Traces Found</h3>
          <p>API request traces will appear here once you start making requests with your API keys.</p>
        </div>
      ) : (
        <>
          <div className={styles.tracesTable}>
            <div className={styles.tracesTableHead}>
              <div className={styles.traceColMethod}>Method</div>
              <div className={styles.traceColPath}>Path</div>
              <div className={styles.traceColStatus}>Status</div>
              <div className={styles.traceColDuration}>Duration</div>
              <div className={styles.traceColKey}>Key</div>
              <div className={styles.traceColTime}>Time</div>
            </div>
            {traces.map((trace) => (
              <TraceRow
                key={trace.id}
                trace={trace}
                expanded={expandedTraceId === trace.id}
                onToggle={() => setExpandedTraceId(expandedTraceId === trace.id ? null : trace.id)}
                keys={keys}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.lastPage > 1 && (
            <div className={styles.tracesPagination}>
              <button
                className={styles.paginationBtn}
                disabled={pagination.currentPage <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              >
                Previous
              </button>
              <span className={styles.paginationInfo}>
                Page {pagination.currentPage} of {pagination.lastPage}
              </span>
              <button
                className={styles.paginationBtn}
                disabled={pagination.currentPage >= pagination.lastPage}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Trace Row ──

function TraceRow({ trace, expanded, onToggle, keys }) {
  const keyName = keys.find((k) => k.id === trace.api_key_id)?.name;

  return (
    <>
      <div className={styles.traceRow} onClick={onToggle}>
        <div className={styles.traceColMethod}>
          <span
            className={styles.methodBadge}
            style={{ '--method-color': HTTP_METHOD_COLORS[trace.method] || 'var(--on-surface-variant)' }}
          >
            {trace.method}
          </span>
        </div>
        <div className={styles.traceColPath}>
          <code className={styles.tracePath}>{trace.path}</code>
        </div>
        <div className={styles.traceColStatus}>
          <span className={`${styles.statusBadge} ${styles[statusCodeClass(trace.status_code)]}`}>
            {trace.status_code}
          </span>
        </div>
        <div className={styles.traceColDuration}>
          <span className={styles.durationValue}>{trace.duration_ms}ms</span>
        </div>
        <div className={styles.traceColKey}>
          <span className={styles.traceKeyName}>{keyName || trace.key_prefix || '—'}</span>
        </div>
        <div className={styles.traceColTime}>
          <span className={styles.traceTime}>{timeAgo(trace.created_at)}</span>
        </div>
      </div>

      {expanded && (
        <div className={styles.traceDetails}>
          <div className={styles.traceDetailGrid}>
            <div className={styles.traceDetailItem}>
              <span className={styles.traceDetailLabel}>Trace ID</span>
              <code className={styles.traceDetailValue}>{trace.trace_id}</code>
            </div>
            <div className={styles.traceDetailItem}>
              <span className={styles.traceDetailLabel}>IP Address</span>
              <span className={styles.traceDetailValue}>{trace.ip_address}</span>
            </div>
            <div className={styles.traceDetailItem}>
              <span className={styles.traceDetailLabel}>Route</span>
              <span className={styles.traceDetailValue}>{trace.route_name || '—'}</span>
            </div>
            <div className={styles.traceDetailItem}>
              <span className={styles.traceDetailLabel}>Timestamp</span>
              <span className={styles.traceDetailValue}>{formatDateTime(trace.created_at)}</span>
            </div>
            {trace.user_agent && (
              <div className={`${styles.traceDetailItem} ${styles.traceDetailFull}`}>
                <span className={styles.traceDetailLabel}>User Agent</span>
                <span className={styles.traceDetailValue}>{trace.user_agent}</span>
              </div>
            )}
            {trace.query_params && Object.keys(trace.query_params).length > 0 && (
              <div className={`${styles.traceDetailItem} ${styles.traceDetailFull}`}>
                <span className={styles.traceDetailLabel}>Query Params</span>
                <pre className={styles.traceDetailPre}>{JSON.stringify(trace.query_params, null, 2)}</pre>
              </div>
            )}
            {trace.request_payload && Object.keys(trace.request_payload).length > 0 && (
              <div className={`${styles.traceDetailItem} ${styles.traceDetailFull}`}>
                <span className={styles.traceDetailLabel}>Request Payload</span>
                <pre className={styles.traceDetailPre}>{JSON.stringify(trace.request_payload, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
