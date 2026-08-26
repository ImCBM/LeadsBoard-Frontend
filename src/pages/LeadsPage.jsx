import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, ArrowUpDown, ArrowUp, ArrowDown, 
  ExternalLink, Mail, Copy, Check, Users, MapPin, 
  Globe, SlidersHorizontal, Eye, X, Building2,
  LayoutGrid, Table as TableIcon
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
import FilterToolbar from '../components/leads/FilterToolbar';
import AdvancedFilterPanel from '../components/leads/AdvancedFilterPanel';
import styles from './LeadsPage.module.css';

const DEFAULT_VISIBLE_COLUMNS = {
  name: true,
  company: true,
  role: true,
  industry: true,
  headcount: true,
  location: true,
  contact: true,
  status: true,
  date: true,
  actions: true,
};

export default function LeadsPage() {
  const queryClient = useQueryClient();

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [titleTier, setTitleTier] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [channel, setChannel] = useState('');
  const [headcountRange, setHeadcountRange] = useState('');
  const [headcountMin, setHeadcountMin] = useState('');
  const [headcountMax, setHeadcountMax] = useState('');
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
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);

  // Debounced search
  const debounceRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setIsSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setIsSearching(false);
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
  if (headcountMin) params.headcount_min = headcountMin;
  if (headcountMax) params.headcount_max = headcountMax;
  if (websiteStatus) params.website_status = websiteStatus;
  if (emailStatus) params.email_status = emailStatus;
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;

  // React Query: Fetch filter options
  const filtersQuery = useQuery({
    queryKey: ['leadsFilters'],
    queryFn: leadsApi.getFilters,
    staleTime: 5 * 60 * 1000,
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

  const isInitialLoading = leadsQuery.isLoading && !leadsQuery.data;
  const isRefetching = leadsQuery.isFetching && !leadsQuery.isLoading;

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

  const handleUniversalSort = (newSortBy, newSortDir) => {
    setSortBy(newSortBy);
    setSortDir(newSortDir);
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
    setRegion('');
    setChannel('');
    setHeadcountRange('');
    setHeadcountMin('');
    setHeadcountMax('');
    setWebsiteStatus('');
    setEmailStatus('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  // Advanced filter update dispatcher
  const handleFilterChange = (key, value) => {
    if (key === 'industry') setIndustry(value);
    if (key === 'country') setCountry(value);
    if (key === 'region') setRegion(value);
    if (key === 'channel') setChannel(value);
    if (key === 'headcountRange') setHeadcountRange(value);
    if (key === 'headcountMin') setHeadcountMin(value);
    if (key === 'headcountMax') setHeadcountMax(value);
    if (key === 'websiteStatus') setWebsiteStatus(value);
    if (key === 'emailStatus') setEmailStatus(value);
    if (key === 'dateFrom') setDateFrom(value);
    if (key === 'dateTo') setDateTo(value);
    setPage(1);
  };

  // Active advanced filters count
  const activeAdvancedCount = [
    industry, country, region, channel, headcountRange,
    headcountMin, headcountMax, websiteStatus, emailStatus, dateFrom, dateTo
  ].filter(Boolean).length;

  const hasAnyFilters = Boolean(search || status || titleTier || activeAdvancedCount > 0);

  // Build active filter chips list for the toolbar
  const activeFilters = useMemo(() => {
    const list = [];
    if (search) list.push({ key: 'search', category: 'Search', label: `"${search}"` });
    if (status) list.push({ key: 'status', category: 'Status', label: status.toUpperCase() });
    if (titleTier) list.push({ key: 'titleTier', category: 'Tier', label: titleTier });
    if (industry) list.push({ key: 'industry', category: 'Industry', label: industry });
    if (region && (!country || country.includes(','))) {
      list.push({ key: 'region', category: 'Region', label: region });
    }
    if (country && !country.includes(',')) {
      list.push({ key: 'country', category: 'Country', label: country });
    }
    if (headcountRange) {
      list.push({ key: 'headcountRange', category: 'Size', label: `${headcountRange} emp` });
    }
    if (headcountMin || headcountMax) {
      list.push({ 
        key: 'headcountCustom', 
        category: 'Size', 
        label: `${headcountMin || '0'} – ${headcountMax || '∞'} emp` 
      });
    }
    if (websiteStatus) {
      list.push({ 
        key: 'websiteStatus', 
        category: 'Domain', 
        label: websiteStatus === '200' ? '200 OK' : websiteStatus 
      });
    }
    if (emailStatus) {
      list.push({ key: 'emailStatus', category: 'Email', label: emailStatus });
    }
    if (channel) {
      list.push({ key: 'channel', category: 'Source', label: channel.toUpperCase() });
    }
    if (dateFrom || dateTo) {
      list.push({ 
        key: 'dateRange', 
        category: 'Date', 
        label: `${dateFrom || 'start'} → ${dateTo || 'now'}` 
      });
    }
    return list;
  }, [search, status, titleTier, industry, region, country, headcountRange, headcountMin, headcountMax, websiteStatus, emailStatus, channel, dateFrom, dateTo]);

  // Remove individual filter chip
  const handleRemoveFilter = (filterKey) => {
    if (filterKey === 'search') setSearch('');
    if (filterKey === 'status') setStatus('');
    if (filterKey === 'titleTier') setTitleTier('');
    if (filterKey === 'industry') setIndustry('');
    if (filterKey === 'region') { setRegion(''); setCountry(''); }
    if (filterKey === 'country') setCountry('');
    if (filterKey === 'headcountRange') setHeadcountRange('');
    if (filterKey === 'headcountCustom') { setHeadcountMin(''); setHeadcountMax(''); }
    if (filterKey === 'websiteStatus') setWebsiteStatus('');
    if (filterKey === 'emailStatus') setEmailStatus('');
    if (filterKey === 'channel') setChannel('');
    if (filterKey === 'dateRange') { setDateFrom(''); setDateTo(''); }
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

          {/* Columns Customizer (Table mode only) */}
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
                      <span>Industry</span>
                    </label>
                    <label className={styles.columnOption}>
                      <input type="checkbox" checked={visibleColumns.headcount} onChange={() => toggleColumn('headcount')} />
                      <span>Employee Headcount</span>
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

      {/* ── Main Filter & Search Toolbar ── */}
      <FilterToolbar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={(val) => { setStatus(val); setPage(1); }}
        titleTier={titleTier}
        onTitleTierChange={(val) => { setTitleTier(val); setPage(1); }}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={handleUniversalSort}
        activeAdvancedCount={activeAdvancedCount}
        isAdvancedOpen={isAdvancedOpen}
        onToggleAdvanced={() => setIsAdvancedOpen((prev) => !prev)}
        hasAnyFilters={hasAnyFilters}
        onClearAll={clearAllFilters}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        isSearching={isSearching}
        isFetching={isRefetching}
      />

      {/* ── Inline Advanced Filter Panel ── */}
      <AdvancedFilterPanel
        isOpen={isAdvancedOpen}
        filters={{
          industry,
          country,
          region,
          channel,
          headcountRange,
          headcountMin,
          headcountMax,
          websiteStatus,
          emailStatus,
          dateFrom,
          dateTo,
        }}
        onFilterChange={handleFilterChange}
        filterOptions={filterOptions}
      />

      {/* ── Main Data View Area ── */}
      <div className={styles.dataAreaContainer}>
        {/* Refetching visual feedback bar */}
        {isRefetching && <div className={styles.topProgressBar} />}

        {isInitialLoading ? (
          <LeadSkeleton viewMode={viewMode} count={viewMode === 'cards' ? 8 : 10} />
        ) : leads.length === 0 ? (
          <EmptyState
            title="No prospects found"
            description={hasAnyFilters
              ? 'No leads match your current search query and filter criteria. Try expanding your search or resetting filters.'
              : 'Leads will appear here automatically once ingested via n8n webhook or CSV imports.'}
          />
        ) : (
          <>
            {/* CARDS / BOARD VIEW */}
            {viewMode === 'cards' && (
              <div 
                className={styles.cardsGrid} 
                style={{ 
                  opacity: isRefetching ? 0.7 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              >
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
              <div 
                className={styles.tableWrapper} 
                style={{ 
                  opacity: isRefetching ? 0.7 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              >
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
                        <th onClick={() => handleSort('job_title')} className={styles.sortableTh}>
                          <span className={styles.thContent}>
                            Job Title
                            <SortIcon column="job_title" />
                          </span>
                        </th>
                      )}

                      {visibleColumns.industry && (
                        <th onClick={() => handleSort('industry_classification')} className={styles.sortableTh}>
                          <span className={styles.thContent}>
                            Industry
                            <SortIcon column="industry_classification" />
                          </span>
                        </th>
                      )}

                      {visibleColumns.headcount && (
                        <th onClick={() => handleSort('employee_headcount')} className={styles.sortableTh}>
                          <span className={styles.thContent}>
                            Headcount
                            <SortIcon column="employee_headcount" />
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
                        <th onClick={() => handleSort('corporate_email')} className={styles.sortableTh}>
                          <span className={styles.thContent}>
                            Direct Contact
                            <SortIcon column="corporate_email" />
                          </span>
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
                            <td className={styles.stickyNameCell}>
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

                          {/* Industry */}
                          {visibleColumns.industry && (
                            <td>
                              <span className={styles.tableIndustryText} title={lead.industry_classification}>
                                {lead.industry_classification || '—'}
                              </span>
                            </td>
                          )}

                          {/* Headcount */}
                          {visibleColumns.headcount && (
                            <td>
                              {lead.employee_headcount ? (
                                <span className={styles.tableHeadcountPill}>
                                  <Users size={11} />
                                  <span>{lead.employee_headcount.toLocaleString()} emp</span>
                                </span>
                              ) : (
                                <span className={styles.tableMutedText}>—</span>
                              )}
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
      </div>

      {/* Quick Preview & Review Side Drawer */}
      <LeadDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onLeadUpdated={handleLeadUpdated}
      />
    </div>
  );
}
