import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type {
  DeliveryAssignment,
  DeliveryProof,
  DigitalHandshake,
  DeliveryStatus,
  OrderItem,
} from '../types';
import {
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Truck,
  AlertTriangle,
  Camera,
  Handshake,
  StickyNote,
  User,
  UserCog,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const STATUS_ORDER: DeliveryStatus[] = [
  'assigned',
  'dispatched',
  'en_route',
  'arrived',
  'delivered',
];

const STATUS_TIMESTAMPS: Partial<Record<DeliveryStatus, string>> = {
  assigned: 'assigned_at',
  dispatched: 'dispatched_at',
  arrived: 'arrived_at',
  delivered: 'delivered_at',
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

const formatLabel = (s: string) =>
  s
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

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

const SELECT_QUERY =
  '*, order:orders(id, order_number, total, delivery_address, delivery_zone, company:companies(name), user:users(name, email, phone)), driver:staff_profiles!delivery_assignments_driver_id_fkey(id, full_name, email, phone, is_active)';

export default function DeliveryDetail() {
  const { id } = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<DeliveryAssignment | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [proofs, setProofs] = useState<DeliveryProof[]>([]);
  const [handshakes, setHandshakes] = useState<DigitalHandshake[]>([]);
  const [loading, setLoading] = useState(true);

  const [drivers, setDrivers] = useState<any[]>([]);
  const [showReassign, setShowReassign] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [reassigning, setReassigning] = useState(false);

  const [showFailModal, setShowFailModal] = useState(false);
  const [failureReason, setFailureReason] = useState('');
  const [failing, setFailing] = useState(false);

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      const { data: aData, error: aErr } = await supabase
        .from('delivery_assignments')
        .select(SELECT_QUERY)
        .eq('id', id)
        .single();

      if (aErr) throw aErr;
      setAssignment(aData);

      const orderId = aData.order_id;

      const [itemsRes, proofsRes, handshakesRes, driversRes] =
        await Promise.all([
          supabase.from('order_items').select('*').eq('order_id', orderId),
          supabase
            .from('delivery_proofs')
            .select('*')
            .eq('delivery_assignment_id', id!),
          supabase
            .from('digital_handshakes')
            .select('*')
            .eq('order_id', orderId),
          supabase
            .from('staff_profiles')
            .select('*')
            .eq('staff_role', 'driver')
            .eq('is_active', true)
            .order('full_name', { ascending: true }),
        ]);

      setItems(itemsRes.data || []);
      setProofs(proofsRes.data || []);
      setHandshakes(handshakesRes.data || []);
      setDrivers(driversRes.data || []);
    } catch (error) {
      console.error('Error fetching delivery detail:', error);
      setAssignment(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: DeliveryStatus) => {
    if (!assignment) return;

    const updates: Record<string, any> = { status: newStatus };
    if (newStatus === 'dispatched')
      updates.dispatched_at = new Date().toISOString();
    if (newStatus === 'arrived') updates.arrived_at = new Date().toISOString();
    if (newStatus === 'delivered')
      updates.delivered_at = new Date().toISOString();

    try {
      const { error } = await supabase
        .from('delivery_assignments')
        .update(updates)
        .eq('id', assignment.id);

      if (error) throw error;
      fetchAll();
    } catch (error) {
      alert('Error updating status: ' + (error as Error).message);
    }
  };

  const handleMarkFailed = async () => {
    if (!assignment || !failureReason.trim()) return;
    setFailing(true);
    try {
      const { error } = await supabase
        .from('delivery_assignments')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          failure_reason: failureReason.trim(),
        })
        .eq('id', assignment.id);

      if (error) throw error;
      setShowFailModal(false);
      setFailureReason('');
      fetchAll();
    } catch (error) {
      alert('Error marking as failed: ' + (error as Error).message);
    } finally {
      setFailing(false);
    }
  };

  const handleReassign = async () => {
    if (!assignment || !selectedDriverId) return;
    setReassigning(true);
    try {
      const { error } = await supabase
        .from('delivery_assignments')
        .update({ driver_id: selectedDriverId })
        .eq('id', assignment.id);

      if (error) throw error;
      setShowReassign(false);
      setSelectedDriverId('');
      fetchAll();
    } catch (error) {
      alert('Error reassigning driver: ' + (error as Error).message);
    } finally {
      setReassigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2
          className="animate-spin text-[var(--text-primary)]"
          size={32}
        />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Delivery not found
          </p>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Assignment ID: {id}
          </p>
          <Link to="/deliveries">
            <Button variant="primary">Back to Deliveries</Button>
          </Link>
        </div>
      </div>
    );
  }

  const order = assignment.order as any;
  const driver = assignment.driver as any;
  const customer = order?.user;
  const handshake = handshakes[0] || null;
  const proof = proofs[0] || null;

  const currentIdx =
    assignment.status === 'failed'
      ? -1
      : STATUS_ORDER.indexOf(assignment.status);

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link to="/deliveries">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-full p-0 min-w-[40px]"
            >
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
              <span>Delivery #{order?.order_number || '—'}</span>
              <Badge
                variant={getStatusVariant(assignment.status)}
                className="text-sm"
              >
                {formatLabel(assignment.status)}
              </Badge>
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {driver?.full_name || 'No driver'} &middot; Assigned{' '}
              {new Date(assignment.assigned_at).toLocaleDateString()} at{' '}
              {new Date(assignment.assigned_at).toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          {assignment.status !== 'delivered' &&
            assignment.status !== 'failed' && (
              <select
                value={assignment.status}
                onChange={e =>
                  handleStatusChange(e.target.value as DeliveryStatus)
                }
                className="px-4 py-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px] touch-manipulation"
              >
                {STATUS_ORDER.map(s => (
                  <option key={s} value={s}>
                    {formatLabel(s)}
                  </option>
                ))}
              </select>
            )}

          <Button
            variant="outline"
            onClick={() => {
              setShowReassign(true);
              setSelectedDriverId(assignment.driver_id);
            }}
            leftIcon={<UserCog size={16} />}
          >
            Reassign
          </Button>

          {assignment.status !== 'failed' && (
            <Button
              variant="danger"
              onClick={() => setShowFailModal(true)}
              leftIcon={<AlertTriangle size={16} />}
            >
              Mark Failed
            </Button>
          )}
        </div>
      </div>

      {/* Failed reason banner */}
      {assignment.status === 'failed' && assignment.failure_reason && (
        <Card className="border-l-4 border-l-red-500 bg-red-50/50">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="text-red-600 mt-0.5 flex-shrink-0"
            />
            <div>
              <p className="font-semibold text-red-800 text-sm">
                Delivery Failed
              </p>
              <p className="text-sm text-red-700 mt-1">
                {assignment.failure_reason}
              </p>
              {assignment.failed_at && (
                <p className="text-xs text-red-500 mt-1">
                  Failed at {new Date(assignment.failed_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Status Timeline */}
      <Card>
        <div className="px-2 py-4 sm:px-6">
          <div className="flex items-center justify-between relative">
            {STATUS_ORDER.map((step, idx) => {
              const isCurrent = idx === currentIdx;
              const isCompleted = currentIdx >= 0 && idx < currentIdx;
              const isFuture = currentIdx >= 0 && idx > currentIdx;
              const isFailed = assignment.status === 'failed';

              const tsField = STATUS_TIMESTAMPS[step];
              const ts = tsField ? (assignment as any)[tsField] : null;

              return (
                <div
                  key={step}
                  className="flex flex-col items-center flex-1 relative z-10"
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isCurrent && !isFailed
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : isFailed && idx === 0
                            ? 'bg-red-500 border-red-500 text-white'
                            : 'bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-tertiary)]'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={16} />
                    ) : isCurrent && !isFailed ? (
                      <Clock size={14} />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`mt-2 text-[10px] sm:text-xs font-medium text-center ${
                      isCompleted
                        ? 'text-green-700'
                        : isCurrent && !isFailed
                          ? 'text-blue-700'
                          : 'text-[var(--text-tertiary)]'
                    }`}
                  >
                    {formatLabel(step)}
                  </span>
                  {ts && (
                    <span className="mt-0.5 text-[9px] sm:text-[10px] text-[var(--text-tertiary)] text-center">
                      {new Date(ts).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      {new Date(ts).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                  {/* Connector line */}
                  {idx < STATUS_ORDER.length - 1 && (
                    <div
                      className={`absolute top-4 left-[calc(50%+16px)] h-0.5 transition-colors ${
                        isCompleted
                          ? 'bg-green-500'
                          : 'bg-[var(--border-primary)]'
                      }`}
                      style={{ width: 'calc(100% - 32px)' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Content Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Main (2/3) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Order Items */}
          <Card className="overflow-hidden p-0">
            <div className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 sm:px-6 py-4">
              <h2 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Package size={18} className="text-[var(--text-secondary)]" />
                Order Items
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-[var(--text-tertiary)] tracking-wider">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left">Product</th>
                    <th className="px-4 sm:px-6 py-3 text-center">Qty</th>
                    <th className="px-4 sm:px-6 py-3 text-right">Unit Price</th>
                    <th className="px-4 sm:px-6 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-primary)]">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 sm:px-6 py-3 text-[var(--text-primary)] font-medium">
                        {item.product_name || 'Unknown Product'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-center text-[var(--text-secondary)]">
                        {item.quantity}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-right text-[var(--text-secondary)]">
                        ${(item.unit_price ?? item.price ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-right font-medium text-[var(--text-primary)]">
                        $
                        {(
                          item.total_price ??
                          (item.unit_price ?? item.price ?? 0) * item.quantity
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 sm:px-6 py-4 flex justify-between items-center">
              <span className="font-semibold text-[var(--text-primary)]">
                Order Total
              </span>
              <span className="font-bold text-lg text-[var(--text-primary)]">
                $
                {(order?.total ?? 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </Card>

          {/* Delivery Notes */}
          {assignment.notes && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <StickyNote
                  size={18}
                  className="text-[var(--text-secondary)]"
                />
                <h2 className="font-semibold text-[var(--text-primary)]">
                  Delivery Notes
                </h2>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {assignment.notes}
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-4 sm:space-y-6">
          {/* Driver Card */}
          <Card>
            <div className="border-b border-[var(--border-primary)] -mx-6 -mt-6 px-4 sm:px-6 py-4 mb-4">
              <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Truck size={16} className="text-[var(--text-secondary)]" />
                Driver
              </h3>
            </div>
            {driver ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--text-primary)]">
                    {driver.full_name}
                  </span>
                  <Badge variant={driver.is_active ? 'success' : 'default'}>
                    {driver.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <a
                    href={`mailto:${driver.email}`}
                    className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Mail size={14} className="flex-shrink-0" />
                    <span className="truncate">{driver.email}</span>
                  </a>
                  {driver.phone && (
                    <a
                      href={`tel:${driver.phone}`}
                      className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <Phone size={14} className="flex-shrink-0" />
                      {driver.phone}
                    </a>
                  )}
                </div>
                <Link to={`/drivers/${driver.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View Full Profile
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)]">
                No driver assigned
              </p>
            )}
          </Card>

          {/* Customer Card */}
          <Card>
            <div className="border-b border-[var(--border-primary)] -mx-6 -mt-6 px-4 sm:px-6 py-4 mb-4">
              <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <User size={16} className="text-[var(--text-secondary)]" />
                Customer
              </h3>
            </div>
            <div className="space-y-3">
              {customer ? (
                <>
                  <p className="font-medium text-[var(--text-primary)]">
                    {customer.name || 'Unknown'}
                  </p>
                  <div className="space-y-2 text-sm">
                    {customer.email && (
                      <a
                        href={`mailto:${customer.email}`}
                        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <Mail size={14} className="flex-shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </a>
                    )}
                    {customer.phone && (
                      <a
                        href={`tel:${customer.phone}`}
                        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <Phone size={14} className="flex-shrink-0" />
                        {customer.phone}
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-[var(--text-tertiary)]">
                  No customer info
                </p>
              )}
              <div className="pt-3 border-t border-[var(--border-primary)]">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin
                    size={14}
                    className="text-[var(--text-tertiary)] mt-0.5 flex-shrink-0"
                  />
                  <span className="text-[var(--text-secondary)] leading-relaxed">
                    {parseAddress(order?.delivery_address)}
                  </span>
                </div>
                {order?.delivery_zone && (
                  <div className="mt-2">
                    <Badge variant="outline">{order.delivery_zone} Zone</Badge>
                  </div>
                )}
              </div>
              {order?.company?.name && (
                <div className="pt-3 border-t border-[var(--border-primary)] text-sm text-[var(--text-secondary)]">
                  Company:{' '}
                  <span className="font-medium text-[var(--text-primary)]">
                    {order.company.name}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Proof of Delivery */}
          {assignment.status === 'delivered' && proof && (
            <Card>
              <div className="border-b border-[var(--border-primary)] -mx-6 -mt-6 px-4 sm:px-6 py-4 mb-4">
                <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Camera size={16} className="text-[var(--text-secondary)]" />
                  Proof of Delivery
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                    Recipient
                  </p>
                  <p className="text-sm text-[var(--text-primary)] font-medium">
                    {proof.recipient_name}
                  </p>
                </div>
                {proof.photo_url && (
                  <div>
                    <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                      Photo
                    </p>
                    <img
                      src={proof.photo_url}
                      alt="Delivery proof"
                      className="w-full rounded-lg border border-[var(--border-primary)] object-cover max-h-48"
                    />
                  </div>
                )}
                {proof.signature_url && (
                  <div>
                    <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                      Signature
                    </p>
                    <img
                      src={proof.signature_url}
                      alt="Signature"
                      className="w-full rounded-lg border border-[var(--border-primary)] object-contain max-h-24 bg-white"
                    />
                  </div>
                )}
                {proof.notes && (
                  <div>
                    <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                      Notes
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {proof.notes}
                    </p>
                  </div>
                )}
                {proof.captured_at && (
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Captured {new Date(proof.captured_at).toLocaleString()}
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Digital Handshake */}
          <Card>
            <div className="border-b border-[var(--border-primary)] -mx-6 -mt-6 px-4 sm:px-6 py-4 mb-4">
              <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Handshake size={16} className="text-[var(--text-secondary)]" />
                Digital Handshake
              </h3>
            </div>
            {handshake ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">
                    Driver Confirmed
                  </span>
                  <div className="flex items-center gap-2">
                    {handshake.driver_confirmed ? (
                      <CheckCircle2 size={18} className="text-green-600" />
                    ) : (
                      <XCircle
                        size={18}
                        className="text-[var(--text-tertiary)]"
                      />
                    )}
                    {handshake.driver_confirmed_at && (
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {new Date(
                          handshake.driver_confirmed_at
                        ).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">
                    Customer Confirmed
                  </span>
                  <div className="flex items-center gap-2">
                    {handshake.customer_confirmed ? (
                      <CheckCircle2 size={18} className="text-green-600" />
                    ) : (
                      <XCircle
                        size={18}
                        className="text-[var(--text-tertiary)]"
                      />
                    )}
                    {handshake.customer_confirmed_at && (
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {new Date(
                          handshake.customer_confirmed_at
                        ).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-[var(--border-primary)] flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    Completed
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={handshake.completed ? 'success' : 'default'}
                    >
                      {handshake.completed ? 'Yes' : 'No'}
                    </Badge>
                    {handshake.completed_at && (
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {new Date(handshake.completed_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)]">
                No handshake data available
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Reassign Modal */}
      <Modal
        isOpen={showReassign}
        onClose={() => {
          setShowReassign(false);
          setSelectedDriverId('');
        }}
        title="Reassign Driver"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Select a new driver for delivery{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              #{order?.order_number || '—'}
            </span>
          </p>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Driver
            </label>
            <select
              value={selectedDriverId}
              onChange={e => setSelectedDriverId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 px-4 text-sm focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
            >
              <option value="">Choose a driver...</option>
              {drivers.map((d: any) => (
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
                setShowReassign(false);
                setSelectedDriverId('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleReassign}
              disabled={
                !selectedDriverId || selectedDriverId === assignment.driver_id
              }
              isLoading={reassigning}
            >
              Reassign
            </Button>
          </div>
        </div>
      </Modal>

      {/* Fail Modal */}
      <Modal
        isOpen={showFailModal}
        onClose={() => {
          setShowFailModal(false);
          setFailureReason('');
        }}
        title="Mark Delivery as Failed"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Provide a reason for marking this delivery as failed.
          </p>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Failure Reason
            </label>
            <textarea
              value={failureReason}
              onChange={e => setFailureReason(e.target.value)}
              rows={3}
              placeholder="e.g., Customer not available, wrong address..."
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 px-4 text-sm focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowFailModal(false);
                setFailureReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleMarkFailed}
              disabled={!failureReason.trim()}
              isLoading={failing}
            >
              Mark as Failed
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
