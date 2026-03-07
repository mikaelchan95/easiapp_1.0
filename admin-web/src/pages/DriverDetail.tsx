import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { StaffProfile, DeliveryAssignment, DeliveryProof } from '../types';
import {
  ArrowLeft,
  Truck,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  BarChart3,
  Package,
  ChevronRight,
  Loader2,
  Image as ImageIcon,
  Clock,
  User,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

type TabKey = 'active' | 'history' | 'proofs';

const STATUS_FLOW: Record<string, string> = {
  assigned: 'dispatched',
  dispatched: 'en_route',
  en_route: 'arrived',
  arrived: 'delivered',
};

const STATUS_TIMESTAMP_FIELD: Record<string, string> = {
  dispatched: 'dispatched_at',
  en_route: 'dispatched_at',
  arrived: 'arrived_at',
  delivered: 'delivered_at',
};

const getDeliveryStatusVariant = (status: string) => {
  switch (status) {
    case 'assigned':
      return 'default';
    case 'dispatched':
      return 'info';
    case 'en_route':
      return 'warning';
    case 'arrived':
      return 'purple';
    case 'delivered':
      return 'success';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
};

const getZoneVariant = (_zone: string) => 'outline' as const;

export default function DriverDetail() {
  const { id } = useParams<{ id: string }>();
  const [driver, setDriver] = useState<StaffProfile | null>(null);
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [proofs, setProofs] = useState<DeliveryProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('active');

  useEffect(() => {
    if (id) fetchDriverDetail();
  }, [id]);

  useEffect(() => {
    if (
      activeTab === 'proofs' &&
      assignments.length > 0 &&
      proofs.length === 0
    ) {
      fetchProofs();
    }
  }, [activeTab, assignments]);

  const fetchDriverDetail = async () => {
    try {
      const [driverRes, assignmentsRes] = await Promise.all([
        supabase.from('staff_profiles').select('*').eq('id', id).single(),
        supabase
          .from('delivery_assignments')
          .select(
            '*, order:orders(id, order_number, total, delivery_address, delivery_zone, company:companies(name))'
          )
          .eq('driver_id', id)
          .order('assigned_at', { ascending: false }),
      ]);

      if (driverRes.error) throw driverRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;

      setDriver(driverRes.data);
      setAssignments(assignmentsRes.data || []);
    } catch (error) {
      console.error('Error fetching driver detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProofs = async () => {
    if (assignments.length === 0) return;
    try {
      const assignmentIds = assignments.map(a => a.id);
      const { data, error } = await supabase
        .from('delivery_proofs')
        .select('*')
        .in('delivery_assignment_id', assignmentIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProofs(data || []);
    } catch (error) {
      console.error('Error fetching delivery proofs:', error);
    }
  };

  const handleToggleActive = async () => {
    if (!driver) return;
    try {
      const { error } = await supabase
        .from('staff_profiles')
        .update({ is_active: !driver.is_active })
        .eq('id', driver.id);

      if (error) throw error;
      setDriver({ ...driver, is_active: !driver.is_active });
    } catch (error) {
      alert('Error updating driver status: ' + (error as Error).message);
    }
  };

  const handleAdvanceStatus = async (assignment: DeliveryAssignment) => {
    const nextStatus = STATUS_FLOW[assignment.status];
    if (!nextStatus) return;

    const timestampField = STATUS_TIMESTAMP_FIELD[nextStatus];
    const updatePayload: Record<string, unknown> = { status: nextStatus };
    if (timestampField) {
      updatePayload[timestampField] = new Date().toISOString();
    }

    try {
      const { error } = await supabase
        .from('delivery_assignments')
        .update(updatePayload)
        .eq('id', assignment.id);

      if (error) throw error;
      setAssignments(prev =>
        prev.map(a =>
          a.id === assignment.id
            ? {
                ...a,
                status: nextStatus as DeliveryAssignment['status'],
                ...updatePayload,
              }
            : a
        )
      );
    } catch (error) {
      alert('Error advancing status: ' + (error as Error).message);
    }
  };

  const activeDeliveries = assignments.filter(
    a => a.status !== 'delivered' && a.status !== 'failed'
  );
  const historyDeliveries = assignments.filter(
    a => a.status === 'delivered' || a.status === 'failed'
  );
  const completedCount = assignments.filter(
    a => a.status === 'delivered'
  ).length;
  const failedCount = assignments.filter(a => a.status === 'failed').length;
  const successRate =
    assignments.length > 0
      ? Math.round((completedCount / assignments.length) * 100)
      : 0;

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

  if (!driver) {
    return (
      <div className="p-8 text-center text-[var(--text-secondary)]">
        <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          Driver not found
        </p>
        <Link
          to="/drivers"
          className="mt-4 inline-block px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg hover:opacity-90"
        >
          Back to Drivers
        </Link>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    {
      key: 'active',
      label: 'Active Deliveries',
      count: activeDeliveries.length,
    },
    { key: 'history', label: 'History', count: historyDeliveries.length },
    { key: 'proofs', label: 'Proofs' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/drivers">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-full p-0 min-w-[40px]"
            >
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-bold text-xl sm:text-2xl border border-[var(--border-primary)] flex-shrink-0">
              {driver.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
                <span className="truncate">{driver.full_name}</span>
                <Badge variant={driver.is_active ? 'success' : 'default'}>
                  {driver.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </h1>
              <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail size={14} className="flex-shrink-0" />
                  {driver.email}
                </span>
                {driver.phone && (
                  <a
                    href={`tel:${driver.phone}`}
                    className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Phone size={14} className="flex-shrink-0" />
                    {driver.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleToggleActive}
            className="w-full sm:w-auto"
          >
            {driver.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-4">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Total Deliveries
            </h3>
            <div className="p-2 bg-blue-50 text-blue-600 ring-1 ring-blue-600/20 rounded-lg">
              <Package size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {assignments.length}
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Completed
            </h3>
            <div className="p-2 bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/20 rounded-lg">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {completedCount}
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Failed
            </h3>
            <div className="p-2 bg-red-50 text-red-600 ring-1 ring-red-600/20 rounded-lg">
              <XCircle size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {failedCount}
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Success Rate
            </h3>
            <div className="p-2 bg-purple-50 text-purple-600 ring-1 ring-purple-600/20 rounded-lg">
              <BarChart3 size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {successRate}%
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-primary)] overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`pb-3 sm:pb-4 px-3 sm:px-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap min-h-[44px] touch-manipulation flex items-center gap-2 ${
              activeTab === tab.key
                ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active Deliveries Tab */}
      {activeTab === 'active' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[900px]">
              <thead className="bg-[var(--bg-tertiary)] text-xs uppercase text-[var(--text-secondary)] font-medium tracking-wider">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Order #
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Company
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Address
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Zone
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Assigned At
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {activeDeliveries.map(assignment => {
                  const order = assignment.order as any;
                  const nextStatus = STATUS_FLOW[assignment.status];
                  return (
                    <tr
                      key={assignment.id}
                      className="group hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-[var(--text-primary)]">
                        #{order?.order_number || '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                        {order?.company?.name || '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)] max-w-[200px] truncate">
                        {formatAddress(order?.delivery_address)}
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
                        <Badge
                          variant={getDeliveryStatusVariant(assignment.status)}
                        >
                          {formatStatus(assignment.status)}
                        </Badge>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                        {new Date(assignment.assigned_at).toLocaleDateString()}{' '}
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {new Date(assignment.assigned_at).toLocaleTimeString(
                            [],
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                        {nextStatus && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdvanceStatus(assignment)}
                            rightIcon={<ChevronRight size={14} />}
                          >
                            {formatStatus(nextStatus)}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {activeDeliveries.length === 0 && (
            <div className="p-12 text-center text-[var(--text-secondary)]">
              <div className="flex flex-col items-center justify-center">
                <Truck className="mb-4 h-12 w-12 text-[var(--text-tertiary)]" />
                <p className="text-lg font-medium text-[var(--text-primary)]">
                  No active deliveries
                </p>
                <p className="text-sm">
                  This driver has no ongoing assignments.
                </p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-[var(--bg-tertiary)] text-xs uppercase text-[var(--text-secondary)] font-medium tracking-wider">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Order #
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Company
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Completed At
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                    Failure Reason
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {historyDeliveries.map(assignment => {
                  const order = assignment.order as any;
                  const completedAt =
                    assignment.delivered_at || assignment.failed_at;
                  return (
                    <tr
                      key={assignment.id}
                      className="group hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-[var(--text-primary)]">
                        #{order?.order_number || '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                        {order?.company?.name || '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <Badge
                          variant={getDeliveryStatusVariant(assignment.status)}
                        >
                          {formatStatus(assignment.status)}
                        </Badge>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                        {completedAt ? (
                          <>
                            {new Date(completedAt).toLocaleDateString()}{' '}
                            <span className="text-xs text-[var(--text-tertiary)]">
                              {new Date(completedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                        {assignment.failure_reason || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {historyDeliveries.length === 0 && (
            <div className="p-12 text-center text-[var(--text-secondary)]">
              <div className="flex flex-col items-center justify-center">
                <Clock className="mb-4 h-12 w-12 text-[var(--text-tertiary)]" />
                <p className="text-lg font-medium text-[var(--text-primary)]">
                  No delivery history
                </p>
                <p className="text-sm">
                  Completed and failed deliveries will appear here.
                </p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Proofs Tab */}
      {activeTab === 'proofs' && (
        <div>
          {proofs.length > 0 ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {proofs.map(proof => (
                <Card key={proof.id} className="overflow-hidden">
                  {proof.photo_url && (
                    <div className="aspect-video bg-[var(--bg-tertiary)] relative">
                      <img
                        src={proof.photo_url}
                        alt={`Proof for ${proof.recipient_name}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <User
                        size={16}
                        className="text-[var(--text-tertiary)] flex-shrink-0"
                      />
                      <span className="font-medium text-[var(--text-primary)] truncate">
                        {proof.recipient_name}
                      </span>
                    </div>
                    {proof.notes && (
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                        {proof.notes}
                      </p>
                    )}
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {proof.captured_at
                        ? new Date(proof.captured_at).toLocaleString()
                        : new Date(proof.created_at).toLocaleString()}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <div className="p-12 text-center text-[var(--text-secondary)]">
                <div className="flex flex-col items-center justify-center">
                  <ImageIcon className="mb-4 h-12 w-12 text-[var(--text-tertiary)]" />
                  <p className="text-lg font-medium text-[var(--text-primary)]">
                    No delivery proofs
                  </p>
                  <p className="text-sm">
                    Proof of delivery records will appear here.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatAddress(address: unknown): string {
  if (!address) return '—';
  if (typeof address === 'string') {
    try {
      const parsed = JSON.parse(address);
      return parsed.address || address;
    } catch {
      return address;
    }
  }
  if (typeof address === 'object' && address !== null) {
    return (address as any).address || JSON.stringify(address);
  }
  return '—';
}
