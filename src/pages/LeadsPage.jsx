import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Download, ArrowUpDown, ArrowUp, ArrowDown, 
  ExternalLink, Mail, Copy, Check, Users, MapPin, 
  Globe, SlidersHorizontal, Eye, X, Filter, Sparkles, Building2,
  LayoutGrid, Table as TableIcon, HelpCircle, ChevronDown, RotateCcw
} from 'lucide-react';

const LinkedInIcon = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45c-.88 0-1.6.72-1.6 1.6s.72 1.6 1.6 1.6c.88 0 1.6-.72 1.6-1.6s-.72-1.6-1.6-1.6Z"/>
  </svg>
);

import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as leadsApi from '../api/leads';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import LeadDrawer from '../components/leads/LeadDrawer';
import LeadCard from '../components/leads/LeadCard';
import LeadSkeleton from '../components/leads/LeadSkeleton';
import AdvancedFilterModal from '../components/leads/AdvancedFilterModal';
import styles from './LeadsPage.module.css';

const DEFAULT_VISIBLE_COLUMNS = {
  name: true,
  company: true,
  role: true,
  industry: true,
  location: true,
  contact: true,
  status: true,
  date: true,
  actions: true,
};

const STATUS_TABS = [
  { key: '', label: 'All Leads' },
  { key: 'new', label: 'New' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'rejected', label: 'Rejected' },
];

const TIER_SHORTCUTS = [
  { key: '', label: 'All Tiers' },
  { key: 'C-Level', label: 'C-Level' },
  { key: 'VP-Level', label: 'VP-Level' },
  { key: 'Director-Level', label: 'Director' },
];

export default function LeadsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [titleTier, setTitleTier] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [channel, setChannel] = useState('');
  const [headcountRange, setHeadcountRange] = useState('');
  const [websiteStatus, setWebsiteStatus] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Sorting & Pagination
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  // UI state
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);

  // Debounced search
  const debounceRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Construct request parameters
  const params = {
    page,
    sort_by: sortBy,
    sort_dir: sortDir,
    per_page: viewMode === 'cards' ? 24 : 25,
  };
  if (debouncedSearch) params.search = debouncedSearch;
  if (status) params.status = status;
  if (titleTier) params.title_tier = titleTier;
  if (industry) params.industry = industry;
  if (country) params.country = country;
  if (channel) params.ingestion_channel = channel;
  if (headcountRange) params.headcount_range = headcountRange;
  if (websiteStatus) params.website_status = websiteStatus;
  if (emailStatus) params.email_status = emailStatus;
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;

  // React Query: Fetch filters
  const filtersQuery = useQuery({
    queryKey: ['leadsFilters'],
    queryFn: leadsApi.getFilters,
  });

  // React Query: Fetch leads
  const leadsQuery = useQuery({
    queryKey: ['leads', params],
    queryFn: () => leadsApi.getLeads(params),
    placeholderData: (previousData) => previousData,
  });

  const filterOptions = filtersQuery.data || {};
  const leadsData = leadsQuery.data || {};
  const leads = leadsData.data || [];
  
  const pagination = {
    currentPage: leadsData.current_page || 1,
    lastPage: leadsData.last_page || 1,
    total: leadsData.total || 0,
    from: leadsData.from || 0,
    to: leadsData.to || 0,
    perPage: leadsData.per_page || 25,
  };

  const loading = leadsQuery.isLoading || (leadsQuery.isFetching && !leadsQuery.isPlaceholderData);

  // Sorting
  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  // CSV export
  const handleExport = async () => {
    try {
      await leadsApi.exportCsv(params);
      toast.success('CSV export downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearch('');
    setStatus('');
    setTitleTier('');
    setIndustry('');
    setCountry('');
    setChannel('');
    setHeadcountRange('');
    setWebsiteStatus('');
    setEmailStatus('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  // Count active advanced filter criteria
  const activeAdvancedCount = [
    industry, country, channel, headcountRange,
    websiteStatus, emailStatus, dateFrom, dateTo
  ].filter(Boolean).length;

  const hasAnyFilters = search || status || titleTier || activeAdvancedCount > 0;

  const handleApplyAdvancedFilters = (newFilters) => {
    if (newFilters.industry !== undefined) setIndustry(newFilters.industry);
    if (newFilters.country !== undefined) setCountry(newFilters.country);
    if (newFilters.titleTier !== undefined) setTitleTier(newFilters.titleTier);
    if (newFilters.channel !== undefined) setChannel(newFilters.channel);
    if (newFilters.headcountRange !== undefined) setHeadcountRange(newFilters.headcountRange);
    if (newFilters.websiteStatus !== undefined) setWebsiteStatus(newFilters.websiteStatus);
    if (newFilters.emailStatus !== undefined) setEmailStatus(newFilters.emailStatus);
    if (newFilters.dateFrom !== undefined) setDateFrom(newFilters.dateFrom);
    if (newFilters.dateTo !== undefined) setDateTo(newFilters.dateTo);
    setPage(1);
  };

  const handleCopyEmail = (e, email) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    toast.success('Email copied to clipboard');
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleLeadUpdated = (updatedLead) => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    setSelectedLead(updatedLead);
  };

  const toggleColumn = (colKey) => {
    setVisibleColumns((prev) => ({ ...prev, [colKey]: !prev[colKey] }));
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <ArrowUpDown size={12} className={styles.sortIcon} />;
    return sortDir === 'asc'
      ? <ArrowUp size={12} className={`${styles.sortIcon} ${styles.active}`} />
      : <ArrowDown size={12} className={`${styles.sortIcon} ${styles.active}`} />;
  };

  return (
    <div className={styles.page}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>Leads Pipeline</h1>
            <span className={styles.totalBadge}>
              {pagination.total.toLocaleString()} {pagination.total === 1 ? 'Lead' : 'Leads'}
            </span>
          </div>
          <p className={styles.pageSubtitle}>
            High-velocity executive pipeline with real-time company intelligence, domain health, and contact direct links.
          </p>
        </div>

        {/* Top Actions */}
        <div className={styles.headerActions}>
          {/* View Mode Toggle */}
          <div className={styles.viewToggleGroup}>
            <button 
              className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <TableIcon size={16} />
              <span>Table</span>
            </button>
            <button 
              className={`${styles.viewBtn} ${viewMode === 'cards' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('cards')}
              title="Executive Cards Board View"
            >
              <LayoutGrid size={16} />
              <span>Cards</span>
            </button>
          </div>

          {/* Columns Customizer */}
          {viewMode === 'table' && (
            <div className={styles.columnToggleContainer}>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowColumnPicker((prev) => !prev)}
                className={styles.toolBtn}
              >
                <SlidersHorizontal size={14} />
                <span>Columns</span>
              </Button>

              {showColumnPicker && (
                <div className={styles.columnDropdown}>
                  <div className={styles.columnDropdownHeader}>
                    <span>Visible Columns</span>
                    <button className={styles.iconClose} onClick={() => setShowColumnPicker(false)}>
                      <X size={14} />
                    </button>
                  </div>
                  <div className={styles.columnList}>
                    <label className={styles.columnOption}>
                      <input type="checkbox" checked={visibleColumns.name} onChange={() => toggleColumn('name')} />
                      <span>Lead & Seniority</span>
                    </label>
                    <label className={styles.columnOption}>
                      <input type="checkbox" checked={visibleColumns.company} onChange={() => toggleColumn('company')} />
                      <span>Company & Domain</span>
                    </label>
                    <label className={styles.columnOption}>
                      <input type="checkbox" checked={visibleColumns.role} onChange={() => toggleColumn('role')} />
                      <span>Job Title</span>
                    </label>
                    <label className={styles.columnOption}>
                      <input type="checkbox" checked={visibleColumns.industry} onChange={() => toggleColumn('industry')} />
                      <span>Industry & Headcount</span>
                    </label>
                    <label className={styles.columnOption}>
                      <input type="checkbox" checked={visibleColumns.location} onChange={() => toggleColumn('location')} />
                      <span>Location</span>
                    </label>
                    <label className={styles.columnOption}>
                      <input type="checkbox" checked={visibleColumns.contact} onChange={() => toggleColumn('contact')} />
                      <span>Direct Contact</span>
                    </label>
                    <label className={styles.columnOption}>
                      <input type="checkbox" checked={visibleColumns.status} onChange={() => toggleColumn('status')} />
                      <span>Status</span>
                    </label>
                    <label className={styles.columnOption}>
                      <input type="checkbox" checked={visibleColumns.date} onChange={() => toggleColumn('date')} />
                      <span>Date Added</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export CSV */}
          <Button variant="outline" size="sm" onClick={handleExport} className={styles.toolBtn}>
            <Download size={14} />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* ── Main Interactive Search & Filter Toolbar ── */}
      <div className={styles.toolbarCard}>
        {/* Top Search & Inline Quick Filters Row */}
        <div className={styles.searchBarRow}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by name, company, email, role, or multi-search (e.g. 'John, Tech, London')..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                className={styles.searchClear} 
                onClick={() => setSearch('')}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Inline Quick Filters */}
          <div className={styles.inlineFiltersGroup}>
            <select
              className={styles.inlineSelect}
              value={industry}
              onChange={(e) => { setIndustry(e.target.value); setPage(1); }}
            >
              <option value="">All Industries</option>
              {(filterOptions.industries || []).map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>

            <select
              className={styles.inlineSelect}
              value={country}
              onChange={(e) => { setCountry(e.target.value); setPage(1); }}
            >
              <option value="">All Countries</option>
              {(filterOptions.countries || []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              className={styles.inlineSelect}
              value={headcountRange}
              onChange={(e) => { setHeadcountRange(e.target.value); setPage(1); }}
            >
              <option value="">Any Size</option>
              <option value="1-50">1–50 (Small)</option>
              <option value="51-500">51–500 (Mid-Market)</option>
              <option value="1000+">1,000+ (Enterprise)</option>
            </select>

            {/* Advanced Filter Trigger Button */}
            <button 
              type="button"
              className={`${styles.filterTriggerBtn} ${activeAdvancedCount > 0 ? styles.filterTriggerBtnActive : ''}`}
              onClick={() => setIsFilterModalOpen(true)}
            >
              <Filter size={14} />
              <span>More Filters</span>
              {activeAdvancedCount > 0 && (
                <span className={styles.filterCountBadge}>{activeAdvancedCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Tabs & Seniority Tier Shortcuts */}
        <div className={styles.shortcutsRow}>
          {/* Status Quick Tabs */}
          <div className={styles.statusTabs}>
            {STATUS_TABS.map((tab) => {
              const isActive = status === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`${styles.statusTab} ${isActive ? styles.statusTabActive : ''}`}
                  onClick={() => {
                    setStatus(tab.key);
                    setPage(1);
                  }}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.divider} />

          {/* Tier Shortcuts */}
          <div className={styles.tierShortcuts}>
            {TIER_SHORTCUTS.map((t) => {
              const isActive = titleTier === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  className={`${styles.tierShortcutChip} ${isActive ? styles.tierShortcutActive : ''}`}
                  onClick={() => {
                    setTitleTier(t.key);
                    setPage(1);
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filters Bar */}
        {hasAnyFilters && (
          <div className={styles.activeChipsBar}>
            <span className={styles.activeChipsLabel}>Active Criteria:</span>
            
            {search && (
              <span className={styles.filterChip}>
                Search: "{search}"
                <button onClick={() => setSearch('')}><X size={12} /></button>
              </span>
            )}
            
            {status && (
              <span className={styles.filterChip}>
                Status: {status}
                <button onClick={() => setStatus('')}><X size={12} /></button>
              </span>
            )}

            {titleTier && (
              <span className={styles.filterChip}>
                Tier: {titleTier}
                <button onClick={() => setTitleTier('')}><X size={12} /></button>
              </span>
            )}

            {industry && (
              <span className={styles.filterChip}>
                Industry: {industry}
                <button onClick={() => setIndustry('')}><X size={12} /></button>
              </span>
            )}

            {headcountRange && (
              <span className={styles.filterChip}>
                Headcount: {headcountRange} emp
                <button onClick={() => setHeadcountRange('')}><X size={12} /></button>
              </span>
            )}

            {websiteStatus && (
              <span className={styles.filterChip}>
                Website: {websiteStatus === '200' ? '200 OK' : websiteStatus}
                <button onClick={() => setWebsiteStatus('')}><X size={12} /></button>
              </span>
            )}

            {emailStatus && (
              <span className={styles.filterChip}>
                Email: {emailStatus}
                <button onClick={() => setEmailStatus('')}><X size={12} /></button>
              </span>
            )}

            {country && (
              <span className={styles.filterChip}>
                Country: {country}
                <button onClick={() => setCountry('')}><X size={12} /></button>
              </span>
            )}

            {channel && (
              <span className={styles.filterChip}>
                Channel: {channel}
                <button onClick={() => setChannel('')}><X size={12} /></button>
              </span>
            )}

            {(dateFrom || dateTo) && (
              <span className={styles.filterChip}>
                Date: {dateFrom || 'start'} → {dateTo || 'now'}
                <button onClick={() => { setDateFrom(''); setDateTo(''); }}><X size={12} /></button>
              </span>
            )}

            <button className={styles.clearAllBtn} onClick={clearAllFilters}>
              <RotateCcw size={12} />
              <span>Reset all</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Main Data View Area ── */}
      {loading && leads.length === 0 ? (
        <LeadSkeleton viewMode={viewMode} count={viewMode === 'cards' ? 8 : 10} />
      ) : leads.length === 0 ? (
        <EmptyState
          title="No prospects found"
          description={hasAnyFilters
            ? 'No leads match your current search query and filter criteria. Try clearing or expanding your search.'
            : 'Leads will appear here automatically once ingested via n8n webhook or CSV imports.'}
        />
      ) : (
        <>
          {/* CARDS / BOARD VIEW */}
          {viewMode === 'cards' && (
            <div className={styles.cardsGrid} style={{ opacity: leadsQuery.isFetching ? 0.7 : 1 }}>
              {leads.map((lead) => (
                <LeadCard 
                  key={lead.id} 
                  lead={lead} 
                  onSelect={setSelectedLead}
                  isSelected={selectedLead?.id === lead.id}
                />
              ))}
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <div className={styles.tableWrapper} style={{ opacity: leadsQuery.isFetching ? 0.7 : 1 }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {visibleColumns.name && (
                      <th onClick={() => handleSort('full_name')} className={styles.sortableTh}>
                        <span className={styles.thContent}>
                          Lead Name & Tier
                          <SortIcon column="full_name" />
                        </span>
                      </th>
                    )}

                    {visibleColumns.company && (
                      <th onClick={() => handleSort('company_name')} className={styles.sortableTh}>
                        <span className={styles.thContent}>
                          Company & Domain
                          <SortIcon column="company_name" />
                        </span>
                      </th>
                    )}

                    {visibleColumns.role && (
                      <th>
                        <span className={styles.thContent}>Job Title</span>
                      </th>
                    )}

                    {visibleColumns.industry && (
                      <th onClick={() => handleSort('industry_classification')} className={styles.sortableTh}>
                        <span className={styles.thContent}>
                          Industry & Headcount
                          <SortIcon column="industry_classification" />
                        </span>
                      </th>
                    )}

                    {visibleColumns.location && (
                      <th onClick={() => handleSort('country')} className={styles.sortableTh}>
                        <span className={styles.thContent}>
                          HQ / Country
                          <SortIcon column="country" />
                        </span>
                      </th>
                    )}

                    {visibleColumns.contact && (
                      <th>
                        <span className={styles.thContent}>Direct Contact</span>
                      </th>
                    )}

                    {visibleColumns.status && (
                      <th onClick={() => handleSort('status')} className={styles.sortableTh}>
                        <span className={styles.thContent}>
                          Status
                          <SortIcon column="status" />
                        </span>
                      </th>
                    )}

                    {visibleColumns.date && (
                      <th onClick={() => handleSort('created_at')} className={styles.sortableTh}>
                        <span className={styles.thContent}>
                          Date Added
                          <SortIcon column="created_at" />
                        </span>
                      </th>
                    )}

                    {visibleColumns.actions && (
                      <th className={styles.actionsTh}>
                        <span className={styles.thContent}>Actions</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const isSelected = selectedLead?.id === lead.id;
                    return (
                      <tr 
                        key={lead.id} 
                        className={`${styles.tableRow} ${isSelected ? styles.selectedRow : ''}`}
                        onClick={() => setSelectedLead(lead)}
                      >
                        {/* Lead Name & Tier */}
                        {visibleColumns.name && (
                          <td>
                            <div className={styles.nameCell}>
                              <div className={styles.nameTextRow}>
                                <span className={styles.leadFullName}>{lead.full_name}</span>
                              </div>
                              {lead.title_tier && (
                                <span className={styles.tableTierBadge}>
                                  {lead.title_tier}
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Company & Domain */}
                        {visibleColumns.company && (
                          <td>
                            <div className={styles.companyCell}>
                              <span className={styles.tableCompanyName} title={lead.company_name}>
                                {lead.company_name || '—'}
                              </span>
                              {lead.clean_root_domain && (
                                <div className={styles.domainSubRow}>
                                  <a
                                    href={`https://${lead.clean_root_domain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className={styles.tableDomainLink}
                                    title={`Visit ${lead.clean_root_domain}`}
                                  >
                                    <Globe size={11} />
                                    <span>{lead.clean_root_domain}</span>
                                    <ExternalLink size={9} />
                                  </a>
                                  {lead.website_status && (
                                    <span 
                                      className={`${styles.tableWebBadge} ${lead.website_status.includes('200') ? styles.webBadgeOk : ''}`}
                                      title={lead.website_status}
                                    >
                                      {lead.website_status.includes('200') ? '200 OK' : lead.website_status}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Job Title */}
                        {visibleColumns.role && (
                          <td>
                            <span className={styles.tableRoleText} title={lead.job_title}>
                              {lead.job_title || '—'}
                            </span>
                          </td>
                        )}

                        {/* Industry & Headcount */}
                        {visibleColumns.industry && (
                          <td>
                            <div className={styles.industryCell}>
                              <span className={styles.tableIndustryText} title={lead.industry_classification}>
                                {lead.industry_classification || '—'}
                              </span>
                              {lead.employee_headcount && (
                                <span className={styles.tableHeadcountPill}>
                                  <Users size={11} />
                                  <span>{lead.employee_headcount.toLocaleString()} emp</span>
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Location */}
                        {visibleColumns.location && (
                          <td>
                            <div className={styles.locationCell}>
                              {lead.hq_location ? (
                                <span className={styles.tableLocationText} title={lead.hq_location}>
                                  <MapPin size={11} className={styles.mutedPin} />
                                  {lead.hq_location}
                                </span>
                              ) : (
                                <span className={styles.tableCountryText}>{lead.country || '—'}</span>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Contact */}
                        {visibleColumns.contact && (
                          <td onClick={(e) => e.stopPropagation()}>
                            {lead.corporate_email ? (
                              <div className={styles.tableEmailGroup}>
                                <a 
                                  href={`mailto:${lead.corporate_email}`}
                                  className={styles.tableEmailLink}
                                  title="Send email"
                                >
                                  <Mail size={12} />
                                  <span>{lead.corporate_email}</span>
                                </a>
                                <button 
                                  className={styles.tableCopyBtn}
                                  onClick={(e) => handleCopyEmail(e, lead.corporate_email)}
                                  title="Copy email address"
                                >
                                  {copiedEmail === lead.corporate_email ? (
                                    <Check size={11} className={styles.copiedGreen} />
                                  ) : (
                                    <Copy size={11} />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className={styles.mutedDash}>—</span>
                            )}
                          </td>
                        )}

                        {/* Status */}
                        {visibleColumns.status && (
                          <td>
                            <StatusBadge status={lead.status} />
                          </td>
                        )}

                        {/* Date Added */}
                        {visibleColumns.date && (
                          <td>
                            <span className={styles.dateText}>
                              {new Date(lead.created_at).toLocaleDateString()}
                            </span>
                          </td>
                        )}

                        {/* Actions */}
                        {visibleColumns.actions && (
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className={styles.tableActionButtons}>
                              {lead.executive_linkedin_url && (
                                <a
                                  href={lead.executive_linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.tableActionIconBtn}
                                  title="Executive LinkedIn Profile"
                                >
                                  <LinkedInIcon size={14} />
                                </a>
                              )}

                              {lead.company_linkedin_page && (
                                <a
                                  href={lead.company_linkedin_page}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.tableActionIconBtn}
                                  title="Company LinkedIn Page"
                                >
                                  <Building2 size={14} />
                                </a>
                              )}

                              <button
                                className={`${styles.tableActionIconBtn} ${styles.quickInspectBtn}`}
                                onClick={() => setSelectedLead(lead)}
                                title="Inspect & Review Prospect"
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={pagination.currentPage}
            lastPage={pagination.lastPage}
            total={pagination.total}
            from={pagination.from}
            to={pagination.to}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={{
          industry,
          country,
          titleTier,
          channel,
          headcountRange,
          websiteStatus,
          emailStatus,
          dateFrom,
          dateTo,
        }}
        onApplyFilters={handleApplyAdvancedFilters}
        onResetFilters={clearAllFilters}
        filterOptions={filterOptions}
      />

      {/* Quick Preview & Review Side Drawer */}
      <LeadDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onLeadUpdated={handleLeadUpdated}
      />
    </div>
  );
}
