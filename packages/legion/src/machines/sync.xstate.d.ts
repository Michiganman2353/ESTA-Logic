/**
 * Zero Entry Machine - Original state machine for period processing
 *
 * This machine handles the period-based workflow:
 * 1. idle -> START_PERIOD -> pulling (pull hours from source)
 * 2. pulling -> onDone -> predicting (run Helix calculations)
 * 3. predicting -> onDone -> ready (final state)
 */
/**
 * Zero Entry Machine
 *
 * State machine for period-based time tracking workflow.
 * Integrates hour pulling with Helix accrual predictions.
 */
export declare const zeroEntryMachine: import('xstate').StateMachine<
  import('xstate').MachineContext,
  import('xstate').AnyEventObject,
  Record<string, import('xstate').AnyActorRef>,
  import('xstate').ProvidedActor,
  import('xstate').ParameterizedObject,
  import('xstate').ParameterizedObject,
  string,
  import('xstate').StateValue,
  string,
  unknown,
  import('xstate').NonReducibleUnknown,
  import('xstate').EventObject,
  import('xstate').MetaObject,
  any
>;
/**
 * Type definition for the zero entry machine events
 */
export type ZeroEntryMachineEvent =
  | {
      type: 'START_PERIOD';
    }
  | {
      type: 'RETRY';
    }
  | {
      type: 'xstate.done.actor.pullHours';
      output: unknown;
    }
  | {
      type: 'xstate.done.actor.runHelix';
      output: unknown;
    }
  | {
      type: 'xstate.error.actor.pullHours';
      error: unknown;
    }
  | {
      type: 'xstate.error.actor.runHelix';
      error: unknown;
    };
//# sourceMappingURL=sync.xstate.d.ts.map
