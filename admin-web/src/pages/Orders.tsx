import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Order } from '../types';
import { Link } from 'react-router-dom';
import { Search, Filter, Loader2, ShoppingBag } from 'lucide-react';
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // @ts-expect-error
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      case 'shipped': return 'default';
      default: return 'default'; // 'processing' or others
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-brand-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-brand-dark tracking-tight">Orders</h1>
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-brand-white py-2 pl-10 pr-8 text-sm focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark transition-all sm:w-40"
            >
              <option value="all">All Status</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark transition-all text-sm"
            />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-brand-light text-xs uppercase text-brand-dark font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Order Number</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Total</th>
                <th className="px-6 py-4 font-semibold text-right">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="group hover:bg-brand-light/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    <Link to={`/orders/${order.id}`} className="flex items-center gap-2 group-hover:text-brand-accent transition-colors">
                      <ShoppingBag size={16} className="text-gray-400 group-hover:text-brand-accent transition-colors" />
                      #{order.order_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-brand-dark">
                    {/* @ts-expect-error */}
                    {order.user?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                    <span className="ml-2 text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-brand-dark">
                    ${order.total?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400 text-xs uppercase tracking-wide">
                    {order.payment_method || 'CC'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <div className="flex flex-col items-center justify-center">
              <ShoppingBag className="mb-4 h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-sm">Try adjusting your filters.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
