import React from 'react';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'error'
    | 'outline'
    | 'info'
    | 'purple';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold transition-colors min-w-[80px]';

    const variants = {
      default: 'bg-gray-100 text-gray-700',
      success: 'bg-[#DCFCE7] text-[#166534]', // Green
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-[#DBEAFE] text-[#1E40AF]', // Blue (Delivery)
      purple: 'bg-[#F3E8FF] text-[#6B21A8]', // Purple (In Process)
      outline: 'text-gray-700 border border-gray-200 bg-transparent',
    };

    return (
      <span
        ref={ref}
        className={twMerge(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
