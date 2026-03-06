import type { DeliveryStatus } from '../types';
import { STATUS_LABELS } from '../types';

const statusStyles: Record<DeliveryStatus, string> = {
  assigned: 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20',
  dispatched: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  en_route: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  arrived: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
  delivered: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  failed: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
};

interface StatusBadgeProps {
  status: DeliveryStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]} ${className}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
