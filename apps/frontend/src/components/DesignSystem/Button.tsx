/**
 * Button Component
 * 
 * A reusable button component that provides consistent styling and behavior
 * across the ESTA Tracker application.
 * 
 * Features:
 * - Multiple variants (primary, secondary, danger, ghost)
 * - Size options (sm, md, lg)
 * - Loading state with spinner
 * - Full width option
 * - Disabled state handling
 * - Icon support (left and right)
 * - Accessibility features (ARIA labels, keyboard support)
 * 
 * Uses:
 * - Tailwind CSS for styling
 * - clsx for conditional class management
 * - Supports all standard button HTML attributes
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  withGlow?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  withGlow = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-royal-500 to-royal-600 text-white hover:from-royal-600 hover:to-royal-700 hover:shadow-lg hover:shadow-royal-500/30 focus:ring-royal-500 disabled:hover:from-royal-500 disabled:hover:to-royal-600 hover:scale-105 active:scale-95',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 focus:ring-gray-500 hover:scale-105 active:scale-95',
    danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30 focus:ring-red-500 disabled:hover:bg-red-600 hover:scale-105 active:scale-95',
    ghost: 'bg-transparent text-royal-600 hover:bg-royal-50 dark:text-royal-400 dark:hover:bg-royal-900/20 focus:ring-royal-500 hover:scale-105 active:scale-95',
    success: 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:shadow-lg hover:shadow-green-500/30 focus:ring-green-500 hover:scale-105 active:scale-95',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const glowClass = withGlow && variant === 'primary' ? 'blue-glow hover:blue-glow-strong' : '';

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        widthClass,
        glowClass,
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}
