import { createMachine } from 'xstate';

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
 *
 * Visualize: npx @xstate/viz > sync.svg
 */
export const syncMachine = createMachine({
  id: 'zeroEntryExpo',
  initial: 'idle',
  states: {
    idle: { on: { START_SYNC: 'pulling' } },
    pulling: {
      invoke: { src: 'csvProcessor.pullHours', onDone: 'predicting' },
    },
    predicting: {
      invoke: { src: 'helixCalculate', onDone: 'ready' },
    },
    ready: { type: 'final' },
  },
});
