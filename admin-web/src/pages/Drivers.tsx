import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { StaffProfile, DeliveryAssignment } from '../types';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Loader2,
  Truck,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function Drivers() {
  const [drivers, setDrivers] = useState<StaffProfile[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<
    DeliveryAssignment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const [driversRes, assignmentsRes] = await Promise.all([
        supabase
          .from('staff_profiles')
          .select('*')
          .eq('staff_role', 'driver')
          .order('full_name', { ascending: true }),
        supabase
          .from('delivery_assignments')
          .select('id, driver_id, status')
          .not('status', 'in', '("delivered","failed")'),
      ]);

      if (driversRes.error) throw driversRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;

      setDrivers(driversRes.data || []);
      setActiveAssignments(assignmentsRes.data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActiveCount = (driverId: string) =>
    activeAssignments.filter(a => a.driver_id === driverId).length;

  const handleToggleActive = async (driver: StaffProfile) => {
    try {
      const { error } = await supabase
        .from('staff_profiles')
        .update({ is_active: !driver.is_active })
        .eq('id', driver.id);

      if (error) throw error;
      setDrivers(prev =>
        prev.map(d =>
          d.id === driver.id ? { ...d, is_active: !d.is_active } : d
        )
      );
    } catch (error) {
      alert('Error updating driver status: ' + (error as Error).message);
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch =
      driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && driver.is_active) ||
      (statusFilter === 'inactive' && !driver.is_active);

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
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
          <Truck size={28} className="text-[var(--text-secondary)]" />
          Drivers
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              size={20}
            />
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
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
                  Active Deliveries
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {filteredDrivers.map(driver => {
                const activeCount = getActiveCount(driver.id);
                return (
                  <tr
                    key={driver.id}
                    className="group hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-[var(--text-primary)]">
                      <Link
                        to={`/drivers/${driver.id}`}
                        className="flex items-center gap-2 hover:underline transition-colors"
                      >
                        <Truck
                          size={16}
                          className="text-[var(--text-tertiary)] flex-shrink-0"
                        />
                        <span className="truncate">{driver.full_name}</span>
                      </Link>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-[var(--text-secondary)]">
                      {driver.email}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-[var(--text-secondary)]">
                      {driver.phone || '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-center">
                      {activeCount > 0 ? (
                        <Badge variant="info">{activeCount}</Badge>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">0</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm">
                      <Badge variant={driver.is_active ? 'success' : 'default'}>
                        {driver.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-right">
                      <button
                        onClick={() => handleToggleActive(driver)}
                        className="rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation ml-auto"
                        title={driver.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {driver.is_active ? (
                          <ToggleRight size={22} className="text-green-600" />
                        ) : (
                          <ToggleLeft size={22} />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredDrivers.length === 0 && (
          <div className="p-12 text-center text-[var(--text-secondary)]">
            <div className="flex flex-col items-center justify-center">
              <Truck className="mb-4 h-12 w-12 text-[var(--text-tertiary)]" />
              <p className="text-lg font-medium text-[var(--text-primary)]">
                No drivers found
              </p>
              <p className="text-sm">Adjust your search or filters</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
