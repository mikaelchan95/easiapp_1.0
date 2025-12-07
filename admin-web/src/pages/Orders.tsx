import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Order } from '../types';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Loader2,
  ShoppingBag,
  Plus,
  Edit,
  Trash2,
  X as XIcon,
  Download,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        // Explicitly specify the FK column to resolve ambiguity
        .select('*, user:users!user_id(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this order? This action cannot be undone.'
      )
    )
      return;

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      alert('Error deleting order: ' + (error as Error).message);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      alert('Error cancelling order: ' + (error as Error).message);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      alert('Error updating order status: ' + (error as Error).message);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // @ts-expect-error
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'shipped':
        return 'default';
      default:
        return 'default'; // 'processing' or others
    }
  };

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
          Orders
        </h1>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            to="/orders/new"
            className="flex items-center justify-center gap-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-2.5 font-semibold transition-all hover:opacity-90 shadow-sm min-h-[44px] touch-manipulation"
          >
            <Plus size={20} />
            New Order
          </Link>

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
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              size={20}
            />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-3 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="bg-[var(--bg-tertiary)] text-xs uppercase text-[var(--text-primary)] font-bold tracking-wider">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Order Number</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Customer</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Date</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Status</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">Total</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                  Payment
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {filteredOrders.map(order => (
                <tr
                  key={order.id}
                  className="group hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-[var(--text-primary)]">
                    <Link
                      to={`/orders/${order.id}`}
                      className="flex items-center gap-2 hover:underline transition-colors"
                    >
                      <ShoppingBag
                        size={16}
                        className="text-[var(--text-tertiary)] flex-shrink-0"
                      />
                      <span className="truncate">#{order.order_number}</span>
                    </Link>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-primary)]">
                    {/* @ts-expect-error */}
                    {order.user?.name || 'Unknown'}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                      <span>
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {new Date(order.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-medium text-[var(--text-primary)]">
                    $
                    {order.total?.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right text-[var(--text-tertiary)] text-xs uppercase tracking-wide">
                    {order.payment_method || 'CC'}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                    <div className="flex justify-end gap-1 sm:gap-2">
                      {order.status !== 'cancelled' &&
                        order.status !== 'delivered' && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
                            title="Cancel Order"
                          >
                            <XIcon size={18} />
                          </button>
                        )}
                      <Link
                        to={`/orders/${order.id}/edit`}
                        className="rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
                        title="Edit Order"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
                        title="Delete Order"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-12 text-center text-[var(--text-secondary)]">
            <div className="flex flex-col items-center justify-center">
              <ShoppingBag className="mb-4 h-12 w-12 text-[var(--text-tertiary)]" />
              <p className="text-lg font-medium text-[var(--text-primary)]">
                No orders found
              </p>
              <p className="text-sm">Try adjusting your filters.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
