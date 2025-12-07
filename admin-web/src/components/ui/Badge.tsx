import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors';

    const variants = {
      default:
        'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)]',
      success:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      warning:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      outline:
        'text-[var(--text-primary)] border border-[var(--border-primary)] bg-transparent',
    };

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
