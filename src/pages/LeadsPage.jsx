import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as leadsApi from '../api/leads';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import StatusBadge from '../components/ui/StatusBadge';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import styles from './LeadsPage.module.css';

const COLUMNS = [
  { key: 'full_name', label: 'Name', sortable: true },
  { key: 'company_name', label: 'Company', sortable: true },
  { key: 'job_title', label: 'Title' },
  { key: 'title_tier', label: 'Tier', sortable: true },
  { key: 'industry_classification', label: 'Industry', sortable: true },
  { key: 'country', label: 'Country', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'created_at', label: 'Date', sortable: true },
];

export default function LeadsPage() {
  const navigate = useNavigate();

  // Filters state
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [titleTier, setTitleTier] = useState('');
  const [status, setStatus] = useState('');
  const [country, setCountry] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  // Debounce search
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

  // Construct params
  const params = {
    page,
    sort_by: sortBy,
    sort_dir: sortDir,
    per_page: 25,
  };
  if (debouncedSearch) params.search = debouncedSearch;
  if (industry) params.industry = industry;
  if (titleTier) params.title_tier = titleTier;
  if (status) params.status = status;
  if (country) params.country = country;
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
    placeholderData: (previousData) => previousData, // keep previous data while fetching new pages (formerly keepPreviousData)
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

  // Sort handler
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
      toast.success('CSV export started');
    } catch {
      toast.error('Export failed');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setIndustry('');
    setTitleTier('');
    setStatus('');
    setCountry('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasFilters = search || industry || titleTier || status || country || dateFrom || dateTo;

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <ArrowUpDown size={12} className={styles.sortIcon} />;
    return sortDir === 'asc'
      ? <ArrowUp size={12} className={`${styles.sortIcon} ${styles.active}`} />
      : <ArrowDown size={12} className={`${styles.sortIcon} ${styles.active}`} />;
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Leads</h1>
        <div className={styles.actions}>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download size={16} />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchRow}>
          <div className={styles.searchInput}>
            <Input
              placeholder="Search leads…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.filtersRow}>
          <Input
            as="select"
            className={styles.filterSelect}
            value={industry}
            onChange={(e) => { setIndustry(e.target.value); setPage(1); }}
          >
            <option value="">All Industries</option>
            {(filterOptions.industries || []).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </Input>
          <Input
            as="select"
            className={styles.filterSelect}
            value={titleTier}
            onChange={(e) => { setTitleTier(e.target.value); setPage(1); }}
          >
            <option value="">All Tiers</option>
            {(filterOptions.title_tiers || []).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </Input>
          <Input
            as="select"
            className={styles.filterSelect}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            {(filterOptions.statuses || []).map((v) => (
              <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
            ))}
          </Input>
          <Input
            as="select"
            className={styles.filterSelect}
            value={country}
            onChange={(e) => { setCountry(e.target.value); setPage(1); }}
          >
            <option value="">All Countries</option>
            {(filterOptions.countries || []).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </Input>
          <Input
            type="date"
            className={styles.dateInput}
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            placeholder="From"
          />
          <Input
            type="date"
            className={styles.dateInput}
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            placeholder="To"
          />
          {hasFilters && (
            <button className={styles.clearBtn} onClick={clearFilters}>
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading && leads.length === 0 ? (
        <div className={styles.loading}>Loading leads…</div>
      ) : leads.length === 0 ? (
        <EmptyState
          title="No leads found"
          description={hasFilters
            ? 'Try adjusting your search or filters.'
            : 'Leads will appear here once they are ingested.'}
        />
      ) : (
        <>
          <div className={styles.tableWrapper} style={{ opacity: leadsQuery.isFetching ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {COLUMNS.map(({ key, label, sortable }) => (
                    <th
                      key={key}
                      onClick={sortable ? () => handleSort(key) : undefined}
                      style={{ cursor: sortable ? 'pointer' : 'default' }}
                    >
                      <span className={styles.thContent}>
                        {label}
                        {sortable && <SortIcon column={key} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                    <td>
                      <div className={styles.leadName}>{lead.full_name}</div>
                    </td>
                    <td className={styles.truncate}>{lead.company_name}</td>
                    <td className={styles.truncate}>{lead.job_title}</td>
                    <td>{lead.title_tier}</td>
                    <td className={styles.truncate}>{lead.industry_classification}</td>
                    <td>{lead.country}</td>
                    <td><StatusBadge status={lead.status} /></td>
                    <td>{new Date(lead.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
  );
}
