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
      default: 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20',
      success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
      warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
      error: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
      info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
      purple: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
      outline: 'text-gray-700 border border-gray-300 bg-transparent',
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
