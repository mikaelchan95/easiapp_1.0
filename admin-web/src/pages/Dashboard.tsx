import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Users,
  ShoppingBag,
  DollarSign,
  Package,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    lowStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Total Revenue (Sum of 'total' from all orders)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(
          'total, id, created_at, status, order_number, user:users!user_id(name)'
        );

      if (ordersError) throw ordersError;

      const totalRevenue =
        ordersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      const totalOrders = ordersData?.length || 0;

      // 2. Total Users
      const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (userError) throw userError;

      // 3. Low Stock Products
      const { count: lowStockCount, error: stockError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lt('stock_quantity', 10);

      if (stockError) throw stockError;

      setStats({
        totalRevenue,
        totalOrders,
        totalUsers: userCount || 0,
        lowStockProducts: lowStockCount || 0,
      });

      // 4. Recent Orders
      const sortedOrders =
        ordersData
          ?.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .slice(0, 5) || [];

      setRecentOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
        return 'default'; // Or add 'info' variant if needed
      default:
        return 'default';
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, to }: any) => (
    <Link to={to} className="block">
      <Card hover className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
              {title}
            </p>
            <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight truncate">
              {value}
            </h3>
          </div>
          <div
            className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl flex-shrink-0 ml-4 ${color.replace('text-', 'bg-').replace('600', '100')} ${color} dark:bg-opacity-20`}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1 text-xs sm:text-sm text-green-600 dark:text-green-400">
          <TrendingUp size={14} className="sm:w-4 sm:h-4" />
          <span className="font-medium">Updated just now</span>
        </div>
      </Card>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--text-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
          Dashboard Overview
        </h1>
        <p className="mt-2 text-[var(--text-secondary)] text-sm sm:text-base lg:text-lg">
          Here's what's happening with your store today.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="text-green-600"
          to="/invoices"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString('en-US')}
          icon={ShoppingBag}
          color="text-blue-600"
          to="/orders"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString('en-US')}
          icon={Users}
          color="text-purple-600"
          to="/customers"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockProducts.toLocaleString('en-US')}
          icon={Package}
          color="text-red-600"
          to="/products"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 sm:px-6 py-4">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
            Recent Orders
          </h2>
          <Link
            to="/orders"
            className="flex items-center gap-1 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-tertiary)] text-xs font-bold uppercase text-[var(--text-primary)] tracking-wider">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  Order ID
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  Customer
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  Amount
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {recentOrders.map(order => (
                <tr
                  key={order.id}
                  className="group hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-[var(--text-primary)]">
                    <Link
                      to={`/orders/${order.id}`}
                      className="group-hover:underline transition-colors"
                    >
                      #{order.order_number}
                    </Link>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                    {/* @ts-expect-error */}
                    {order.user?.name || 'Unknown'}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-[var(--text-primary)]">
                    $
                    {order.total?.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right text-[var(--text-secondary)]">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
