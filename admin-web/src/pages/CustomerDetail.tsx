import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User, Order } from '../types';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  ShoppingBag,
  DollarSign,
  Star,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CustomerPointsHistory } from '../components/Customers/CustomerPointsHistory';
import { CustomerVouchers } from '../components/Customers/CustomerVouchers';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsAdjustment, setPointsAdjustment] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'points' | 'vouchers'
  >('overview');

  useEffect(() => {
    if (id) fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      // 1. Fetch User Info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*, companies(name)')
        .eq('id', id)
        .single();

      if (userError) throw userError;
      setCustomer(userData);

      // 2. Fetch User Orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeOrdersCount = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);

  const handleAdjustPoints = async () => {
    if (!customer || pointsAdjustment === 0) return;
    try {
      const newPoints = (customer.points || 0) + pointsAdjustment;
      const { error } = await supabase
        .from('users')
        .update({ points: newPoints })
        .eq('id', customer.id);

      if (error) throw error;
      setCustomer({ ...customer, points: newPoints });
      setPointsAdjustment(0);
      alert('Points updated!');
    } catch (err) {
      console.error('Error updating points', err);
      alert('Failed to update points');
    }
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    role: 'user',
  });

  useEffect(() => {
    if (customer) {
      setEditFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        role: customer.role || 'user',
      });
    }
  }, [customer]);

  const handleSaveCustomer = async () => {
    if (!customer) return;
    try {
      const { error } = await supabase
        .from('users')
        .update(editFormData)
        .eq('id', customer.id);

      if (error) throw error;

      setCustomer({ ...customer, ...editFormData });
      setIsEditModalOpen(false);
      alert('Customer updated successfully');
    } catch (err) {
      console.error('Error updating customer:', err);
      alert('Failed to update customer: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  if (!customer)
    return <div className="p-8 text-center">Customer not found</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/customers">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-full p-0"
            >
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand-dark font-bold text-2xl border border-gray-100">
              {customer.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
                {customer.name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Badge variant="success">Active</Badge>
                <span>•</span>
                <span className="capitalize">{customer.role}</span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            Edit Customer
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Spent</h3>
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-brand-dark">
            $
            {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-brand-dark">
            {activeOrdersCount}
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">
              Loyalty Points
            </h3>
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
              <Star size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-brand-dark">
            {customer.points || 0}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              type="number"
              placeholder="+/-"
              className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
              value={pointsAdjustment || ''}
              onChange={e => setPointsAdjustment(parseInt(e.target.value) || 0)}
            />
            <Button size="sm" variant="outline" onClick={handleAdjustPoints}>
              Adjust
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar: Details */}
        <div className="space-y-6">
          <Card>
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="font-semibold text-brand-dark">
                Contact Information
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-gray-400" />
                <span className="text-brand-dark">{customer.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-gray-400" />
                <span className="text-brand-dark">{customer.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Building2 size={16} className="text-gray-400" />
                {/* @ts-expect-error */}
                <span className="text-brand-dark">
                  {customer.companies?.name || 'Individual'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-gray-500">
                  Joined {new Date(customer.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content: Order History */}
        <div className="md:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              className={`pb-4 px-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'overview'
                  ? 'border-brand-dark text-brand-dark'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`pb-4 px-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'points'
                  ? 'border-brand-dark text-brand-dark'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('points')}
            >
              Points History
            </button>
            <button
              className={`pb-4 px-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'vouchers'
                  ? 'border-brand-dark text-brand-dark'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('vouchers')}
            >
              Vouchers
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <Card className="overflow-hidden">
              <div className="border-b border-gray-100 bg-brand-light/50 px-6 py-4">
                <h2 className="font-semibold text-brand-dark flex items-center gap-2">
                  <ShoppingBag size={18} className="text-gray-400" />
                  Order History
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="bg-brand-light text-xs uppercase text-brand-dark font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Order #</th>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">
                        Total
                      </th>
                      <th className="px-6 py-4 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map(order => (
                      <tr
                        key={order.id}
                        className="hover:bg-brand-light/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-brand-dark">
                          #{order.order_number}
                        </td>
                        <td className="px-6 py-4">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize
                                        ${
                                          order.status === 'delivered'
                                            ? 'bg-green-100 text-green-700'
                                            : order.status === 'cancelled'
                                              ? 'bg-red-100 text-red-700'
                                              : 'bg-blue-100 text-blue-700'
                                        }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-brand-dark">
                          $
                          {order.total?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/orders/${order.id}`}
                            className="text-brand-accent hover:text-brand-dark font-medium transition-colors"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          No orders found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'points' && (
            <CustomerPointsHistory userId={customer.id} />
          )}

          {activeTab === 'vouchers' && (
            <CustomerVouchers userId={customer.id} />
          )}
        </div>
      </div>

      {/* Edit Customer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-brand-dark">
              Edit Customer
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={e =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={e =>
                    setEditFormData({ ...editFormData, phone: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={editFormData.role}
                  onChange={e =>
                    setEditFormData({ ...editFormData, role: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveCustomer}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
