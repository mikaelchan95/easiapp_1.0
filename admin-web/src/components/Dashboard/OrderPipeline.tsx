import { ChevronDown, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type {
  OrderPipelineData,
  ActionOrder,
} from '../../hooks/useDashboardData';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../lib/formatters';

const CHARCOAL = '#36454F';

interface OrderPipelineProps {
  pipeline: OrderPipelineData;
  actionOrders: ActionOrder[];
}

const FUNNEL_STEPS: {
  key: keyof OrderPipelineData;
  label: string;
  opacity: number;
  widthPct: string;
}[] = [
  { key: 'pending', label: 'Pending', opacity: 0.2, widthPct: '100%' },
  { key: 'confirmed', label: 'Confirmed', opacity: 0.4, widthPct: '90%' },
  { key: 'preparing', label: 'Preparing', opacity: 0.6, widthPct: '80%' },
  {
    key: 'outForDelivery',
    label: 'Out for Delivery',
    opacity: 0.8,
    widthPct: '70%',
  },
  { key: 'delivered', label: 'Delivered', opacity: 1, widthPct: '60%' },
];

function issueVariant(
  type: ActionOrder['issueType']
): 'warning' | 'error' | 'default' {
  switch (type) {
    case 'payment_failed':
      return 'error';
    case 'stock_shortage':
    case 'address_error':
      return 'warning';
    default:
      return 'default';
  }
}

export function OrderPipeline({ pipeline, actionOrders }: OrderPipelineProps) {
  const navigate = useNavigate();

  return (
    <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Order Funnel */}
      <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h4 className="font-bold text-[var(--text-primary)] mb-6">
          Order Funnel
        </h4>
        <div className="space-y-1">
          {FUNNEL_STEPS.map((step, i) => {
            const count = pipeline[step.key];
            const isLast = i === FUNNEL_STEPS.length - 1;
            const textWhite = step.opacity >= 0.6;

            return (
              <div key={step.key} className="flex flex-col items-center">
                <div
                  className="py-2 text-center rounded-lg font-bold text-sm transition-all"
                  style={{
                    width: step.widthPct,
                    backgroundColor: `rgba(54, 69, 79, ${step.opacity})`,
                    color: textWhite ? '#fff' : CHARCOAL,
                  }}
                >
                  {step.label} ({count})
                </div>
                {!isLast && (
                  <ChevronDown size={16} className="text-gray-300 my-0.5" />
                )}
                {isLast && (
                  <CheckCircle
                    size={16}
                    className="my-0.5"
                    style={{ color: CHARCOAL }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Orders Requiring Action */}
      <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h4 className="font-bold text-[var(--text-primary)]">
            Orders Requiring Action
          </h4>
          {actionOrders.length > 0 && (
            <Badge variant="error">
              {actionOrders.length} Alert{actionOrders.length !== 1 && 's'}
            </Badge>
          )}
        </div>

        {actionOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-400 font-semibold">
                  <th className="px-6 py-3 text-xs uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider">
                    Issue
                  </th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-xs uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {actionOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={issueVariant(order.issueType)}>
                        {order.issue}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {formatCurrency(order.value)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="font-bold hover:underline"
                        style={{ color: CHARCOAL }}
                      >
                        Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-sm text-gray-400">
            No orders require attention right now
          </div>
        )}
      </div>
    </section>
  );
}
