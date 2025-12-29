import { ReactNode } from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';
export type AlertSize = 'sm' | 'md' | 'lg';

export interface AlertProps {
  /**
   * Alert variant determines color scheme
   */
  variant?: AlertVariant;
  /**
   * Title text (optional)
   */
  title?: string;
  /**
   * Message content
   */
  children: ReactNode;
  /**
   * Optional icon (if not provided, default variant icon is used)
   */
  icon?: ReactNode;
  /**
   * Show close button
   */
  onClose?: () => void;
  /**
   * Size variant
   */
  size?: AlertSize;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Show action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Alert Component
 *
 * Displays contextual feedback messages for user actions.
 * Follows best practices for alert UX with clear hierarchy,
 * appropriate colors, and optional actions.
 *
 * Features:
 * - Multiple variants (info, success, warning, error)
 * - Optional title and icon
 * - Dismissible with close button
 * - Action button support
 * - Accessible markup
 * - Responsive sizing
 * - Smooth animations
 *
 * @example
 * <Alert variant="success" title="Success!" onClose={handleClose}>
 *   Your changes have been saved successfully.
 * </Alert>
 */
export function Alert({
  variant = 'info',
  title,
  children,
  icon,
  onClose,
  size = 'md',
  className = '',
  action,
}: AlertProps) {
  const variantClasses = {
    info: 'alert-info',
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-error',
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const defaultIcons = {
    info: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    success: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return (
    <div
      className={`${variantClasses[variant]} ${sizeClasses[size]} animate-fade-in ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0" aria-hidden="true">
          {icon || defaultIcons[variant]}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {title && <h3 className="mb-1 text-sm font-semibold">{title}</h3>}
          <div className="text-sm">{children}</div>
          {action && (
            <button
              onClick={action.onClick}
              className="mt-3 rounded text-sm font-semibold underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2"
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2"
            aria-label="Dismiss alert"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Specialized Alert Variants
 * Pre-configured alerts for common scenarios
 */

export function SuccessAlert({
  title = 'Success!',
  children,
  onClose,
}: {
  title?: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <Alert variant="success" title={title} onClose={onClose}>
      {children}
    </Alert>
  );
}

export function ErrorAlert({
  title = 'Error',
  children,
  onClose,
  onRetry,
}: {
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  onRetry?: () => void;
}) {
  return (
    <Alert
      variant="error"
      title={title}
      onClose={onClose}
      action={onRetry ? { label: 'Try again', onClick: onRetry } : undefined}
    >
      {children}
    </Alert>
  );
}

export function WarningAlert({
  title = 'Warning',
  children,
  onClose,
}: {
  title?: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <Alert variant="warning" title={title} onClose={onClose}>
      {children}
    </Alert>
  );
}

export function InfoAlert({
  title,
  children,
  onClose,
}: {
  title?: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <Alert variant="info" title={title} onClose={onClose}>
      {children}
    </Alert>
  );
}
