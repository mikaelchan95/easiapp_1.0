import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, ShoppingBag, DollarSign, Package, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    lowStockProducts: 0
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
        .select('total, id, created_at, status, order_number, user:users!user_id(name)');
      
      if (ordersError) throw ordersError;

      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
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
        lowStockProducts: lowStockCount || 0
      });

      // 4. Recent Orders
      const sortedOrders = ordersData
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
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
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      case 'shipped': return 'default'; // Or add 'info' variant if needed
      default: return 'default';
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, to }: any) => (
    <Link to={to} className="block">
      <Card hover className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="mt-2 text-3xl font-bold text-brand-dark tracking-tight">{value}</h3>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-opacity-20 ${color.replace('text-', 'bg-').replace('600', '100')} ${color}`}>
            <Icon size={24} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
          <TrendingUp size={16} />
          <span className="font-medium">Update just now</span>
        </div>
      </Card>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-brand-dark tracking-tight">Dashboard Overview</h1>
        <p className="mt-2 text-gray-500 text-lg">Here's what's happening with your store today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="text-green-600"
          to="/invoices"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          color="text-blue-600"
          to="/orders"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="text-purple-600"
          to="/customers"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockProducts}
          icon={Package}
          color="text-red-600"
          to="/products"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 bg-brand-white px-6 py-4">
          <h2 className="text-lg font-bold text-brand-dark">Recent Orders</h2>
          <Link to="/orders" className="flex items-center gap-1 text-sm font-medium text-brand-accent hover:text-brand-dark transition-colors">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-light text-xs font-bold uppercase text-brand-dark tracking-wider">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="group hover:bg-brand-light/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    <Link to={`/orders/${order.id}`} className="group-hover:text-brand-accent transition-colors">
                      #{order.order_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                     {/* @ts-expect-error */}
                     {order.user?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-medium text-brand-dark">${order.total?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-gray-500">
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
