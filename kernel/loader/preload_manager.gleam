//// kernel/loader/preload_manager.gleam
////
//// ESTA Logic Module Preload Manager
////
//// This module manages preloading of modules for faster startup
//// and improved runtime performance.
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: PRELOAD TYPES
// ============================================================================

/// Module identifier
pub type ModuleId {
  ModuleId(value: Int)
}

/// Preload priority
pub type PreloadPriority {
  Critical
  High
  Normal
  Low
  Lazy
}

/// Preload state
pub type PreloadState {
  Pending
  Loading
  Loaded
  Failed(reason: String)
}

/// Preload entry
pub type PreloadEntry {
  PreloadEntry(
    module_id: ModuleId,
    module_name: String,
    priority: PreloadPriority,
    state: PreloadState,
    load_time_ns: Int,
    dependencies: List(ModuleId),
  )
}

/// Preload manager state
pub type PreloadManager {
  PreloadManager(
    entries: List(PreloadEntry),
    config: PreloadConfig,
    stats: PreloadStats,
  )
}

/// Preload configuration
pub type PreloadConfig {
  PreloadConfig(
    max_concurrent_loads: Int,
    load_timeout_ns: Int,
    retry_on_failure: Bool,
  )
}

/// Preload statistics
pub type PreloadStats {
  PreloadStats(
    total_preloaded: Int,
    total_failed: Int,
    total_load_time_ns: Int,
  )
}

// ============================================================================
// SECTION 2: MANAGER CREATION
// ============================================================================

/// Create a new preload manager
pub fn new() -> PreloadManager {
  new_with_config(default_config())
}

/// Create a manager with custom configuration
pub fn new_with_config(config: PreloadConfig) -> PreloadManager {
  PreloadManager(
    entries: [],
    config: config,
    stats: PreloadStats(
      total_preloaded: 0,
      total_failed: 0,
      total_load_time_ns: 0,
    ),
  )
}

/// Default preload configuration
pub fn default_config() -> PreloadConfig {
  PreloadConfig(
    max_concurrent_loads: 4,
    load_timeout_ns: 30_000_000_000,
    retry_on_failure: True,
  )
}

// ============================================================================
// SECTION 3: PRELOAD OPERATIONS
// ============================================================================

/// Schedule a module for preloading
pub fn schedule(
  manager: PreloadManager,
  module_id: ModuleId,
  module_name: String,
  priority: PreloadPriority,
  dependencies: List(ModuleId),
) -> PreloadManager {
  let entry = PreloadEntry(
    module_id: module_id,
    module_name: module_name,
    priority: priority,
    state: Pending,
    load_time_ns: 0,
    dependencies: dependencies,
  )
  PreloadManager(..manager, entries: insert_by_priority(manager.entries, entry))
}

/// Mark a module as loaded
pub fn mark_loaded(
  manager: PreloadManager,
  module_id: ModuleId,
  load_time_ns: Int,
) -> PreloadManager {
  let entries = update_entry_state(manager.entries, module_id, Loaded, load_time_ns)
  PreloadManager(
    ..manager,
    entries: entries,
    stats: PreloadStats(
      ..manager.stats,
      total_preloaded: manager.stats.total_preloaded + 1,
      total_load_time_ns: manager.stats.total_load_time_ns + load_time_ns,
    ),
  )
}

/// Mark a module as failed
pub fn mark_failed(
  manager: PreloadManager,
  module_id: ModuleId,
  reason: String,
) -> PreloadManager {
  let entries = update_entry_state(manager.entries, module_id, Failed(reason), 0)
  PreloadManager(
    ..manager,
    entries: entries,
    stats: PreloadStats(
      ..manager.stats,
      total_failed: manager.stats.total_failed + 1,
    ),
  )
}

/// Get next modules to preload
pub fn get_next_to_load(
  manager: PreloadManager,
  count: Int,
) -> List(PreloadEntry) {
  get_pending_entries(manager.entries, count)
}

// ============================================================================
// SECTION 4: QUERIES
// ============================================================================

/// Check if a module is preloaded
pub fn is_preloaded(manager: PreloadManager, module_id: ModuleId) -> Bool {
  case find_entry(manager.entries, module_id) {
    Error(Nil) -> False
    Ok(entry) ->
      case entry.state {
        Loaded -> True
        _ -> False
      }
  }
}

/// Get preload state for a module
pub fn get_state(
  manager: PreloadManager,
  module_id: ModuleId,
) -> Result(PreloadState, Nil) {
  case find_entry(manager.entries, module_id) {
    Error(Nil) -> Error(Nil)
    Ok(entry) -> Ok(entry.state)
  }
}

/// Get all pending modules
pub fn get_pending(manager: PreloadManager) -> List(ModuleId) {
  filter_pending(manager.entries)
}

/// Get preload statistics
pub fn get_stats(manager: PreloadManager) -> PreloadStats {
  manager.stats
}

// ============================================================================
// SECTION 5: HELPER FUNCTIONS
// ============================================================================

fn find_entry(
  entries: List(PreloadEntry),
  module_id: ModuleId,
) -> Result(PreloadEntry, Nil) {
  case entries {
    [] -> Error(Nil)
    [e, ..rest] ->
      case e.module_id.value == module_id.value {
        True -> Ok(e)
        False -> find_entry(rest, module_id)
      }
  }
}

fn insert_by_priority(
  entries: List(PreloadEntry),
  entry: PreloadEntry,
) -> List(PreloadEntry) {
  case entries {
    [] -> [entry]
    [first, ..rest] ->
      case priority_greater(entry.priority, first.priority) {
        True -> [entry, first, ..rest]
        False -> [first, ..insert_by_priority(rest, entry)]
      }
  }
}

fn priority_greater(a: PreloadPriority, b: PreloadPriority) -> Bool {
  priority_to_int(a) > priority_to_int(b)
}

fn priority_to_int(priority: PreloadPriority) -> Int {
  case priority {
    Critical -> 4
    High -> 3
    Normal -> 2
    Low -> 1
    Lazy -> 0
  }
}

fn update_entry_state(
  entries: List(PreloadEntry),
  module_id: ModuleId,
  state: PreloadState,
  load_time_ns: Int,
) -> List(PreloadEntry) {
  case entries {
    [] -> []
    [e, ..rest] ->
      case e.module_id.value == module_id.value {
        True -> [PreloadEntry(..e, state: state, load_time_ns: load_time_ns), ..rest]
        False -> [e, ..update_entry_state(rest, module_id, state, load_time_ns)]
      }
  }
}

fn get_pending_entries(entries: List(PreloadEntry), count: Int) -> List(PreloadEntry) {
  case count <= 0 {
    True -> []
    False ->
      case entries {
        [] -> []
        [e, ..rest] ->
          case e.state {
            Pending -> [e, ..get_pending_entries(rest, count - 1)]
            _ -> get_pending_entries(rest, count)
          }
      }
  }
}

fn filter_pending(entries: List(PreloadEntry)) -> List(ModuleId) {
  case entries {
    [] -> []
    [e, ..rest] ->
      case e.state {
        Pending -> [e.module_id, ..filter_pending(rest)]
        _ -> filter_pending(rest)
      }
  }
}
