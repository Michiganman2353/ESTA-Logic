import { createMachine, assign } from 'xstate';

/**
 * Sync Machine Context
 * Holds retry counts, error info, and sync metadata
 */
export interface SyncContext {
  retryCount: number;
  maxRetries: number;
  errorMessage: string | null;
  lastSyncAttempt: number | null;
  isOffline: boolean;
}

/**
 * Sync Machine Events
 */
export type SyncEvent =
  | { type: 'START_SYNC' }
  | { type: 'RETRY' }
  | { type: 'CANCEL' }
  | { type: 'RESET' }
  | { type: 'GO_OFFLINE' }
  | { type: 'GO_ONLINE' };

/**
 * Zero-Entry Expo Sync Machine
 *
 * Visual FSM for deadlock-free workflow orchestration.
 * Syncs with n8n/Playwright bots and Helix immutable calculations.
 *
 * States:
 * - idle: Waiting for START_SYNC event
 * - pulling: Invoking CSV processor to pull hours
 * - predicting: Running Helix accrual calculations
 * - ready: Final state - prediction complete
 * - error: Error state with retry capability
 * - offline: Offline state, waiting for connectivity
 * - retrying: Transient state for retry attempts
 *
 * Features:
 * - Error handling with configurable retry limits
 * - Offline detection and recovery
 * - Graceful degradation
 * - WCAG 2.1 AA compliant state notifications
 *
 * Visualize: npx @xstate/viz > sync.svg
 */
export const syncMachine = createMachine(
  {
    id: 'zeroEntryExpo',
    initial: 'idle',
    context: {
      retryCount: 0,
      maxRetries: 3,
      errorMessage: null,
      lastSyncAttempt: null,
      isOffline: false,
    } as SyncContext,
    states: {
      idle: {
        on: {
          START_SYNC: {
            target: 'pulling',
            actions: assign({
              lastSyncAttempt: () => Date.now(),
              errorMessage: null,
            }),
          },
          GO_OFFLINE: 'offline',
        },
      },
      pulling: {
        invoke: {
          src: 'csvProcessor.pullHours',
          onDone: {
            target: 'predicting',
            actions: assign({
              retryCount: 0,
              errorMessage: null,
            }),
          },
          onError: {
            target: 'error',
            actions: assign({
              errorMessage: (_context, event) => {
                const error = event as { data?: { message?: string } };
                return error.data?.message || 'Failed to pull hours data';
              },
            }),
          },
        },
        on: {
          CANCEL: 'idle',
          GO_OFFLINE: 'offline',
        },
      },
      predicting: {
        invoke: {
          src: 'helixCalculate',
          onDone: {
            target: 'ready',
            actions: assign({
              retryCount: 0,
              errorMessage: null,
            }),
          },
          onError: {
            target: 'error',
            actions: assign({
              errorMessage: (_context, event) => {
                const error = event as { data?: { message?: string } };
                return error.data?.message || 'Failed to calculate accrual';
              },
            }),
          },
        },
        on: {
          CANCEL: 'idle',
          GO_OFFLINE: 'offline',
        },
      },
      error: {
        on: {
          RETRY: [
            {
              target: 'retrying',
              guard: ({ context }) => context.retryCount < context.maxRetries,
              actions: assign({
                retryCount: ({ context }) => context.retryCount + 1,
              }),
            },
            {
              target: 'error',
              // Stay in error state if max retries exceeded
            },
          ],
          RESET: {
            target: 'idle',
            actions: assign({
              retryCount: 0,
              errorMessage: null,
            }),
          },
          GO_OFFLINE: 'offline',
        },
      },
      retrying: {
        after: {
          // Exponential backoff: 1s, 2s, 4s
          RETRY_DELAY: {
            target: 'pulling',
          },
        },
        on: {
          CANCEL: 'idle',
        },
      },
      offline: {
        entry: assign({
          isOffline: true,
        }),
        exit: assign({
          isOffline: false,
        }),
        on: {
          GO_ONLINE: {
            target: 'idle',
            actions: assign({
              errorMessage: null,
            }),
          },
        },
      },
      ready: {
        type: 'final' as const,
        entry: assign({
          retryCount: 0,
          errorMessage: null,
        }),
      },
    },
  },
  {
    delays: {
      RETRY_DELAY: ({ context }) => Math.pow(2, context.retryCount) * 1000,
    },
  }
);

/**
 * Get human-readable status for accessibility announcements
 * @param state - Current machine state
 * @param context - Current machine context
 * @returns Accessibility-friendly status string
 */
export function getSyncStatusAnnouncement(
  state: string,
  context: SyncContext
): string {
  switch (state) {
    case 'idle':
      return 'Sync ready. Press start to begin synchronization.';
    case 'pulling':
      return 'Syncing hours data. Please wait.';
    case 'predicting':
      return 'Calculating accrual. Almost complete.';
    case 'ready':
      return 'Synchronization complete. Data is up to date.';
    case 'error':
      if (context.retryCount >= context.maxRetries) {
        return `Synchronization failed after ${context.maxRetries} attempts. ${context.errorMessage || 'Please try again later.'}`;
      }
      return `Synchronization error. ${context.errorMessage || 'Retrying...'} Attempt ${context.retryCount} of ${context.maxRetries}.`;
    case 'retrying':
      return `Retrying synchronization. Attempt ${context.retryCount} of ${context.maxRetries}.`;
    case 'offline':
      return 'You are offline. Synchronization will resume when connection is restored.';
    default:
      return 'Unknown sync status.';
  }
}
