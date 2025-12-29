import { ReactNode } from 'react';

export interface ProgressBarProps {
  /**
   * Progress value (0-100)
   */
  value: number;
  /**
   * Maximum value (default: 100)
   */
  max?: number;
  /**
   * Show percentage label
   */
  showLabel?: boolean;
  /**
   * Label text (if not provided, shows percentage)
   */
  label?: string;
  /**
   * Color variant
   */
  variant?: 'primary' | 'success' | 'warning' | 'error';
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Show striped animation
   */
  striped?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Progress Bar Component
 *
 * Visual indicator for progress or completion status.
 *
 * Features:
 * - Percentage-based progress
 * - Multiple color variants
 * - Optional label display
 * - Striped animation option
 * - Accessible markup with ARIA
 * - Responsive sizing
 *
 * @example
 * <ProgressBar value={75} showLabel variant="success" />
 */
export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  label,
  variant = 'primary',
  size = 'md',
  striped = false,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variantClasses = {
    primary: 'bg-royal-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-500',
    error: 'bg-red-600',
  };

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {label || 'Progress'}
          </span>
          {showLabel && (
            <span className="font-semibold text-gray-900 dark:text-white">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 ${sizeClasses[size]}`}
      >
        <div
          className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-full transition-all duration-500 ease-out ${
            striped
              ? 'animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:20px_100%]'
              : ''
          }`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || 'Progress'}
        />
      </div>
    </div>
  );
}

export interface CircularProgressProps {
  /**
   * Progress value (0-100)
   */
  value: number;
  /**
   * Maximum value (default: 100)
   */
  max?: number;
  /**
   * Size in pixels
   */
  size?: number;
  /**
   * Stroke width in pixels
   */
  strokeWidth?: number;
  /**
   * Show percentage in center
   */
  showLabel?: boolean;
  /**
   * Color variant
   */
  variant?: 'primary' | 'success' | 'warning' | 'error';
  /**
   * Children to render in center (overrides label)
   */
  children?: ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Circular Progress Component
 *
 * Circular visual indicator for progress or completion status.
 *
 * Features:
 * - SVG-based circular progress
 * - Multiple color variants
 * - Customizable size
 * - Optional center label
 * - Smooth animations
 * - Accessible markup
 *
 * @example
 * <CircularProgress value={75} showLabel variant="success" />
 */
export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  showLabel = false,
  variant = 'primary',
  children,
  className = '',
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    primary: '#1E63FF',
    success: '#16A34A',
    warning: '#EAB308',
    error: '#DC2626',
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      style={{ width: size, height: size }}
    >
      <svg className="-rotate-90 transform" width={size} height={size}>
        {/* Background circle */}
        <circle
          className="text-gray-200 dark:text-gray-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={variantColors[variant]}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </svg>
      {/* Center content */}
      {(showLabel || children) && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children || (
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Indeterminate Spinner Component
 *
 * Loading spinner for when progress is unknown.
 */
export function Spinner({
  size = 'md',
  variant = 'primary',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'white';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'text-royal-600',
    white: 'text-white',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[variant]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
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
  );
}
