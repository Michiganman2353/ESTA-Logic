/**
 * LoadingSpinner Component
 *
 * A versatile loading spinner component with multiple variants and sizes.
 * Provides consistent loading feedback across the ESTA Tracker application.
 *
 * Features:
 * - Multiple spinner variants (circular, dots, pulse, bars)
 * - Size options (xs, sm, md, lg, xl)
 * - Color customization
 * - Optional loading text
 * - Centered or inline display
 * - Accessible with ARIA labels
 * - Smooth animations
 *
 * Uses:
 * - Tailwind CSS for styling and animations
 * - SVG for smooth, scalable graphics
 *
 * Best Practices:
 * - Use appropriate size for context
 * - Include descriptive text for better UX
 * - Use aria-label for accessibility
 */

import clsx from 'clsx';

export interface LoadingSpinnerProps {
  /** Spinner style variant */
  variant?: 'circular' | 'dots' | 'pulse' | 'bars';
  /** Size of the spinner */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Optional text to display below spinner */
  text?: string;
  /** Center spinner in container */
  centered?: boolean;
  /** Custom color (overrides default) */
  color?: string;
  /** Custom className for additional styling */
  className?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

export function LoadingSpinner({
  variant = 'circular',
  size = 'md',
  text,
  centered = false,
  color,
  className,
  ariaLabel = 'Loading',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const containerClasses = clsx(
    'flex flex-col items-center gap-2',
    centered && 'justify-center min-h-[200px]',
    className
  );

  const colorClass = color || 'text-royal-500';

  const renderSpinner = () => {
    switch (variant) {
      case 'circular':
        return (
          <svg
            className={clsx('animate-spin', sizeClasses[size], colorClass)}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            role="status"
            aria-label={ariaLabel}
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

      case 'dots':
        return (
          <div
            className={clsx('flex gap-1', sizeClasses[size])}
            role="status"
            aria-label={ariaLabel}
          >
            <div
              className={clsx(
                'h-2 w-2 animate-bounce rounded-full',
                colorClass,
                'bg-current'
              )}
              style={{ animationDelay: '0ms' }}
            />
            <div
              className={clsx(
                'h-2 w-2 animate-bounce rounded-full',
                colorClass,
                'bg-current'
              )}
              style={{ animationDelay: '150ms' }}
            />
            <div
              className={clsx(
                'h-2 w-2 animate-bounce rounded-full',
                colorClass,
                'bg-current'
              )}
              style={{ animationDelay: '300ms' }}
            />
          </div>
        );

      case 'pulse':
        return (
          <div
            className={clsx(
              'animate-pulse rounded-full',
              sizeClasses[size],
              colorClass,
              'bg-current opacity-75'
            )}
            role="status"
            aria-label={ariaLabel}
          />
        );

      case 'bars':
        return (
          <div
            className={clsx('flex items-end gap-1', sizeClasses[size])}
            role="status"
            aria-label={ariaLabel}
          >
            <div
              className={clsx(
                'h-full w-1 animate-pulse',
                colorClass,
                'bg-current'
              )}
              style={{ animationDelay: '0ms' }}
            />
            <div
              className={clsx(
                'h-3/4 w-1 animate-pulse',
                colorClass,
                'bg-current'
              )}
              style={{ animationDelay: '150ms' }}
            />
            <div
              className={clsx(
                'h-1/2 w-1 animate-pulse',
                colorClass,
                'bg-current'
              )}
              style={{ animationDelay: '300ms' }}
            />
            <div
              className={clsx(
                'h-3/4 w-1 animate-pulse',
                colorClass,
                'bg-current'
              )}
              style={{ animationDelay: '450ms' }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={containerClasses}>
      {renderSpinner()}
      {text && (
        <p
          className={clsx(
            'font-medium text-gray-600 dark:text-gray-400',
            textSizeClasses[size]
          )}
        >
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * PageLoader Component
 *
 * Full-page loading overlay for page transitions and initial loads.
 * Provides a professional loading experience with backdrop and spinner.
 */
export interface PageLoaderProps {
  /** Loading message to display */
  message?: string;
  /** Additional message or hint */
  hint?: string;
  /** Show overlay backdrop */
  overlay?: boolean;
}

export function PageLoader({
  message = 'Loading',
  hint,
  overlay = true,
}: PageLoaderProps) {
  return (
    <div
      className={clsx(
        'flex min-h-screen items-center justify-center',
        overlay
          ? 'from-royal-50/90 dark:from-navy-900/90 dark:via-navy-800/90 fixed inset-0 z-50 bg-gradient-to-br via-sky-50/90 to-white/90 backdrop-blur-sm dark:to-gray-900/90'
          : 'gradient-bg'
      )}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="animate-fade-in space-y-6 text-center">
        {/* Branded Logo Loader */}
        <div className="relative inline-block">
          <div className="blue-glow animate-glow absolute inset-0 rounded-full"></div>
          <img
            src="/logo-icon.svg"
            alt="ESTA Tracker"
            className="relative z-10 h-24 w-24 animate-pulse"
          />
        </div>
        <div>
          <div className="gradient-header animate-slide-up mb-2 text-2xl font-bold">
            {message}
          </div>
          {hint && (
            <p
              className="animate-slide-up text-sm text-gray-600 dark:text-gray-400"
              style={{ animationDelay: '0.1s' }}
            >
              {hint}
            </p>
          )}
        </div>
        {/* Loading bar */}
        <div className="mx-auto h-1 w-64 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="from-royal-500 animate-shimmer h-full bg-gradient-to-r to-sky-400"
            style={{ width: '40%' }}
          ></div>
        </div>
      </div>
    </div>
  );
}

/**
 * InlineLoader Component
 *
 * Compact inline loader for data-fetch boundaries and button loading states.
 * Minimal footprint, perfect for inline use.
 */
export interface InlineLoaderProps {
  /** Optional text to display */
  text?: string;
  /** Size of the inline loader */
  size?: 'xs' | 'sm' | 'md';
  /** Variant of the spinner */
  variant?: 'circular' | 'dots';
}

export function InlineLoader({
  text,
  size = 'sm',
  variant = 'circular',
}: InlineLoaderProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <LoadingSpinner variant={variant} size={size} />
      {text && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
      )}
    </span>
  );
}
