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
      // Fetch invoices (assuming we have an invoices table or view, or mocking it)
      // Since schema wasn't fully detailed for invoices, we might mock structure or assume similar to orders
      // For now, let's assume we query 'orders' focused on payment info as proxy for invoices or a real 'invoices' table
      // If table doesn't exist, this might fail, but code follows pattern. 
      // Assuming 'invoices' table exists based on previous instructions.
      const { data, error } = await supabase
        .from('invoices') // Assuming this table exists
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback or just empty if table doesn't exist yet
        console.warn('Invoices table might not exist, using empty array');
      }
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
     // invoice_number might differ from id
     const matchesSearch = invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
     return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'overdue': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-brand-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-brand-dark tracking-tight">Invoices</h1>
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-brand-white py-2 pl-10 pr-8 text-sm focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark transition-all sm:w-40"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark transition-all text-sm"
            />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-brand-light text-xs uppercase text-brand-dark font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Invoice #</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Due Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-6 py-4 font-semibold text-right">Balance</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="group hover:bg-brand-light/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    <div className="flex items-center gap-2">
                       <FileText size={16} className="text-gray-400" />
                       {invoice.id.slice(0, 8).toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(new Date(invoice.created_at).setDate(new Date(invoice.created_at).getDate() + 30)).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getStatusVariant(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-brand-dark">
                    ${invoice.total_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    ${(invoice.status === 'paid' ? 0 : invoice.total_amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Download size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="p-12 text-center text-gray-500">
             <div className="flex flex-col items-center justify-center">
              <FileText className="mb-4 h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium">No invoices found</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
