import { useEffect, useState } from 'react';
import { Truck, Package, CheckCircle, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import type { Order, StaffProfile } from '../types';

function parseAddress(raw: string | null | undefined): string {
  if (!raw) return 'No address';
  try {
    const parsed = JSON.parse(raw);
    return parsed.address || raw;
  } catch {
    return raw;
  }
}

type DeliveryOrder = Omit<Order, 'company' | 'order_items'> & {
  company?: { name: string };
  order_items?: { id: string }[];
  digital_handshake?: {
    id: string;
    driver_confirmed: boolean;
    customer_confirmed: boolean;
    completed: boolean;
  };
};

export function Deliveries() {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    loadDeliveries();
  }, []);

  async function loadDeliveries() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: staffData } = await supabase
        .from('staff_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!staffData) return;

      const staffProfile = staffData as Pick<StaffProfile, 'id'>;

      const { data, error } = await supabase
        .from('orders')
        .select('*, company:companies(name), order_items(id)')
        .eq('placed_by_staff_id', staffProfile.id)
        .eq('status', 'out_for_delivery')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading deliveries:', error);
        return;
      }

      const orders = (data ?? []) as DeliveryOrder[];

      // Load digital handshake status for each order
      if (orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        const { data: handshakes } = await supabase
          .from('digital_handshakes')
          .select(
            'id, order_id, driver_confirmed, customer_confirmed, completed'
          )
          .in('order_id', orderIds);

        if (handshakes) {
          const hsMap = new Map(
            handshakes.map(h => [
              h.order_id,
              {
                id: h.id,
                driver_confirmed: h.driver_confirmed,
                customer_confirmed: h.customer_confirmed,
                completed: h.completed,
              },
            ])
          );
          for (const order of orders) {
            order.digital_handshake = hsMap.get(order.id);
          }
        }
      }

      setDeliveries(orders);
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelivery(order: DeliveryOrder) {
    setConfirmingId(order.id);
    try {
      const now = new Date().toISOString();

      if (order.digital_handshake) {
        const customerConfirmed = order.digital_handshake.customer_confirmed;
        const updates: Record<string, unknown> = {
          driver_confirmed: true,
          driver_confirmed_at: now,
        };
        if (customerConfirmed) {
          updates.completed = true;
          updates.completed_at = now;
        }

        const { error } = await supabase
          .from('digital_handshakes')
          .update(updates)
          .eq('id', order.digital_handshake.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('digital_handshakes').insert({
          order_id: order.id,
          driver_confirmed: true,
          driver_confirmed_at: now,
          customer_confirmed: false,
          completed: false,
        });

        if (error) throw error;
      }

      toast('success', `Delivery confirmed for ${order.order_number}`);
      await loadDeliveries();
    } catch (err) {
      console.error('Confirm delivery error:', err);
      toast('error', 'Failed to confirm delivery');
    } finally {
      setConfirmingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <div className="h-28 animate-pulse rounded-lg bg-gray-100" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
          {deliveries.length} pending
        </span>
      </div>

      {deliveries.length === 0 ? (
        <Card className="py-16 text-center">
          <Truck className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">
            No deliveries pending confirmation
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Orders with "Out for Delivery" status will appear here
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {deliveries.map(order => {
            const isConfirmed =
              order.digital_handshake?.driver_confirmed === true;
            const isCompleted = order.digital_handshake?.completed === true;

            return (
              <Card key={order.id} padding="none">
                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {order.order_number}
                        </h3>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                            <CheckCircle className="h-3 w-3" /> Completed
                          </span>
                        )}
                        {isConfirmed && !isCompleted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Awaiting customer
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600">
                        {order.company?.name ?? 'Unknown customer'}
                      </p>
                    </div>
                    <span className="text-base font-bold text-gray-900">
                      $
                      {(order.total ?? 0).toLocaleString('en-SG', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-500">
                    {order.delivery_address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {parseAddress(order.delivery_address)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      {order.order_items?.length ?? 0} item
                      {(order.order_items?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {!isConfirmed && (
                    <Button
                      onClick={() => confirmDelivery(order)}
                      loading={confirmingId === order.id}
                      className="w-full"
                      icon={<CheckCircle className="h-4 w-4" />}
                    >
                      Confirm Delivery
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
