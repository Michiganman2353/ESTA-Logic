//// estalogic_kernel/realtime/constraints.gleam
////
//// Soft Real-Time Constraints - Mission-Critical Timing Guarantees
////
//// This module defines the soft real-time constraints for the ESTA Logic
//// microkernel, ensuring predictable timing behavior for compliance-critical
//// operations.
////
//// Key Components:
//// 1. End-to-End Latency Budgets
////    - Request-to-response timing bounds
////    - Per-subsystem latency allocation
////    - Latency monitoring and alerts
////
//// 2. Maximum Jitter Specifications
////    - Timing variance bounds
////    - Jitter detection and mitigation
////    - Statistical jitter analysis
////
//// 3. Recovery Time Objectives (RTO)
////    - Trap recovery timing
////    - Process restart timing
////    - Driver reconnection timing
////
//// Reference: docs/safety/safety_case.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: TIME UNITS AND CONSTANTS
// ============================================================================

/// Time value in microseconds for precision
pub type TimeMicros {
  TimeMicros(value: Int)
}

/// Time value in milliseconds
pub type TimeMillis {
  TimeMillis(value: Int)
}

/// Convert milliseconds to microseconds
pub fn millis_to_micros(ms: TimeMillis) -> TimeMicros {
  TimeMicros(ms.value * 1000)
}

/// Convert microseconds to milliseconds (truncating)
pub fn micros_to_millis(us: TimeMicros) -> TimeMillis {
  TimeMillis(us.value / 1000)
}

/// Standard timing constants
pub const max_message_latency_us: Int = 1_000
// 1 ms

pub const max_scheduling_latency_us: Int = 500
// 500 μs

pub const max_memory_alloc_latency_us: Int = 100
// 100 μs

pub const max_context_switch_latency_us: Int = 50
// 50 μs

pub const max_syscall_latency_us: Int = 200
// 200 μs

// ============================================================================
// SECTION 2: LATENCY BUDGET TYPES
// ============================================================================

/// End-to-end latency budget for a complete operation
pub type LatencyBudget {
  LatencyBudget(
    /// Total allowed latency
    total_budget_us: Int,
    /// Breakdown by component
    components: List(ComponentBudget),
    /// Remaining budget
    remaining_us: Int,
    /// Whether budget is exceeded
    exceeded: Bool,
    /// Budget metadata
    metadata: BudgetMetadata,
  )
}

/// Budget allocation for a single component
pub type ComponentBudget {
  ComponentBudget(
    /// Component name
    component: Component,
    /// Allocated time in microseconds
    allocated_us: Int,
    /// Actually consumed time in microseconds
    consumed_us: Int,
    /// Whether this component exceeded its budget
    exceeded: Bool,
  )
}

/// System components that consume latency budget
pub type Component {
  /// Message serialization
  ComponentSerialization
  /// Network/IPC transmission
  ComponentTransmission
  /// Message deserialization
  ComponentDeserialization
  /// Business logic processing
  ComponentProcessing
  /// Memory allocation
  ComponentMemoryAlloc
  /// Disk I/O
  ComponentDiskIO
  /// Database access
  ComponentDatabase
  /// External service call
  ComponentExternalService
  /// Scheduling overhead
  ComponentScheduling
  /// Context switch
  ComponentContextSwitch
  /// Custom component
  ComponentCustom(name: String)
}

/// Metadata for latency budget tracking
pub type BudgetMetadata {
  BudgetMetadata(
    /// Operation identifier
    operation_id: Int,
    /// Operation type
    operation_type: String,
    /// Start timestamp
    started_at_us: Int,
    /// Priority level
    priority: Int,
    /// Caller process ID
    caller_pid: Int,
  )
}

// ============================================================================
// SECTION 3: STANDARD LATENCY BUDGETS
// ============================================================================

/// Create standard latency budget for ESTA accrual calculation
pub fn accrual_calculation_budget(operation_id: Int, started_at_us: Int, caller_pid: Int) -> LatencyBudget {
  LatencyBudget(
    total_budget_us: 10_000,  // 10 ms total
    components: [
      ComponentBudget(ComponentDeserialization, 500, 0, False),
      ComponentBudget(ComponentProcessing, 5000, 0, False),
      ComponentBudget(ComponentMemoryAlloc, 500, 0, False),
      ComponentBudget(ComponentDatabase, 3000, 0, False),
      ComponentBudget(ComponentSerialization, 500, 0, False),
      ComponentBudget(ComponentScheduling, 500, 0, False),
    ],
    remaining_us: 10_000,
    exceeded: False,
    metadata: BudgetMetadata(
      operation_id: operation_id,
      operation_type: "accrual_calculation",
      started_at_us: started_at_us,
      priority: 3,
      caller_pid: caller_pid,
    ),
  )
}

/// Create standard latency budget for audit record write
pub fn audit_write_budget(operation_id: Int, started_at_us: Int, caller_pid: Int) -> LatencyBudget {
  LatencyBudget(
    total_budget_us: 5_000,  // 5 ms total
    components: [
      ComponentBudget(ComponentSerialization, 200, 0, False),
      ComponentBudget(ComponentDiskIO, 3000, 0, False),
      ComponentBudget(ComponentMemoryAlloc, 200, 0, False),
      ComponentBudget(ComponentScheduling, 100, 0, False),
    ],
    remaining_us: 5_000,
    exceeded: False,
    metadata: BudgetMetadata(
      operation_id: operation_id,
      operation_type: "audit_write",
      started_at_us: started_at_us,
      priority: 4,
      caller_pid: caller_pid,
    ),
  )
}

/// Create standard latency budget for message passing
pub fn message_passing_budget(operation_id: Int, started_at_us: Int, caller_pid: Int) -> LatencyBudget {
  LatencyBudget(
    total_budget_us: 2_000,  // 2 ms total
    components: [
      ComponentBudget(ComponentSerialization, 200, 0, False),
      ComponentBudget(ComponentTransmission, 500, 0, False),
      ComponentBudget(ComponentDeserialization, 200, 0, False),
      ComponentBudget(ComponentScheduling, 200, 0, False),
      ComponentBudget(ComponentContextSwitch, 100, 0, False),
    ],
    remaining_us: 2_000,
    exceeded: False,
    metadata: BudgetMetadata(
      operation_id: operation_id,
      operation_type: "message_passing",
      started_at_us: started_at_us,
      priority: 3,
      caller_pid: caller_pid,
    ),
  )
}

/// Create standard latency budget for process spawn
pub fn process_spawn_budget(operation_id: Int, started_at_us: Int, caller_pid: Int) -> LatencyBudget {
  LatencyBudget(
    total_budget_us: 50_000,  // 50 ms total
    components: [
      ComponentBudget(ComponentMemoryAlloc, 5000, 0, False),
      ComponentBudget(ComponentProcessing, 20_000, 0, False),
      ComponentBudget(ComponentScheduling, 1000, 0, False),
      ComponentBudget(ComponentDiskIO, 20_000, 0, False),
    ],
    remaining_us: 50_000,
    exceeded: False,
    metadata: BudgetMetadata(
      operation_id: operation_id,
      operation_type: "process_spawn",
      started_at_us: started_at_us,
      priority: 2,
      caller_pid: caller_pid,
    ),
  )
}

// ============================================================================
// SECTION 4: BUDGET CONSUMPTION
// ============================================================================

/// Result of consuming budget
pub type ConsumeResult {
  /// Budget consumed successfully, still within limits
  ConsumeOk(remaining_us: Int)
  /// Component exceeded its budget
  ConsumeComponentExceeded(component: Component, exceeded_by_us: Int)
  /// Total budget exceeded
  ConsumeTotalExceeded(exceeded_by_us: Int)
}

/// Consume budget for a component
pub fn consume_budget(
  budget: LatencyBudget,
  component: Component,
  consumed_us: Int,
) -> #(LatencyBudget, ConsumeResult) {
  let new_remaining = budget.remaining_us - consumed_us
  let new_components = update_component(budget.components, component, consumed_us)
  
  let exceeded = new_remaining < 0
  let component_exceeded = check_component_exceeded(new_components, component)
  
  let new_budget = LatencyBudget(
    ..budget,
    components: new_components,
    remaining_us: new_remaining,
    exceeded: exceeded,
  )
  
  case exceeded {
    True -> #(new_budget, ConsumeTotalExceeded(-new_remaining))
    False ->
      case component_exceeded {
        True -> #(
          new_budget,
          ConsumeComponentExceeded(component, get_component_excess(new_components, component)),
        )
        False -> #(new_budget, ConsumeOk(new_remaining))
      }
  }
}

/// Update component's consumed time
fn update_component(
  components: List(ComponentBudget),
  target: Component,
  consumed: Int,
) -> List(ComponentBudget) {
  case components {
    [] -> []
    [comp, ..rest] ->
      case component_matches(comp.component, target) {
        True -> {
          let new_consumed = comp.consumed_us + consumed
          let exceeded = new_consumed > comp.allocated_us
          [ComponentBudget(..comp, consumed_us: new_consumed, exceeded: exceeded), ..rest]
        }
        False -> [comp, ..update_component(rest, target, consumed)]
      }
  }
}

/// Check if a component matches
fn component_matches(a: Component, b: Component) -> Bool {
  case a, b {
    ComponentSerialization, ComponentSerialization -> True
    ComponentTransmission, ComponentTransmission -> True
    ComponentDeserialization, ComponentDeserialization -> True
    ComponentProcessing, ComponentProcessing -> True
    ComponentMemoryAlloc, ComponentMemoryAlloc -> True
    ComponentDiskIO, ComponentDiskIO -> True
    ComponentDatabase, ComponentDatabase -> True
    ComponentExternalService, ComponentExternalService -> True
    ComponentScheduling, ComponentScheduling -> True
    ComponentContextSwitch, ComponentContextSwitch -> True
    ComponentCustom(n1), ComponentCustom(n2) -> n1 == n2
    _, _ -> False
  }
}

/// Check if component exceeded budget
fn check_component_exceeded(components: List(ComponentBudget), target: Component) -> Bool {
  case components {
    [] -> False
    [comp, ..rest] ->
      case component_matches(comp.component, target) {
        True -> comp.exceeded
        False -> check_component_exceeded(rest, target)
      }
  }
}

/// Get excess time for component
fn get_component_excess(components: List(ComponentBudget), target: Component) -> Int {
  case components {
    [] -> 0
    [comp, ..rest] ->
      case component_matches(comp.component, target) {
        True -> comp.consumed_us - comp.allocated_us
        False -> get_component_excess(rest, target)
      }
  }
}

// ============================================================================
// SECTION 5: JITTER TYPES AND TRACKING
// ============================================================================

/// Jitter measurement for an operation
pub type JitterMeasurement {
  JitterMeasurement(
    /// Minimum observed latency (microseconds)
    min_latency_us: Int,
    /// Maximum observed latency (microseconds)
    max_latency_us: Int,
    /// Average latency (microseconds)
    avg_latency_us: Int,
    /// Standard deviation (microseconds)
    std_dev_us: Int,
    /// Peak-to-peak jitter (max - min)
    peak_to_peak_us: Int,
    /// Number of samples
    sample_count: Int,
    /// Number of outliers (> 2 std dev)
    outlier_count: Int,
  )
}

/// Jitter specification for an operation type
pub type JitterSpec {
  JitterSpec(
    /// Operation type
    operation_type: String,
    /// Maximum allowed peak-to-peak jitter
    max_peak_to_peak_us: Int,
    /// Maximum allowed standard deviation
    max_std_dev_us: Int,
    /// Maximum percentage of outliers allowed
    max_outlier_percent: Int,
    /// Measurement window (samples)
    window_size: Int,
  )
}

/// Jitter tracking state
pub type JitterTracker {
  JitterTracker(
    /// Specification being tracked against
    spec: JitterSpec,
    /// Recent latency samples
    samples: List(Int),
    /// Current measurement
    current: JitterMeasurement,
    /// Whether jitter is within spec
    within_spec: Bool,
    /// Alerts generated
    alerts: List(JitterAlert),
  )
}

/// Jitter alert
pub type JitterAlert {
  JitterAlert(
    /// Alert type
    alert_type: JitterAlertType,
    /// When alert was generated
    timestamp_us: Int,
    /// Current value
    current_value: Int,
    /// Threshold exceeded
    threshold: Int,
    /// Alert message
    message: String,
  )
}

/// Types of jitter alerts
pub type JitterAlertType {
  /// Peak-to-peak jitter exceeded
  AlertPeakToPeakExceeded
  /// Standard deviation exceeded
  AlertStdDevExceeded
  /// Too many outliers
  AlertOutlierRateExceeded
  /// Sudden jitter spike
  AlertJitterSpike
}

// ============================================================================
// SECTION 6: STANDARD JITTER SPECIFICATIONS
// ============================================================================

/// Jitter specification for message passing
pub fn message_passing_jitter_spec() -> JitterSpec {
  JitterSpec(
    operation_type: "message_passing",
    max_peak_to_peak_us: 500,     // 500 μs max jitter
    max_std_dev_us: 100,          // 100 μs std dev
    max_outlier_percent: 5,       // 5% outliers allowed
    window_size: 100,             // 100 sample window
  )
}

/// Jitter specification for scheduling
pub fn scheduling_jitter_spec() -> JitterSpec {
  JitterSpec(
    operation_type: "scheduling",
    max_peak_to_peak_us: 200,     // 200 μs max jitter
    max_std_dev_us: 50,           // 50 μs std dev
    max_outlier_percent: 2,       // 2% outliers allowed
    window_size: 100,
  )
}

/// Jitter specification for context switch
pub fn context_switch_jitter_spec() -> JitterSpec {
  JitterSpec(
    operation_type: "context_switch",
    max_peak_to_peak_us: 100,     // 100 μs max jitter
    max_std_dev_us: 25,           // 25 μs std dev
    max_outlier_percent: 1,       // 1% outliers allowed
    window_size: 100,
  )
}

/// Jitter specification for real-time operations
pub fn realtime_jitter_spec() -> JitterSpec {
  JitterSpec(
    operation_type: "realtime",
    max_peak_to_peak_us: 50,      // 50 μs max jitter
    max_std_dev_us: 10,           // 10 μs std dev
    max_outlier_percent: 0,       // No outliers allowed
    window_size: 100,
  )
}

// ============================================================================
// SECTION 7: JITTER TRACKING OPERATIONS
// ============================================================================

/// Create a new jitter tracker
pub fn new_jitter_tracker(spec: JitterSpec) -> JitterTracker {
  JitterTracker(
    spec: spec,
    samples: [],
    current: JitterMeasurement(
      min_latency_us: 0,
      max_latency_us: 0,
      avg_latency_us: 0,
      std_dev_us: 0,
      peak_to_peak_us: 0,
      sample_count: 0,
      outlier_count: 0,
    ),
    within_spec: True,
    alerts: [],
  )
}

/// Add a latency sample to the tracker
pub fn add_sample(tracker: JitterTracker, latency_us: Int, timestamp_us: Int) -> JitterTracker {
  // Add sample, maintaining window size
  let new_samples = case list_length(tracker.samples) >= tracker.spec.window_size {
    True -> [latency_us, ..list_take(tracker.samples, tracker.spec.window_size - 1)]
    False -> [latency_us, ..tracker.samples]
  }
  
  // Recalculate statistics
  let new_measurement = calculate_jitter_stats(new_samples)
  
  // Check against spec
  let #(within_spec, new_alerts) = check_jitter_spec(tracker.spec, new_measurement, timestamp_us)
  
  JitterTracker(
    spec: tracker.spec,
    samples: new_samples,
    current: new_measurement,
    within_spec: within_spec,
    alerts: list_append(tracker.alerts, new_alerts),
  )
}

/// Calculate jitter statistics from samples
fn calculate_jitter_stats(samples: List(Int)) -> JitterMeasurement {
  case samples {
    [] -> JitterMeasurement(0, 0, 0, 0, 0, 0, 0)
    _ -> {
      let count = list_length(samples)
      let min_val = list_min(samples)
      let max_val = list_max(samples)
      let sum = list_sum(samples)
      let avg = sum / count
      let variance = calculate_variance(samples, avg)
      let std_dev = int_sqrt(variance)
      let outliers = count_outliers(samples, avg, std_dev)
      
      JitterMeasurement(
        min_latency_us: min_val,
        max_latency_us: max_val,
        avg_latency_us: avg,
        std_dev_us: std_dev,
        peak_to_peak_us: max_val - min_val,
        sample_count: count,
        outlier_count: outliers,
      )
    }
  }
}

/// Check if jitter is within spec
fn check_jitter_spec(
  spec: JitterSpec,
  measurement: JitterMeasurement,
  timestamp_us: Int,
) -> #(Bool, List(JitterAlert)) {
  let alerts = []
  let within_spec = True
  
  // Check peak-to-peak
  let #(within_spec, alerts) = case measurement.peak_to_peak_us > spec.max_peak_to_peak_us {
    True -> #(
      False,
      [JitterAlert(
        AlertPeakToPeakExceeded,
        timestamp_us,
        measurement.peak_to_peak_us,
        spec.max_peak_to_peak_us,
        "Peak-to-peak jitter exceeded",
      ), ..alerts],
    )
    False -> #(within_spec, alerts)
  }
  
  // Check standard deviation
  let #(within_spec, alerts) = case measurement.std_dev_us > spec.max_std_dev_us {
    True -> #(
      False,
      [JitterAlert(
        AlertStdDevExceeded,
        timestamp_us,
        measurement.std_dev_us,
        spec.max_std_dev_us,
        "Standard deviation exceeded",
      ), ..alerts],
    )
    False -> #(within_spec, alerts)
  }
  
  // Check outlier rate
  let outlier_percent = case measurement.sample_count {
    0 -> 0
    n -> measurement.outlier_count * 100 / n
  }
  let #(within_spec, alerts) = case outlier_percent > spec.max_outlier_percent {
    True -> #(
      False,
      [JitterAlert(
        AlertOutlierRateExceeded,
        timestamp_us,
        outlier_percent,
        spec.max_outlier_percent,
        "Outlier rate exceeded",
      ), ..alerts],
    )
    False -> #(within_spec, alerts)
  }
  
  #(within_spec, alerts)
}

// ============================================================================
// SECTION 8: RECOVERY TIME OBJECTIVES (RTO)
// ============================================================================

/// Recovery Time Objective specification
pub type RtoSpec {
  RtoSpec(
    /// Type of recovery
    recovery_type: RecoveryType,
    /// Target RTO in milliseconds
    target_rto_ms: Int,
    /// Maximum RTO in milliseconds (hard limit)
    max_rto_ms: Int,
    /// Warning threshold (percentage of target)
    warning_threshold_percent: Int,
    /// Actions to take on RTO violation
    violation_actions: List(RtoAction),
  )
}

/// Types of recovery operations
pub type RecoveryType {
  /// Recovery from WASM trap
  RecoveryFromTrap
  /// Process restart
  RecoveryProcessRestart
  /// Driver reconnection
  RecoveryDriverReconnect
  /// Failover to secondary
  RecoveryFailover
  /// Module reload
  RecoveryModuleReload
  /// Supervisor restart
  RecoverySupervisorRestart
  /// Custom recovery type
  RecoveryCustom(name: String)
}

/// Actions to take on RTO events
pub type RtoAction {
  /// Log the event
  ActionLog
  /// Send alert notification
  ActionAlert
  /// Escalate to supervisor
  ActionEscalate
  /// Skip recovery and terminate
  ActionTerminate
  /// Retry with extended timeout
  ActionRetryExtended
}

/// RTO tracking state
pub type RtoTracker {
  RtoTracker(
    /// Active recovery operations
    active: List(ActiveRecovery),
    /// Completed recoveries (for statistics)
    completed: List(CompletedRecovery),
    /// Statistics
    stats: RtoStats,
  )
}

/// Active recovery operation
pub type ActiveRecovery {
  ActiveRecovery(
    /// Recovery identifier
    recovery_id: Int,
    /// Recovery type
    recovery_type: RecoveryType,
    /// RTO specification
    spec: RtoSpec,
    /// Start timestamp (milliseconds)
    started_at_ms: Int,
    /// Current phase
    phase: RecoveryPhase,
    /// Process being recovered (if applicable)
    process_id: Result(Int, Nil),
    /// Driver being recovered (if applicable)
    driver_id: Result(String, Nil),
  )
}

/// Phases of recovery
pub type RecoveryPhase {
  /// Recovery initiated
  PhaseInitiated
  /// Cleaning up failed state
  PhaseCleanup
  /// Restoring from checkpoint
  PhaseRestore
  /// Reinitializing
  PhaseReinit
  /// Validating recovery
  PhaseValidate
  /// Recovery complete
  PhaseComplete
  /// Recovery failed
  PhaseFailed(reason: String)
}

/// Completed recovery record
pub type CompletedRecovery {
  CompletedRecovery(
    /// Recovery identifier
    recovery_id: Int,
    /// Recovery type
    recovery_type: RecoveryType,
    /// Actual duration (milliseconds)
    duration_ms: Int,
    /// Whether RTO was met
    rto_met: Bool,
    /// Whether recovery succeeded
    success: Bool,
    /// Timestamp
    completed_at_ms: Int,
  )
}

/// RTO statistics
pub type RtoStats {
  RtoStats(
    /// Total recoveries
    total_recoveries: Int,
    /// Successful recoveries
    successful_recoveries: Int,
    /// RTO met count
    rto_met_count: Int,
    /// RTO violated count
    rto_violated_count: Int,
    /// Average recovery time (ms)
    avg_recovery_time_ms: Int,
    /// 99th percentile recovery time (ms)
    p99_recovery_time_ms: Int,
    /// Worst recovery time (ms)
    worst_recovery_time_ms: Int,
  )
}

// ============================================================================
// SECTION 9: STANDARD RTO SPECIFICATIONS
// ============================================================================

/// RTO specification for WASM trap recovery
pub fn trap_recovery_rto() -> RtoSpec {
  RtoSpec(
    recovery_type: RecoveryFromTrap,
    target_rto_ms: 100,           // 100 ms target
    max_rto_ms: 500,              // 500 ms hard limit
    warning_threshold_percent: 80, // Warn at 80 ms
    violation_actions: [ActionLog, ActionAlert],
  )
}

/// RTO specification for process restart
pub fn process_restart_rto() -> RtoSpec {
  RtoSpec(
    recovery_type: RecoveryProcessRestart,
    target_rto_ms: 1000,          // 1 second target
    max_rto_ms: 5000,             // 5 seconds hard limit
    warning_threshold_percent: 80,
    violation_actions: [ActionLog, ActionAlert, ActionEscalate],
  )
}

/// RTO specification for driver reconnection
pub fn driver_reconnect_rto() -> RtoSpec {
  RtoSpec(
    recovery_type: RecoveryDriverReconnect,
    target_rto_ms: 5000,          // 5 seconds target
    max_rto_ms: 30_000,           // 30 seconds hard limit
    warning_threshold_percent: 80,
    violation_actions: [ActionLog, ActionAlert, ActionRetryExtended],
  )
}

/// RTO specification for failover
pub fn failover_rto() -> RtoSpec {
  RtoSpec(
    recovery_type: RecoveryFailover,
    target_rto_ms: 5000,          // 5 seconds target
    max_rto_ms: 15_000,           // 15 seconds hard limit
    warning_threshold_percent: 80,
    violation_actions: [ActionLog, ActionAlert, ActionEscalate],
  )
}

/// RTO specification for module reload
pub fn module_reload_rto() -> RtoSpec {
  RtoSpec(
    recovery_type: RecoveryModuleReload,
    target_rto_ms: 2000,          // 2 seconds target
    max_rto_ms: 10_000,           // 10 seconds hard limit
    warning_threshold_percent: 80,
    violation_actions: [ActionLog, ActionAlert],
  )
}

/// RTO specification for supervisor restart
pub fn supervisor_restart_rto() -> RtoSpec {
  RtoSpec(
    recovery_type: RecoverySupervisorRestart,
    target_rto_ms: 10_000,        // 10 seconds target
    max_rto_ms: 60_000,           // 60 seconds hard limit
    warning_threshold_percent: 80,
    violation_actions: [ActionLog, ActionAlert, ActionEscalate],
  )
}

// ============================================================================
// SECTION 10: RTO TRACKING OPERATIONS
// ============================================================================

/// Create a new RTO tracker
pub fn new_rto_tracker() -> RtoTracker {
  RtoTracker(
    active: [],
    completed: [],
    stats: RtoStats(
      total_recoveries: 0,
      successful_recoveries: 0,
      rto_met_count: 0,
      rto_violated_count: 0,
      avg_recovery_time_ms: 0,
      p99_recovery_time_ms: 0,
      worst_recovery_time_ms: 0,
    ),
  )
}

/// Start tracking a recovery operation
pub fn start_recovery(
  tracker: RtoTracker,
  recovery_id: Int,
  spec: RtoSpec,
  now_ms: Int,
) -> RtoTracker {
  let recovery = ActiveRecovery(
    recovery_id: recovery_id,
    recovery_type: spec.recovery_type,
    spec: spec,
    started_at_ms: now_ms,
    phase: PhaseInitiated,
    process_id: Error(Nil),
    driver_id: Error(Nil),
  )
  RtoTracker(..tracker, active: [recovery, ..tracker.active])
}

/// Update recovery phase
pub fn update_recovery_phase(
  tracker: RtoTracker,
  recovery_id: Int,
  new_phase: RecoveryPhase,
) -> RtoTracker {
  let new_active = update_recovery_in_list(tracker.active, recovery_id, new_phase)
  RtoTracker(..tracker, active: new_active)
}

fn update_recovery_in_list(
  recoveries: List(ActiveRecovery),
  recovery_id: Int,
  new_phase: RecoveryPhase,
) -> List(ActiveRecovery) {
  case recoveries {
    [] -> []
    [r, ..rest] ->
      case r.recovery_id == recovery_id {
        True -> [ActiveRecovery(..r, phase: new_phase), ..rest]
        False -> [r, ..update_recovery_in_list(rest, recovery_id, new_phase)]
      }
  }
}

/// Complete a recovery operation
pub fn complete_recovery(
  tracker: RtoTracker,
  recovery_id: Int,
  success: Bool,
  now_ms: Int,
) -> #(RtoTracker, RtoCheckResult) {
  case find_recovery(tracker.active, recovery_id) {
    Error(Nil) -> #(tracker, RtoRecoveryNotFound)
    Ok(recovery) -> {
      let duration_ms = now_ms - recovery.started_at_ms
      let rto_met = duration_ms <= recovery.spec.target_rto_ms
      
      let completed = CompletedRecovery(
        recovery_id: recovery_id,
        recovery_type: recovery.recovery_type,
        duration_ms: duration_ms,
        rto_met: rto_met,
        success: success,
        completed_at_ms: now_ms,
      )
      
      let new_active = remove_recovery(tracker.active, recovery_id)
      let new_completed = [completed, ..tracker.completed]
      let new_stats = update_stats(tracker.stats, completed)
      
      let result = case rto_met {
        True -> RtoMet(duration_ms)
        False -> RtoViolated(duration_ms, recovery.spec.target_rto_ms)
      }
      
      #(
        RtoTracker(active: new_active, completed: new_completed, stats: new_stats),
        result,
      )
    }
  }
}

/// Check if any active recovery has exceeded RTO
pub fn check_active_recoveries(tracker: RtoTracker, now_ms: Int) -> List(RtoCheckResult) {
  list_map(tracker.active, fn(r) {
    let elapsed_ms = now_ms - r.started_at_ms
    case elapsed_ms > r.spec.max_rto_ms {
      True -> RtoHardLimitExceeded(r.recovery_id, elapsed_ms, r.spec.max_rto_ms)
      False ->
        case elapsed_ms > r.spec.target_rto_ms {
          True -> RtoViolated(elapsed_ms, r.spec.target_rto_ms)
          False -> {
            let warning_threshold = r.spec.target_rto_ms * r.spec.warning_threshold_percent / 100
            case elapsed_ms > warning_threshold {
              True -> RtoWarning(elapsed_ms, warning_threshold)
              False -> RtoOnTrack(elapsed_ms, r.spec.target_rto_ms)
            }
          }
        }
    }
  })
}

/// Result of RTO check
pub type RtoCheckResult {
  /// Recovery is on track
  RtoOnTrack(elapsed_ms: Int, target_ms: Int)
  /// Warning threshold exceeded
  RtoWarning(elapsed_ms: Int, warning_threshold_ms: Int)
  /// RTO violated but within hard limit
  RtoViolated(elapsed_ms: Int, target_ms: Int)
  /// Hard limit exceeded
  RtoHardLimitExceeded(recovery_id: Int, elapsed_ms: Int, limit_ms: Int)
  /// RTO was met
  RtoMet(duration_ms: Int)
  /// Recovery not found
  RtoRecoveryNotFound
}

fn find_recovery(
  recoveries: List(ActiveRecovery),
  recovery_id: Int,
) -> Result(ActiveRecovery, Nil) {
  case recoveries {
    [] -> Error(Nil)
    [r, ..rest] ->
      case r.recovery_id == recovery_id {
        True -> Ok(r)
        False -> find_recovery(rest, recovery_id)
      }
  }
}

fn remove_recovery(
  recoveries: List(ActiveRecovery),
  recovery_id: Int,
) -> List(ActiveRecovery) {
  case recoveries {
    [] -> []
    [r, ..rest] ->
      case r.recovery_id == recovery_id {
        True -> rest
        False -> [r, ..remove_recovery(rest, recovery_id)]
      }
  }
}

fn update_stats(stats: RtoStats, completed: CompletedRecovery) -> RtoStats {
  let new_total = stats.total_recoveries + 1
  let new_successful = case completed.success {
    True -> stats.successful_recoveries + 1
    False -> stats.successful_recoveries
  }
  let new_met = case completed.rto_met {
    True -> stats.rto_met_count + 1
    False -> stats.rto_met_count
  }
  let new_violated = case completed.rto_met {
    True -> stats.rto_violated_count
    False -> stats.rto_violated_count + 1
  }
  let new_avg = (stats.avg_recovery_time_ms * stats.total_recoveries + completed.duration_ms) / new_total
  let new_worst = case completed.duration_ms > stats.worst_recovery_time_ms {
    True -> completed.duration_ms
    False -> stats.worst_recovery_time_ms
  }
  
  RtoStats(
    total_recoveries: new_total,
    successful_recoveries: new_successful,
    rto_met_count: new_met,
    rto_violated_count: new_violated,
    avg_recovery_time_ms: new_avg,
    p99_recovery_time_ms: stats.p99_recovery_time_ms,  // Would need sorted list for accurate p99
    worst_recovery_time_ms: new_worst,
  )
}

// ============================================================================
// SECTION 11: TIMING CONSTRAINTS SUMMARY
// ============================================================================

/// Complete timing constraints configuration
pub type TimingConstraints {
  TimingConstraints(
    /// Latency budget configurations
    latency_budgets: List(LatencyBudgetConfig),
    /// Jitter specifications
    jitter_specs: List(JitterSpec),
    /// RTO specifications
    rto_specs: List(RtoSpec),
    /// Global timing parameters
    global_params: GlobalTimingParams,
  )
}

/// Configuration for a latency budget type
pub type LatencyBudgetConfig {
  LatencyBudgetConfig(
    /// Operation type
    operation_type: String,
    /// Total budget in microseconds
    total_budget_us: Int,
    /// Component allocations
    component_allocations: List(#(Component, Int)),
  )
}

/// Global timing parameters
pub type GlobalTimingParams {
  GlobalTimingParams(
    /// Scheduling tick interval (microseconds)
    tick_interval_us: Int,
    /// Minimum time slice (microseconds)
    min_time_slice_us: Int,
    /// Maximum time slice (microseconds)
    max_time_slice_us: Int,
    /// Watchdog interval (milliseconds)
    watchdog_interval_ms: Int,
    /// Maximum blocking time (milliseconds)
    max_blocking_time_ms: Int,
    /// Clock precision (nanoseconds)
    clock_precision_ns: Int,
  )
}

/// Default timing constraints
pub fn default_timing_constraints() -> TimingConstraints {
  TimingConstraints(
    latency_budgets: [
      LatencyBudgetConfig("accrual_calculation", 10_000, [
        #(ComponentProcessing, 5000),
        #(ComponentDatabase, 3000),
        #(ComponentSerialization, 1000),
        #(ComponentScheduling, 1000),
      ]),
      LatencyBudgetConfig("message_passing", 2_000, [
        #(ComponentTransmission, 500),
        #(ComponentSerialization, 400),
        #(ComponentScheduling, 200),
        #(ComponentContextSwitch, 100),
      ]),
    ],
    jitter_specs: [
      message_passing_jitter_spec(),
      scheduling_jitter_spec(),
      context_switch_jitter_spec(),
    ],
    rto_specs: [
      trap_recovery_rto(),
      process_restart_rto(),
      driver_reconnect_rto(),
      failover_rto(),
    ],
    global_params: GlobalTimingParams(
      tick_interval_us: 1000,       // 1 ms tick
      min_time_slice_us: 10_000,    // 10 ms minimum
      max_time_slice_us: 100_000,   // 100 ms maximum
      watchdog_interval_ms: 500,     // 500 ms watchdog
      max_blocking_time_ms: 1000,    // 1 second max block
      clock_precision_ns: 1000,      // 1 μs precision
    ),
  )
}

// ============================================================================
// SECTION 12: HELPER FUNCTIONS
// ============================================================================

/// Get length of list
fn list_length(list: List(a)) -> Int {
  case list {
    [] -> 0
    [_, ..tail] -> 1 + list_length(tail)
  }
}

/// Take first n elements from list
fn list_take(list: List(a), n: Int) -> List(a) {
  case n <= 0 {
    True -> []
    False ->
      case list {
        [] -> []
        [head, ..tail] -> [head, ..list_take(tail, n - 1)]
      }
  }
}

/// Append two lists
fn list_append(a: List(a), b: List(a)) -> List(a) {
  case a {
    [] -> b
    [head, ..tail] -> [head, ..list_append(tail, b)]
  }
}

/// Map over list
fn list_map(list: List(a), f: fn(a) -> b) -> List(b) {
  case list {
    [] -> []
    [head, ..tail] -> [f(head), ..list_map(tail, f)]
  }
}

/// Get minimum value in list
fn list_min(list: List(Int)) -> Int {
  case list {
    [] -> 0
    [x] -> x
    [x, ..rest] -> {
      let rest_min = list_min(rest)
      case x < rest_min {
        True -> x
        False -> rest_min
      }
    }
  }
}

/// Get maximum value in list
fn list_max(list: List(Int)) -> Int {
  case list {
    [] -> 0
    [x] -> x
    [x, ..rest] -> {
      let rest_max = list_max(rest)
      case x > rest_max {
        True -> x
        False -> rest_max
      }
    }
  }
}

/// Sum values in list
fn list_sum(list: List(Int)) -> Int {
  case list {
    [] -> 0
    [x, ..rest] -> x + list_sum(rest)
  }
}

/// Calculate variance
fn calculate_variance(samples: List(Int), avg: Int) -> Int {
  let sum_sq_diff = list_fold(samples, 0, fn(acc, x) {
    let diff = x - avg
    acc + diff * diff
  })
  case list_length(samples) {
    0 -> 0
    n -> sum_sq_diff / n
  }
}

/// Fold over list
fn list_fold(list: List(a), acc: b, f: fn(b, a) -> b) -> b {
  case list {
    [] -> acc
    [head, ..tail] -> list_fold(tail, f(acc, head), f)
  }
}

/// Count outliers (> 2 standard deviations from mean)
fn count_outliers(samples: List(Int), avg: Int, std_dev: Int) -> Int {
  let threshold = 2 * std_dev
  list_fold(samples, 0, fn(acc, x) {
    let diff = case x > avg {
      True -> x - avg
      False -> avg - x
    }
    case diff > threshold {
      True -> acc + 1
      False -> acc
    }
  })
}

/// Integer square root (approximation)
fn int_sqrt(n: Int) -> Int {
  case n <= 0 {
    True -> 0
    False -> int_sqrt_helper(n, n / 2)
  }
}

fn int_sqrt_helper(n: Int, guess: Int) -> Int {
  case guess <= 0 {
    True -> 1
    False -> {
      let new_guess = (guess + n / guess) / 2
      case new_guess >= guess {
        True -> guess
        False -> int_sqrt_helper(n, new_guess)
      }
    }
  }
}
