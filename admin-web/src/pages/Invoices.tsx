import { useState, useMemo } from 'react';
import {
  Download,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  Building2,
  User,
  Eye,
  Send,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { useInvoicesData } from '../hooks/useInvoicesData';
import type { EnrichedInvoice } from '../hooks/useInvoicesData';
import { formatCurrency, formatDate } from '../lib/formatters';
import { Button } from '../components/ui/Button';

const PAGE_SIZE = 10;

type AgingFilter = 'all' | '0-30' | '31-60' | '61-90' | '90+';

const AGING_TABS: { key: AgingFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: '0-30', label: '0-30 Days' },
  { key: '31-60', label: '31-60 Days' },
  { key: '61-90', label: '61-90 Days' },
  { key: '90+', label: '90+ Days' },
];

function matchesAging(inv: EnrichedInvoice, filter: AgingFilter): boolean {
  if (filter === 'all') return true;
  if (inv.status === 'paid' || inv.status === 'cancelled')
    return filter === 'all';
  const d = inv.daysOverdue;
  switch (filter) {
    case '0-30':
      return d >= 0 && d <= 30;
    case '31-60':
      return d >= 31 && d <= 60;
    case '61-90':
      return d >= 61 && d <= 90;
    case '90+':
      return d > 90;
    default:
      return true;
  }
}

function statusBadge(status: string) {
  switch (status) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-700';
    case 'overdue':
      return 'bg-rose-100 text-rose-700';
    case 'pending':
    case 'outstanding':
      return 'bg-amber-100 text-amber-700';
    case 'partial_paid':
      return 'bg-blue-100 text-blue-700';
    case 'cancelled':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'partial_paid':
      return 'Partial';
    case 'outstanding':
      return 'Outstanding';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function formatTrend(value: number | null): string | undefined {
  if (value === null) return undefined;
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
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

export default function Invoices() {
  const { invoices, kpis, loading } = useInvoicesData();
  const [agingFilter, setAgingFilter] = useState<AgingFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return invoices.filter(inv => {
      if (!matchesAging(inv, agingFilter)) return false;
      if (
        q &&
        !inv.invoice_number?.toLowerCase().includes(q) &&
        !inv.customerName.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [invoices, agingFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const allPageSelected =
    paged.length > 0 && paged.every(inv => selectedIds.has(inv.id));

  function toggleAll() {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allPageSelected) {
        paged.forEach(inv => next.delete(inv.id));
      } else {
        paged.forEach(inv => next.add(inv.id));
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-primary)]">
            Invoices Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track, manage and process your business billing.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={<Download size={16} />}>
            Export
          </Button>
          <Button variant="primary" leftIcon={<Plus size={16} />}>
            Create Invoice
          </Button>
        </div>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          label="Total Outstanding"
          value={formatCurrency(kpis.totalOutstanding)}
          icon={<Clock size={20} className="text-gray-400" />}
          trend={formatTrend(kpis.outstandingTrend)}
          trendUp={
            kpis.outstandingTrend !== null ? kpis.outstandingTrend >= 0 : true
          }
        />
        <KPICard
          label="Total Overdue"
          value={formatCurrency(kpis.totalOverdue)}
          icon={<AlertTriangle size={20} className="text-rose-500" />}
          trend={formatTrend(kpis.overdueTrend)}
          trendUp={kpis.overdueTrend !== null ? kpis.overdueTrend >= 0 : false}
        />
        <KPICard
          label="Total Paid This Month"
          value={formatCurrency(kpis.totalPaidThisMonth)}
          icon={<CheckCircle size={20} className="text-emerald-500" />}
          trend={formatTrend(kpis.paidTrend)}
          trendUp={kpis.paidTrend !== null ? kpis.paidTrend >= 0 : true}
        />
      </div>

      {/* Invoice Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Aging Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between px-6 gap-4">
            <div className="flex gap-8 overflow-x-auto">
              {AGING_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setAgingFilter(tab.key);
                    setPage(1);
                  }}
                  className={`flex flex-col items-center justify-center border-b-2 pb-3 pt-4 px-1 text-sm font-bold transition-colors ${
                    agingFilter === tab.key
                      ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'border-transparent text-gray-500 hover:text-[var(--color-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative pb-2 pt-2">
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="bg-gray-100 border-none rounded-lg pl-4 pr-4 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] w-56"
              />
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Layers
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <select className="appearance-none bg-white border border-gray-200 rounded-lg h-10 pl-9 pr-10 text-sm font-bold text-gray-700 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] cursor-pointer">
                <option>Bulk Actions</option>
                <option>Send Reminder</option>
                <option>Download PDF</option>
                <option>Archive</option>
                <option>Delete</option>
              </select>
            </div>
            <Button variant="primary" size="sm">
              Apply
            </Button>
            {selectedIds.size > 0 && (
              <span className="text-xs text-gray-500 font-medium">
                {selectedIds.size} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500 font-medium mr-2">
              Showing {paged.length} of {filtered.length} invoices
            </p>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-2 bg-white hover:bg-gray-50 text-gray-400 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-2 bg-white hover:bg-gray-50 text-gray-400 border-l border-gray-200 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
                  />
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.map(inv => {
                const amt =
                  Number(inv.billing_amount) || Number(inv.total_amount) || 0;
                const issuedDate = inv.invoice_date || inv.created_at;
                const dueDate = inv.payment_due_date || inv.due_date;
                const isOverdue = inv.status === 'overdue';

                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(inv.id)}
                        onChange={() => toggleOne(inv.id)}
                        className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        {inv.invoice_number ||
                          `INV-${inv.id.slice(0, 8).toUpperCase()}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                          {inv.isCompany ? (
                            <Building2 size={16} className="text-gray-400" />
                          ) : (
                            <User size={16} className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)]">
                            {inv.customerName}
                          </p>
                          {inv.customerDetail && (
                            <p className="text-xs text-gray-500">
                              {inv.customerDetail}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">
                          Issued: {formatDate(issuedDate)}
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            isOverdue ? 'text-rose-500' : 'text-gray-700'
                          }`}
                        >
                          Due: {dueDate ? formatDate(dueDate) : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold w-fit ${statusBadge(inv.status)}`}
                        >
                          {statusLabel(inv.status)}
                        </span>
                        {isOverdue && inv.daysOverdue > 0 && (
                          <span className="text-[10px] text-rose-600 font-bold uppercase tracking-tight">
                            {inv.daysOverdue} Days late
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        {formatCurrency(amt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isOverdue ? (
                          <button
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                            title="Send Reminder"
                          >
                            <Send size={16} />
                          </button>
                        ) : (
                          <button
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <button
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                          title="More"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-16 text-center text-sm text-gray-400"
                  >
                    No invoices match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button className="text-sm font-bold text-[var(--color-primary)] hover:underline">
            Download all CSV
          </button>
          {totalPages > 1 && (
            <div className="flex gap-1">
              {getPageNumbers(currentPage, totalPages).map((item, i) =>
                item === '...' ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-2 py-1 text-xs text-gray-400 self-center select-none"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className={`min-w-[32px] h-8 flex items-center justify-center rounded text-xs font-bold transition-colors ${
                      item === currentPage
                        ? 'bg-[var(--color-primary)] text-white shadow-sm'
                        : 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  icon,
  trend,
  trendUp,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex justify-between items-start">
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        {icon}
      </div>
      <p className="text-3xl font-bold text-[var(--text-primary)] mt-2 leading-tight">
        {value}
      </p>
      {trend ? (
        <div
          className={`flex items-center gap-1 text-sm font-bold mt-2 ${
            trendUp ? 'text-emerald-600' : 'text-rose-500'
          }`}
        >
          {trend}
          <span className="text-gray-400 font-normal ml-1">vs last month</span>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mt-2">No prior data</p>
      )}
    </div>
  );
}
