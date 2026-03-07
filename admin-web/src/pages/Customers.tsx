import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';
import {
  Loader2,
  Search,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';

const PAGE_SIZE = 10;

export default function Customers() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchCustomers();
  }, [page, searchTerm]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('account_type', 'individual');

      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setCustomers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Customers
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Individual and private buyers
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-2 pl-9 pr-4 text-sm focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all"
          />
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-tertiary)]">
              <tr>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Customer
                </th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Points
                </th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] text-right">
                  Total Spent
                </th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] text-right">
                  Orders
                </th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="h-40 text-center">
                    <div className="flex justify-center items-center h-full">
                      <Loader2
                        className="animate-spin text-[var(--text-secondary)]"
                        size={20}
                      />
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <UserIcon className="mb-3 h-10 w-10 text-[var(--text-tertiary)]" />
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        No customers found
                      </p>
                      {searchTerm && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-1">
                          Try a different search term
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map(customer => (
                  <tr
                    key={customer.id}
                    className="group hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-bold text-xs shrink-0">
                          {customer.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/customers/${customer.id}`}
                            className="text-sm font-medium text-[var(--text-primary)] hover:underline block truncate"
                          >
                            {customer.name}
                          </Link>
                          <div className="text-xs text-[var(--text-tertiary)] truncate">
                            {customer.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm font-mono text-[var(--text-primary)]">
                      {(customer.points || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-sm font-mono font-medium text-[var(--text-primary)] text-right">
                      $
                      {(customer.total_spent || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-5 py-3 text-sm text-[var(--text-primary)] text-right">
                      {(customer.total_orders || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">
                      {new Date(customer.created_at).toLocaleDateString(
                        'en-GB',
                        {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalCount > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-secondary)]">
              Showing {(page - 1) * PAGE_SIZE + 1} to{' '}
              {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-medium text-[var(--text-primary)]">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
