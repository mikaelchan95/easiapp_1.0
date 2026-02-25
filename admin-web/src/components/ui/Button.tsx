import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none touch-manipulation';

    const variants = {
      primary:
        'bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 focus:ring-[var(--text-primary)] shadow-sm',
      secondary:
        'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--border-secondary)] focus:ring-[var(--border-primary)] border border-[var(--border-primary)]',
      outline:
        'border border-[var(--border-primary)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] focus:ring-[var(--border-primary)]',
      ghost:
        'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] focus:ring-[var(--border-primary)]',
      danger:
        'bg-red-600 text-[var(--color-primary-text)] hover:bg-red-700 focus:ring-red-600 dark:bg-red-500 dark:hover:bg-red-600',
    };

    const sizes = {
      sm: 'min-h-[36px] px-3 text-xs',
      md: 'min-h-[44px] px-4 py-2 text-sm',
      lg: 'min-h-[48px] px-6 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
