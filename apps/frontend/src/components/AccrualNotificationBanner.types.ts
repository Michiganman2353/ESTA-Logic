/**
 * Accrual Notification Types
 *
 * Type definitions for the accrual notification system.
 */

export type NotificationSeverity = 'info' | 'warning' | 'success' | 'error';

export interface AccrualNotification {
  id: string;
  type:
    | 'cap_reached'
    | 'waiting_period'
    | 'carryover'
    | 'milestone'
    | 'general';
  severity: NotificationSeverity;
  title: string;
  message: string;
  dismissible?: boolean;
  autoDismissMs?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface AccrualNotificationBannerProps {
  notifications: AccrualNotification[];
  onDismiss: (id: string) => void;
  className?: string;
}
