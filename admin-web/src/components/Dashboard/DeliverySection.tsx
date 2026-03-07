import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { DeliveryData } from '../../hooks/useDashboardData';
import { Badge } from '../ui/Badge';
import { formatTime } from '../../lib/formatters';

const CHARCOAL = '#36454F';

interface DeliverySectionProps {
  data: DeliveryData;
}

function deliveryStatusVariant(
  status: string
): 'success' | 'warning' | 'error' | 'info' | 'default' {
  switch (status) {
    case 'delivered':
      return 'success';
    case 'en_route':
    case 'dispatched':
      return 'info';
    case 'arrived':
      return 'success';
    case 'failed':
      return 'error';
    case 'assigned':
      return 'default';
    default:
      return 'default';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'en_route':
      return 'En Route';
    case 'dispatched':
      return 'Dispatched';
    case 'assigned':
      return 'Assigned';
    case 'arrived':
      return 'Arrived';
    case 'delivered':
      return 'Delivered';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

export function DeliverySection({ data }: DeliverySectionProps) {
  const { kpis, schedule } = data;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Logistics & Delivery Operations
        </h2>
        <Link
          to="/deliveries"
          className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1 hover:underline"
        >
          View All <ChevronRight size={14} />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="On-Time Rate"
          value={`${kpis.onTimeRate.toFixed(1)}%`}
          barPct={kpis.onTimeRate}
          barColor="#10b981"
        />
        <KPICard
          label="Average Transit"
          value={`${kpis.avgTransitDays}`}
          suffix="days"
        />
        <KPICard
          label="Active Drivers"
          value={`${kpis.activeDrivers} / ${kpis.totalDrivers}`}
          sub={`${kpis.utilizationPct}% Utilization`}
        />
        <KPICard
          label="Fleet Utilization"
          value={`${kpis.utilizationPct}%`}
          barPct={kpis.utilizationPct}
          barColor={CHARCOAL}
        />
      </div>

      {/* Today's Delivery Schedule */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h4 className="font-bold text-[var(--text-primary)]">
            Today's Delivery Schedule
          </h4>
          <Link
            to="/deliveries"
            className="px-3 py-1 text-xs font-bold rounded"
            style={{ backgroundColor: CHARCOAL, color: '#fff' }}
          >
            View All Deliveries
          </Link>
        </div>

        {schedule.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-400 font-semibold">
                  <th className="px-6 py-3 text-xs uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider">
                    Assigned
                  </th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {schedule.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                      {d.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                      {d.driverName}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                      {d.destinationArea}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                      {d.assignedAt ? formatTime(d.assignedAt) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={deliveryStatusVariant(d.status)}>
                        {statusLabel(d.status)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-sm text-gray-400">
            No deliveries scheduled for today
          </div>
        )}
      </div>
    </section>
  );
}

function KPICard({
  label,
  value,
  suffix,
  sub,
  barPct,
  barColor,
}: {
  label: string;
  value: string;
  suffix?: string;
  sub?: string;
  barPct?: number;
  barColor?: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
      <p className="text-xs font-bold text-gray-400 uppercase">{label}</p>
      <h3 className="text-3xl font-bold mt-2" style={{ color: CHARCOAL }}>
        {value}
        {suffix && (
          <span className="text-sm font-normal text-gray-400 ml-1">
            {suffix}
          </span>
        )}
      </h3>
      {barPct !== undefined && (
        <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(barPct, 100)}%`,
              backgroundColor: barColor ?? '#10b981',
            }}
          />
        </div>
      )}
      {sub && <p className="text-[10px] text-gray-400 font-bold mt-2">{sub}</p>}
    </div>
  );
}
