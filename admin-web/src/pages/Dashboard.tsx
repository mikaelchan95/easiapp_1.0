import { useDashboardData } from '../hooks/useDashboardData';
import { KPIBanner } from '../components/Dashboard/KPIBanner';
import { RevenueSection } from '../components/Dashboard/RevenueSection';
import { OrderPipeline } from '../components/Dashboard/OrderPipeline';
import { CreditSection } from '../components/Dashboard/CreditSection';
import { DeliverySection } from '../components/Dashboard/DeliverySection';

export default function Dashboard() {
  const data = useDashboardData();

  if (data.loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
            style={{ backgroundColor: '#36454F' }}
          >
            <PulseIcon />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              Today's Pulse
            </h1>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Banner */}
      <KPIBanner data={data.kpi} />

      {/* Revenue & Sales */}
      <RevenueSection data={data.revenue} />

      {/* Order Pipeline */}
      <OrderPipeline
        pipeline={data.pipeline}
        actionOrders={data.actionOrders}
      />

      {/* Credit & AR */}
      <CreditSection data={data.credit} />

      {/* Delivery Operations */}
      <DeliverySection data={data.delivery} />
    </div>
  );
}

function PulseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
