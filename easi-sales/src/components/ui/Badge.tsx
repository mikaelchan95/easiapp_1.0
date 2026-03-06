import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
  neutral: 'bg-gray-50 text-gray-600',
};

export function Badge({
  variant = 'default',
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          variantStyles[variant],
          className
        )
      )}
    >
      {children}
    </span>
  );
}

const statusMap: Record<string, BadgeVariant> = {
  active: 'success',
  on_hold: 'warning',
  suspended: 'error',
  pending: 'warning',
  confirmed: 'info',
  preparing: 'info',
  ready: 'info',
  out_for_delivery: 'info',
  delivered: 'success',
  cancelled: 'error',
  returned: 'neutral',
  approved: 'success',
  rejected: 'error',
  paid: 'success',
  overdue: 'error',
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const variant = statusMap[status] ?? 'default';
  const label = status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
