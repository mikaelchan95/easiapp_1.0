import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';
import { Loader2, Search, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

// Helper to deduce status color
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'error';
    default:
      return 'default';
  }
};

export default function Customers() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      // Join with companies table to get company name
      const { data, error } = await supabase
        .from('users')
        .select('*, companies(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    customer =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          Customers
        </h1>
        <div className="relative w-full sm:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
            size={20}
          />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-[var(--bg-tertiary)] text-xs uppercase text-[var(--text-primary)] font-bold tracking-wider">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4">User</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Role</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Company</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Points</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Joined At</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {filteredCustomers.map(customer => (
                <tr
                  key={customer.id}
                  className="group hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-bold group-hover:opacity-80 transition-opacity flex-shrink-0">
                        {customer.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/customers/${customer.id}`}
                          className="font-medium text-[var(--text-primary)] hover:underline transition-colors block truncate"
                        >
                          {customer.name}
                        </Link>
                        <div className="text-xs text-[var(--text-tertiary)] truncate">
                          {customer.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)] capitalize">
                    {customer.role || '-'}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-[var(--text-primary)]">
                    {/* @ts-expect-error */}
                    {customer.companies?.name || '-'}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-[var(--text-primary)]">
                    {(customer.points || 0).toLocaleString('en-US')}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <Badge variant={getStatusVariant('active')}>Active</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center text-[var(--text-secondary)]">
            <div className="flex flex-col items-center justify-center">
              <UserIcon className="mb-4 h-12 w-12 text-[var(--text-tertiary)]" />
              <p className="text-lg font-medium text-[var(--text-primary)]">
                No customers found
              </p>
              <p className="text-sm">Try adjusting your search terms.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
