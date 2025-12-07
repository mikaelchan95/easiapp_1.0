import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  LayoutGrid,
  List,
  ChevronRight,
  Trash2,
  ChevronLeft,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Total Revenue & Orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(
          'total, id, created_at, status, order_number, user:users!user_id(name, email)'
        );

      if (ordersError) throw ordersError;

      const totalRevenue =
        ordersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      const totalOrders = ordersData?.length || 0;

      // 2. Total Customers
      const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (userError) throw userError;

      // 3. Total Products
      const { count: productCount, error: productError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (productError) throw productError;

      setStats({
        totalRevenue,
        totalOrders,
        totalCustomers: userCount || 0,
        totalProducts: productCount || 0,
      });

      // 4. Recent Orders
      const sortedOrders =
        ordersData
          ?.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .slice(0, 8) || []; // Show 8 items like image

      setRecentOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'delivered') return 'info'; // Blue
    if (s === 'processing' || s === 'shipped') return 'purple'; // Purple
    if (s === 'completed' || s === 'paid') return 'success'; // Green
    if (s === 'cancelled') return 'error';
    return 'default';
  };

  const StatCard = ({ title, value, trend, trendUp, to }: any) => (
    <Card
      className="relative p-6 group cursor-pointer hover:border-gray-200"
      onClick={() => navigate(to)}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal size={20} />
        </button>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold text-gray-900 tracking-tight">
          {value}
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-green-500' : 'text-red-500'} mb-1`}
        >
          {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{trend}</span>
          <span className="text-gray-400 font-normal ml-1">From last week</span>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Stats Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          trend="3.1%"
          trendUp={true}
          to="/invoices"
        />
        <StatCard
          title="Total Customer"
          value={stats.totalCustomers.toLocaleString()}
          trend="5.1%"
          trendUp={true}
          to="/customers"
        />
        <StatCard
          title="Total Transaction"
          value={stats.totalOrders.toLocaleString()}
          trend="5.1%"
          trendUp={false}
          to="/orders"
        />
        <StatCard
          title="Total Product"
          value={stats.totalProducts.toLocaleString()}
          trend="5.1%"
          trendUp={true}
          to="/products"
        />
      </div>

      {/* Main Table Section */}
      <div className="space-y-4">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900 self-start sm:self-center">
            List Return
            <span className="ml-3 text-sm font-normal text-gray-500">
              188 Refund
            </span>
          </h2>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <span>Show</span>
              <select className="bg-transparent font-semibold text-gray-900 border-none focus:ring-0 p-0 cursor-pointer">
                <option>6</option>
                <option>10</option>
                <option>20</option>
              </select>
              <span>Entries</span>
            </div>

            <div className="relative flex-1 sm:flex-none">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search by Name Product"
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm border-none focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div className="flex gap-2">
              <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600">
                <LayoutGrid size={18} />
              </button>
              <button className="p-2 bg-gray-900 rounded-lg text-white">
                <List size={18} />
              </button>
              <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600">
                <Filter size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <Card className="overflow-hidden border-0 shadow-none bg-white p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-transparent">
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Date Return</th>
                  <th className="px-6 py-4 font-medium">Name Customer</th>
                  <th className="px-6 py-4 font-medium">Address</th>
                  <th className="px-6 py-4 font-medium">Reason Return</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">
                    Follow-up
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order, i) => (
                  <tr
                    key={order.id}
                    className="group hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      <Link
                        to={`/orders/${order.id}`}
                        className="hover:text-blue-600"
                      >
                        ODR-{order.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">
                      {new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {/* @ts-expect-error */}
                      {order.user?.name || 'Unknown User'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 truncate max-w-[200px]">
                      {/* Mock Address */}
                      {
                        [
                          '123 Main St, Inazuma',
                          '456 Oak Ave, Inazuma',
                          '789 Elm Rd, Inazuma',
                          '321 Pine Ln, Liyue',
                        ][i % 4]
                      }
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {/* Mock Reason */}
                      {
                        [
                          'Poor Product Quality',
                          'Product Not as Expected',
                          'Damaged in Shipping',
                        ][i % 3]
                      }
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status === 'paid' ? 'Success' : order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                          <ChevronRight size={18} />
                        </button>
                        <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                          <MoreHorizontal size={18} />
                        </button>
                        <button className="p-1.5 rounded-full hover:bg-red-50 text-red-300 hover:text-red-500">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Mock */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500 font-medium">
              Showing 1 to 10 of 7000 entries
            </span>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                <ChevronLeft size={16} />
              </button>
              <button className="px-3 py-1 rounded-lg bg-green-200 text-green-800 font-semibold text-sm">
                1
              </button>
              <button className="px-3 py-1 rounded-lg hover:bg-gray-100 text-gray-600 font-semibold text-sm">
                2
              </button>
              <button className="px-3 py-1 rounded-lg hover:bg-gray-100 text-gray-600 font-semibold text-sm">
                3
              </button>
              <span className="text-gray-400">...</span>
              <button className="px-3 py-1 rounded-lg hover:bg-gray-100 text-gray-600 font-semibold text-sm">
                10
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
