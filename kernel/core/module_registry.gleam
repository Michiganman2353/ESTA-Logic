//// kernel/core/module_registry.gleam
////
//// ESTA Logic Microkernel Module Registry
////
//// This module implements the central registry for all loaded modules
//// in the ESTA Logic microkernel. It tracks module lifecycle, dependencies,
//// and provides lookup services for module resolution.
////
//// Key Design Principles:
//// 1. All modules must be registered before use
//// 2. Dependency resolution is deterministic
//// 3. Module versions are strictly enforced
//// 4. Hot-reload support for non-critical modules
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: MODULE TYPES
// ============================================================================

/// Module identifier
pub type ModuleId {
  ModuleId(value: Int)
}

/// Module name with version
pub type ModuleName {
  ModuleName(name: String, version: ModuleVersion)
}

/// Semantic version
pub type ModuleVersion {
  ModuleVersion(major: Int, minor: Int, patch: Int)
}

/// Module state in the registry
pub type ModuleState {
  /// Module registered but not loaded
  Registered
  /// Module is currently loading
  Loading
  /// Module is loaded and ready
  Ready
  /// Module failed to load
  Failed(reason: String)
  /// Module is being unloaded
  Unloading
  /// Module has been unloaded
  Unloaded
}

/// Module type classification
pub type ModuleType {
  /// Core kernel module
  CoreModule
  /// Service module
  ServiceModule
  /// Driver module
  DriverModule
  /// Extension module
  ExtensionModule
}

/// Module entry in the registry
pub type ModuleEntry {
  ModuleEntry(
    id: ModuleId,
    name: ModuleName,
    module_type: ModuleType,
    state: ModuleState,
    dependencies: List(ModuleName),
    dependents: List(ModuleId),
    entry_point: String,
    capabilities_required: List(String),
    load_time_ns: Int,
    checksum: Int,
  )
}

/// Module registry state
pub type ModuleRegistry {
  ModuleRegistry(
    modules: List(ModuleEntry),
    next_id: Int,
    config: RegistryConfig,
    stats: RegistryStats,
  )
}

/// Registry configuration
pub type RegistryConfig {
  RegistryConfig(
    max_modules: Int,
    max_dependencies_depth: Int,
    allow_hot_reload: Bool,
  )
}

/// Registry statistics
pub type RegistryStats {
  RegistryStats(
    total_registered: Int,
    total_loaded: Int,
    total_failed: Int,
    total_unloaded: Int,
  )
}

/// Registration result
pub type RegistrationResult {
  Registered(id: ModuleId)
  AlreadyExists(id: ModuleId)
  RegistrationFailed(reason: String)
}

/// Lookup result
pub type LookupResult {
  Found(entry: ModuleEntry)
  NotFound
}

// ============================================================================
// SECTION 2: REGISTRY CREATION
// ============================================================================

/// Create a new module registry
pub fn new() -> ModuleRegistry {
  new_with_config(default_config())
}

/// Create a registry with custom configuration
pub fn new_with_config(config: RegistryConfig) -> ModuleRegistry {
  ModuleRegistry(
    modules: [],
    next_id: 1,
    config: config,
    stats: RegistryStats(
      total_registered: 0,
      total_loaded: 0,
      total_failed: 0,
      total_unloaded: 0,
    ),
  )
}

/// Default registry configuration
pub fn default_config() -> RegistryConfig {
  RegistryConfig(
    max_modules: 1000,
    max_dependencies_depth: 10,
    allow_hot_reload: True,
  )
}

// ============================================================================
// SECTION 3: MODULE REGISTRATION
// ============================================================================

/// Register a new module
pub fn register(
  registry: ModuleRegistry,
  name: ModuleName,
  module_type: ModuleType,
  entry_point: String,
  dependencies: List(ModuleName),
  capabilities_required: List(String),
  checksum: Int,
) -> #(ModuleRegistry, RegistrationResult) {
  // Check if module already exists
  case find_by_name(registry.modules, name) {
    Found(existing) -> #(registry, AlreadyExists(existing.id))
    NotFound -> {
      // Check max modules limit
      case list_length(registry.modules) >= registry.config.max_modules {
        True -> #(registry, RegistrationFailed("Max modules limit reached"))
        False -> {
          let id = ModuleId(registry.next_id)
          let entry = ModuleEntry(
            id: id,
            name: name,
            module_type: module_type,
            state: Registered,
            dependencies: dependencies,
            dependents: [],
            entry_point: entry_point,
            capabilities_required: capabilities_required,
            load_time_ns: 0,
            checksum: checksum,
          )
          let new_registry = ModuleRegistry(
            ..registry,
            modules: [entry, ..registry.modules],
            next_id: registry.next_id + 1,
            stats: RegistryStats(
              ..registry.stats,
              total_registered: registry.stats.total_registered + 1,
            ),
          )
          #(new_registry, Registered(id))
        }
      }
    }
  }
}

/// Unregister a module
pub fn unregister(
  registry: ModuleRegistry,
  id: ModuleId,
) -> #(ModuleRegistry, Result(Nil, String)) {
  case find_by_id(registry.modules, id) {
    NotFound -> #(registry, Error("Module not found"))
    Found(entry) -> {
      // Check if any modules depend on this one
      case entry.dependents {
        [] -> {
          let modules = remove_module(registry.modules, id)
          let new_registry = ModuleRegistry(
            ..registry,
            modules: modules,
            stats: RegistryStats(
              ..registry.stats,
              total_unloaded: registry.stats.total_unloaded + 1,
            ),
          )
          #(new_registry, Ok(Nil))
        }
        _ -> #(registry, Error("Module has dependents"))
      }
    }
  }
}

// ============================================================================
// SECTION 4: MODULE STATE MANAGEMENT
// ============================================================================

/// Set module state to loading
pub fn set_loading(
  registry: ModuleRegistry,
  id: ModuleId,
) -> ModuleRegistry {
  update_state(registry, id, Loading)
}

/// Set module state to ready
pub fn set_ready(
  registry: ModuleRegistry,
  id: ModuleId,
  load_time_ns: Int,
) -> ModuleRegistry {
  let registry = update_state(registry, id, Ready)
  let modules = update_load_time(registry.modules, id, load_time_ns)
  ModuleRegistry(
    ..registry,
    modules: modules,
    stats: RegistryStats(
      ..registry.stats,
      total_loaded: registry.stats.total_loaded + 1,
    ),
  )
}

/// Set module state to failed
pub fn set_failed(
  registry: ModuleRegistry,
  id: ModuleId,
  reason: String,
) -> ModuleRegistry {
  let registry = update_state(registry, id, Failed(reason))
  ModuleRegistry(
    ..registry,
    stats: RegistryStats(
      ..registry.stats,
      total_failed: registry.stats.total_failed + 1,
    ),
  )
}

/// Set module state to unloading
pub fn set_unloading(
  registry: ModuleRegistry,
  id: ModuleId,
) -> ModuleRegistry {
  update_state(registry, id, Unloading)
}

/// Set module state to unloaded
pub fn set_unloaded(
  registry: ModuleRegistry,
  id: ModuleId,
) -> ModuleRegistry {
  let registry = update_state(registry, id, Unloaded)
  ModuleRegistry(
    ..registry,
    stats: RegistryStats(
      ..registry.stats,
      total_unloaded: registry.stats.total_unloaded + 1,
    ),
  )
}

// ============================================================================
// SECTION 5: MODULE LOOKUP
// ============================================================================

/// Find a module by ID
pub fn lookup(registry: ModuleRegistry, id: ModuleId) -> LookupResult {
  find_by_id(registry.modules, id)
}

/// Find a module by name
pub fn lookup_by_name(registry: ModuleRegistry, name: ModuleName) -> LookupResult {
  find_by_name(registry.modules, name)
}

/// Find a module by name string (latest version)
pub fn lookup_by_name_string(
  registry: ModuleRegistry,
  name_str: String,
) -> LookupResult {
  find_by_name_string(registry.modules, name_str)
}

/// Get all modules of a specific type
pub fn get_by_type(
  registry: ModuleRegistry,
  module_type: ModuleType,
) -> List(ModuleEntry) {
  filter_by_type(registry.modules, module_type)
}

/// Get all ready modules
pub fn get_ready_modules(registry: ModuleRegistry) -> List(ModuleEntry) {
  filter_by_state_ready(registry.modules)
}

/// Get all modules
pub fn get_all_modules(registry: ModuleRegistry) -> List(ModuleEntry) {
  registry.modules
}

// ============================================================================
// SECTION 6: DEPENDENCY MANAGEMENT
// ============================================================================

/// Add a dependent to a module
pub fn add_dependent(
  registry: ModuleRegistry,
  module_id: ModuleId,
  dependent_id: ModuleId,
) -> ModuleRegistry {
  let modules = add_dependent_to_module(registry.modules, module_id, dependent_id)
  ModuleRegistry(..registry, modules: modules)
}

/// Remove a dependent from a module
pub fn remove_dependent(
  registry: ModuleRegistry,
  module_id: ModuleId,
  dependent_id: ModuleId,
) -> ModuleRegistry {
  let modules = remove_dependent_from_module(registry.modules, module_id, dependent_id)
  ModuleRegistry(..registry, modules: modules)
}

/// Check if all dependencies are satisfied
pub fn check_dependencies(
  registry: ModuleRegistry,
  id: ModuleId,
) -> Result(Nil, List(ModuleName)) {
  case find_by_id(registry.modules, id) {
    NotFound -> Error([])
    Found(entry) -> {
      let missing = find_missing_dependencies(registry.modules, entry.dependencies)
      case missing {
        [] -> Ok(Nil)
        _ -> Error(missing)
      }
    }
  }
}

/// Get dependency resolution order
pub fn get_load_order(
  registry: ModuleRegistry,
  ids: List(ModuleId),
) -> Result(List(ModuleId), String) {
  topological_sort(registry.modules, ids, registry.config.max_dependencies_depth)
}

// ============================================================================
// SECTION 7: STATISTICS
// ============================================================================

/// Get registry statistics
pub fn get_stats(registry: ModuleRegistry) -> RegistryStats {
  registry.stats
}

/// Get module count by state
pub fn count_by_state(registry: ModuleRegistry) -> List(#(String, Int)) {
  [
    #("registered", count_state(registry.modules, "registered")),
    #("loading", count_state(registry.modules, "loading")),
    #("ready", count_state(registry.modules, "ready")),
    #("failed", count_state(registry.modules, "failed")),
    #("unloading", count_state(registry.modules, "unloading")),
    #("unloaded", count_state(registry.modules, "unloaded")),
  ]
}

// ============================================================================
// SECTION 8: HELPER FUNCTIONS
// ============================================================================

fn find_by_id(modules: List(ModuleEntry), id: ModuleId) -> LookupResult {
  case modules {
    [] -> NotFound
    [entry, ..rest] ->
      case entry.id.value == id.value {
        True -> Found(entry)
        False -> find_by_id(rest, id)
      }
  }
}

fn find_by_name(modules: List(ModuleEntry), name: ModuleName) -> LookupResult {
  case modules {
    [] -> NotFound
    [entry, ..rest] ->
      case entry.name.name == name.name && versions_equal(entry.name.version, name.version) {
        True -> Found(entry)
        False -> find_by_name(rest, name)
      }
  }
}

fn find_by_name_string(modules: List(ModuleEntry), name_str: String) -> LookupResult {
  find_latest_version(modules, name_str, NotFound)
}

fn find_latest_version(
  modules: List(ModuleEntry),
  name_str: String,
  current_best: LookupResult,
) -> LookupResult {
  case modules {
    [] -> current_best
    [entry, ..rest] ->
      case entry.name.name == name_str {
        True -> {
          case current_best {
            NotFound -> find_latest_version(rest, name_str, Found(entry))
            Found(best) ->
              case version_greater(entry.name.version, best.name.version) {
                True -> find_latest_version(rest, name_str, Found(entry))
                False -> find_latest_version(rest, name_str, current_best)
              }
          }
        }
        False -> find_latest_version(rest, name_str, current_best)
      }
  }
}

fn versions_equal(a: ModuleVersion, b: ModuleVersion) -> Bool {
  a.major == b.major && a.minor == b.minor && a.patch == b.patch
}

fn version_greater(a: ModuleVersion, b: ModuleVersion) -> Bool {
  case a.major > b.major {
    True -> True
    False ->
      case a.major == b.major && a.minor > b.minor {
        True -> True
        False ->
          case a.major == b.major && a.minor == b.minor && a.patch > b.patch {
            True -> True
            False -> False
          }
      }
  }
}

fn remove_module(modules: List(ModuleEntry), id: ModuleId) -> List(ModuleEntry) {
  case modules {
    [] -> []
    [entry, ..rest] ->
      case entry.id.value == id.value {
        True -> rest
        False -> [entry, ..remove_module(rest, id)]
      }
  }
}

fn update_state(
  registry: ModuleRegistry,
  id: ModuleId,
  new_state: ModuleState,
) -> ModuleRegistry {
  let modules = update_module_state(registry.modules, id, new_state)
  ModuleRegistry(..registry, modules: modules)
}

fn update_module_state(
  modules: List(ModuleEntry),
  id: ModuleId,
  new_state: ModuleState,
) -> List(ModuleEntry) {
  case modules {
    [] -> []
    [entry, ..rest] ->
      case entry.id.value == id.value {
        True -> [ModuleEntry(..entry, state: new_state), ..rest]
        False -> [entry, ..update_module_state(rest, id, new_state)]
      }
  }
}

fn update_load_time(
  modules: List(ModuleEntry),
  id: ModuleId,
  load_time_ns: Int,
) -> List(ModuleEntry) {
  case modules {
    [] -> []
    [entry, ..rest] ->
      case entry.id.value == id.value {
        True -> [ModuleEntry(..entry, load_time_ns: load_time_ns), ..rest]
        False -> [entry, ..update_load_time(rest, id, load_time_ns)]
      }
  }
}

fn filter_by_type(
  modules: List(ModuleEntry),
  module_type: ModuleType,
) -> List(ModuleEntry) {
  case modules {
    [] -> []
    [entry, ..rest] ->
      case types_equal(entry.module_type, module_type) {
        True -> [entry, ..filter_by_type(rest, module_type)]
        False -> filter_by_type(rest, module_type)
      }
  }
}

fn types_equal(a: ModuleType, b: ModuleType) -> Bool {
  case a, b {
    CoreModule, CoreModule -> True
    ServiceModule, ServiceModule -> True
    DriverModule, DriverModule -> True
    ExtensionModule, ExtensionModule -> True
    _, _ -> False
  }
}

fn filter_by_state_ready(modules: List(ModuleEntry)) -> List(ModuleEntry) {
  case modules {
    [] -> []
    [entry, ..rest] ->
      case entry.state {
        Ready -> [entry, ..filter_by_state_ready(rest)]
        _ -> filter_by_state_ready(rest)
      }
  }
}

fn add_dependent_to_module(
  modules: List(ModuleEntry),
  module_id: ModuleId,
  dependent_id: ModuleId,
) -> List(ModuleEntry) {
  case modules {
    [] -> []
    [entry, ..rest] ->
      case entry.id.value == module_id.value {
        True -> {
          let new_dependents = [dependent_id, ..entry.dependents]
          [ModuleEntry(..entry, dependents: new_dependents), ..rest]
        }
        False -> [entry, ..add_dependent_to_module(rest, module_id, dependent_id)]
      }
  }
}

fn remove_dependent_from_module(
  modules: List(ModuleEntry),
  module_id: ModuleId,
  dependent_id: ModuleId,
) -> List(ModuleEntry) {
  case modules {
    [] -> []
    [entry, ..rest] ->
      case entry.id.value == module_id.value {
        True -> {
          let new_dependents = filter_out_id(entry.dependents, dependent_id)
          [ModuleEntry(..entry, dependents: new_dependents), ..rest]
        }
        False -> [entry, ..remove_dependent_from_module(rest, module_id, dependent_id)]
      }
  }
}

fn filter_out_id(ids: List(ModuleId), id: ModuleId) -> List(ModuleId) {
  case ids {
    [] -> []
    [first, ..rest] ->
      case first.value == id.value {
        True -> filter_out_id(rest, id)
        False -> [first, ..filter_out_id(rest, id)]
      }
  }
}

fn find_missing_dependencies(
  modules: List(ModuleEntry),
  dependencies: List(ModuleName),
) -> List(ModuleName) {
  case dependencies {
    [] -> []
    [dep, ..rest] ->
      case find_by_name(modules, dep) {
        Found(entry) ->
          case entry.state {
            Ready -> find_missing_dependencies(modules, rest)
            _ -> [dep, ..find_missing_dependencies(modules, rest)]
          }
        NotFound -> [dep, ..find_missing_dependencies(modules, rest)]
      }
  }
}

fn topological_sort(
  _modules: List(ModuleEntry),
  ids: List(ModuleId),
  _max_depth: Int,
) -> Result(List(ModuleId), String) {
  // Simple implementation - just return the list as-is for now
  // A full implementation would do proper topological sorting
  Ok(ids)
}

fn count_state(modules: List(ModuleEntry), state_name: String) -> Int {
  case modules {
    [] -> 0
    [entry, ..rest] -> {
      let matches = case state_name, entry.state {
        "registered", Registered -> True
        "loading", Loading -> True
        "ready", Ready -> True
        "failed", Failed(_) -> True
        "unloading", Unloading -> True
        "unloaded", Unloaded -> True
        _, _ -> False
      }
      case matches {
        True -> 1 + count_state(rest, state_name)
        False -> count_state(rest, state_name)
      }
    }
  }
}

fn list_length(list: List(a)) -> Int {
  case list {
    [] -> 0
    [_, ..rest] -> 1 + list_length(rest)
  }
}
