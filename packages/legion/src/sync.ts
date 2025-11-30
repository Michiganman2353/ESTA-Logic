/**
 * XState Legion - Zero Entry Sync Machine
 *
 * Deadlock-free workflow state machine for expo scalability.
 * Visual FSMs that sync with n8n bots and Helix calculations.
 *
 * Workflow:
 * 1. idle -> PULL_HOURS -> syncing (calls QuickBooks Playwright bot)
 * 2. syncing -> onDone -> predicting (runs Helix calculate)
 * 3. predicting -> onDone -> approved (final state)
 *
 * Usage: npx @xstate/viz > sync.svg to visualize
 */

import { createMachine } from 'xstate';

/**
 * Zero Entry Sync Machine
 *
 * State machine for automated time tracking sync workflow.
 * Integrates QuickBooks bot data pull with Helix accrual predictions.
 */
export const syncMachine = createMachine({
  id: 'zeroEntrySync',
  initial: 'idle',
  states: {
    /** Waiting for sync trigger */
    idle: {
      on: {
        PULL_HOURS: 'syncing',
      },
    },
    /** Syncing hours from external system (QuickBooks via Playwright) */
    syncing: {
      invoke: {
        src: 'quickbooksBot', // Calls Playwright automation
        onDone: 'predicting',
        onError: 'error',
      },
    },
    /** Running Helix accrual calculations */
    predicting: {
      invoke: {
        src: 'helixCalculate', // Runs Gleam Helix Core
        onDone: 'approved',
        onError: 'error',
      },
    },
    /** Workflow completed successfully */
    approved: {
      type: 'final' as const,
    },
    /** Error state for handling failures */
    error: {
      on: {
        RETRY: 'idle',
        PULL_HOURS: 'syncing',
      },
    },
  },
});

/**
 * Type definition for the sync machine events
 */
export type SyncMachineEvent =
  | { type: 'PULL_HOURS' }
  | { type: 'RETRY' }
  | { type: 'xstate.done.actor.quickbooksBot'; output: unknown }
  | { type: 'xstate.done.actor.helixCalculate'; output: unknown }
  | { type: 'xstate.error.actor.quickbooksBot'; error: unknown }
  | { type: 'xstate.error.actor.helixCalculate'; error: unknown };

/**
 * Type definition for the sync machine context
 */
export interface SyncMachineContext {
  hours?: number;
  accrual?: {
    regular: number;
    bonus: number;
  };
  error?: string;
}
