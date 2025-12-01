/**
 * Accrual Notification Utilities
 *
 * Helper functions and hooks for managing ESTA accrual notifications.
 * Separated from components to comply with React Fast Refresh requirements.
 */

import { useState } from 'react';
import type { AccrualNotification } from './AccrualNotificationBanner.types';

// Counter for generating unique IDs within a session
let notificationCounter = 0;

/**
 * Generate a unique notification ID using counter and timestamp
 * This ensures uniqueness even when called in quick succession
 */
function generateNotificationId(type: string): string {
  notificationCounter += 1;
  return `notification-${type}-${Date.now()}-${notificationCounter}`;
}

/**
 * Helper function to create common ESTA notifications
 */
export function createESTANotification(
  type: AccrualNotification['type'],
  data?: {
    hoursAccrued?: number;
    maxHours?: number;
    daysRemaining?: number;
    carryoverHours?: number;
  }
): AccrualNotification {
  const id = generateNotificationId(type);

  switch (type) {
    case 'cap_reached':
      return {
        id,
        type,
        severity: 'warning',
        title: 'Maximum Accrual Cap Reached',
        message: `You have reached the maximum of ${data?.maxHours || 72} hours for this year. Additional hours will not accrue until you use some of your balance.`,
        dismissible: true,
      };

    case 'waiting_period':
      return {
        id,
        type,
        severity: 'info',
        title: '120-Day Waiting Period',
        message: `${data?.daysRemaining || 0} days remaining in your waiting period. You can begin using accrued sick time after this period ends.`,
        dismissible: true,
      };

    case 'carryover':
      return {
        id,
        type,
        severity: 'info',
        title: 'Annual Carryover Notice',
        message: `Up to ${data?.carryoverHours || 72} hours can carry over to the next year. Any excess will be forfeited.`,
        dismissible: true,
      };

    case 'milestone':
      return {
        id,
        type,
        severity: 'success',
        title: 'Accrual Milestone Reached',
        message: `Congratulations! You have accrued ${data?.hoursAccrued || 0} hours of sick time.`,
        dismissible: true,
        autoDismissMs: 8000,
      };

    default:
      return {
        id,
        type: 'general',
        severity: 'info',
        title: 'Notice',
        message: 'Please check your accrual status.',
        dismissible: true,
      };
  }
}

/**
 * Hook for managing accrual notifications
 */
export function useAccrualNotifications() {
  const [notifications, setNotifications] = useState<AccrualNotification[]>([]);

  const addNotification = (notification: AccrualNotification) => {
    setNotifications((prev) => {
      // Avoid duplicate notifications of the same type
      const filtered = prev.filter((n) => n.type !== notification.type);
      return [...filtered, notification];
    });
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  /**
   * Check accrual status and generate appropriate notifications
   */
  const checkAccrualStatus = (data: {
    hoursAccrued: number;
    maxHours: number;
    daysInWaitingPeriod?: number;
    isNearingCap?: boolean;
  }) => {
    // Check if cap is reached
    if (data.hoursAccrued >= data.maxHours) {
      addNotification(
        createESTANotification('cap_reached', {
          hoursAccrued: data.hoursAccrued,
          maxHours: data.maxHours,
        })
      );
    }

    // Check waiting period
    if (data.daysInWaitingPeriod && data.daysInWaitingPeriod > 0) {
      addNotification(
        createESTANotification('waiting_period', {
          daysRemaining: data.daysInWaitingPeriod,
        })
      );
    }

    // Check milestone (every 10 hours)
    if (data.hoursAccrued > 0 && data.hoursAccrued % 10 === 0) {
      addNotification(
        createESTANotification('milestone', {
          hoursAccrued: data.hoursAccrued,
        })
      );
    }
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    checkAccrualStatus,
  };
}
