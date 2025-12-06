import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', hover = false, children, ...props }, ref) => {
    
    const baseStyles = 'rounded-xl border border-gray-200 bg-brand-white shadow-sm';
    const hoverStyles = hover ? 'transition-all hover:-translate-y-1 hover:shadow-md' : '';

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
