import { ReactNode } from 'react';

export interface EmptyStateProps {
  /**
   * Icon to display (SVG element)
   */
  icon?: ReactNode;
  /**
   * Title text
   */
  title: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Primary action button
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  /**
   * Secondary action button or link
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Optional illustration URL
   */
  illustration?: string;
}

/**
 * Empty State Component
 *
 * A reusable component for displaying empty states across the application.
 * Follows best practices from Nielsen Norman Group for empty state UX.
 *
 * Features:
 * - Clear messaging about why content is missing
 * - Actionable next steps
 * - Visual interest with icons or illustrations
 * - Responsive sizing
 * - Accessibility compliant
 * - Consistent styling
 *
 * @example
 * <EmptyState
 *   title="No employees yet"
 *   description="Add your first employee to start tracking sick time"
 *   icon={<UserIcon />}
 *   action={{ label: "Add Employee", onClick: handleAdd }}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  illustration,
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
  };

  const iconSizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  return (
    <div className={`empty-state ${sizeClasses[size]}`}>
      {/* Icon or Illustration */}
      {illustration ? (
        <img
          src={illustration}
          alt=""
          className={`mb-6 ${size === 'sm' ? 'w-32' : size === 'md' ? 'w-48' : 'w-64'}`}
          aria-hidden="true"
        />
      ) : icon ? (
        <div
          className={`empty-state-icon ${iconSizeClasses[size]} mb-6`}
          aria-hidden="true"
        >
          {icon}
        </div>
      ) : (
        <div
          className={`${iconSizeClasses[size]} mb-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800`}
          aria-hidden="true"
        >
          <svg
            className={`${size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-8 w-8' : 'h-10 w-10'} text-gray-400 dark:text-gray-500`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
      )}

      {/* Title */}
      <h3 className="empty-state-title">{title}</h3>

      {/* Description */}
      {description && <p className="empty-state-description">{description}</p>}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {action && (
            <button
              onClick={action.onClick}
              className={`btn ${action.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'}`}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button onClick={secondaryAction.onClick} className="btn btn-ghost">
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Common Empty State Variants
 * Pre-configured empty states for common scenarios
 */

export function NoDataEmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      title="No data available"
      description="There's no data to display at the moment. This might be because you haven't added any information yet."
      action={onRefresh ? { label: 'Refresh', onClick: onRefresh } : undefined}
    />
  );
}

export function NoResultsEmptyState({
  onClearFilters,
}: {
  onClearFilters?: () => void;
}) {
  return (
    <EmptyState
      icon={
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      title="No results found"
      description="We couldn't find anything matching your search. Try adjusting your filters or search terms."
      action={
        onClearFilters
          ? {
              label: 'Clear filters',
              onClick: onClearFilters,
              variant: 'secondary',
            }
          : undefined
      }
    />
  );
}

export function ErrorEmptyState({
  onRetry,
  message,
}: {
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <EmptyState
      icon={
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      }
      title="Something went wrong"
      description={
        message ||
        "We're having trouble loading this content. Please try again."
      }
      action={onRetry ? { label: 'Try again', onClick: onRetry } : undefined}
    />
  );
}
