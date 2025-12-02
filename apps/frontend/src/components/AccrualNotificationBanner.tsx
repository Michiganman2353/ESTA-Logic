/**
 * AccrualNotificationBanner Component
 *
 * Real-time notification banner for ESTA accrual status updates.
 * Provides accessible notices for:
 * - Maximum accrual cap reached
 * - 120-day waiting period status
 * - Annual carryover limits
 * - Upcoming accrual milestones
 *
 * Features:
 * - WCAG 2.1 AA compliant with ARIA live regions
 * - Keyboard navigable with proper focus management
 * - Auto-dismiss with configurable duration
 * - Multiple severity levels (info, warning, success, error)
 * - Mobile-responsive design
 *
 * Uses:
 * - Tailwind CSS for styling
 * - clsx for conditional class management
 *
 * Note: Import utilities and types separately:
 * - Types: import { AccrualNotification } from './AccrualNotificationBanner.types'
 * - Utils: import { createESTANotification, useAccrualNotifications } from './AccrualNotificationBanner.utils'
 */

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type {
  AccrualNotification,
  AccrualNotificationBannerProps,
} from './AccrualNotificationBanner.types';

export function AccrualNotificationBanner({
  notifications,
  onDismiss,
  className,
}: AccrualNotificationBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (notifications.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={clsx('space-y-3', className)}
      role="region"
      aria-label="Accrual Status Notifications"
    >
      {/* Accessibility live region for screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {notifications.length > 0 && (
          <span>
            {notifications.length} notification
            {notifications.length !== 1 ? 's' : ''} available
          </span>
        )}
      </div>

      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: AccrualNotification;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(true);
  const dismissButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-dismiss timer
  useEffect(() => {
    if (notification.autoDismissMs && notification.autoDismissMs > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(notification.id), 300); // Allow exit animation
      }, notification.autoDismissMs);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [notification.autoDismissMs, notification.id, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && notification.dismissible) {
      handleDismiss();
    }
  };

  const severityConfig = {
    info: {
      container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-500',
      icon: 'text-blue-500 dark:text-blue-400',
      title: 'text-blue-800 dark:text-blue-200',
      message: 'text-blue-700 dark:text-blue-300',
    },
    warning: {
      container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500',
      icon: 'text-yellow-500 dark:text-yellow-400',
      title: 'text-yellow-800 dark:text-yellow-200',
      message: 'text-yellow-700 dark:text-yellow-300',
    },
    success: {
      container: 'bg-green-50 dark:bg-green-900/20 border-green-500',
      icon: 'text-green-500 dark:text-green-400',
      title: 'text-green-800 dark:text-green-200',
      message: 'text-green-700 dark:text-green-300',
    },
    error: {
      container: 'bg-red-50 dark:bg-red-900/20 border-red-500',
      icon: 'text-red-500 dark:text-red-400',
      title: 'text-red-800 dark:text-red-200',
      message: 'text-red-700 dark:text-red-300',
    },
  };

  const config = severityConfig[notification.severity];

  const icons = {
    info: (
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    success: (
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
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
      className={clsx(
        'rounded-lg border-l-4 p-4 shadow-sm transition-all duration-300',
        config.container,
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
      )}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start gap-3">
        <div className={clsx('flex-shrink-0', config.icon)} aria-hidden="true">
          {icons[notification.severity]}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className={clsx('text-sm font-semibold', config.title)}>
            {notification.title}
          </h3>
          <p className={clsx('mt-1 text-sm', config.message)}>
            {notification.message}
          </p>

          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className={clsx(
                'mt-3 inline-flex items-center text-sm font-medium underline underline-offset-2',
                'rounded hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2',
                config.title
              )}
            >
              {notification.action.label}
            </button>
          )}
        </div>

        {notification.dismissible && (
          <button
            ref={dismissButtonRef}
            onClick={handleDismiss}
            className={clsx(
              'flex-shrink-0 rounded-lg p-1.5 transition-colors',
              'hover:bg-black/5 dark:hover:bg-white/10',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              config.icon
            )}
            aria-label={`Dismiss ${notification.title} notification`}
          >
            <svg
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
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
