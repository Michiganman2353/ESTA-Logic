//// kernel/core/init.gleam
////
//// ESTA Logic Microkernel Initialization
////
//// This module handles the initialization sequence for the ESTA Logic
//// microkernel. It bootstraps all core subsystems in the correct order
//// and validates system integrity before starting.
////
//// Key Design Principles:
//// 1. Deterministic initialization order
//// 2. Fail-fast on initialization errors
//// 3. All subsystems must be ready before kernel starts
//// 4. Initialization is idempotent
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: INITIALIZATION TYPES
// ============================================================================

/// Initialization phase
pub type InitPhase {
  /// Pre-initialization checks
  PreInit
  /// Core subsystem initialization
  CoreInit
  /// Driver initialization
  DriverInit
  /// Service initialization
  ServiceInit
  /// Post-initialization validation
  PostInit
  /// Initialization complete
  Complete
  /// Initialization failed
  Failed(reason: String)
}

/// Initialization result for a subsystem
pub type InitResult {
  /// Subsystem initialized successfully
  InitOk
  /// Subsystem initialization failed
  InitFailed(reason: String)
  /// Subsystem already initialized
  InitSkipped
}

/// Subsystem descriptor
pub type Subsystem {
  Subsystem(
    name: String,
    phase: InitPhase,
    dependencies: List(String),
    init_time_ns: Int,
    status: SubsystemStatus,
  )
}

/// Subsystem status
pub type SubsystemStatus {
  Pending
  Initializing
  Ready
  Error(message: String)
}

/// Kernel initialization state
pub type KernelInit {
  KernelInit(
    phase: InitPhase,
    subsystems: List(Subsystem),
    start_time_ns: Int,
    config: InitConfig,
    errors: List(String),
  )
}

/// Initialization configuration
pub type InitConfig {
  InitConfig(
    /// Timeout for each subsystem initialization (ns)
    subsystem_timeout_ns: Int,
    /// Whether to continue on non-critical failures
    continue_on_warning: Bool,
    /// Enable verbose logging
    verbose: Bool,
  )
}

// ============================================================================
// SECTION 2: INITIALIZATION CREATION
// ============================================================================

/// Create a new kernel initialization
pub fn new(start_time_ns: Int) -> KernelInit {
  new_with_config(start_time_ns, default_config())
}

/// Create kernel initialization with custom configuration
pub fn new_with_config(start_time_ns: Int, config: InitConfig) -> KernelInit {
  KernelInit(
    phase: PreInit,
    subsystems: default_subsystems(),
    start_time_ns: start_time_ns,
    config: config,
    errors: [],
  )
}

/// Default initialization configuration
pub fn default_config() -> InitConfig {
  InitConfig(
    subsystem_timeout_ns: 5_000_000_000,
    continue_on_warning: True,
    verbose: False,
  )
}

/// Default subsystems to initialize
fn default_subsystems() -> List(Subsystem) {
  [
    Subsystem(
      name: "memory_manager",
      phase: CoreInit,
      dependencies: [],
      init_time_ns: 0,
      status: Pending,
    ),
    Subsystem(
      name: "scheduler",
      phase: CoreInit,
      dependencies: ["memory_manager"],
      init_time_ns: 0,
      status: Pending,
    ),
    Subsystem(
      name: "message_router",
      phase: CoreInit,
      dependencies: ["memory_manager"],
      init_time_ns: 0,
      status: Pending,
    ),
    Subsystem(
      name: "capabilities_engine",
      phase: CoreInit,
      dependencies: ["memory_manager"],
      init_time_ns: 0,
      status: Pending,
    ),
    Subsystem(
      name: "module_registry",
      phase: CoreInit,
      dependencies: ["memory_manager", "capabilities_engine"],
      init_time_ns: 0,
      status: Pending,
    ),
    Subsystem(
      name: "wasm_loader",
      phase: DriverInit,
      dependencies: ["module_registry", "capabilities_engine"],
      init_time_ns: 0,
      status: Pending,
    ),
    Subsystem(
      name: "firestore_driver",
      phase: DriverInit,
      dependencies: ["capabilities_engine"],
      init_time_ns: 0,
      status: Pending,
    ),
    Subsystem(
      name: "filesystem_driver",
      phase: DriverInit,
      dependencies: ["capabilities_engine"],
      init_time_ns: 0,
      status: Pending,
    ),
  ]
}

// ============================================================================
// SECTION 3: INITIALIZATION PHASES
// ============================================================================

/// Run the complete initialization sequence
pub fn run(init: KernelInit, now_ns: Int) -> KernelInit {
  init
  |> run_phase(PreInit, now_ns)
  |> run_phase(CoreInit, now_ns)
  |> run_phase(DriverInit, now_ns)
  |> run_phase(ServiceInit, now_ns)
  |> run_phase(PostInit, now_ns)
  |> finalize()
}

/// Run a specific initialization phase
pub fn run_phase(init: KernelInit, phase: InitPhase, now_ns: Int) -> KernelInit {
  case init.phase {
    Failed(_) -> init
    _ -> {
      let init = KernelInit(..init, phase: phase)
      let subsystems_in_phase = get_subsystems_for_phase(init.subsystems, phase)
      init_subsystems(init, subsystems_in_phase, now_ns)
    }
  }
}

/// Finalize initialization
fn finalize(init: KernelInit) -> KernelInit {
  case init.errors {
    [] -> KernelInit(..init, phase: Complete)
    _ -> KernelInit(..init, phase: Failed("Initialization errors occurred"))
  }
}

// ============================================================================
// SECTION 4: SUBSYSTEM INITIALIZATION
// ============================================================================

fn init_subsystems(
  init: KernelInit,
  subsystems: List(Subsystem),
  now_ns: Int,
) -> KernelInit {
  case subsystems {
    [] -> init
    [subsystem, ..rest] -> {
      let init = init_subsystem(init, subsystem, now_ns)
      init_subsystems(init, rest, now_ns)
    }
  }
}

fn init_subsystem(
  init: KernelInit,
  subsystem: Subsystem,
  now_ns: Int,
) -> KernelInit {
  // Check dependencies
  case check_dependencies(init.subsystems, subsystem.dependencies) {
    False -> {
      let error = "Dependencies not satisfied for " <> subsystem.name
      add_error(init, error)
    }
    True -> {
      // Mark as initializing
      let subsystems = update_subsystem_status(
        init.subsystems,
        subsystem.name,
        Initializing,
      )
      let init = KernelInit(..init, subsystems: subsystems)
      
      // Simulate initialization (in real implementation, call actual init)
      let result = do_init(subsystem)
      
      // Update status based on result
      case result {
        InitOk -> {
          let subsystems = update_subsystem(
            init.subsystems,
            subsystem.name,
            Ready,
            now_ns,
          )
          KernelInit(..init, subsystems: subsystems)
        }
        InitFailed(reason) -> {
          let subsystems = update_subsystem_status(
            init.subsystems,
            subsystem.name,
            Error(reason),
          )
          let init = KernelInit(..init, subsystems: subsystems)
          add_error(init, reason)
        }
        InitSkipped -> init
      }
    }
  }
}

fn do_init(_subsystem: Subsystem) -> InitResult {
  // Placeholder for actual initialization logic
  InitOk
}

// ============================================================================
// SECTION 5: QUERY FUNCTIONS
// ============================================================================

/// Get current initialization phase
pub fn get_phase(init: KernelInit) -> InitPhase {
  init.phase
}

/// Check if initialization is complete
pub fn is_complete(init: KernelInit) -> Bool {
  case init.phase {
    Complete -> True
    _ -> False
  }
}

/// Check if initialization failed
pub fn is_failed(init: KernelInit) -> Bool {
  case init.phase {
    Failed(_) -> True
    _ -> False
  }
}

/// Get all errors
pub fn get_errors(init: KernelInit) -> List(String) {
  init.errors
}

/// Get subsystem status
pub fn get_subsystem_status(
  init: KernelInit,
  name: String,
) -> Result(SubsystemStatus, Nil) {
  find_subsystem_status(init.subsystems, name)
}

/// Get all ready subsystems
pub fn get_ready_subsystems(init: KernelInit) -> List(String) {
  filter_ready_names(init.subsystems)
}

/// Get initialization duration
pub fn get_duration_ns(init: KernelInit, now_ns: Int) -> Int {
  now_ns - init.start_time_ns
}

// ============================================================================
// SECTION 6: HELPER FUNCTIONS
// ============================================================================

fn get_subsystems_for_phase(
  subsystems: List(Subsystem),
  phase: InitPhase,
) -> List(Subsystem) {
  case subsystems {
    [] -> []
    [sub, ..rest] ->
      case phases_equal(sub.phase, phase) {
        True -> [sub, ..get_subsystems_for_phase(rest, phase)]
        False -> get_subsystems_for_phase(rest, phase)
      }
  }
}

fn phases_equal(a: InitPhase, b: InitPhase) -> Bool {
  case a, b {
    PreInit, PreInit -> True
    CoreInit, CoreInit -> True
    DriverInit, DriverInit -> True
    ServiceInit, ServiceInit -> True
    PostInit, PostInit -> True
    Complete, Complete -> True
    _, _ -> False
  }
}

fn check_dependencies(
  subsystems: List(Subsystem),
  dependencies: List(String),
) -> Bool {
  case dependencies {
    [] -> True
    [dep, ..rest] ->
      case is_subsystem_ready(subsystems, dep) {
        False -> False
        True -> check_dependencies(subsystems, rest)
      }
  }
}

fn is_subsystem_ready(subsystems: List(Subsystem), name: String) -> Bool {
  case subsystems {
    [] -> False
    [sub, ..rest] ->
      case sub.name == name {
        True ->
          case sub.status {
            Ready -> True
            _ -> False
          }
        False -> is_subsystem_ready(rest, name)
      }
  }
}

fn update_subsystem_status(
  subsystems: List(Subsystem),
  name: String,
  status: SubsystemStatus,
) -> List(Subsystem) {
  case subsystems {
    [] -> []
    [sub, ..rest] ->
      case sub.name == name {
        True -> [Subsystem(..sub, status: status), ..rest]
        False -> [sub, ..update_subsystem_status(rest, name, status)]
      }
  }
}

fn update_subsystem(
  subsystems: List(Subsystem),
  name: String,
  status: SubsystemStatus,
  init_time_ns: Int,
) -> List(Subsystem) {
  case subsystems {
    [] -> []
    [sub, ..rest] ->
      case sub.name == name {
        True -> [Subsystem(..sub, status: status, init_time_ns: init_time_ns), ..rest]
        False -> [sub, ..update_subsystem(rest, name, status, init_time_ns)]
      }
  }
}

fn add_error(init: KernelInit, error: String) -> KernelInit {
  KernelInit(..init, errors: [error, ..init.errors])
}

fn find_subsystem_status(
  subsystems: List(Subsystem),
  name: String,
) -> Result(SubsystemStatus, Nil) {
  case subsystems {
    [] -> Error(Nil)
    [sub, ..rest] ->
      case sub.name == name {
        True -> Ok(sub.status)
        False -> find_subsystem_status(rest, name)
      }
  }
}

fn filter_ready_names(subsystems: List(Subsystem)) -> List(String) {
  case subsystems {
    [] -> []
    [sub, ..rest] ->
      case sub.status {
        Ready -> [sub.name, ..filter_ready_names(rest)]
        _ -> filter_ready_names(rest)
      }
  }
}
