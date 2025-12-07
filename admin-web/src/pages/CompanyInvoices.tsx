import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Invoice, Company } from '../types';
import {
  Search,
  Filter,
  Loader2,
  Download,
  FileText,
  Send,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function CompanyInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, uen')
        .order('name');

      if (error) {
        console.error('Error fetching companies:', error);
      } else {
        setCompanies(data || []);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
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

  const generateMonthlyInvoice = async (companyId: string) => {
    setGenerating(true);
    try {
      const now = new Date();
      const month = now.getMonth(); // 0-11
      const year = now.getFullYear();

      // Get company orders for the previous month
      const startDate = new Date(year, month - 1, 1)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('company_id', companyId)
        .eq('status', 'delivered')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (ordersError) {
        alert('Error fetching orders: ' + ordersError.message);
        return;
      }

      if (!orders || orders.length === 0) {
        alert('No delivered orders found for the previous month');
        return;
      }

      // Calculate total
      const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);

      // Generate invoice number
      const invoiceNumber = `INV-${year}-${month.toString().padStart(2, '0')}-${companyId.slice(0, 6)}`;

      // Calculate due date (NET30)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // Create invoice
      const { error: invoiceError } = await supabase
        .from('company_invoices')
        .insert({
          company_id: companyId,
          invoice_number: invoiceNumber,
          invoice_date: new Date().toISOString().split('T')[0],
          payment_due_date: dueDate.toISOString().split('T')[0],
          billing_amount: totalAmount,
          outstanding_amount: totalAmount,
          status: 'pending',
          payment_terms: 'NET30',
        })
        .select()
        .single();

      if (invoiceError) {
        alert('Error creating invoice: ' + invoiceError.message);
        return;
      }

      alert(
        `Invoice ${invoiceNumber} generated successfully for $${totalAmount.toFixed(2)}`
      );
      fetchInvoices();
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  const sendInvoiceEmail = async (invoiceId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-invoice-email', {
        body: { invoice_id: invoiceId },
      });

      if (error) {
        throw error;
      }
      
      alert('Invoice email sent successfully!');
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Failed to send invoice email.');
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
    const matchesCompany =
      companyFilter === 'all' || invoice.company_id === companyFilter;
    return matchesSearch && matchesStatus && matchesCompany;
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
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            Company Invoices
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage monthly statements of account for companies
          </p>
        </div>

        <div className="flex gap-2">
          <select
            onChange={e => {
              if (e.target.value) {
                generateMonthlyInvoice(e.target.value);
                e.target.value = '';
              }
            }}
            disabled={generating}
            className="px-4 py-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
          >
            <option value="">Generate Invoice...</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative">
          <Filter
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
            size={20}
          />
          <select
            value={companyFilter}
            onChange={e => setCompanyFilter(e.target.value)}
            className="w-full appearance-none rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-8 text-sm focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all sm:w-48 min-h-[44px]"
          >
            <option value="all">All Companies</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Filter
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
            size={20}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full appearance-none rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-8 text-sm focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all sm:w-48 min-h-[44px]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="outstanding">Outstanding</option>
            <option value="partial_paid">Partial Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="relative flex-1 sm:w-64">
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

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1000px]">
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
                        className="min-w-[36px] min-h-[36px] p-2"
                        title="Download Invoice"
                        onClick={() => generateInvoicePDF(invoice)}
                      >
                        <Download size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="min-w-[36px] min-h-[36px] p-2"
                        title="Send Invoice Email"
                        onClick={() => sendInvoiceEmail(invoice.id)}
                      >
                        <Send size={16} />
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
              <p className="text-sm mt-2">
                Generate monthly invoices for companies using the dropdown above
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}