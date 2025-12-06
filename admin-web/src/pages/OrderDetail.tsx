import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
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
      // Fetch order with user details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, user:users(name, email, phone)')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Fetch order items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, product:products(name, image_url)')
        .eq('order_id', id);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching order details:', error);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  if (!order) return <div className="p-8 text-center">Order not found</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/orders">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-full p-0"
            >
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
              Order #{order.order_number}
              <Badge
                variant={getStatusVariant(order.status)}
                className="ml-2 text-sm"
              >
                {order.status}
              </Badge>
            </h1>
            <p className="text-sm text-gray-500">
              Placed on {new Date(order.created_at).toLocaleDateString()} at{' '}
              {new Date(order.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={order.status}
            onChange={async e => {
              const newStatus = e.target.value;
              // Optimistic update
              setOrder({ ...order, status: newStatus });
              const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', order.id);
              if (error) {
                console.error('Error updating status:', error);
                // Revert or alert
                alert('Failed to update status');
                fetchOrderDetail();
              }
            }}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
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

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content: Items */}
        <div className="md:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <div className="border-b border-gray-100 bg-brand-light/50 px-6 py-4">
              <h2 className="font-semibold text-brand-dark flex items-center gap-2">
                <ShoppingBag size={18} className="text-gray-400" />
                Order Items
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-6">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-white">
                    {/* @ts-expect-error */}
                    {item.product?.image_url ? (
                      <img
                        // @ts-expect-error
                        src={item.product?.image_url}
                        // @ts-expect-error
                        alt={item.product?.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-300">
                        <Package size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    {/* @ts-expect-error */}
                    <h3 className="font-medium text-brand-dark">
                      {item.product?.name || 'Unknown Product'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right font-medium text-brand-dark">
                    $
                    {(item.price * item.quantity).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 px-6 py-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>
                    $
                    {order.total?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg text-brand-dark">
                  <span>Total</span>
                  <span>
                    $
                    {order.total?.toLocaleString(undefined, {
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
        <div className="space-y-6">
          <Card>
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="font-semibold text-brand-dark">
                Customer Details
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {/* @ts-expect-error */}
              <div className="flex items-start gap-3">
                <div className="mt-1 h-8 w-8 flex-shrink-0 rounded-full bg-brand-light flex items-center justify-center font-bold text-brand-dark">
                  {/* @ts-expect-error */}
                  {order.user?.name?.charAt(0) || '?'}
                </div>
                <div>
                  {/* @ts-expect-error */}
                  <p className="font-medium text-brand-dark">
                    {order.user?.name || 'Guest'}
                  </p>
                  {/* @ts-expect-error */}
                  <p className="text-sm text-gray-500">{order.user?.email}</p>
                  {/* @ts-expect-error */}
                  <p className="text-sm text-gray-500">{order.user?.phone}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Payment Method
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  {order.payment_method || 'Credit Card'}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="font-semibold text-brand-dark">
                Shipping Address
              </h3>
            </div>
            <div className="p-6 flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-gray-400" />
              <p className="text-sm text-gray-600 leading-relaxed">
                {order.shipping_address}
                <br />
                {/* Mock city/zip if not separate fields */}
                Singapore, 123456
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
