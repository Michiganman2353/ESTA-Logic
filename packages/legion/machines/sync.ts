import { createMachine } from 'xstate';

/**
 * Zero-Entry Sync Machine
 *
 * Visual FSM for deadlock-free workflow orchestration.
 * Syncs with n8n bots and Helix calculations for expo scalability.
 *
 * States:
 * - idle: Waiting for PULL_HOURS event
 * - syncing: Invoking QuickBooks Playwright bot
 * - predicting: Running Helix immutable calculations
 * - approved: Final state - workflow complete
 *
 * Visualize: npx @xstate/viz > sync.svg
 */
export const syncMachine = createMachine({
  id: 'zeroEntrySync',
  initial: 'idle',
  states: {
    idle: { on: { PULL_HOURS: 'syncing' } },
    syncing: {
      invoke: { src: 'quickbooksBot', onDone: 'predicting' }, // Calls your Playwright
    },
    predicting: {
      invoke: { src: 'helixCalculate', onDone: 'approved' },
    },
    approved: { type: 'final' },
  },
});
