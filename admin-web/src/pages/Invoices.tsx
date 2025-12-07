import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Invoice } from '../types';
import { Search, Filter, Loader2, Download, FileText } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      // Fetch company invoices with company details
      const { data, error } = await supabase
        .from('company_invoices')
        .select('*, company:companies(name, uen)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
        setInvoices([]);
      } else {
        setInvoices(data || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.invoice_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      // @ts-expect-error
      invoice.company?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'overdue':
        return 'error';
      case 'pending':
      case 'outstanding':
        return 'warning';
      case 'partial_paid':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2
          className="animate-spin text-[var(--text-primary)]"
          size={32}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          Invoices
        </h1>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              size={20}
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-8 text-sm focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all sm:w-48 min-h-[44px] touch-manipulation"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              size={20}
            />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="bg-[var(--bg-tertiary)] text-xs uppercase text-[var(--text-primary)] font-bold tracking-wider">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Invoice #</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Company</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Invoice Date</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Due Date</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Status</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">Amount</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                  Outstanding
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {filteredInvoices.map(invoice => (
                <tr
                  key={invoice.id}
                  className="group hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-[var(--text-primary)]">
                    <div className="flex items-center gap-2">
                      <FileText
                        size={16}
                        className="text-[var(--text-tertiary)]"
                      />
                      <span className="truncate">
                        {invoice.invoice_number ||
                          `INV-${invoice.id.slice(0, 8).toUpperCase()}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                    {/* @ts-expect-error */}
                    <div className="flex flex-col">
                      {/* @ts-expect-error */}
                      <span className="font-medium text-[var(--text-primary)]">
                        {invoice.company?.name || 'N/A'}
                      </span>
                      {/* @ts-expect-error */}
                      <span className="text-xs">
                        {invoice.company?.uen || ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                    {invoice.invoice_date
                      ? new Date(invoice.invoice_date).toLocaleDateString()
                      : new Date(invoice.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                    {invoice.payment_due_date || invoice.due_date
                      ? new Date(
                          invoice.payment_due_date || invoice.due_date
                        ).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <Badge variant={getStatusVariant(invoice.status)}>
                      {invoice.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-medium text-[var(--text-primary)]">
                    $
                    {(
                      invoice.billing_amount ||
                      invoice.total_amount ||
                      0
                    ).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right text-[var(--text-secondary)]">
                    $
                    {(
                      invoice.outstanding_amount ||
                      invoice.remaining_amount ||
                      (invoice.status === 'paid'
                        ? 0
                        : invoice.billing_amount || invoice.total_amount || 0)
                    ).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="min-w-[36px] min-h-[36px] p-2 touch-manipulation"
                        title="Download Invoice"
                      >
                        <Download size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="p-12 text-center text-[var(--text-secondary)]">
            <div className="flex flex-col items-center justify-center">
              <FileText className="mb-4 h-12 w-12 text-[var(--text-tertiary)]" />
              <p className="text-lg font-medium text-[var(--text-primary)]">
                No invoices found
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
