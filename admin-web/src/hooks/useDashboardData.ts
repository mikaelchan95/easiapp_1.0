import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────

export interface KPIData {
  ordersToday: number;
  ordersTodayTrend: number | null;
  revenueToday: number;
  revenueTodayTrend: number | null;
  pendingOrders: number;
  pendingTrend: number | null;
  activeDeliveries: number;
  failedOrders: number;
}

export interface DailyRevenue {
  day: string;
  b2b: number;
  b2c: number;
}

export interface TopCompany {
  id: string;
  name: string;
  revenue: number;
}

export interface RevenueData {
  dailyRevenue: DailyRevenue[];
  mtdRevenue: number;
  mtdTrend: number | null;
  avgOrderValue: number;
  topCompanies: TopCompany[];
}

export interface OrderPipelineData {
  pending: number;
  confirmed: number;
  preparing: number;
  outForDelivery: number;
  delivered: number;
}

export interface ActionOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  issue: string;
  issueType: 'payment_failed' | 'stock_shortage' | 'address_error' | 'stuck';
  value: number;
}

export interface AgingBucket {
  label: string;
  amount: number;
  percentage: number;
}

export interface HighRiskAccount {
  id: string;
  name: string;
  overdueDays: number;
  overdueAmount: number;
  creditLimit: number;
}

export interface CreditData {
  totalOutstanding: number;
  agingBuckets: AgingBucket[];
  highRiskAccounts: HighRiskAccount[];
}

export interface DeliveryKPIs {
  onTimeRate: number;
  avgTransitDays: number;
  activeDrivers: number;
  totalDrivers: number;
  utilizationPct: number;
}

export interface ScheduledDelivery {
  id: string;
  orderId: string;
  orderNumber: string;
  driverName: string;
  destinationArea: string;
  status: string;
  assignedAt: string;
}

export interface DeliveryData {
  kpis: DeliveryKPIs;
  schedule: ScheduledDelivery[];
}

export interface DashboardData {
  kpi: KPIData;
  revenue: RevenueData;
  pipeline: OrderPipelineData;
  actionOrders: ActionOrder[];
  credit: CreditData;
  delivery: DeliveryData;
  loading: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function startOfDay(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonth(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}

function daysAgo(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return 100;
  return ((current - previous) / previous) * 100;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useDashboardData(): DashboardData {
  const [data, setData] = useState<DashboardData>({
    kpi: {
      ordersToday: 0,
      ordersTodayTrend: null,
      revenueToday: 0,
      revenueTodayTrend: null,
      pendingOrders: 0,
      pendingTrend: null,
      activeDeliveries: 0,
      failedOrders: 0,
    },
    revenue: {
      dailyRevenue: [],
      mtdRevenue: 0,
      mtdTrend: null,
      avgOrderValue: 0,
      topCompanies: [],
    },
    pipeline: {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      outForDelivery: 0,
      delivered: 0,
    },
    actionOrders: [],
    credit: {
      totalOutstanding: 0,
      agingBuckets: [],
      highRiskAccounts: [],
    },
    delivery: {
      kpis: {
        onTimeRate: 0,
        avgTransitDays: 0,
        activeDrivers: 0,
        totalDrivers: 0,
        utilizationPct: 0,
      },
      schedule: [],
    },
    loading: true,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const now = new Date();
      const todayStart = startOfDay(now);
      const yesterdayStart = daysAgo(now, 1);
      const monthStart = startOfMonth(now);
      const prevMonthStart = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      ).toISOString();

      const [
        kpiResult,
        revenueResult,
        pipelineResult,
        creditResult,
        deliveryResult,
      ] = await Promise.all([
        fetchKPI(todayStart, yesterdayStart),
        fetchRevenue(monthStart, prevMonthStart, now),
        fetchPipeline(todayStart),
        fetchCredit(now),
        fetchDelivery(todayStart),
      ]);

      setData({
        kpi: kpiResult,
        revenue: revenueResult,
        pipeline: pipelineResult.pipeline,
        actionOrders: pipelineResult.actionOrders,
        credit: creditResult,
        delivery: deliveryResult,
        loading: false,
      });
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setData(prev => ({ ...prev, loading: false }));
    }
  }

  return data;
}

// ── Fetchers ───────────────────────────────────────────────────────────────

async function fetchKPI(
  todayStart: string,
  yesterdayStart: string
): Promise<KPIData> {
  const [
    todayOrdersRes,
    yesterdayOrdersRes,
    todayRevenueRes,
    yesterdayRevenueRes,
    pendingRes,
    activeDeliveriesRes,
    failedRes,
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterdayStart)
      .lt('created_at', todayStart),
    supabase
      .from('orders')
      .select('total')
      .gte('created_at', todayStart)
      .eq('payment_status', 'paid'),
    supabase
      .from('orders')
      .select('total')
      .gte('created_at', yesterdayStart)
      .lt('created_at', todayStart)
      .eq('payment_status', 'paid'),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('delivery_assignments')
      .select('*', { count: 'exact', head: true })
      .in('status', ['assigned', 'dispatched', 'en_route']),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'failed'),
  ]);

  const ordersToday = todayOrdersRes.count ?? 0;
  const ordersYesterday = yesterdayOrdersRes.count ?? 0;
  const revenueToday =
    todayRevenueRes.data?.reduce((s, o) => s + (Number(o.total) || 0), 0) ?? 0;
  const revenueYesterday =
    yesterdayRevenueRes.data?.reduce((s, o) => s + (Number(o.total) || 0), 0) ??
    0;

  return {
    ordersToday,
    ordersTodayTrend: pctChange(ordersToday, ordersYesterday),
    revenueToday,
    revenueTodayTrend: pctChange(revenueToday, revenueYesterday),
    pendingOrders: pendingRes.count ?? 0,
    pendingTrend: null,
    activeDeliveries: activeDeliveriesRes.count ?? 0,
    failedOrders: failedRes.count ?? 0,
  };
}

async function fetchRevenue(
  monthStart: string,
  prevMonthStart: string,
  now: Date
): Promise<RevenueData> {
  const [thisMonthRes, prevMonthRes, companiesRevenueRes] = await Promise.all([
    supabase
      .from('orders')
      .select('total, company_id, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', monthStart),
    supabase
      .from('orders')
      .select('total')
      .eq('payment_status', 'paid')
      .gte('created_at', prevMonthStart)
      .lt('created_at', monthStart),
    supabase
      .from('orders')
      .select('total, company_id, companies:company_id(name)')
      .eq('payment_status', 'paid')
      .gte('created_at', monthStart)
      .not('company_id', 'is', null),
  ]);

  const thisMonthOrders = thisMonthRes.data ?? [];
  const prevMonthOrders = prevMonthRes.data ?? [];

  // MTD revenue
  const mtdRevenue = thisMonthOrders.reduce(
    (s, o) => s + (Number(o.total) || 0),
    0
  );
  const prevMtd = prevMonthOrders.reduce(
    (s, o) => s + (Number(o.total) || 0),
    0
  );

  // Average order value
  const avgOrderValue =
    thisMonthOrders.length > 0 ? mtdRevenue / thisMonthOrders.length : 0;

  // Daily revenue for current month, split B2B/B2C
  const dayMap = new Map<string, { b2b: number; b2c: number }>();
  const daysInMonth = now.getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const key = String(d).padStart(2, '0');
    dayMap.set(key, { b2b: 0, b2c: 0 });
  }
  for (const o of thisMonthOrders) {
    const day = String(new Date(o.created_at).getDate()).padStart(2, '0');
    const entry = dayMap.get(day) ?? { b2b: 0, b2c: 0 };
    const amt = Number(o.total) || 0;
    if (o.company_id) {
      entry.b2b += amt;
    } else {
      entry.b2c += amt;
    }
    dayMap.set(day, entry);
  }
  const dailyRevenue: DailyRevenue[] = Array.from(dayMap.entries()).map(
    ([day, vals]) => ({ day, ...vals })
  );

  // Top companies by revenue
  const companyMap = new Map<string, { name: string; revenue: number }>();
  for (const o of companiesRevenueRes.data ?? []) {
    const cid = o.company_id as string;
    const existing = companyMap.get(cid) ?? {
      name: (o.companies as any)?.name ?? 'Unknown',
      revenue: 0,
    };
    existing.revenue += Number(o.total) || 0;
    companyMap.set(cid, existing);
  }
  const topCompanies: TopCompany[] = Array.from(companyMap.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    dailyRevenue,
    mtdRevenue,
    mtdTrend: pctChange(mtdRevenue, prevMtd),
    avgOrderValue,
    topCompanies,
  };
}

async function fetchPipeline(todayStart: string): Promise<{
  pipeline: OrderPipelineData;
  actionOrders: ActionOrder[];
}> {
  const [pipelineRes, failedPaymentRes, stuckRes] = await Promise.all([
    supabase
      .from('orders')
      .select('status')
      .in('status', [
        'pending',
        'confirmed',
        'preparing',
        'out_for_delivery',
        'delivered',
      ]),
    supabase
      .from('orders')
      .select(
        'id, order_number, total, payment_status, user:users!user_id(name)'
      )
      .eq('payment_status', 'failed')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('orders')
      .select(
        'id, order_number, total, status, created_at, user:users!user_id(name)'
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5),
  ]);

  const statuses = pipelineRes.data ?? [];
  const pipeline: OrderPipelineData = {
    pending: statuses.filter(o => o.status === 'pending').length,
    confirmed: statuses.filter(o => o.status === 'confirmed').length,
    preparing: statuses.filter(o => o.status === 'preparing').length,
    outForDelivery: statuses.filter(o => o.status === 'out_for_delivery')
      .length,
    delivered: statuses.filter(o => o.status === 'delivered').length,
  };

  const actionOrders: ActionOrder[] = [];

  for (const o of failedPaymentRes.data ?? []) {
    actionOrders.push({
      id: o.id,
      orderNumber: o.order_number,
      customerName: (o.user as any)?.name ?? 'Unknown',
      issue: 'Payment Failed',
      issueType: 'payment_failed',
      value: Number(o.total) || 0,
    });
  }

  for (const o of stuckRes.data ?? []) {
    const ageHours =
      (Date.now() - new Date(o.created_at).getTime()) / (1000 * 60 * 60);
    if (ageHours > 24) {
      actionOrders.push({
        id: o.id,
        orderNumber: o.order_number,
        customerName: (o.user as any)?.name ?? 'Unknown',
        issue: `Pending ${Math.floor(ageHours / 24)}d`,
        issueType: 'stuck',
        value: Number(o.total) || 0,
      });
    }
  }

  return { pipeline, actionOrders: actionOrders.slice(0, 10) };
}

async function fetchCredit(now: Date): Promise<CreditData> {
  const [invoicesRes, companiesRes] = await Promise.all([
    supabase
      .from('invoices')
      .select(
        'id, total_amount, billing_amount, paid_amount, remaining_amount, outstanding_amount, due_date, payment_due_date, status, company:company_id(id, name, credit_limit)'
      )
      .in('status', ['outstanding', 'partial_paid', 'overdue']),
    supabase.from('companies').select('id, name, credit_limit, current_credit'),
  ]);

  const invoices = invoicesRes.data ?? [];

  // Bucket invoices by aging
  const buckets = [
    { label: 'Current', amount: 0 },
    { label: '1-30', amount: 0 },
    { label: '31-60', amount: 0 },
    { label: '61-90', amount: 0 },
    { label: '90+', amount: 0 },
  ];

  let totalOutstanding = 0;

  for (const inv of invoices) {
    const amt =
      Number(inv.remaining_amount) ||
      Number(inv.outstanding_amount) ||
      Number(inv.total_amount) ||
      Number(inv.billing_amount) ||
      0;
    totalOutstanding += amt;

    const dueDate = inv.due_date || inv.payment_due_date;
    if (!dueDate) {
      buckets[0].amount += amt;
      continue;
    }

    const days = daysBetween(now, new Date(dueDate));
    const isPastDue = new Date(dueDate) < now;

    if (!isPastDue) {
      buckets[0].amount += amt;
    } else if (days <= 30) {
      buckets[1].amount += amt;
    } else if (days <= 60) {
      buckets[2].amount += amt;
    } else if (days <= 90) {
      buckets[3].amount += amt;
    } else {
      buckets[4].amount += amt;
    }
  }

  const agingBuckets: AgingBucket[] = buckets.map(b => ({
    ...b,
    percentage: totalOutstanding > 0 ? (b.amount / totalOutstanding) * 100 : 0,
  }));

  // High risk: companies with high utilization or overdue invoices
  const companies = companiesRes.data ?? [];
  const highRiskAccounts: HighRiskAccount[] = [];

  // Find overdue invoices grouped by company
  const companyOverdue = new Map<
    string,
    { amount: number; maxDays: number; name: string; creditLimit: number }
  >();
  for (const inv of invoices) {
    const dueDate = inv.due_date || inv.payment_due_date;
    if (!dueDate || new Date(dueDate) >= now) continue;

    const company = inv.company as any;
    if (!company?.id) continue;

    const days = daysBetween(now, new Date(dueDate));
    const amt =
      Number(inv.remaining_amount) ||
      Number(inv.outstanding_amount) ||
      Number(inv.total_amount) ||
      0;

    const existing = companyOverdue.get(company.id) ?? {
      amount: 0,
      maxDays: 0,
      name: company.name ?? 'Unknown',
      creditLimit: Number(company.credit_limit) || 0,
    };
    existing.amount += amt;
    existing.maxDays = Math.max(existing.maxDays, days);
    companyOverdue.set(company.id, existing);
  }

  for (const [id, v] of companyOverdue) {
    if (v.maxDays >= 30) {
      highRiskAccounts.push({
        id,
        name: v.name,
        overdueDays: v.maxDays,
        overdueAmount: v.amount,
        creditLimit: v.creditLimit,
      });
    }
  }

  // Also add companies with >80% credit utilization even if no overdue invoices
  for (const c of companies) {
    const util =
      Number(c.credit_limit) > 0
        ? (Number(c.current_credit) / Number(c.credit_limit)) * 100
        : 0;
    if (util > 80 && !companyOverdue.has(c.id)) {
      highRiskAccounts.push({
        id: c.id,
        name: c.name,
        overdueDays: 0,
        overdueAmount: Number(c.current_credit) || 0,
        creditLimit: Number(c.credit_limit) || 0,
      });
    }
  }

  highRiskAccounts.sort((a, b) => b.overdueDays - a.overdueDays);

  return {
    totalOutstanding,
    agingBuckets,
    highRiskAccounts: highRiskAccounts.slice(0, 5),
  };
}

async function fetchDelivery(todayStart: string): Promise<DeliveryData> {
  const [allDriversRes, activeRes, todayDeliveriesRes, completedRes] =
    await Promise.all([
      supabase
        .from('staff_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('staff_role', 'driver')
        .eq('is_active', true),
      supabase
        .from('delivery_assignments')
        .select('driver_id, status')
        .in('status', ['assigned', 'dispatched', 'en_route']),
      supabase
        .from('delivery_assignments')
        .select(
          'id, order_id, status, assigned_at, driver:driver_id(full_name), order:order_id(order_number, delivery_address)'
        )
        .gte('assigned_at', todayStart)
        .order('assigned_at', { ascending: true })
        .limit(20),
      supabase
        .from('delivery_assignments')
        .select('status, assigned_at, delivered_at')
        .eq('status', 'delivered')
        .gte('delivered_at', todayStart),
    ]);

  const totalDrivers = allDriversRes.count ?? 0;
  const activeAssignments = activeRes.data ?? [];
  const uniqueActiveDrivers = new Set(activeAssignments.map(a => a.driver_id))
    .size;

  // On-time rate: delivered within 24h of assignment (rough proxy)
  const completed = completedRes.data ?? [];
  let onTime = 0;
  let totalTransitMs = 0;
  for (const d of completed) {
    if (d.assigned_at && d.delivered_at) {
      const transit =
        new Date(d.delivered_at).getTime() - new Date(d.assigned_at).getTime();
      totalTransitMs += transit;
      if (transit < 24 * 60 * 60 * 1000) onTime++;
    }
  }
  const onTimeRate =
    completed.length > 0 ? (onTime / completed.length) * 100 : 0;
  const avgTransitDays =
    completed.length > 0
      ? totalTransitMs / completed.length / (1000 * 60 * 60 * 24)
      : 0;

  const schedule: ScheduledDelivery[] = (todayDeliveriesRes.data ?? []).map(
    (d: any) => ({
      id: d.id,
      orderId: d.order_id,
      orderNumber: d.order?.order_number ?? d.order_id?.slice(0, 8),
      driverName: d.driver?.full_name ?? 'Unassigned',
      destinationArea:
        typeof d.order?.delivery_address === 'object'
          ? (d.order.delivery_address?.area ??
            d.order.delivery_address?.city ??
            'N/A')
          : (d.order?.delivery_address ?? 'N/A'),
      status: d.status,
      assignedAt: d.assigned_at,
    })
  );

  return {
    kpis: {
      onTimeRate,
      avgTransitDays: Math.round(avgTransitDays * 10) / 10,
      activeDrivers: uniqueActiveDrivers,
      totalDrivers,
      utilizationPct:
        totalDrivers > 0
          ? Math.round((uniqueActiveDrivers / totalDrivers) * 100)
          : 0,
    },
    schedule,
  };
}
