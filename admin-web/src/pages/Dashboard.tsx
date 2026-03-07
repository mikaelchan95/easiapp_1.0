import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  TrendingUp,
  TrendingDown,
  List,
  ChevronRight,
  AlertTriangle,
  CreditCard,
  DollarSign,
  Users,
  Package,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import type { Order } from '../types';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalIndividualCustomers: number;
  totalProducts: number;
  totalCompanies: number;
  totalCreditLimit: number;
  totalCreditUsed: number;
  creditUtilization: number;
  revenueThisMonth: number;
  revenuePrevMonth: number;
  ordersThisMonth: number;
  ordersPrevMonth: number;
}

interface HighRiskCompany {
  id: string;
  name: string;
  credit_limit: number;
  current_credit: number;
  utilization: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalIndividualCustomers: 0,
    totalProducts: 0,
    totalCompanies: 0,
    totalCreditLimit: 0,
    totalCreditUsed: 0,
    creditUtilization: 0,
    revenueThisMonth: 0,
    revenuePrevMonth: 0,
    ordersThisMonth: 0,
    ordersPrevMonth: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [highRiskCompanies, setHighRiskCompanies] = useState<HighRiskCompany[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();
      const startOfPrevMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      ).toISOString();

      const [
        recentOrdersRes,
        paidOrdersRes,
        totalOrdersRes,
        thisMonthOrdersRes,
        prevMonthOrdersRes,
        thisMonthRevenueRes,
        prevMonthRevenueRes,
        usersRes,
        productsRes,
        companiesRes,
      ] = await Promise.all([
        supabase
          .from('orders')
          .select(
            'id, order_number, created_at, status, payment_status, total, user:users!user_id(name, email)'
          )
          .order('created_at', { ascending: false })
          .limit(10),

        supabase.from('orders').select('total').eq('payment_status', 'paid'),

        supabase.from('orders').select('*', { count: 'exact', head: true }),

        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth),

        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfPrevMonth)
          .lt('created_at', startOfMonth),

        supabase
          .from('orders')
          .select('total')
          .eq('payment_status', 'paid')
          .gte('created_at', startOfMonth),

        supabase
          .from('orders')
          .select('total')
          .eq('payment_status', 'paid')
          .gte('created_at', startOfPrevMonth)
          .lt('created_at', startOfMonth),

        supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('account_type', 'individual'),

        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),

        supabase
          .from('companies')
          .select('id, name, credit_limit, current_credit'),
      ]);

      if (recentOrdersRes.error) throw recentOrdersRes.error;
      if (paidOrdersRes.error) throw paidOrdersRes.error;
      if (usersRes.error) throw usersRes.error;
      if (productsRes.error) throw productsRes.error;
      if (companiesRes.error) throw companiesRes.error;

      const totalRevenue =
        paidOrdersRes.data?.reduce(
          (sum, o) => sum + (Number(o.total) || 0),
          0
        ) || 0;
      const revenueThisMonth =
        thisMonthRevenueRes.data?.reduce(
          (sum, o) => sum + (Number(o.total) || 0),
          0
        ) || 0;
      const revenuePrevMonth =
        prevMonthRevenueRes.data?.reduce(
          (sum, o) => sum + (Number(o.total) || 0),
          0
        ) || 0;

      const companiesData = companiesRes.data || [];
      const totalCreditLimit = companiesData.reduce(
        (sum, c) => sum + (Number(c.credit_limit) || 0),
        0
      );
      const totalCreditUsed = companiesData.reduce(
        (sum, c) => sum + (Number(c.current_credit) || 0),
        0
      );
      const creditUtilization =
        totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;

      const riskyCompanies: HighRiskCompany[] = companiesData
        .map(c => ({
          id: c.id,
          name: c.name,
          credit_limit: Number(c.credit_limit) || 0,
          current_credit: Number(c.current_credit) || 0,
          utilization:
            Number(c.credit_limit) > 0
              ? (Number(c.current_credit) / Number(c.credit_limit)) * 100
              : 0,
        }))
        .filter(c => c.utilization > 80)
        .sort((a, b) => b.utilization - a.utilization)
        .slice(0, 5);

      setStats({
        totalRevenue,
        totalOrders: totalOrdersRes.count || 0,
        totalIndividualCustomers: usersRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalCompanies: companiesData.length,
        totalCreditLimit,
        totalCreditUsed,
        creditUtilization,
        revenueThisMonth,
        revenuePrevMonth,
        ordersThisMonth: thisMonthOrdersRes.count || 0,
        ordersPrevMonth: prevMonthOrdersRes.count || 0,
      });

      setRecentOrders((recentOrdersRes.data as unknown as Order[]) || []);
      setHighRiskCompanies(riskyCompanies);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTrend = (
    current: number,
    previous: number
  ): string | undefined => {
    if (previous === 0 && current === 0) return undefined;
    if (previous === 0) return '+100%';
    const pct = ((current - previous) / previous) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  };

  const getStatusVariant = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'delivered':
        return 'info';
      case 'processing':
      case 'preparing':
      case 'ready':
      case 'out_for_delivery':
        return 'purple';
      case 'completed':
      case 'paid':
      case 'confirmed':
        return 'success';
      case 'cancelled':
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    subtext,
    trend,
    trendUp,
    to,
  }: any) => (
    <Card
      className="relative p-5 group cursor-pointer hover:border-gray-300 transition-all duration-200"
      onClick={() => to && navigate(to)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="p-2 bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-secondary)]">
          <Icon size={18} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-green-600' : 'text-red-600'}`}
          >
            {trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-xs font-medium text-[var(--text-secondary)] mb-1">
          {title}
        </h3>
        <div className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
          {value}
        </div>
        {subtext && (
          <p className="text-xs text-[var(--text-tertiary)] mt-1">{subtext}</p>
        )}
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
    <div className="space-y-6 animate-fade-in font-sans pb-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          Dashboard Overview
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Today's overview at a glance.
        </p>
      </div>

      {/* Primary Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          trend={formatTrend(stats.revenueThisMonth, stats.revenuePrevMonth)}
          trendUp={stats.revenueThisMonth >= stats.revenuePrevMonth}
          subtext={`$${stats.revenueThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} this month`}
          to="/invoices"
        />
        <StatCard
          title="Customers"
          value={stats.totalIndividualCustomers.toLocaleString()}
          icon={Users}
          subtext={`${stats.totalCompanies.toLocaleString()} companies`}
          to="/customers"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          icon={List}
          trend={formatTrend(stats.ordersThisMonth, stats.ordersPrevMonth)}
          trendUp={stats.ordersThisMonth >= stats.ordersPrevMonth}
          subtext={`${stats.ordersThisMonth} this month`}
          to="/orders"
        />
        <StatCard
          title="Active Products"
          value={stats.totalProducts.toLocaleString()}
          icon={Package}
          subtext="In catalog"
          to="/products"
        />
      </div>

      {/* Credit Risk Section */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Credit Monitoring
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <StatCard
              title="Total Credit Extended"
              value={`$${stats.totalCreditLimit.toLocaleString()}`}
              icon={CreditCard}
              subtext="Across all company accounts"
              to="/companies"
            />
            <StatCard
              title="Credit Utilization"
              value={`${stats.creditUtilization.toFixed(1)}%`}
              icon={AlertTriangle}
              subtext={`$${stats.totalCreditUsed.toLocaleString()} used`}
              trendUp={stats.creditUtilization < 70}
              trend={stats.creditUtilization > 80 ? 'High Risk' : 'Healthy'}
              to="/companies"
            />
          </div>
        </div>

        {/* High Risk Watchlist */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            High Risk Companies
          </h2>
          <Card className="p-0 overflow-hidden max-h-[280px] overflow-y-auto">
            {highRiskCompanies.length === 0 ? (
              <div className="p-5 text-center text-[var(--text-secondary)] text-sm">
                No high-risk companies
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {highRiskCompanies.map(company => (
                  <div
                    key={company.id}
                    className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/companies/${company.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {company.name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        ${company.current_credit.toLocaleString()} / $
                        {company.credit_limit.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="error">
                      {company.utilization.toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Recent Orders
          </h2>
          <Link
            to="/orders"
            className="text-xs font-medium text-[var(--color-primary)] hover:underline flex items-center gap-0.5"
          >
            View All <ChevronRight size={14} />
          </Link>
        </div>

        <Card className="overflow-hidden border-0 shadow-sm bg-white p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--bg-tertiary)]">
                <tr>
                  <th className="px-5 py-3 text-xs uppercase font-medium tracking-wider text-[var(--text-secondary)]">
                    Order ID
                  </th>
                  <th className="px-5 py-3 text-xs uppercase font-medium tracking-wider text-[var(--text-secondary)]">
                    Date
                  </th>
                  <th className="px-5 py-3 text-xs uppercase font-medium tracking-wider text-[var(--text-secondary)]">
                    Customer
                  </th>
                  <th className="px-5 py-3 text-xs uppercase font-medium tracking-wider text-[var(--text-secondary)]">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs uppercase font-medium tracking-wider text-[var(--text-secondary)] text-right">
                    Total
                  </th>
                  <th className="px-5 py-3 text-xs uppercase font-medium tracking-wider text-[var(--text-secondary)] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {recentOrders.map(order => (
                  <tr
                    key={order.id}
                    className="group hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <td className="px-5 py-3 text-sm font-medium text-[var(--text-primary)]">
                      <Link
                        to={`/orders/${order.id}`}
                        className="hover:text-blue-600"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">
                      {new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-[var(--text-primary)]">
                      {/* @ts-expect-error - joined data */}
                      {order.user?.name || order.user?.email || 'Guest'}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-sm text-right font-mono font-medium text-[var(--text-primary)]">
                      ${(order.total || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-sm text-right">
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="p-1.5 hover:bg-gray-200 rounded-full text-[var(--text-secondary)] transition-colors"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-sm text-[var(--text-secondary)]"
                    >
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
