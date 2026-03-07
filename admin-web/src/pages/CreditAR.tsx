import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Eye,
  Mail,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useCreditARData } from '../hooks/useCreditARData';
import type { CompanyRow } from '../hooks/useCreditARData';
import { formatCurrency, formatPercentage } from '../lib/formatters';
import { Button } from '../components/ui/Button';

const CHARCOAL = '#36454F';
const PAGE_SIZE = 10;

type RiskFilter = 'all' | 'high' | 'medium' | 'low';

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function utilizationColor(pct: number): string {
  if (pct >= 90) return 'text-red-600';
  if (pct >= 80) return 'text-orange-600';
  return 'text-emerald-600';
}

function utilizationBarColor(pct: number): string {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 80) return 'bg-orange-500';
  return 'bg-emerald-500';
}

function filterByRisk(companies: CompanyRow[], risk: RiskFilter): CompanyRow[] {
  switch (risk) {
    case 'high':
      return companies.filter(c => c.utilization >= 80);
    case 'medium':
      return companies.filter(c => c.utilization >= 50 && c.utilization < 80);
    case 'low':
      return companies.filter(c => c.utilization < 50);
    default:
      return companies;
  }
}

export default function CreditAR() {
  const { kpis, agingChart, companies, loading } = useCreditARData();
  const navigate = useNavigate();
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [page, setPage] = useState(1);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  const filtered = filterByRisk(companies, riskFilter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-primary)]">
            Credit & Accounts Receivable
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time monitoring of credit limits, aging buckets, and high-risk
            accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Download size={16} />}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          label="Total Extended"
          value={formatCompact(kpis.totalExtended)}
        />
        <KPICard
          label="Total Credit Used"
          value={formatCompact(kpis.totalUsed)}
        />
        <KPICard
          label="Utilization %"
          value={formatPercentage(kpis.utilization)}
        />
        <KPICard
          label="Outstanding"
          value={formatCompact(kpis.totalOutstanding)}
        />
        <KPICard
          label="Overdue Amount"
          value={formatCompact(kpis.overdueAmount)}
          alert={kpis.overdueAmount > 0}
        />
        <KPICard label="Avg Days to Pay" value={`${kpis.avgDaysToPay} Days`} />
      </div>

      {/* AR Aging Chart + Quick Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              AR Aging Buckets
            </h3>
            <div className="flex gap-4">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: `rgba(54,69,79,0.2)` }}
                />
                Current
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: `rgba(54,69,79,0.6)` }}
                />
                1-60 Days
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: CHARCOAL }}
                />
                90+ Days
              </span>
            </div>
          </div>

          {agingChart.some(b => b.current + b.mid + b.overdue > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={agingChart}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => formatCompact(v)}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  }}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'current'
                      ? 'Current'
                      : name === 'mid'
                        ? '1-60 Days'
                        : '90+ Days',
                  ]}
                />
                <Legend content={() => null} />
                <Bar
                  dataKey="current"
                  stackId="a"
                  fill="rgba(54,69,79,0.2)"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="mid"
                  stackId="a"
                  fill="rgba(54,69,79,0.6)"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="overdue"
                  stackId="a"
                  fill={CHARCOAL}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">
              No aging data available
            </div>
          )}
        </div>

        {/* Quick Filters */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">
            Quick Filters
          </h3>
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">
                Risk Level
              </label>
              <div className="flex gap-2">
                {(
                  [
                    ['all', 'All'],
                    ['high', 'High'],
                    ['medium', 'Medium'],
                    ['low', 'Low'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => {
                      setRiskFilter(value);
                      setPage(1);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
                      riskFilter === value
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-3">Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">High Risk ({'>'}80%)</span>
                  <span className="font-bold">
                    {companies.filter(c => c.utilization >= 80).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Medium (50-80%)</span>
                  <span className="font-bold">
                    {
                      companies.filter(
                        c => c.utilization >= 50 && c.utilization < 80
                      ).length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Low ({'<'}50%)</span>
                  <span className="font-bold">
                    {companies.filter(c => c.utilization < 50).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High-Risk Companies Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            {riskFilter === 'all'
              ? 'All Companies'
              : `${riskFilter.charAt(0).toUpperCase() + riskFilter.slice(1)}-Risk Companies`}
          </h3>
          <span className="text-xs text-gray-500">
            Showing {paged.length} of {filtered.length} companies
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Credit Limit
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Credit Used
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Utilization %
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Overdue
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Oldest
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.map(company => (
                <tr
                  key={company.id}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center font-bold text-xs"
                        style={{
                          backgroundColor: 'rgba(54,69,79,0.1)',
                          color: CHARCOAL,
                        }}
                      >
                        {company.initials}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)] text-sm">
                          {company.name}
                        </p>
                        {company.uen && (
                          <p className="text-xs text-gray-400">{company.uen}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {formatCurrency(company.creditLimit)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {formatCurrency(company.creditUsed)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full max-w-[120px]">
                      <div className="flex justify-between mb-1">
                        <span
                          className={`text-xs font-bold ${utilizationColor(company.utilization)}`}
                        >
                          {company.utilization.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full">
                        <div
                          className={`h-full rounded-full ${utilizationBarColor(company.utilization)}`}
                          style={{
                            width: `${Math.min(company.utilization, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {company.overdueAmount > 0 ? (
                      <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded">
                        {formatCurrency(company.overdueAmount)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {company.oldestOverdueDays > 0
                      ? `${company.oldestOverdueDays} Days`
                      : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/companies/${company.id}`)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="View Company"
                      >
                        <Eye size={16} className="text-gray-500" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="Send Reminder"
                      >
                        <Mail size={16} className="text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-gray-400"
                  >
                    No companies match the selected filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-white flex items-center justify-between border-t border-gray-100">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="text-xs font-bold text-gray-500 hover:text-[var(--color-primary)] flex items-center gap-1 transition-colors disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <div className="flex gap-1">
              {getPageNumbers(currentPage, totalPages).map((item, i) =>
                item === '...' ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-1.5 py-1 text-xs text-gray-400 select-none"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                      item === currentPage
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="text-xs font-bold text-gray-500 hover:text-[var(--color-primary)] flex items-center gap-1 transition-colors disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}

function KPICard({
  label,
  value,
  alert,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <span
        className={`text-2xl font-bold ${alert ? 'text-red-500' : 'text-[var(--text-primary)]'}`}
      >
        {value}
      </span>
    </div>
  );
}
