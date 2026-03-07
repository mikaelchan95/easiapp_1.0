import { ChevronRight, TrendingUp, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { RevenueData } from '../../hooks/useDashboardData';
import { formatCurrency } from '../../lib/formatters';

const CHARCOAL = '#36454F';

interface RevenueSectionProps {
  data: RevenueData;
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
}

export function RevenueSection({ data }: RevenueSectionProps) {
  const maxCompanyRevenue = data.topCompanies[0]?.revenue ?? 1;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Revenue & Sales Performance
        </h2>
        <Link
          to="/invoices"
          className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1 hover:underline"
        >
          View Detailed Report <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* B2B vs B2C Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-[var(--text-primary)]">
                B2B vs B2C Revenue
              </h4>
              <p className="text-xs text-gray-400">
                Daily revenue comparison for current month
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CHARCOAL }}
                />
                <span className="text-xs font-medium">B2B</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-300" />
                <span className="text-xs font-medium">B2C</span>
              </div>
            </div>
          </div>

          {data.dailyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={data.dailyRevenue}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => formatCompact(v)}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  }}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'b2b' ? 'B2B' : 'B2C',
                  ]}
                  labelFormatter={label => `Day ${label}`}
                />
                <Legend content={() => null} />
                <Bar
                  dataKey="b2b"
                  fill={CHARCOAL}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={16}
                />
                <Bar
                  dataKey="b2c"
                  fill="#cbd5e1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">
              No revenue data for this month
            </div>
          )}
        </div>

        {/* Right column: MTD + AOV + Top Companies */}
        <div className="space-y-4">
          {/* MTD Revenue Hero */}
          <div
            className="text-white p-6 rounded-xl shadow-lg relative overflow-hidden"
            style={{ backgroundColor: CHARCOAL }}
          >
            <div className="relative z-10">
              <p className="text-xs font-medium opacity-80 uppercase">
                MTD Revenue
              </p>
              <h3 className="text-3xl font-bold mt-1">
                {formatCompact(data.mtdRevenue)}
              </h3>
              {data.mtdTrend !== null && (
                <div className="mt-4 flex items-center gap-2 bg-white/10 w-fit px-2 py-1 rounded">
                  <TrendingUp size={12} />
                  <span className="text-xs font-bold">
                    {data.mtdTrend >= 0 ? '+' : ''}
                    {data.mtdTrend.toFixed(1)}% vs prev. month
                  </span>
                </div>
              )}
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <DollarWatermark />
            </div>
          </div>

          {/* Avg Order Value */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">
                Avg. Order Value
              </p>
              <h4 className="text-xl font-bold text-[var(--text-primary)]">
                {formatCurrency(data.avgOrderValue)}
              </h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt size={18} />
            </div>
          </div>

          {/* Top Companies */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">
              Top Companies (Revenue)
            </h4>
            {data.topCompanies.length > 0 ? (
              <div className="space-y-3">
                {data.topCompanies.slice(0, 5).map(c => (
                  <div key={c.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="truncate mr-2">{c.name}</span>
                      <span className="shrink-0">
                        {formatCompact(c.revenue)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: CHARCOAL,
                          width: `${(c.revenue / maxCompanyRevenue) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">
                No company revenue data
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function DollarWatermark() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
