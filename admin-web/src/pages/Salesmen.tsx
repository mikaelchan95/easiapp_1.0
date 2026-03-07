import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { StaffProfile } from '../types';
import { Loader2, Search, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface SalesmanRow extends StaffProfile {
  ordersCount: number;
  pendingOnboardings: number;
}

export default function Salesmen() {
  const [salesmen, setSalesmen] = useState<SalesmanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSalesmen();
  }, []);

  const fetchSalesmen = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('staff_role', 'salesman')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!profiles || profiles.length === 0) {
        setSalesmen([]);
        return;
      }

      const ids = profiles.map(p => p.id);

      const [ordersRes, onboardingRes] = await Promise.all([
        supabase
          .from('orders')
          .select('placed_by_staff_id')
          .in('placed_by_staff_id', ids),
        supabase
          .from('customer_onboarding_requests')
          .select('salesman_id')
          .in('salesman_id', ids)
          .eq('status', 'pending'),
      ]);

      const orderCounts: Record<string, number> = {};
      (ordersRes.data || []).forEach(o => {
        orderCounts[o.placed_by_staff_id] =
          (orderCounts[o.placed_by_staff_id] || 0) + 1;
      });

      const onboardingCounts: Record<string, number> = {};
      (onboardingRes.data || []).forEach(o => {
        onboardingCounts[o.salesman_id] =
          (onboardingCounts[o.salesman_id] || 0) + 1;
      });

      const rows: SalesmanRow[] = profiles.map(p => ({
        ...p,
        ordersCount: orderCounts[p.id] || 0,
        pendingOnboardings: onboardingCounts[p.id] || 0,
      }));

      setSalesmen(rows);
    } catch (error) {
      console.error('Error fetching salesmen:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (salesman: SalesmanRow) => {
    setTogglingId(salesman.id);
    try {
      const { error } = await supabase
        .from('staff_profiles')
        .update({ is_active: !salesman.is_active })
        .eq('id', salesman.id);

      if (error) throw error;

      setSalesmen(prev =>
        prev.map(s =>
          s.id === salesman.id ? { ...s, is_active: !s.is_active } : s
        )
      );
    } catch (error) {
      console.error('Error toggling salesman status:', error);
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = salesmen.filter(s => {
    const matchesSearch =
      s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && s.is_active) ||
      (statusFilter === 'inactive' && !s.is_active);
    return matchesSearch && matchesStatus;
  });

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
          Salesmen
        </h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={statusFilter}
            onChange={e =>
              setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
            }
            className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-3 text-sm focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px] touch-manipulation"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all"
            />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="bg-[var(--bg-tertiary)] text-xs uppercase text-[var(--text-secondary)] font-medium tracking-wider">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Name
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Email
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Phone
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] text-center">
                  Orders Placed
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] text-center">
                  Pending Onboardings
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {filtered.map(salesman => (
                <tr
                  key={salesman.id}
                  className="group hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-bold group-hover:opacity-80 transition-opacity flex-shrink-0">
                        {salesman.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <Link
                        to={`/salesmen/${salesman.id}`}
                        className="text-sm font-medium text-[var(--text-primary)] hover:underline transition-colors"
                      >
                        {salesman.full_name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-[var(--text-secondary)]">
                    {salesman.email}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-[var(--text-secondary)]">
                    {salesman.phone || '—'}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center text-sm font-mono text-[var(--text-primary)]">
                    {salesman.ordersCount}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center text-sm font-mono text-[var(--text-primary)]">
                    {salesman.pendingOnboardings > 0 ? (
                      <Badge variant="warning">
                        {salesman.pendingOnboardings}
                      </Badge>
                    ) : (
                      0
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm">
                    <Badge variant={salesman.is_active ? 'success' : 'default'}>
                      {salesman.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm">
                    <Button
                      variant={salesman.is_active ? 'outline' : 'primary'}
                      size="sm"
                      isLoading={togglingId === salesman.id}
                      onClick={() => toggleActive(salesman)}
                    >
                      {salesman.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-[var(--text-secondary)]">
            <div className="flex flex-col items-center justify-center">
              <UserCheck className="mb-4 h-12 w-12 text-[var(--text-tertiary)]" />
              <p className="text-lg font-medium text-[var(--text-primary)]">
                No salesmen found
              </p>
              <p className="text-sm">Adjust your search or filters</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
