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
      default: 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]',
      success: 'bg-[var(--text-primary)] text-[var(--color-primary-text)]',
      warning:
        'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-default)]',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      info: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
      purple: 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]',
      outline:
        'text-[var(--text-primary)] border border-[var(--border-default)] bg-transparent',
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
