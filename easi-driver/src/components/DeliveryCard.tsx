import { ChevronRight, Package, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import type { DeliveryAssignment, DeliveryStatus } from '../types';
import { ZONE_COLORS } from '../types';

interface DeliveryCardProps {
  assignment: DeliveryAssignment;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(amount);
}

function parseAddress(raw: string | null | undefined): string {
  if (!raw) return 'No address';
  try {
    const parsed = JSON.parse(raw);
    return parsed.address || raw;
  } catch {
    return raw;
  }
}

export function DeliveryCard({ assignment }: DeliveryCardProps) {
  const navigate = useNavigate();
  const order = assignment.order;

  if (!order) return null;

  const zone = order.delivery_zone || 'Central';
  const itemCount = order.order_items?.length ?? 0;
  const totalAmount =
    typeof order.total === 'number' && !isNaN(order.total) ? order.total : 0;

  return (
    <button
      onClick={() => navigate(`/delivery/${assignment.id}`)}
      className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 p-4 active:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 text-base">
              {order.order_number}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${ZONE_COLORS[zone] || ZONE_COLORS.Central}`}
            >
              {zone.charAt(0)}
            </span>
          </div>

          <p className="text-sm font-medium text-gray-700 mb-0.5">
            {order.company?.name || 'Customer'}
          </p>

          <p className="text-sm text-gray-500 truncate mb-2">
            {parseAddress(order.delivery_address)}
          </p>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Package className="h-3.5 w-3.5" />
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(order.created_at)}
            </span>
            <span className="font-medium text-gray-700">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <StatusBadge status={assignment.status as DeliveryStatus} />
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </button>
  );
}
