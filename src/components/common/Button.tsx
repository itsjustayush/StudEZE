import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'md',
      icon,
      loading = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeClass = size === 'sm' ? 'btn-sm' : '';
    const variantClass = `btn-${variant}`;

    return (
      <button
        ref={ref}
        className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              border: '2px solid currentColor',
              borderRightColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }}
            aria-hidden="true"
          />
        ) : (
          icon && <span aria-hidden="true" style={{ display: 'inline-flex' }}>{icon}</span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
