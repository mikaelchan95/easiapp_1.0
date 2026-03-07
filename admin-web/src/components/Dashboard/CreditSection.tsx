import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CreditData } from '../../hooks/useDashboardData';
import { formatCurrency } from '../../lib/formatters';

const CHARCOAL = '#36454F';

const BUCKET_STYLES: { opacity: number; isAlert?: boolean }[] = [
  { opacity: 1 },
  { opacity: 0.7 },
  { opacity: 0.5 },
  { opacity: 0.3 },
  { isAlert: true },
];

interface CreditSectionProps {
  data: CreditData;
}

export function CreditSection({ data }: CreditSectionProps) {
  const navigate = useNavigate();

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* AR Aging Buckets */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-[var(--text-primary)]">
            AR Aging Buckets
          </h4>
          <div className="text-xs font-bold text-gray-400 uppercase">
            Total Outstanding: {formatCurrency(data.totalOutstanding)}
          </div>
        </div>

        {/* Stacked bar */}
        <div className="h-10 w-full flex rounded-lg overflow-hidden mb-6">
          {data.agingBuckets.map((bucket, i) => {
            const style = BUCKET_STYLES[i] ?? BUCKET_STYLES[0];
            if (bucket.percentage <= 0) return null;
            return (
              <div
                key={bucket.label}
                className="h-full transition-all"
                style={{
                  width: `${bucket.percentage}%`,
                  backgroundColor: style.isAlert
                    ? '#ef4444'
                    : `rgba(54, 69, 79, ${style.opacity})`,
                }}
                title={`${bucket.label}: ${formatCurrency(bucket.amount)}`}
              />
            );
          })}
          {data.totalOutstanding === 0 && (
            <div className="h-full w-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
              No outstanding invoices
            </div>
          )}
        </div>

        {/* Bucket labels */}
        <div className="grid grid-cols-5 gap-2 text-center">
          {data.agingBuckets.map((bucket, i) => {
            const isAlert = BUCKET_STYLES[i]?.isAlert;
            return (
              <div key={bucket.label}>
                <p
                  className={`text-[10px] font-bold uppercase ${isAlert ? 'text-red-500' : 'text-gray-400'}`}
                >
                  {bucket.label}
                </p>
                <p
                  className={`text-xs font-bold ${isAlert ? 'text-red-500' : ''}`}
                >
                  {formatCompactShort(bucket.amount)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* High Risk Accounts */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h4 className="font-bold text-[var(--text-primary)]">
            High Risk Accounts
          </h4>
          <AlertTriangle size={16} className="text-gray-400" />
        </div>

        {data.highRiskAccounts.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {data.highRiskAccounts.map(account => (
              <div
                key={account.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/companies/${account.id}`)}
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {account.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {account.overdueDays > 0
                      ? `Overdue: ${account.overdueDays} days`
                      : 'High utilization'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-500">
                    {formatCurrency(account.overdueAmount)}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">
                    Credit Limit: {formatCompactShort(account.creditLimit)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-sm text-gray-400">
            No high-risk accounts
          </div>
        )}
      </div>
    </section>
  );
}

function formatCompactShort(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
}
