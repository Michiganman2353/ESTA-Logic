/**
 * Zero Entry Machine - Original state machine for period processing
 *
 * This machine handles the period-based workflow:
 * 1. idle -> START_PERIOD -> pulling (pull hours from source)
 * 2. pulling -> onDone -> predicting (run Helix calculations)
 * 3. predicting -> onDone -> ready (final state)
 */

import { createMachine } from 'xstate';

/**
 * Zero Entry Machine
 *
 * State machine for period-based time tracking workflow.
 * Integrates hour pulling with Helix accrual predictions.
 */
export const zeroEntryMachine = createMachine({
  id: 'zeroEntry',
  initial: 'idle',
  states: {
    /** Waiting for period start trigger */
    idle: {
      on: {
        START_PERIOD: 'pulling',
      },
    },
    /** Pulling hours from external source */
    pulling: {
      invoke: {
        src: 'pullHours',
        onDone: 'predicting',
        onError: 'error',
      },
    },
    /** Running Helix accrual calculations */
    predicting: {
      invoke: {
        src: 'runHelix',
        onDone: 'ready',
        onError: 'error',
      },
    },
    /** Workflow completed successfully */
    ready: {
      type: 'final' as const,
    },
    /** Error state for handling failures */
    error: {
      on: {
        RETRY: 'idle',
        START_PERIOD: 'pulling',
      },
    },
  },
});

/**
 * Type definition for the zero entry machine events
 */
export type ZeroEntryMachineEvent =
  | { type: 'START_PERIOD' }
  | { type: 'RETRY' }
  | { type: 'xstate.done.actor.pullHours'; output: unknown }
  | { type: 'xstate.done.actor.runHelix'; output: unknown }
  | { type: 'xstate.error.actor.pullHours'; error: unknown }
  | { type: 'xstate.error.actor.runHelix'; error: unknown };
