import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useQueries } from '@tanstack/react-query';
import { Users, CalendarDays, TrendingUp, BarChart3 } from 'lucide-react';
import * as statsApi from '../api/stats';
import styles from './DashboardPage.module.css';

const CHART_COLORS = {
  primary: '#1fa97d',
  secondary: '#e8724a',
  tertiary: '#3e93b8',
  surface: '#eeeadb',
  onSurface: '#1e2a22',
  primaryContainer: '#c9f1e1',
};

const PIE_COLORS = ['#1fa97d', '#e8724a', '#3e93b8', '#86e0be', '#f5b594', '#8fcde1', '#cac5b0', '#dfd9c4'];

export default function DashboardPage() {
  const results = useQueries({
    queries: [
      { queryKey: ['stats', 'summary'], queryFn: statsApi.getSummary },
      { queryKey: ['stats', 'timeline'], queryFn: () => statsApi.getTimeline(30) },
      { queryKey: ['stats', 'industry'], queryFn: statsApi.getByIndustry },
      { queryKey: ['stats', 'tier'], queryFn: statsApi.getByTitleTier },
      { queryKey: ['stats', 'country'], queryFn: statsApi.getByCountry },
    ],
  });

  const isLoading = results.some((r) => r.isLoading);

  if (isLoading) {
    return <div className={styles.loading}>Loading dashboard…</div>;
  }

  const [summaryRes, timelineRes, industryRes, tierRes, countryRes] = results;
  
  const summary = summaryRes.data?.data || summaryRes.data || {};
  const timeline = timelineRes.data?.data || timelineRes.data || [];
  const byIndustry = industryRes.data?.data || industryRes.data || [];
  const byTitleTier = tierRes.data?.data || tierRes.data || [];
  const byCountry = countryRes.data?.data || countryRes.data || [];

  const statCards = [
    { label: 'Total Leads', value: summary.total_leads ?? 0, icon: Users, color: 'mint' },
    { label: 'Today', value: summary.today ?? 0, icon: CalendarDays, color: 'coral' },
    { label: 'This Week', value: summary.this_week ?? 0, icon: TrendingUp, color: 'sky' },
    { label: 'This Month', value: summary.this_month ?? 0, icon: BarChart3, color: 'stone' },
  ];

  const statusCounts = summary.status_counts || {};

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Dashboard</h1>

      {/* ── Stat Cards ── */}
      <div className={styles.statsGrid}>
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles[color]}`}>
              <Icon size={22} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>{label}</span>
              <span className={styles.statValue}>{value.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Status Breakdown ── */}
      <div className={styles.statusGrid}>
        {['new', 'reviewed', 'qualified', 'rejected'].map((status) => (
          <div key={status} className={`${styles.statusCard} ${styles[status]}`}>
            <div className={styles.statusValue}>{(statusCounts[status] ?? 0).toLocaleString()}</div>
            <div className={styles.statusLabel}>{status}</div>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className={styles.chartsGrid}>
        {/* Timeline Area Chart */}
        <div className={`${styles.chartCard} ${styles.fullWidth}`}>
          <h3 className={styles.chartTitle}>Leads Over Time (30 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.surface} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#52584a' }}
                tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 11, fill: '#52584a' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cac5b0',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorLeads)"
                name="Leads"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Industry Bar Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>By Industry</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byIndustry} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.surface} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#52584a' }} allowDecimals={false} />
              <YAxis
                dataKey="industry_classification"
                type="category"
                tick={{ fontSize: 11, fill: '#52584a' }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cac5b0',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Title Tier Pie Chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>By Title Tier</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={byTitleTier}
                dataKey="count"
                nameKey="title_tier"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
                paddingAngle={3}
                label={({ title_tier, percent }) => `${title_tier} ${(percent * 100).toFixed(0)}%`}
              >
                {byTitleTier.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Country Bar Chart */}
        <div className={`${styles.chartCard} ${styles.fullWidth}`}>
          <h3 className={styles.chartTitle}>By Country</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byCountry}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.surface} />
              <XAxis dataKey="country" tick={{ fontSize: 11, fill: '#52584a' }} />
              <YAxis tick={{ fontSize: 11, fill: '#52584a' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cac5b0',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Bar dataKey="count" fill={CHART_COLORS.tertiary} radius={[4, 4, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
