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
  ChevronLeft,
  Eye,
  ArrowUpRight,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../lib/formatters';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

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
          .slice(0, 50) || []; // Fetch more for client-side filtering (limited to 50 for demo)

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

  const filteredOrders = recentOrders
    .filter(order => {
      const matchesSearch =
        order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        // @ts-expect-error
        order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .slice(0, 10); // Show top 10 after filter

  const StatCard = ({ title, value, trend, trendUp, to }: any) => (
    <Card
      className="relative p-6 group cursor-pointer hover:border-[var(--color-primary)] hover:shadow-md transition-all duration-200"
      onClick={() => navigate(to)}
    >
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
        <button
          className="text-[var(--text-tertiary)] hover:text-[var(--color-primary)] transition-colors"
          onClick={e => {
            e.stopPropagation();
            navigate(to);
          }}
        >
          <ArrowUpRight size={20} />
        </button>
      </div>
      <div className="space-y-3">
        <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          {value}
        </div>
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold ${trendUp ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
        >
          {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{trend}</span>
          <span className="text-[var(--text-tertiary)] font-normal">
            from last week
          </span>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-8">
      {/* Stats Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          trend="3.1%"
          trendUp={true}
          to="/invoices"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers.toLocaleString()}
          trend="5.1%"
          trendUp={true}
          to="/customers"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          trend="5.1%"
          trendUp={true}
          to="/orders"
        />
        <StatCard
          title="Total Products"
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
          <h2 className="text-xl font-bold text-[var(--text-primary)] self-start sm:self-center">
            Recent Orders
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none w-full sm:w-auto">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
                size={16}
              />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                className={`p-2 rounded-lg border transition-colors ${viewMode === 'grid' ? 'bg-[var(--text-primary)] text-[var(--color-primary-text)] border-transparent' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-default)] hover:bg-[var(--bg-tertiary)]'}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                className={`p-2 rounded-lg border transition-colors ${viewMode === 'list' ? 'bg-[var(--text-primary)] text-[var(--color-primary-text)] border-transparent' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-default)] hover:bg-[var(--bg-tertiary)]'}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <List size={18} />
              </button>

              <div className="relative">
                <button
                  className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-[var(--color-primary-bg)] text-[var(--color-primary)] border-[var(--color-primary)]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-default)] hover:bg-[var(--bg-tertiary)]'}`}
                  onClick={() => setShowFilters(!showFilters)}
                  title="Filter"
                >
                  <Filter size={18} />
                </button>

                {showFilters && (
                  <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] rounded-lg shadow-lg border border-[var(--border-subtle)] z-10 py-1">
                    <div className="px-3 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase">
                      Status
                    </div>
                    {[
                      'all',
                      'paid',
                      'pending',
                      'processing',
                      'shipped',
                      'delivered',
                      'cancelled',
                    ].map(status => (
                      <button
                        key={status}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-tertiary)] capitalize ${statusFilter === status ? 'text-[var(--color-primary)] font-medium bg-[var(--color-primary-bg)]' : 'text-[var(--text-secondary)]'}`}
                        onClick={() => {
                          setStatusFilter(status);
                          setShowFilters(false);
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === 'list' ? (
          <Card className="overflow-hidden border-0 shadow-none bg-[var(--bg-card)] p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider bg-transparent">
                  <tr className="border-b border-[var(--border-subtle)]">
                    <th className="px-6 py-4 font-medium">Order ID</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Total</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredOrders.map(order => (
                    <tr
                      key={order.id}
                      className="group hover:bg-[var(--bg-tertiary)]/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">
                        <span className="group-hover:text-[var(--color-primary)] transition-colors">
                          #{order.order_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)] font-medium">
                        {new Date(order.created_at).toLocaleDateString(
                          'en-GB',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">
                        {/* @ts-expect-error */}
                        {order.user?.name || 'Unknown User'}
                      </td>
                      <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status === 'paid' ? 'Paid' : order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-1.5 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                            onClick={e => {
                              e.stopPropagation();
                              navigate(`/orders/${order.id}`);
                            }}
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-[var(--text-secondary)]"
                      >
                        No recent orders found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map(order => (
              <Card
                key={order.id}
                className="p-4 hover:shadow-md transition-all cursor-pointer border hover:border-[var(--color-primary)]"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <Badge variant={getStatusVariant(order.status)}>
                    {order.status === 'paid' ? 'Paid' : order.status}
                  </Badge>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="mb-3">
                  <h4 className="font-bold text-[var(--text-primary)]">
                    #{order.order_number}
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {/* @ts-expect-error */}
                    {order.user?.name || 'Unknown User'}
                  </p>
                </div>

                <div className="flex justify-between items-center border-t border-[var(--border-subtle)] pt-3">
                  <span className="font-bold text-[var(--text-primary)]">
                    {formatCurrency(order.total)}
                  </span>
                  <button
                    className="text-[var(--color-primary)] text-sm font-medium hover:underline"
                    onClick={e => {
                      e.stopPropagation();
                      navigate(`/orders/${order.id}`);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </Card>
            ))}
            {filteredOrders.length === 0 && (
              <div className="col-span-full p-12 text-center text-[var(--text-secondary)] bg-[var(--bg-card)] rounded-xl border border-dashed border-[var(--border-subtle)]">
                No recent orders found matching your search.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
