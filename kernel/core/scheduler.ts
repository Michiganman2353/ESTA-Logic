/**
 * ESTA-Logic Microkernel Scheduler
 *
 * Implements deterministic process scheduling for the WASM-native kernel.
 * This scheduler is the kernel's conductor - ensuring fair time distribution,
 * priority handling, and backpressure management.
 *
 * @module kernel/core/scheduler
 */

// ============================================================================
// SECTION 1: TYPE DEFINITIONS
// ============================================================================

/** Process identifier */
export interface ProcessId {
  readonly value: number;
}

/** Process priority levels */
export type Priority =
  | 'idle'
  | 'low'
  | 'normal'
  | 'high'
  | 'realtime'
  | 'system';

/** Process state in the scheduler */
export type ProcessState =
  | 'ready'
  | 'running'
  | 'blocked'
  | 'suspended'
  | 'terminated';

/** Yield reason for cooperative scheduling */
export type YieldReason =
  | 'timeslice_exhausted'
  | 'waiting_for_message'
  | 'waiting_for_io'
  | 'voluntary';

/** Scheduled process entry */
export interface ScheduledProcess {
  readonly pid: ProcessId;
  readonly priority: Priority;
  readonly state: ProcessState;
  readonly timeSliceMs: number;
  readonly remainingTimeMs: number;
  readonly waitingSince?: number;
  readonly messageQueueDepth: number;
  readonly cpuTimeUsedMs: number;
}

/** Scheduler configuration */
export interface SchedulerConfig {
  /** Maximum time slice for any process (ms) */
  readonly maxTimeSliceMs: number;
  /** Minimum time slice for any process (ms) */
  readonly minTimeSliceMs: number;
  /** Maximum queue depth before backpressure */
  readonly maxQueueDepth: number;
  /** Time after which waiting processes get priority boost */
  readonly priorityBoostAfterMs: number;
  /** Whether to use round-robin within priority levels */
  readonly roundRobinWithinPriority: boolean;
}

/** Scheduler statistics */
export interface SchedulerStats {
  readonly totalProcesses: number;
  readonly readyProcesses: number;
  readonly blockedProcesses: number;
  readonly contextSwitches: number;
  readonly totalCpuTimeMs: number;
  readonly avgWaitTimeMs: number;
  readonly maxWaitTimeMs: number;
}

/** Scheduler state */
export interface SchedulerState {
  readonly config: SchedulerConfig;
  readonly processes: ReadonlyMap<number, ScheduledProcess>;
  readonly readyQueue: readonly ProcessId[];
  readonly currentProcess: ProcessId | null;
  readonly stats: SchedulerStats;
  readonly tickCount: number;
}

/** Scheduling decision */
export type SchedulingDecision =
  | { type: 'run'; pid: ProcessId; timeSliceMs: number }
  | { type: 'continue'; remainingMs: number }
  | { type: 'idle' }
  | { type: 'backpressure'; queueDepth: number };

// ============================================================================
// SECTION 2: CONFIGURATION
// ============================================================================

/** Default scheduler configuration */
export function defaultSchedulerConfig(): SchedulerConfig {
  return {
    maxTimeSliceMs: 100,
    minTimeSliceMs: 10,
    maxQueueDepth: 1000,
    priorityBoostAfterMs: 1000,
    roundRobinWithinPriority: true,
  };
}

/** Get time slice for priority level */
export function priorityToTimeSlice(
  priority: Priority,
  config: SchedulerConfig
): number {
  switch (priority) {
    case 'idle':
      return config.maxTimeSliceMs;
    case 'low':
      return Math.floor((config.maxTimeSliceMs + config.minTimeSliceMs) / 2);
    case 'normal':
      return Math.floor(config.maxTimeSliceMs * 0.6);
    case 'high':
      return Math.floor(config.maxTimeSliceMs * 0.4);
    case 'realtime':
      return config.minTimeSliceMs;
    case 'system':
      return 0; // System priority runs to completion
  }
}

/** Convert priority to numeric value for comparison */
export function priorityToNumber(priority: Priority): number {
  switch (priority) {
    case 'idle':
      return 0;
    case 'low':
      return 1;
    case 'normal':
      return 2;
    case 'high':
      return 3;
    case 'realtime':
      return 4;
    case 'system':
      return 5;
  }
}

// ============================================================================
// SECTION 3: SCHEDULER OPERATIONS
// ============================================================================

/** Create initial scheduler state */
export function createScheduler(
  config: SchedulerConfig = defaultSchedulerConfig()
): SchedulerState {
  return {
    config,
    processes: new Map(),
    readyQueue: [],
    currentProcess: null,
    stats: {
      totalProcesses: 0,
      readyProcesses: 0,
      blockedProcesses: 0,
      contextSwitches: 0,
      totalCpuTimeMs: 0,
      avgWaitTimeMs: 0,
      maxWaitTimeMs: 0,
    },
    tickCount: 0,
  };
}

/** Add a process to the scheduler */
export function addProcess(
  state: SchedulerState,
  pid: ProcessId,
  priority: Priority
): SchedulerState {
  const timeSlice = priorityToTimeSlice(priority, state.config);

  const process: ScheduledProcess = {
    pid,
    priority,
    state: 'ready',
    timeSliceMs: timeSlice,
    remainingTimeMs: timeSlice,
    messageQueueDepth: 0,
    cpuTimeUsedMs: 0,
  };

  const newProcesses = new Map(state.processes);
  newProcesses.set(pid.value, process);

  const newReadyQueue = insertByPriority(
    [...state.readyQueue],
    pid,
    priority,
    state.processes
  );

  return {
    ...state,
    processes: newProcesses,
    readyQueue: newReadyQueue,
    stats: {
      ...state.stats,
      totalProcesses: state.stats.totalProcesses + 1,
      readyProcesses: state.stats.readyProcesses + 1,
    },
  };
}

/** Remove a process from the scheduler */
export function removeProcess(
  state: SchedulerState,
  pid: ProcessId
): SchedulerState {
  const process = state.processes.get(pid.value);
  if (!process) return state;

  const newProcesses = new Map(state.processes);
  newProcesses.delete(pid.value);

  const newReadyQueue = state.readyQueue.filter((p) => p.value !== pid.value);

  const newCurrentProcess =
    state.currentProcess?.value === pid.value ? null : state.currentProcess;

  return {
    ...state,
    processes: newProcesses,
    readyQueue: newReadyQueue,
    currentProcess: newCurrentProcess,
    stats: {
      ...state.stats,
      totalProcesses: state.stats.totalProcesses - 1,
      readyProcesses:
        process.state === 'ready'
          ? state.stats.readyProcesses - 1
          : state.stats.readyProcesses,
      blockedProcesses:
        process.state === 'blocked'
          ? state.stats.blockedProcesses - 1
          : state.stats.blockedProcesses,
    },
  };
}

/** Block a process (e.g., waiting for I/O or message) */
export function blockProcess(
  state: SchedulerState,
  pid: ProcessId,
  now: number
): SchedulerState {
  const process = state.processes.get(pid.value);
  if (!process || process.state !== 'running') return state;

  const blockedProcess: ScheduledProcess = {
    ...process,
    state: 'blocked',
    waitingSince: now,
  };

  const newProcesses = new Map(state.processes);
  newProcesses.set(pid.value, blockedProcess);

  return {
    ...state,
    processes: newProcesses,
    currentProcess: null,
    stats: {
      ...state.stats,
      readyProcesses: state.stats.readyProcesses,
      blockedProcesses: state.stats.blockedProcesses + 1,
    },
  };
}

/** Unblock a process (e.g., message received, I/O complete) */
export function unblockProcess(
  state: SchedulerState,
  pid: ProcessId,
  now: number
): SchedulerState {
  const process = state.processes.get(pid.value);
  if (!process || process.state !== 'blocked') return state;

  const waitTime = process.waitingSince ? now - process.waitingSince : 0;

  // Calculate effective priority with anti-starvation boost
  const boostedPriority =
    waitTime >= state.config.priorityBoostAfterMs
      ? boostPriority(process.priority)
      : process.priority;

  const unblockedProcess: ScheduledProcess = {
    ...process,
    state: 'ready',
    priority: boostedPriority,
    remainingTimeMs: priorityToTimeSlice(boostedPriority, state.config),
    waitingSince: undefined,
  };

  const newProcesses = new Map(state.processes);
  newProcesses.set(pid.value, unblockedProcess);

  const newReadyQueue = insertByPriority(
    [...state.readyQueue],
    pid,
    boostedPriority,
    newProcesses
  );

  return {
    ...state,
    processes: newProcesses,
    readyQueue: newReadyQueue,
    stats: {
      ...state.stats,
      readyProcesses: state.stats.readyProcesses + 1,
      blockedProcesses: state.stats.blockedProcesses - 1,
      maxWaitTimeMs: Math.max(state.stats.maxWaitTimeMs, waitTime),
    },
  };
}

/** Yield the current process */
export function yieldProcess(
  state: SchedulerState,
  _reason: YieldReason
): SchedulerState {
  if (!state.currentProcess) return state;

  const process = state.processes.get(state.currentProcess.value);
  if (!process) return state;

  const yieldedProcess: ScheduledProcess = {
    ...process,
    state: 'ready',
    remainingTimeMs: priorityToTimeSlice(process.priority, state.config),
  };

  const newProcesses = new Map(state.processes);
  newProcesses.set(state.currentProcess.value, yieldedProcess);

  // Re-add to ready queue (at end of same priority level if round-robin)
  const newReadyQueue = insertByPriority(
    [...state.readyQueue],
    state.currentProcess,
    process.priority,
    newProcesses,
    state.config.roundRobinWithinPriority
  );

  return {
    ...state,
    processes: newProcesses,
    readyQueue: newReadyQueue,
    currentProcess: null,
  };
}

// ============================================================================
// SECTION 4: SCHEDULING DECISION
// ============================================================================

/** Make a scheduling decision */
export function schedule(state: SchedulerState): SchedulingDecision {
  // Check for backpressure
  const totalQueueDepth = Array.from(state.processes.values()).reduce(
    (sum, p) => sum + p.messageQueueDepth,
    0
  );

  if (totalQueueDepth > state.config.maxQueueDepth) {
    return { type: 'backpressure', queueDepth: totalQueueDepth };
  }

  // If current process has remaining time, continue
  if (state.currentProcess) {
    const current = state.processes.get(state.currentProcess.value);
    if (current && current.state === 'running' && current.remainingTimeMs > 0) {
      return { type: 'continue', remainingMs: current.remainingTimeMs };
    }
  }

  // Select next process from ready queue
  if (state.readyQueue.length === 0) {
    return { type: 'idle' };
  }

  const nextPid = state.readyQueue[0];
  if (!nextPid) {
    return { type: 'idle' };
  }

  const nextProcess = state.processes.get(nextPid.value);

  if (!nextProcess) {
    return { type: 'idle' };
  }

  return {
    type: 'run',
    pid: nextPid,
    timeSliceMs: nextProcess.remainingTimeMs,
  };
}

/** Execute the scheduling decision - transition to running */
export function executeSchedule(
  state: SchedulerState,
  decision: SchedulingDecision
): SchedulerState {
  if (decision.type !== 'run') return state;

  const process = state.processes.get(decision.pid.value);
  if (!process) return state;

  const runningProcess: ScheduledProcess = {
    ...process,
    state: 'running',
  };

  const newProcesses = new Map(state.processes);
  newProcesses.set(decision.pid.value, runningProcess);

  const newReadyQueue = state.readyQueue.filter(
    (p) => p.value !== decision.pid.value
  );

  return {
    ...state,
    processes: newProcesses,
    readyQueue: newReadyQueue,
    currentProcess: decision.pid,
    stats: {
      ...state.stats,
      contextSwitches: state.stats.contextSwitches + 1,
      readyProcesses: state.stats.readyProcesses - 1,
    },
  };
}

/** Consume time from current process */
export function consumeTime(
  state: SchedulerState,
  elapsedMs: number
): SchedulerState {
  if (!state.currentProcess) return state;

  const process = state.processes.get(state.currentProcess.value);
  if (!process || process.state !== 'running') return state;

  const newRemainingTime = Math.max(0, process.remainingTimeMs - elapsedMs);

  const updatedProcess: ScheduledProcess = {
    ...process,
    remainingTimeMs: newRemainingTime,
    cpuTimeUsedMs: process.cpuTimeUsedMs + elapsedMs,
  };

  const newProcesses = new Map(state.processes);
  newProcesses.set(state.currentProcess.value, updatedProcess);

  return {
    ...state,
    processes: newProcesses,
    stats: {
      ...state.stats,
      totalCpuTimeMs: state.stats.totalCpuTimeMs + elapsedMs,
    },
    tickCount: state.tickCount + 1,
  };
}

/** Update message queue depth for a process */
export function updateQueueDepth(
  state: SchedulerState,
  pid: ProcessId,
  depth: number
): SchedulerState {
  const process = state.processes.get(pid.value);
  if (!process) return state;

  const updatedProcess: ScheduledProcess = {
    ...process,
    messageQueueDepth: depth,
  };

  const newProcesses = new Map(state.processes);
  newProcesses.set(pid.value, updatedProcess);

  return {
    ...state,
    processes: newProcesses,
  };
}

// ============================================================================
// SECTION 5: HELPER FUNCTIONS
// ============================================================================

/** Boost priority by one level (anti-starvation) */
function boostPriority(priority: Priority): Priority {
  switch (priority) {
    case 'idle':
      return 'low';
    case 'low':
      return 'normal';
    case 'normal':
      return 'high';
    case 'high':
      return 'realtime';
    case 'realtime':
    case 'system':
      return priority; // Already at max
  }
}

/** Insert process into ready queue by priority */
function insertByPriority(
  queue: ProcessId[],
  pid: ProcessId,
  priority: Priority,
  processes: ReadonlyMap<number, ScheduledProcess>,
  atEnd: boolean = false
): ProcessId[] {
  const priorityNum = priorityToNumber(priority);

  if (atEnd) {
    // Find the last process with same or higher priority
    let insertIndex = queue.length;
    for (let i = queue.length - 1; i >= 0; i--) {
      const queueItem = queue[i];
      if (!queueItem) continue;
      const proc = processes.get(queueItem.value);
      if (proc && priorityToNumber(proc.priority) >= priorityNum) {
        insertIndex = i + 1;
        break;
      }
    }
    queue.splice(insertIndex, 0, pid);
  } else {
    // Find the first process with lower priority
    let insertIndex = queue.length;
    for (let i = 0; i < queue.length; i++) {
      const queueItem = queue[i];
      if (!queueItem) continue;
      const proc = processes.get(queueItem.value);
      if (proc && priorityToNumber(proc.priority) < priorityNum) {
        insertIndex = i;
        break;
      }
    }
    queue.splice(insertIndex, 0, pid);
  }

  return queue;
}

/** Get scheduler statistics summary */
export function getSchedulerSummary(state: SchedulerState): SchedulerStats {
  const readyCount = state.readyQueue.length;
  const blockedCount = Array.from(state.processes.values()).filter(
    (p) => p.state === 'blocked'
  ).length;

  return {
    ...state.stats,
    readyProcesses: readyCount,
    blockedProcesses: blockedCount,
  };
}

/** Check if scheduler is in backpressure state */
export function isBackpressured(state: SchedulerState): boolean {
  const totalQueueDepth = Array.from(state.processes.values()).reduce(
    (sum, p) => sum + p.messageQueueDepth,
    0
  );
  return totalQueueDepth > state.config.maxQueueDepth;
}
