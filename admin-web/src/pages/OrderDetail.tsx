import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getImageUrl } from '../lib/imageUtils';
import type { Order, OrderItem } from '../types';
import { ArrowLeft, MapPin, Package, ShoppingBag } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      console.log('Fetching order with ID:', id);

      // Fetch order with user details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, user:users(name, email, phone)')
        .eq('id', id)
        .single();

      console.log('Order fetch result:', { orderData, orderError });

      if (orderError) {
        console.error('Error fetching order:', orderError);
        console.error('Order ID that failed:', id);

        // Check if it's a "not found" error vs other error
        if (orderError.code === 'PGRST116') {
          console.error(
            'Order not found in database - may not exist or RLS blocking access'
          );
        }

        setOrder(null);
        setLoading(false);
        return;
      }

      if (!orderData) {
        console.error('No order data returned for ID:', id);
        setOrder(null);
        setLoading(false);
        return;
      }

      console.log('Order loaded successfully:', orderData.order_number);
      setOrder(orderData);

      // Fetch order items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, product:products(name, image_url)')
        .eq('order_id', id);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        setItems([]);
      } else {
        // Map the data to ensure price field is set from unit_price or total_price
        const mappedItems = (itemsData || []).map(item => ({
          ...item,
          price: item.unit_price || item.price || 0,
        }));
        setItems(mappedItems);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'shipped':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--text-primary)]"></div>
      </div>
    );
  }

  if (!order)
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Order not found
          </p>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Order ID: {id}
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">
            This order may not exist in the database or you may not have
            permission to view it. Check the browser console for more details.
          </p>
          <button
            onClick={() => (window.location.href = '/orders')}
            className="mt-4 px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg hover:opacity-90"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link to="/orders">
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
              <span>Order #{order.order_number}</span>
              <Badge
                variant={getStatusVariant(order.status)}
                className="text-sm"
              >
                {order.status}
              </Badge>
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Placed on {new Date(order.created_at).toLocaleDateString()} at{' '}
              {new Date(order.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <select
            value={order.status}
            onChange={async e => {
              const newStatus = e.target.value;
              // Optimistic update
              setOrder({ ...order, status: newStatus as any });
              const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', order.id);
              if (error) {
                console.error('Error updating status:', error);
                alert('Failed to update status');
                fetchOrderDetail();
              }
            }}
            className="px-4 py-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px] touch-manipulation"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button variant="outline">Download Invoice</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
        {/* Main Content: Items */}
        <div className="md:col-span-2 space-y-4 sm:space-y-6">
          <Card className="overflow-hidden">
            <div className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-4 sm:px-6 py-4">
              <h2 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <ShoppingBag
                  size={18}
                  className="text-[var(--text-secondary)]"
                />
                Order Items
              </h2>
            </div>
            <div className="divide-y divide-[var(--border-primary)]">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6"
                >
                  <div className="h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)]">
                    {/* @ts-expect-error */}
                    {item.product?.image_url ? (
                      <img
                        // @ts-expect-error
                        src={getImageUrl(item.product?.image_url)}
                        // @ts-expect-error
                        alt={item.product?.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
                        <Package size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* @ts-expect-error */}
                    <h3 className="font-medium text-[var(--text-primary)] truncate">
                      {item.product?.name || 'Unknown Product'}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Qty: {item.quantity.toLocaleString('en-US')}
                    </p>
                  </div>
                  <div className="text-right font-medium text-[var(--text-primary)] flex-shrink-0">
                    $
                    {(item.price * item.quantity).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-[var(--bg-tertiary)] px-4 sm:px-6 py-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                  <span>Subtotal</span>
                  <span>
                    $
                    {(order.subtotal || order.total)?.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {order.gst > 0 && (
                  <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                    <span>GST (9%)</span>
                    <span>
                      $
                      {order.gst?.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                  <span>Delivery</span>
                  <span
                    className={
                      order.delivery_fee === 0
                        ? 'text-green-600 dark:text-green-400 font-medium'
                        : ''
                    }
                  >
                    {order.delivery_fee === 0
                      ? 'FREE'
                      : `$${order.delivery_fee?.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>
                      -$
                      {order.discount?.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                <div className="border-t border-[var(--border-primary)] pt-2 flex justify-between font-bold text-base sm:text-lg text-[var(--text-primary)]">
                  <span>Total</span>
                  <span>
                    $
                    {order.total?.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar: Customer & Info */}
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <div className="border-b border-[var(--border-primary)] px-4 sm:px-6 py-4">
              <h3 className="font-semibold text-[var(--text-primary)]">
                Customer Details
              </h3>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {/* @ts-expect-error */}
              <div className="flex items-start gap-3">
                <div className="mt-1 h-8 w-8 flex-shrink-0 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center font-bold text-[var(--text-primary)]">
                  {/* @ts-expect-error */}
                  {order.user?.name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  {/* @ts-expect-error */}
                  <p className="font-medium text-[var(--text-primary)] truncate">
                    {order.user?.name || 'Guest'}
                  </p>
                  {/* @ts-expect-error */}
                  <p className="text-sm text-[var(--text-secondary)] truncate">
                    {order.user?.email}
                  </p>
                  {/* @ts-expect-error */}
                  <p className="text-sm text-[var(--text-secondary)]">
                    {order.user?.phone}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-[var(--border-primary)]">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  Payment Method
                </h4>
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <div className="h-2 w-2 rounded-full bg-green-500 dark:bg-green-400"></div>
                  {order.payment_method || 'Credit Card'}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="border-b border-[var(--border-primary)] px-4 sm:px-6 py-4">
              <h3 className="font-semibold text-[var(--text-primary)]">
                Delivery Details
              </h3>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 text-[var(--text-tertiary)] flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                    Address
                  </p>
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                    {typeof order.delivery_address === 'string'
                      ? (() => {
                          try {
                            const parsed = JSON.parse(order.delivery_address);
                            return `${parsed.name || ''}\n${parsed.address || ''}${parsed.unitNumber ? `, ${parsed.unitNumber}` : ''}\nSingapore ${parsed.postalCode || ''}\n${parsed.phone || ''}`;
                          } catch {
                            return order.delivery_address;
                          }
                        })()
                      : order.delivery_address?.address ||
                        order.shipping_address ||
                        'No address provided'}
                  </p>
                </div>
              </div>

              {(order.delivery_date || order.delivery_time_slot) && (
                <div className="flex items-start gap-3 pt-3 border-t border-[var(--border-primary)]">
                  <Package className="mt-1 h-5 w-5 text-[var(--text-tertiary)] flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                      Scheduled Delivery
                    </p>
                    <p className="text-sm text-[var(--text-primary)]">
                      {order.delivery_date &&
                        new Date(order.delivery_date).toLocaleDateString(
                          'en-US',
                          {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
                    </p>
                    {order.delivery_time_slot && (
                      <p className="text-sm text-[var(--text-secondary)]">
                        {order.delivery_time_slot}
                      </p>
                    )}
                    {order.is_same_day_delivery && (
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Same-Day Delivery
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Order Notes & Voucher */}
          {(order.order_notes || order.voucher_id) && (
            <Card>
              <div className="border-b border-[var(--border-primary)] px-4 sm:px-6 py-4">
                <h3 className="font-semibold text-[var(--text-primary)]">
                  Additional Info
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-3">
                {order.order_notes && (
                  <div>
                    <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                      Order Notes
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {order.order_notes}
                    </p>
                  </div>
                )}
                {order.voucher_id && (
                  <div>
                    <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                      Voucher Applied
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--text-primary)] font-medium">
                        {order.voucher_id}
                      </span>
                      {order.voucher_discount > 0 && (
                        <span className="text-sm text-green-600 dark:text-green-400">
                          -${order.voucher_discount?.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
