import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', hover = false, children, ...props }, ref) => {
    const baseStyles =
      'rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-sm';
    const hoverStyles = hover
      ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--border-secondary)]'
      : '';

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
