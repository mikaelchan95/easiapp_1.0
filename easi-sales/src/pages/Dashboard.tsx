import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  DollarSign,
  Users,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/Badge';
import type { DashboardStats, Order, StaffProfile } from '../types';

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    activeCustomers: 0,
    pendingOnboardings: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topCustomers, setTopCustomers] = useState<
    { company_name: string; order_count: number; total_revenue: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function getStaffProfile(): Promise<StaffProfile | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return data as StaffProfile | null;
  }

  async function loadDashboard() {
    setLoading(true);
    try {
      const staff = await getStaffProfile();
      if (!staff) return;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const monthStart = startOfMonth.toISOString();

      const [ordersRes, onboardingRes, recentRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, total, company_id')
          .eq('placed_by_staff_id', staff.id)
          .gte('created_at', monthStart),
        supabase
          .from('customer_onboarding_requests')
          .select('id', { count: 'exact' })
          .eq('salesman_id', staff.id)
          .eq('status', 'pending'),
        supabase
          .from('orders')
          .select('*, company:companies(name)')
          .eq('placed_by_staff_id', staff.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const orders = ordersRes.data ?? [];
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
      const uniqueCustomers = new Set(orders.map(o => o.company_id));

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        activeCustomers: uniqueCustomers.size,
        pendingOnboardings: onboardingRes.count ?? 0,
      });

      setRecentOrders((recentRes.data ?? []) as Order[]);

      // Top customers by order count
      const customerMap = new Map<
        string,
        { company_name: string; order_count: number; total_revenue: number }
      >();
      for (const order of orders) {
        const name =
          (order as Record<string, unknown>).company &&
          typeof (order as Record<string, unknown>).company === 'object'
            ? ((order as Record<string, unknown>).company as { name: string })
                ?.name
            : order.company_id;
        const existing = customerMap.get(order.company_id);
        if (existing) {
          existing.order_count += 1;
          existing.total_revenue += order.total ?? 0;
        } else {
          customerMap.set(order.company_id, {
            company_name: String(name),
            order_count: 1,
            total_revenue: order.total ?? 0,
          });
        }
      }
      const sorted = Array.from(customerMap.values())
        .sort((a, b) => b.order_count - a.order_count)
        .slice(0, 5);
      setTopCustomers(sorted);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      label: 'Orders This Month',
      value: stats.totalOrders,
      icon: ShoppingCart,
      format: (v: number) => v.toString(),
    },
    {
      label: 'Revenue This Month',
      value: stats.totalRevenue,
      icon: DollarSign,
      format: (v: number) =>
        `$${v.toLocaleString('en-SG', { minimumFractionDigits: 2 })}`,
    },
    {
      label: 'Active Customers',
      value: stats.activeCustomers,
      icon: Users,
      format: (v: number) => v.toString(),
    },
    {
      label: 'Pending Onboardings',
      value: stats.pendingOnboardings,
      icon: ClipboardList,
      format: (v: number) => v.toString(),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <div className="h-20 animate-pulse rounded-lg bg-gray-100" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(stat => (
          <Card key={stat.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {stat.format(stat.value)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-100 p-2">
                <stat.icon className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <Card padding="none" className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">
              Recent Orders
            </h2>
            <button
              onClick={() => navigate('/customers')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              No orders yet this month
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map(order => (
                <div
                  key={order.id}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {order.order_number}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(
                        order as Order & {
                          company?: { name: string };
                        }
                      ).company?.name ?? '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">
                      $
                      {(order.total ?? 0).toLocaleString('en-SG', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top customers */}
        <Card padding="none">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">
              Top Customers
            </h2>
          </div>
          {topCustomers.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              No data available
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topCustomers.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {c.company_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.order_count} order{c.order_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    $
                    {c.total_revenue.toLocaleString('en-SG', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
