/**
 * AccrualNotificationBanner Tests
 *
 * Unit tests for the AccrualNotificationBanner component and utilities.
 * Tests accessibility features, notification behavior, and user interactions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccrualNotificationBanner } from '../AccrualNotificationBanner';
import {
  createESTANotification,
  useAccrualNotifications,
} from '../AccrualNotificationBanner.utils';
import { renderHook, act } from '@testing-library/react';

describe('AccrualNotificationBanner', () => {
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should not render when notifications array is empty', () => {
      const { container } = render(
        <AccrualNotificationBanner
          notifications={[]}
          onDismiss={mockOnDismiss}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render notifications with correct ARIA attributes', () => {
      const notifications = [
        createESTANotification('cap_reached', { maxHours: 72 }),
      ];

      render(
        <AccrualNotificationBanner
          notifications={notifications}
          onDismiss={mockOnDismiss}
        />
      );

      const region = screen.getByRole('region', {
        name: /accrual status notifications/i,
      });
      expect(region).toBeInTheDocument();

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should display notification title and message', () => {
      const notifications = [
        createESTANotification('waiting_period', { daysRemaining: 30 }),
      ];

      render(
        <AccrualNotificationBanner
          notifications={notifications}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('120-Day Waiting Period')).toBeInTheDocument();
      expect(screen.getByText(/30 days remaining/i)).toBeInTheDocument();
    });
  });

  describe('dismissible notifications', () => {
    it('should call onDismiss when dismiss button is clicked', async () => {
      const notifications = [
        createESTANotification('cap_reached', { maxHours: 72 }),
      ];

      render(
        <AccrualNotificationBanner
          notifications={notifications}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      // Wait for animation to complete
      await waitFor(
        () => {
          expect(mockOnDismiss).toHaveBeenCalledWith(notifications[0].id);
        },
        { timeout: 500 }
      );
    });

    it('should dismiss on Escape key press', async () => {
      const notifications = [
        createESTANotification('cap_reached', { maxHours: 72 }),
      ];

      render(
        <AccrualNotificationBanner
          notifications={notifications}
          onDismiss={mockOnDismiss}
        />
      );

      const alert = screen.getByRole('alert');
      fireEvent.keyDown(alert, { key: 'Escape' });

      await waitFor(
        () => {
          expect(mockOnDismiss).toHaveBeenCalled();
        },
        { timeout: 500 }
      );
    });
  });

  describe('multiple notifications', () => {
    it('should render multiple notifications', () => {
      const notifications = [
        createESTANotification('cap_reached', { maxHours: 72 }),
        createESTANotification('waiting_period', { daysRemaining: 30 }),
      ];

      render(
        <AccrualNotificationBanner
          notifications={notifications}
          onDismiss={mockOnDismiss}
        />
      );

      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(2);
    });

    it('should announce notification count to screen readers', () => {
      const notifications = [
        createESTANotification('cap_reached', { maxHours: 72 }),
        createESTANotification('waiting_period', { daysRemaining: 30 }),
      ];

      render(
        <AccrualNotificationBanner
          notifications={notifications}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('2 notifications available')).toBeInTheDocument();
    });
  });
});

describe('createESTANotification', () => {
  it('should create cap_reached notification with correct data', () => {
    const notification = createESTANotification('cap_reached', {
      maxHours: 72,
    });

    expect(notification.type).toBe('cap_reached');
    expect(notification.severity).toBe('warning');
    expect(notification.title).toBe('Maximum Accrual Cap Reached');
    expect(notification.message).toContain('72 hours');
    expect(notification.dismissible).toBe(true);
  });

  it('should create waiting_period notification with correct data', () => {
    const notification = createESTANotification('waiting_period', {
      daysRemaining: 45,
    });

    expect(notification.type).toBe('waiting_period');
    expect(notification.severity).toBe('info');
    expect(notification.title).toBe('120-Day Waiting Period');
    expect(notification.message).toContain('45 days remaining');
  });

  it('should create milestone notification with auto-dismiss', () => {
    const notification = createESTANotification('milestone', {
      hoursAccrued: 40,
    });

    expect(notification.type).toBe('milestone');
    expect(notification.severity).toBe('success');
    expect(notification.autoDismissMs).toBe(8000);
    expect(notification.message).toContain('40 hours');
  });

  it('should create carryover notification', () => {
    const notification = createESTANotification('carryover', {
      carryoverHours: 72,
    });

    expect(notification.type).toBe('carryover');
    expect(notification.message).toContain('72 hours');
  });

  it('should use default values when data is not provided', () => {
    const notification = createESTANotification('cap_reached');

    expect(notification.message).toContain('72 hours'); // Default max hours
  });

  it('should generate unique IDs with counter', () => {
    // IDs should be unique even when called immediately after each other
    // due to the counter-based approach
    const notification1 = createESTANotification('cap_reached');
    const notification2 = createESTANotification('cap_reached');

    expect(notification1.id).not.toBe(notification2.id);
    // Verify ID format includes counter
    expect(notification1.id).toMatch(/^notification-cap_reached-\d+-\d+$/);
  });
});

describe('useAccrualNotifications', () => {
  it('should start with empty notifications', () => {
    const { result } = renderHook(() => useAccrualNotifications());

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should add notification', () => {
    const { result } = renderHook(() => useAccrualNotifications());
    const notification = createESTANotification('cap_reached');

    act(() => {
      result.current.addNotification(notification);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toEqual(notification);
  });

  it('should remove notification by ID', () => {
    const { result } = renderHook(() => useAccrualNotifications());
    const notification = createESTANotification('cap_reached');

    act(() => {
      result.current.addNotification(notification);
    });

    act(() => {
      result.current.removeNotification(notification.id);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should not add duplicate notifications of the same type', () => {
    const { result } = renderHook(() => useAccrualNotifications());

    act(() => {
      result.current.addNotification(createESTANotification('cap_reached'));
      result.current.addNotification(createESTANotification('cap_reached'));
    });

    expect(result.current.notifications).toHaveLength(1);
  });

  it('should clear all notifications', () => {
    const { result } = renderHook(() => useAccrualNotifications());

    act(() => {
      result.current.addNotification(createESTANotification('cap_reached'));
      result.current.addNotification(createESTANotification('waiting_period'));
    });

    expect(result.current.notifications).toHaveLength(2);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  describe('checkAccrualStatus', () => {
    it('should add cap_reached notification when cap is reached', () => {
      const { result } = renderHook(() => useAccrualNotifications());

      act(() => {
        result.current.checkAccrualStatus({
          hoursAccrued: 72,
          maxHours: 72,
        });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].type).toBe('cap_reached');
    });

    it('should add waiting_period notification when in waiting period', () => {
      const { result } = renderHook(() => useAccrualNotifications());

      act(() => {
        result.current.checkAccrualStatus({
          hoursAccrued: 10,
          maxHours: 72,
          daysInWaitingPeriod: 60,
        });
      });

      const waitingPeriodNotification = result.current.notifications.find(
        (n) => n.type === 'waiting_period'
      );
      expect(waitingPeriodNotification).toBeDefined();
    });

    it('should add milestone notification at 10 hour intervals', () => {
      const { result } = renderHook(() => useAccrualNotifications());

      act(() => {
        result.current.checkAccrualStatus({
          hoursAccrued: 20,
          maxHours: 72,
        });
      });

      const milestoneNotification = result.current.notifications.find(
        (n) => n.type === 'milestone'
      );
      expect(milestoneNotification).toBeDefined();
    });
  });
});
