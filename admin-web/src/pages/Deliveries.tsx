import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  DeliveryAssignment,
  StaffProfile,
  DeliveryStatus,
  DeliveryZone,
} from '../types';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Loader2,
  Truck,
  CalendarClock,
  Phone,
  ArrowRight,
  UserCog,
  Package,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const DELIVERY_STATUSES: DeliveryStatus[] = [
  'assigned',
  'dispatched',
  'en_route',
  'arrived',
  'delivered',
  'failed',
];

const ZONES: DeliveryZone[] = ['North', 'South', 'East', 'West', 'Central'];

const STATUS_FLOW: Record<string, DeliveryStatus | null> = {
  assigned: 'dispatched',
  dispatched: 'en_route',
  en_route: 'arrived',
  arrived: 'delivered',
  delivered: null,
  failed: null,
};

const getStatusVariant = (status: DeliveryStatus) => {
  const map: Record<
    DeliveryStatus,
    'default' | 'success' | 'warning' | 'error' | 'info' | 'purple'
  > = {
    assigned: 'default',
    dispatched: 'info',
    en_route: 'warning',
    arrived: 'purple',
    delivered: 'success',
    failed: 'error',
  };
  return map[status] ?? 'default';
};

const getZoneVariant = (zone: string) => {
  const map: Record<
    string,
    'default' | 'info' | 'warning' | 'success' | 'purple'
  > = {
    North: 'info',
    South: 'success',
    East: 'warning',
    West: 'purple',
    Central: 'default',
  };
  return map[zone] ?? 'default';
};

const parseAddress = (addr: any): string => {
  if (!addr) return 'No address';
  if (typeof addr === 'string') {
    try {
      const parsed = JSON.parse(addr);
      return parsed.address || addr;
    } catch {
      return addr;
    }
  }
  return addr.address || 'No address';
};

const formatLabel = (s: string) =>
  s
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const SELECT_QUERY =
  '*, order:orders(id, order_number, total, delivery_address, delivery_zone, company:companies(name)), driver:staff_profiles!delivery_assignments_driver_id_fkey(id, full_name, email, phone, is_active)';

export default function Deliveries() {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [upcoming, setUpcoming] = useState<DeliveryAssignment[]>([]);
  const [drivers, setDrivers] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');

  const [reassignTarget, setReassignTarget] =
    useState<DeliveryAssignment | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const now = new Date();
      const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const [assignmentsRes, upcomingRes, driversRes] = await Promise.all([
        supabase
          .from('delivery_assignments')
          .select(SELECT_QUERY)
          .order('assigned_at', { ascending: false }),
        supabase
          .from('delivery_assignments')
          .select(SELECT_QUERY)
          .gte('assigned_at', now.toISOString())
          .lte('assigned_at', threeDays.toISOString())
          .not('status', 'in', '("delivered","failed")')
          .order('assigned_at', { ascending: true }),
        supabase
          .from('staff_profiles')
          .select('*')
          .eq('staff_role', 'driver')
          .eq('is_active', true)
          .order('full_name', { ascending: true }),
      ]);

      if (assignmentsRes.error) throw assignmentsRes.error;
      if (upcomingRes.error) throw upcomingRes.error;
      if (driversRes.error) throw driversRes.error;

      setAssignments(assignmentsRes.data || []);
      setUpcoming(upcomingRes.data || []);
      setDrivers(driversRes.data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStatus = async (assignment: DeliveryAssignment) => {
    const nextStatus = STATUS_FLOW[assignment.status];
    if (!nextStatus) return;

    const updates: Record<string, any> = { status: nextStatus };
    if (nextStatus === 'dispatched')
      updates.dispatched_at = new Date().toISOString();
    if (nextStatus === 'arrived') updates.arrived_at = new Date().toISOString();
    if (nextStatus === 'delivered')
      updates.delivered_at = new Date().toISOString();

    try {
      const { error } = await supabase
        .from('delivery_assignments')
        .update(updates)
        .eq('id', assignment.id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      alert('Error advancing status: ' + (error as Error).message);
    }
  };

  const handleReassign = async () => {
    if (!reassignTarget || !selectedDriverId) return;
    setReassigning(true);
    try {
      const { error } = await supabase
        .from('delivery_assignments')
        .update({ driver_id: selectedDriverId })
        .eq('id', reassignTarget.id);

      if (error) throw error;
      setReassignTarget(null);
      setSelectedDriverId('');
      fetchData();
    } catch (error) {
      alert('Error reassigning driver: ' + (error as Error).message);
    } finally {
      setReassigning(false);
    }
  };

  const filtered = assignments.filter(a => {
    const order = a.order as any;
    const driver = a.driver as any;
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      !term ||
      order?.order_number?.toLowerCase().includes(term) ||
      driver?.full_name?.toLowerCase().includes(term) ||
      order?.company?.name?.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesZone =
      zoneFilter === 'all' || order?.delivery_zone === zoneFilter;

    return matchesSearch && matchesStatus && matchesZone;
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
          <Truck size={28} className="text-[var(--text-secondary)]" />
          Deliveries
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
              {DELIVERY_STATUSES.map(s => (
                <option key={s} value={s}>
                  {formatLabel(s)}
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
              value={zoneFilter}
              onChange={e => setZoneFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-8 text-sm focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all sm:w-44 min-h-[44px] touch-manipulation"
            >
              <option value="all">All Zones</option>
              {ZONES.map(z => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              size={20}
            />
            <input
              type="text"
              placeholder="Search orders, drivers, companies..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* Upcoming Deliveries */}
      <Card className="border-l-4 border-l-blue-500">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock
            size={20}
            className="text-blue-600 dark:text-blue-400"
          />
          <h2 className="font-semibold text-[var(--text-primary)]">
            Upcoming Deliveries (Next 3 Days)
          </h2>
          {upcoming.length > 0 && (
            <Badge variant="info">{upcoming.length}</Badge>
          )}
        </div>

        {upcoming.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)]">
            No upcoming deliveries
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map(a => {
              const order = a.order as any;
              const driver = a.driver as any;
              return (
                <Link
                  key={a.id}
                  to={`/deliveries/${a.id}`}
                  className="block rounded-lg border border-[var(--border-primary)] p-3 hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-[var(--text-primary)]">
                      #{order?.order_number || '—'}
                    </span>
                    <Badge
                      variant={getStatusVariant(a.status)}
                      className="text-[10px] px-2 py-0.5 min-w-0"
                    >
                      {formatLabel(a.status)}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-[var(--text-secondary)]">
                    <p>{order?.company?.name || 'No company'}</p>
                    <div className="flex items-center justify-between">
                      <span>{driver?.full_name || 'Unassigned'}</span>
                      {order?.delivery_zone && (
                        <Badge
                          variant={getZoneVariant(order.delivery_zone)}
                          className="text-[10px] px-2 py-0.5 min-w-0"
                        >
                          {order.delivery_zone}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[var(--text-tertiary)]">
                      {new Date(a.assigned_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {/* Main Deliveries Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1000px]">
            <thead className="bg-[var(--bg-tertiary)] text-xs uppercase text-[var(--text-primary)] font-bold tracking-wider">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Order #</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Driver</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Company</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Address</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Zone</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Status</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Assigned</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {filtered.map(a => {
                const order = a.order as any;
                const driver = a.driver as any;
                const address = parseAddress(order?.delivery_address);
                const nextStatus = STATUS_FLOW[a.status];

                return (
                  <tr
                    key={a.id}
                    className="group hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-[var(--text-primary)]">
                      <Link
                        to={`/deliveries/${a.id}`}
                        className="flex items-center gap-2 hover:underline transition-colors"
                      >
                        <Package
                          size={16}
                          className="text-[var(--text-tertiary)] flex-shrink-0"
                        />
                        <span className="truncate">
                          #{order?.order_number || '—'}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-primary)]">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/drivers/${driver?.id}`}
                          className="hover:underline truncate"
                        >
                          {driver?.full_name || 'Unassigned'}
                        </Link>
                        {driver?.phone && (
                          <div className="relative group/phone">
                            <Phone
                              size={14}
                              className="text-[var(--text-tertiary)] hover:text-[var(--color-primary)] cursor-pointer flex-shrink-0"
                            />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/phone:block z-10">
                              <a
                                href={`tel:${driver.phone}`}
                                className="block whitespace-nowrap rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] px-3 py-1.5 text-xs font-medium shadow-lg hover:opacity-90 transition-opacity"
                              >
                                {driver.phone}
                              </a>
                              <div className="mx-auto mt-[-1px] h-2 w-2 rotate-45 bg-[var(--text-primary)]" />
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                      {order?.company?.name || '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                      <span
                        className="block max-w-[180px] truncate"
                        title={address}
                      >
                        {address}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      {order?.delivery_zone ? (
                        <Badge variant={getZoneVariant(order.delivery_zone)}>
                          {order.delivery_zone}
                        </Badge>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">—</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <Badge variant={getStatusVariant(a.status)}>
                        {formatLabel(a.status)}
                      </Badge>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                      <div className="flex flex-col">
                        <span>
                          {new Date(a.assigned_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {new Date(a.assigned_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setReassignTarget(a);
                            setSelectedDriverId(a.driver_id);
                          }}
                          className="rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
                          title="Reassign Driver"
                        >
                          <UserCog size={16} />
                        </button>
                        {nextStatus && (
                          <button
                            onClick={() => handleAdvanceStatus(a)}
                            className="rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
                            title={`Advance to ${formatLabel(nextStatus)}`}
                          >
                            <ArrowRight size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-[var(--text-secondary)]">
            <div className="flex flex-col items-center justify-center">
              <Truck className="mb-4 h-12 w-12 text-[var(--text-tertiary)]" />
              <p className="text-lg font-medium text-[var(--text-primary)]">
                No deliveries found
              </p>
              <p className="text-sm">Try adjusting your search or filters.</p>
            </div>
          </div>
        )}
      </Card>

      {/* Reassign Driver Modal */}
      <Modal
        isOpen={!!reassignTarget}
        onClose={() => {
          setReassignTarget(null);
          setSelectedDriverId('');
        }}
        title="Reassign Driver"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Reassigning delivery for order{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              #{(reassignTarget?.order as any)?.order_number || '—'}
            </span>
          </p>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Select Driver
            </label>
            <select
              value={selectedDriverId}
              onChange={e => setSelectedDriverId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 px-4 text-sm focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
            >
              <option value="">Choose a driver...</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.full_name} {d.phone ? `(${d.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setReassignTarget(null);
                setSelectedDriverId('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleReassign}
              disabled={
                !selectedDriverId ||
                selectedDriverId === reassignTarget?.driver_id
              }
              isLoading={reassigning}
            >
              Reassign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
