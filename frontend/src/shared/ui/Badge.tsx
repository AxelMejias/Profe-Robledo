import clsx from 'clsx';
import { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'info' | 'gray';
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = 'gray',
  size = 'sm',
  children,
  className,
}: BadgeProps) {
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800',
    secondary: 'bg-secondary-100 text-secondary-800',
    danger: 'bg-danger-100 text-danger-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}
