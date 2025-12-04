//// kernel/core/scheduler.gleam
////
//// ESTA Logic Microkernel Scheduler
////
//// This module implements a priority-based preemptive scheduler for the
//// ESTA Logic microkernel. It manages process execution, time slices,
//// and ensures fair CPU distribution across all processes.
////
//// Key Design Principles:
//// 1. Priority-based scheduling with aging to prevent starvation
//// 2. Preemptive scheduling for high-priority processes
//// 3. Deterministic behavior for compliance-critical operations
//// 4. Bounded latency guarantees for real-time processes
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: SCHEDULER TYPES
// ============================================================================

/// Process identifier
pub type Pid {
  Pid(id: Int)
}

/// Priority levels for process scheduling
pub type Priority {
  /// Background tasks, fully preemptible
  Idle
  /// Batch processing, preemptible
  Low
  /// Standard operations, preemptible
  Normal
  /// User-facing requests, preemptible
  High
  /// Compliance deadlines, limited preemption
  Realtime
  /// Kernel operations, non-preemptible
  System
}

/// Process state in the scheduler
pub type ProcessState {
  /// Process is ready to run
  Ready
  /// Process is currently running
  Running
  /// Process is waiting for a message
  Waiting
  /// Process is blocked on I/O
  Blocked
  /// Process has completed execution
  Completed
}

/// Time slice in milliseconds
pub type TimeSlice {
  TimeSlice(ms: Int)
}

/// Scheduler entry for a process
pub type SchedulerEntry {
  SchedulerEntry(
    pid: Pid,
    priority: Priority,
    state: ProcessState,
    time_slice_remaining: TimeSlice,
    wait_time_ms: Int,
    cpu_time_ms: Int,
  )
}

/// Scheduler state
pub type Scheduler {
  Scheduler(
    /// All processes in the system
    processes: List(SchedulerEntry),
    /// Currently running process
    current: Result(Pid, Nil),
    /// Tick counter for aging
    tick_count: Int,
    /// Configuration
    config: SchedulerConfig,
    /// Statistics
    stats: SchedulerStats,
  )
}

/// Scheduler configuration
pub type SchedulerConfig {
  SchedulerConfig(
    /// Base time slice in ms
    base_time_slice_ms: Int,
    /// Aging interval in ticks
    aging_interval_ticks: Int,
    /// Maximum wait time before priority boost (ms)
    max_wait_before_boost_ms: Int,
    /// Preemption threshold priority
    preemption_threshold: Priority,
  )
}

/// Scheduler statistics
pub type SchedulerStats {
  SchedulerStats(
    /// Total context switches
    context_switches: Int,
    /// Total processes scheduled
    total_scheduled: Int,
    /// Processes by priority
    processes_by_priority: List(#(Priority, Int)),
    /// Average wait time
    avg_wait_time_ms: Int,
  )
}

/// Scheduler decision
pub type ScheduleDecision {
  /// Run the specified process
  Run(pid: Pid, slice: TimeSlice)
  /// Preempt current process for higher priority
  Preempt(current: Pid, next: Pid)
  /// No runnable processes
  Idle
}

// ============================================================================
// SECTION 2: SCHEDULER CREATION
// ============================================================================

/// Create a new scheduler with default configuration
pub fn new() -> Scheduler {
  new_with_config(default_config())
}

/// Create a new scheduler with custom configuration
pub fn new_with_config(config: SchedulerConfig) -> Scheduler {
  Scheduler(
    processes: [],
    current: Error(Nil),
    tick_count: 0,
    config: config,
    stats: SchedulerStats(
      context_switches: 0,
      total_scheduled: 0,
      processes_by_priority: [],
      avg_wait_time_ms: 0,
    ),
  )
}

/// Default scheduler configuration
pub fn default_config() -> SchedulerConfig {
  SchedulerConfig(
    base_time_slice_ms: 25,
    aging_interval_ticks: 100,
    max_wait_before_boost_ms: 5000,
    preemption_threshold: High,
  )
}

// ============================================================================
// SECTION 3: PROCESS MANAGEMENT
// ============================================================================

/// Add a process to the scheduler
pub fn add_process(
  scheduler: Scheduler,
  pid: Pid,
  priority: Priority,
) -> Scheduler {
  let entry = SchedulerEntry(
    pid: pid,
    priority: priority,
    state: Ready,
    time_slice_remaining: priority_to_slice(priority, scheduler.config),
    wait_time_ms: 0,
    cpu_time_ms: 0,
  )
  Scheduler(..scheduler, processes: [entry, ..scheduler.processes])
}

/// Remove a process from the scheduler
pub fn remove_process(scheduler: Scheduler, pid: Pid) -> Scheduler {
  let processes = filter_out_pid(scheduler.processes, pid)
  let current = case scheduler.current {
    Ok(current_pid) if current_pid.id == pid.id -> Error(Nil)
    other -> other
  }
  Scheduler(..scheduler, processes: processes, current: current)
}

/// Update process state
pub fn set_process_state(
  scheduler: Scheduler,
  pid: Pid,
  new_state: ProcessState,
) -> Scheduler {
  let processes = update_process_state(scheduler.processes, pid, new_state)
  Scheduler(..scheduler, processes: processes)
}

// ============================================================================
// SECTION 4: SCHEDULING ALGORITHM
// ============================================================================

/// Make a scheduling decision
pub fn schedule(scheduler: Scheduler) -> #(Scheduler, ScheduleDecision) {
  // Find the highest priority ready process
  let ready_processes = filter_ready(scheduler.processes)
  
  case find_highest_priority(ready_processes) {
    Error(Nil) -> #(scheduler, Idle)
    Ok(next) -> {
      case scheduler.current {
        Error(Nil) -> {
          // No current process, just run the next one
          let new_scheduler = run_process(scheduler, next.pid)
          #(new_scheduler, Run(next.pid, next.time_slice_remaining))
        }
        Ok(current_pid) -> {
          // Check if preemption is needed
          case should_preempt(scheduler, current_pid, next) {
            True -> {
              let new_scheduler = preempt_process(scheduler, current_pid, next.pid)
              #(new_scheduler, Preempt(current_pid, next.pid))
            }
            False -> {
              // Continue running current process
              case find_process(scheduler.processes, current_pid) {
                Error(Nil) -> #(scheduler, Idle)
                Ok(current) ->
                  #(scheduler, Run(current.pid, current.time_slice_remaining))
              }
            }
          }
        }
      }
    }
  }
}

/// Tick the scheduler (called periodically)
pub fn tick(scheduler: Scheduler) -> Scheduler {
  let new_tick_count = scheduler.tick_count + 1
  
  // Update wait times for waiting processes
  let processes = update_wait_times(scheduler.processes)
  
  // Apply aging if needed
  let processes = case new_tick_count % scheduler.config.aging_interval_ticks == 0 {
    True -> apply_aging(processes, scheduler.config)
    False -> processes
  }
  
  Scheduler(..scheduler, processes: processes, tick_count: new_tick_count)
}

/// Process has yielded or completed its time slice
pub fn yield_process(scheduler: Scheduler, pid: Pid) -> Scheduler {
  let processes = update_process(scheduler.processes, pid, fn(entry) {
    SchedulerEntry(
      ..entry,
      state: Ready,
      time_slice_remaining: priority_to_slice(entry.priority, scheduler.config),
    )
  })
  
  let current = case scheduler.current {
    Ok(current_pid) if current_pid.id == pid.id -> Error(Nil)
    other -> other
  }
  
  Scheduler(
    ..scheduler,
    processes: processes,
    current: current,
    stats: SchedulerStats(
      ..scheduler.stats,
      context_switches: scheduler.stats.context_switches + 1,
    ),
  )
}

// ============================================================================
// SECTION 5: HELPER FUNCTIONS
// ============================================================================

fn priority_to_slice(priority: Priority, config: SchedulerConfig) -> TimeSlice {
  let multiplier = case priority {
    Idle -> 4
    Low -> 2
    Normal -> 1
    High -> 1
    Realtime -> 1
    System -> 0
  }
  TimeSlice(config.base_time_slice_ms * multiplier)
}

fn priority_to_int(priority: Priority) -> Int {
  case priority {
    Idle -> 0
    Low -> 1
    Normal -> 2
    High -> 3
    Realtime -> 4
    System -> 5
  }
}

fn filter_out_pid(processes: List(SchedulerEntry), pid: Pid) -> List(SchedulerEntry) {
  case processes {
    [] -> []
    [entry, ..rest] ->
      case entry.pid.id == pid.id {
        True -> filter_out_pid(rest, pid)
        False -> [entry, ..filter_out_pid(rest, pid)]
      }
  }
}

fn filter_ready(processes: List(SchedulerEntry)) -> List(SchedulerEntry) {
  case processes {
    [] -> []
    [entry, ..rest] ->
      case entry.state {
        Ready -> [entry, ..filter_ready(rest)]
        _ -> filter_ready(rest)
      }
  }
}

fn find_highest_priority(
  processes: List(SchedulerEntry),
) -> Result(SchedulerEntry, Nil) {
  case processes {
    [] -> Error(Nil)
    [first, ..rest] -> Ok(find_highest_priority_helper(rest, first))
  }
}

fn find_highest_priority_helper(
  processes: List(SchedulerEntry),
  current_best: SchedulerEntry,
) -> SchedulerEntry {
  case processes {
    [] -> current_best
    [entry, ..rest] -> {
      let best = case priority_to_int(entry.priority) > priority_to_int(current_best.priority) {
        True -> entry
        False -> current_best
      }
      find_highest_priority_helper(rest, best)
    }
  }
}

fn find_process(
  processes: List(SchedulerEntry),
  pid: Pid,
) -> Result(SchedulerEntry, Nil) {
  case processes {
    [] -> Error(Nil)
    [entry, ..rest] ->
      case entry.pid.id == pid.id {
        True -> Ok(entry)
        False -> find_process(rest, pid)
      }
  }
}

fn should_preempt(
  scheduler: Scheduler,
  current_pid: Pid,
  next: SchedulerEntry,
) -> Bool {
  case find_process(scheduler.processes, current_pid) {
    Error(Nil) -> True
    Ok(current) -> {
      let threshold = priority_to_int(scheduler.config.preemption_threshold)
      let next_priority = priority_to_int(next.priority)
      let current_priority = priority_to_int(current.priority)
      next_priority > current_priority && next_priority >= threshold
    }
  }
}

fn run_process(scheduler: Scheduler, pid: Pid) -> Scheduler {
  let processes = update_process(scheduler.processes, pid, fn(entry) {
    SchedulerEntry(..entry, state: Running, wait_time_ms: 0)
  })
  Scheduler(
    ..scheduler,
    processes: processes,
    current: Ok(pid),
    stats: SchedulerStats(
      ..scheduler.stats,
      total_scheduled: scheduler.stats.total_scheduled + 1,
    ),
  )
}

fn preempt_process(scheduler: Scheduler, current: Pid, next: Pid) -> Scheduler {
  let processes =
    scheduler.processes
    |> update_process(current, fn(entry) {
      SchedulerEntry(..entry, state: Ready)
    })
    |> update_process(next, fn(entry) {
      SchedulerEntry(..entry, state: Running, wait_time_ms: 0)
    })
  
  Scheduler(
    ..scheduler,
    processes: processes,
    current: Ok(next),
    stats: SchedulerStats(
      ..scheduler.stats,
      context_switches: scheduler.stats.context_switches + 1,
      total_scheduled: scheduler.stats.total_scheduled + 1,
    ),
  )
}

fn update_process(
  processes: List(SchedulerEntry),
  pid: Pid,
  updater: fn(SchedulerEntry) -> SchedulerEntry,
) -> List(SchedulerEntry) {
  case processes {
    [] -> []
    [entry, ..rest] ->
      case entry.pid.id == pid.id {
        True -> [updater(entry), ..rest]
        False -> [entry, ..update_process(rest, pid, updater)]
      }
  }
}

fn update_process_state(
  processes: List(SchedulerEntry),
  pid: Pid,
  new_state: ProcessState,
) -> List(SchedulerEntry) {
  update_process(processes, pid, fn(entry) {
    SchedulerEntry(..entry, state: new_state)
  })
}

fn update_wait_times(processes: List(SchedulerEntry)) -> List(SchedulerEntry) {
  case processes {
    [] -> []
    [entry, ..rest] -> {
      let new_entry = case entry.state {
        Ready -> SchedulerEntry(..entry, wait_time_ms: entry.wait_time_ms + 1)
        Waiting -> SchedulerEntry(..entry, wait_time_ms: entry.wait_time_ms + 1)
        _ -> entry
      }
      [new_entry, ..update_wait_times(rest)]
    }
  }
}

fn apply_aging(
  processes: List(SchedulerEntry),
  config: SchedulerConfig,
) -> List(SchedulerEntry) {
  case processes {
    [] -> []
    [entry, ..rest] -> {
      let new_entry = case entry.wait_time_ms > config.max_wait_before_boost_ms {
        True -> boost_priority(entry)
        False -> entry
      }
      [new_entry, ..apply_aging(rest, config)]
    }
  }
}

fn boost_priority(entry: SchedulerEntry) -> SchedulerEntry {
  let new_priority = case entry.priority {
    Idle -> Low
    Low -> Normal
    Normal -> High
    High -> High
    Realtime -> Realtime
    System -> System
  }
  SchedulerEntry(..entry, priority: new_priority, wait_time_ms: 0)
}
