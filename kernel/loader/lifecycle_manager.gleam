//// kernel/loader/lifecycle_manager.gleam
////
//// ESTA Logic Module Lifecycle Manager
////
//// This module manages the lifecycle of modules in the ESTA Logic
//// microkernel, handling startup, shutdown, and health monitoring.
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: LIFECYCLE TYPES
// ============================================================================

/// Module identifier
pub type ModuleId {
  ModuleId(value: Int)
}

/// Lifecycle state
pub type LifecycleState {
  Stopped
  Starting
  Running
  Stopping
  Failed(reason: String)
  Restarting
}

/// Lifecycle event
pub type LifecycleEvent {
  EventStart
  EventStop
  EventRestart
  EventHealthCheck
  EventTimeout
  EventError(message: String)
}

/// Module lifecycle entry
pub type LifecycleEntry {
  LifecycleEntry(
    module_id: ModuleId,
    state: LifecycleState,
    start_time_ns: Int,
    stop_time_ns: Int,
    restart_count: Int,
    last_health_check_ns: Int,
    health_status: HealthStatus,
  )
}

/// Health status
pub type HealthStatus {
  Healthy
  Degraded(reason: String)
  Unhealthy(reason: String)
  Unknown
}

/// Lifecycle manager state
pub type LifecycleManager {
  LifecycleManager(
    entries: List(LifecycleEntry),
    config: ManagerConfig,
    stats: ManagerStats,
  )
}

/// Manager configuration
pub type ManagerConfig {
  ManagerConfig(
    health_check_interval_ns: Int,
    startup_timeout_ns: Int,
    shutdown_timeout_ns: Int,
    max_restart_attempts: Int,
  )
}

/// Manager statistics
pub type ManagerStats {
  ManagerStats(
    total_starts: Int,
    total_stops: Int,
    total_restarts: Int,
    total_failures: Int,
  )
}

// ============================================================================
// SECTION 2: MANAGER CREATION
// ============================================================================

/// Create a new lifecycle manager
pub fn new() -> LifecycleManager {
  new_with_config(default_config())
}

/// Create a manager with custom configuration
pub fn new_with_config(config: ManagerConfig) -> LifecycleManager {
  LifecycleManager(
    entries: [],
    config: config,
    stats: ManagerStats(
      total_starts: 0,
      total_stops: 0,
      total_restarts: 0,
      total_failures: 0,
    ),
  )
}

/// Default manager configuration
pub fn default_config() -> ManagerConfig {
  ManagerConfig(
    health_check_interval_ns: 30_000_000_000,
    startup_timeout_ns: 10_000_000_000,
    shutdown_timeout_ns: 5_000_000_000,
    max_restart_attempts: 3,
  )
}

// ============================================================================
// SECTION 3: LIFECYCLE OPERATIONS
// ============================================================================

/// Register a module with the lifecycle manager
pub fn register(
  manager: LifecycleManager,
  module_id: ModuleId,
) -> LifecycleManager {
  let entry = LifecycleEntry(
    module_id: module_id,
    state: Stopped,
    start_time_ns: 0,
    stop_time_ns: 0,
    restart_count: 0,
    last_health_check_ns: 0,
    health_status: Unknown,
  )
  LifecycleManager(..manager, entries: [entry, ..manager.entries])
}

/// Start a module
pub fn start(
  manager: LifecycleManager,
  module_id: ModuleId,
  now_ns: Int,
) -> #(LifecycleManager, Result(Nil, String)) {
  case find_entry(manager.entries, module_id) {
    Error(Nil) -> #(manager, Error("Module not registered"))
    Ok(entry) ->
      case entry.state {
        Running -> #(manager, Error("Module already running"))
        Starting -> #(manager, Error("Module already starting"))
        _ -> {
          let new_entry = LifecycleEntry(
            ..entry,
            state: Running,
            start_time_ns: now_ns,
            health_status: Healthy,
          )
          let entries = update_entry(manager.entries, new_entry)
          let new_manager = LifecycleManager(
            ..manager,
            entries: entries,
            stats: ManagerStats(
              ..manager.stats,
              total_starts: manager.stats.total_starts + 1,
            ),
          )
          #(new_manager, Ok(Nil))
        }
      }
  }
}

/// Stop a module
pub fn stop(
  manager: LifecycleManager,
  module_id: ModuleId,
  now_ns: Int,
) -> #(LifecycleManager, Result(Nil, String)) {
  case find_entry(manager.entries, module_id) {
    Error(Nil) -> #(manager, Error("Module not registered"))
    Ok(entry) ->
      case entry.state {
        Stopped -> #(manager, Error("Module already stopped"))
        Stopping -> #(manager, Error("Module already stopping"))
        _ -> {
          let new_entry = LifecycleEntry(
            ..entry,
            state: Stopped,
            stop_time_ns: now_ns,
            health_status: Unknown,
          )
          let entries = update_entry(manager.entries, new_entry)
          let new_manager = LifecycleManager(
            ..manager,
            entries: entries,
            stats: ManagerStats(
              ..manager.stats,
              total_stops: manager.stats.total_stops + 1,
            ),
          )
          #(new_manager, Ok(Nil))
        }
      }
  }
}

/// Restart a module
pub fn restart(
  manager: LifecycleManager,
  module_id: ModuleId,
  now_ns: Int,
) -> #(LifecycleManager, Result(Nil, String)) {
  case find_entry(manager.entries, module_id) {
    Error(Nil) -> #(manager, Error("Module not registered"))
    Ok(entry) -> {
      case entry.restart_count >= manager.config.max_restart_attempts {
        True -> #(manager, Error("Max restart attempts exceeded"))
        False -> {
          let new_entry = LifecycleEntry(
            ..entry,
            state: Running,
            start_time_ns: now_ns,
            restart_count: entry.restart_count + 1,
            health_status: Healthy,
          )
          let entries = update_entry(manager.entries, new_entry)
          let new_manager = LifecycleManager(
            ..manager,
            entries: entries,
            stats: ManagerStats(
              ..manager.stats,
              total_restarts: manager.stats.total_restarts + 1,
            ),
          )
          #(new_manager, Ok(Nil))
        }
      }
    }
  }
}

// ============================================================================
// SECTION 4: HEALTH MONITORING
// ============================================================================

/// Update health status for a module
pub fn update_health(
  manager: LifecycleManager,
  module_id: ModuleId,
  status: HealthStatus,
  now_ns: Int,
) -> LifecycleManager {
  case find_entry(manager.entries, module_id) {
    Error(Nil) -> manager
    Ok(entry) -> {
      let new_entry = LifecycleEntry(
        ..entry,
        health_status: status,
        last_health_check_ns: now_ns,
      )
      let entries = update_entry(manager.entries, new_entry)
      LifecycleManager(..manager, entries: entries)
    }
  }
}

/// Get modules that need health check
pub fn get_stale_health_checks(
  manager: LifecycleManager,
  now_ns: Int,
) -> List(ModuleId) {
  filter_stale_checks(manager.entries, manager.config.health_check_interval_ns, now_ns)
}

/// Get unhealthy modules
pub fn get_unhealthy_modules(manager: LifecycleManager) -> List(ModuleId) {
  filter_unhealthy(manager.entries)
}

// ============================================================================
// SECTION 5: QUERIES
// ============================================================================

/// Get lifecycle state for a module
pub fn get_state(
  manager: LifecycleManager,
  module_id: ModuleId,
) -> Result(LifecycleState, Nil) {
  case find_entry(manager.entries, module_id) {
    Error(Nil) -> Error(Nil)
    Ok(entry) -> Ok(entry.state)
  }
}

/// Get all running modules
pub fn get_running_modules(manager: LifecycleManager) -> List(ModuleId) {
  filter_running(manager.entries)
}

/// Get manager statistics
pub fn get_stats(manager: LifecycleManager) -> ManagerStats {
  manager.stats
}

// ============================================================================
// SECTION 6: HELPER FUNCTIONS
// ============================================================================

fn find_entry(
  entries: List(LifecycleEntry),
  module_id: ModuleId,
) -> Result(LifecycleEntry, Nil) {
  case entries {
    [] -> Error(Nil)
    [e, ..rest] ->
      case e.module_id.value == module_id.value {
        True -> Ok(e)
        False -> find_entry(rest, module_id)
      }
  }
}

fn update_entry(
  entries: List(LifecycleEntry),
  new_entry: LifecycleEntry,
) -> List(LifecycleEntry) {
  case entries {
    [] -> []
    [e, ..rest] ->
      case e.module_id.value == new_entry.module_id.value {
        True -> [new_entry, ..rest]
        False -> [e, ..update_entry(rest, new_entry)]
      }
  }
}

fn filter_stale_checks(
  entries: List(LifecycleEntry),
  interval_ns: Int,
  now_ns: Int,
) -> List(ModuleId) {
  case entries {
    [] -> []
    [e, ..rest] -> {
      let is_running = case e.state {
        Running -> True
        _ -> False
      }
      let is_stale = now_ns - e.last_health_check_ns > interval_ns
      case is_running && is_stale {
        True -> [e.module_id, ..filter_stale_checks(rest, interval_ns, now_ns)]
        False -> filter_stale_checks(rest, interval_ns, now_ns)
      }
    }
  }
}

fn filter_unhealthy(entries: List(LifecycleEntry)) -> List(ModuleId) {
  case entries {
    [] -> []
    [e, ..rest] ->
      case e.health_status {
        Unhealthy(_) -> [e.module_id, ..filter_unhealthy(rest)]
        _ -> filter_unhealthy(rest)
      }
  }
}

fn filter_running(entries: List(LifecycleEntry)) -> List(ModuleId) {
  case entries {
    [] -> []
    [e, ..rest] ->
      case e.state {
        Running -> [e.module_id, ..filter_running(rest)]
        _ -> filter_running(rest)
      }
  }
}
