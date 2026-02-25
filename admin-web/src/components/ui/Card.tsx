import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', hover = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          'bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-6',
          hover &&
            'transition-all duration-200 hover:shadow-md hover:border-[var(--border-default)]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
