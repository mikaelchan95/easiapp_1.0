import {
  ShoppingCart,
  DollarSign,
  Clock,
  Truck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { KPIData } from '../../hooks/useDashboardData';
import { formatCurrency, formatNumber } from '../../lib/formatters';

interface KPIBannerProps {
  data: KPIData;
}

interface KPICardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: number | null;
  trendLabel?: string;
  alert?: boolean;
}

function KPICard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  alert,
}: KPICardProps) {
  const isPositive = trend !== null && trend !== undefined && trend >= 0;
  const hasTrend = trend !== null && trend !== undefined;

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400">
          <Icon size={14} />
        </div>
      </div>
      <div className="flex items-end justify-between mt-2">
        <h3
          className={`text-2xl font-bold tracking-tight ${alert ? 'text-red-500' : 'text-[var(--text-primary)]'}`}
        >
          {value}
        </h3>
        {hasTrend ? (
          <span
            className={`text-xs font-bold flex items-center gap-0.5 mb-0.5 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(0)}%
          </span>
        ) : trendLabel ? (
          <span
            className={`text-[10px] font-bold mb-0.5 ${alert ? 'text-red-500' : 'text-gray-400'}`}
          >
            {trendLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function KPIBanner({ data }: KPIBannerProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <KPICard
        label="Orders Today"
        value={formatNumber(data.ordersToday)}
        icon={ShoppingCart}
        trend={data.ordersTodayTrend}
      />
      <KPICard
        label="Revenue Today"
        value={formatCurrency(data.revenueToday)}
        icon={DollarSign}
        trend={data.revenueTodayTrend}
      />
      <KPICard
        label="Pending Orders"
        value={formatNumber(data.pendingOrders)}
        icon={Clock}
        trend={data.pendingTrend}
      />
      <KPICard
        label="Deliveries"
        value={formatNumber(data.activeDeliveries)}
        icon={Truck}
        trendLabel="Active"
      />
      <KPICard
        label="Failures"
        value={formatNumber(data.failedOrders)}
        icon={AlertTriangle}
        alert={data.failedOrders > 0}
        trendLabel={data.failedOrders > 0 ? 'Alert' : undefined}
      />
    </div>
  );
}
