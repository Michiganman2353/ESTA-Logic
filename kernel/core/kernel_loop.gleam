//// kernel/core/kernel_loop.gleam
////
//// ESTA Logic Microkernel Main Event Loop
////
//// This module implements the main event loop for the ESTA Logic microkernel.
//// It coordinates all kernel subsystems and handles the core dispatch cycle.
////
//// Key Design Principles:
//// 1. Single-threaded event loop for determinism
//// 2. Bounded execution time per iteration
//// 3. Priority-based event dispatch
//// 4. Graceful shutdown handling
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: KERNEL STATE TYPES
// ============================================================================

/// Kernel state enumeration
pub type KernelState {
  /// Kernel is initializing
  Initializing
  /// Kernel is running normally
  Running
  /// Kernel is pausing for maintenance
  Pausing
  /// Kernel is shutting down
  ShuttingDown
  /// Kernel has stopped
  Stopped
}

/// Kernel event types
pub type KernelEvent {
  /// Timer tick event
  Tick(timestamp_ns: Int)
  /// Process spawned
  ProcessSpawned(pid: Int)
  /// Process exited
  ProcessExited(pid: Int, exit_code: Int)
  /// Message received
  MessageReceived(from: Int, to: Int, payload_size: Int)
  /// Syscall requested
  SyscallRequested(pid: Int, syscall_id: Int)
  /// Driver event
  DriverEvent(driver_id: Int, event_type: String)
  /// Shutdown requested
  ShutdownRequested(reason: String)
  /// Configuration changed
  ConfigChanged(key: String)
}

/// Kernel statistics
pub type KernelStats {
  KernelStats(
    /// Total ticks processed
    total_ticks: Int,
    /// Total events processed
    total_events: Int,
    /// Total syscalls processed
    total_syscalls: Int,
    /// Total messages routed
    total_messages: Int,
    /// Uptime in nanoseconds
    uptime_ns: Int,
    /// Last tick duration in nanoseconds
    last_tick_duration_ns: Int,
    /// Average tick duration in nanoseconds
    avg_tick_duration_ns: Int,
  )
}

/// Kernel configuration
pub type KernelConfig {
  KernelConfig(
    /// Tick interval in nanoseconds
    tick_interval_ns: Int,
    /// Maximum events per tick
    max_events_per_tick: Int,
    /// Shutdown timeout in nanoseconds
    shutdown_timeout_ns: Int,
    /// Enable debug mode
    debug_mode: Bool,
  )
}

/// Kernel loop state
pub type KernelLoop {
  KernelLoop(
    state: KernelState,
    event_queue: List(KernelEvent),
    stats: KernelStats,
    config: KernelConfig,
    start_time_ns: Int,
    last_tick_ns: Int,
  )
}

/// Tick result
pub type TickResult {
  /// Continue running
  Continue(loop: KernelLoop)
  /// Kernel should stop
  Stop(loop: KernelLoop, reason: String)
}

// ============================================================================
// SECTION 2: KERNEL CREATION
// ============================================================================

/// Create a new kernel loop
pub fn new(start_time_ns: Int) -> KernelLoop {
  new_with_config(start_time_ns, default_config())
}

/// Create a kernel loop with custom configuration
pub fn new_with_config(start_time_ns: Int, config: KernelConfig) -> KernelLoop {
  KernelLoop(
    state: Initializing,
    event_queue: [],
    stats: KernelStats(
      total_ticks: 0,
      total_events: 0,
      total_syscalls: 0,
      total_messages: 0,
      uptime_ns: 0,
      last_tick_duration_ns: 0,
      avg_tick_duration_ns: 0,
    ),
    config: config,
    start_time_ns: start_time_ns,
    last_tick_ns: start_time_ns,
  )
}

/// Default kernel configuration
pub fn default_config() -> KernelConfig {
  KernelConfig(
    tick_interval_ns: 1_000_000,
    max_events_per_tick: 100,
    shutdown_timeout_ns: 5_000_000_000,
    debug_mode: False,
  )
}

// ============================================================================
// SECTION 3: STATE TRANSITIONS
// ============================================================================

/// Start the kernel
pub fn start(loop: KernelLoop) -> KernelLoop {
  KernelLoop(..loop, state: Running)
}

/// Pause the kernel
pub fn pause(loop: KernelLoop) -> KernelLoop {
  case loop.state {
    Running -> KernelLoop(..loop, state: Pausing)
    _ -> loop
  }
}

/// Resume the kernel
pub fn resume(loop: KernelLoop) -> KernelLoop {
  case loop.state {
    Pausing -> KernelLoop(..loop, state: Running)
    _ -> loop
  }
}

/// Request shutdown
pub fn request_shutdown(loop: KernelLoop, reason: String) -> KernelLoop {
  let event = ShutdownRequested(reason)
  enqueue_event(KernelLoop(..loop, state: ShuttingDown), event)
}

/// Check if kernel is running
pub fn is_running(loop: KernelLoop) -> Bool {
  case loop.state {
    Running -> True
    _ -> False
  }
}

/// Check if kernel is stopped
pub fn is_stopped(loop: KernelLoop) -> Bool {
  case loop.state {
    Stopped -> True
    _ -> False
  }
}

// ============================================================================
// SECTION 4: EVENT HANDLING
// ============================================================================

/// Enqueue an event
pub fn enqueue_event(loop: KernelLoop, event: KernelEvent) -> KernelLoop {
  KernelLoop(..loop, event_queue: append_event(loop.event_queue, event))
}

/// Enqueue multiple events
pub fn enqueue_events(loop: KernelLoop, events: List(KernelEvent)) -> KernelLoop {
  case events {
    [] -> loop
    [event, ..rest] -> enqueue_events(enqueue_event(loop, event), rest)
  }
}

/// Process a single tick
pub fn tick(loop: KernelLoop, current_time_ns: Int) -> TickResult {
  case loop.state {
    Stopped -> Stop(loop, "Kernel is stopped")
    Initializing -> Continue(loop)
    Pausing -> Continue(loop)
    ShuttingDown -> process_shutdown_tick(loop, current_time_ns)
    Running -> process_running_tick(loop, current_time_ns)
  }
}

/// Get pending event count
pub fn pending_event_count(loop: KernelLoop) -> Int {
  list_length(loop.event_queue)
}

/// Clear all pending events
pub fn clear_events(loop: KernelLoop) -> KernelLoop {
  KernelLoop(..loop, event_queue: [])
}

// ============================================================================
// SECTION 5: TICK PROCESSING
// ============================================================================

fn process_running_tick(loop: KernelLoop, current_time_ns: Int) -> TickResult {
  let tick_start = current_time_ns
  
  // Add tick event
  let loop = enqueue_event(loop, Tick(current_time_ns))
  
  // Process events up to limit
  let #(loop, processed) = process_events(loop, loop.config.max_events_per_tick)
  
  // Update statistics
  let tick_duration = current_time_ns - tick_start
  let uptime = current_time_ns - loop.start_time_ns
  let new_total_ticks = loop.stats.total_ticks + 1
  let new_avg = case new_total_ticks {
    1 -> tick_duration
    n -> { loop.stats.avg_tick_duration_ns * { n - 1 } + tick_duration } / n
  }
  
  let new_stats = KernelStats(
    ..loop.stats,
    total_ticks: new_total_ticks,
    total_events: loop.stats.total_events + processed,
    uptime_ns: uptime,
    last_tick_duration_ns: tick_duration,
    avg_tick_duration_ns: new_avg,
  )
  
  let loop = KernelLoop(
    ..loop,
    stats: new_stats,
    last_tick_ns: current_time_ns,
  )
  
  Continue(loop)
}

fn process_shutdown_tick(loop: KernelLoop, current_time_ns: Int) -> TickResult {
  // Check if shutdown timeout has elapsed
  let elapsed = current_time_ns - loop.last_tick_ns
  case elapsed > loop.config.shutdown_timeout_ns {
    True -> {
      let loop = KernelLoop(..loop, state: Stopped)
      Stop(loop, "Shutdown timeout")
    }
    False -> {
      // Process remaining events
      let #(loop, _) = process_events(loop, loop.config.max_events_per_tick)
      case loop.event_queue {
        [] -> {
          let loop = KernelLoop(..loop, state: Stopped)
          Stop(loop, "Graceful shutdown complete")
        }
        _ -> Continue(loop)
      }
    }
  }
}

fn process_events(
  loop: KernelLoop,
  max_count: Int,
) -> #(KernelLoop, Int) {
  process_events_helper(loop, max_count, 0)
}

fn process_events_helper(
  loop: KernelLoop,
  remaining: Int,
  processed: Int,
) -> #(KernelLoop, Int) {
  case remaining <= 0 {
    True -> #(loop, processed)
    False ->
      case loop.event_queue {
        [] -> #(loop, processed)
        [event, ..rest] -> {
          let loop = KernelLoop(..loop, event_queue: rest)
          let loop = handle_event(loop, event)
          process_events_helper(loop, remaining - 1, processed + 1)
        }
      }
  }
}

fn handle_event(loop: KernelLoop, event: KernelEvent) -> KernelLoop {
  case event {
    Tick(_) -> loop
    ProcessSpawned(_) -> loop
    ProcessExited(_, _) -> loop
    MessageReceived(_, _, _) -> {
      KernelLoop(
        ..loop,
        stats: KernelStats(
          ..loop.stats,
          total_messages: loop.stats.total_messages + 1,
        ),
      )
    }
    SyscallRequested(_, _) -> {
      KernelLoop(
        ..loop,
        stats: KernelStats(
          ..loop.stats,
          total_syscalls: loop.stats.total_syscalls + 1,
        ),
      )
    }
    DriverEvent(_, _) -> loop
    ShutdownRequested(_) -> KernelLoop(..loop, state: ShuttingDown)
    ConfigChanged(_) -> loop
  }
}

// ============================================================================
// SECTION 6: STATISTICS AND QUERIES
// ============================================================================

/// Get kernel statistics
pub fn get_stats(loop: KernelLoop) -> KernelStats {
  loop.stats
}

/// Get kernel state
pub fn get_state(loop: KernelLoop) -> KernelState {
  loop.state
}

/// Get kernel configuration
pub fn get_config(loop: KernelLoop) -> KernelConfig {
  loop.config
}

/// Get uptime in nanoseconds
pub fn get_uptime_ns(loop: KernelLoop, current_time_ns: Int) -> Int {
  current_time_ns - loop.start_time_ns
}

/// Check if tick is due
pub fn tick_due(loop: KernelLoop, current_time_ns: Int) -> Bool {
  let elapsed = current_time_ns - loop.last_tick_ns
  elapsed >= loop.config.tick_interval_ns
}

// ============================================================================
// SECTION 7: HELPER FUNCTIONS
// ============================================================================

fn append_event(events: List(KernelEvent), event: KernelEvent) -> List(KernelEvent) {
  case events {
    [] -> [event]
    [first, ..rest] -> [first, ..append_event(rest, event)]
  }
}

fn list_length(list: List(a)) -> Int {
  case list {
    [] -> 0
    [_, ..rest] -> 1 + list_length(rest)
  }
}
