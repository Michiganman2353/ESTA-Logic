//// estalogic_kernel/isolation/guardrails.gleam
////
//// Space-Grade Runtime Hardening - Fault Containment Regions (FCRs)
////
//// This module implements fault containment and isolation mechanisms
//// for space-grade reliability. Key capabilities:
////
//// 1. Fault Containment Regions (FCRs)
////    - Kernel FCR: Core kernel operations
////    - Driver FCRs: Kafka, Redis, Postgres drivers
////    - Application FCRs: User-level processes
////    - Tauri FCR: Host boundary isolation
////
//// 2. Temporal Isolation
////    - Predictable scheduling
////    - Bounded operations with explicit timeouts
////
//// 3. Spatial Isolation
////    - Message payload size validation
////    - Fail-fast behavior on violations
////
//// Key Invariants:
//// - No fault in any region can cascade outside without going through 
////   a quarantine gateway
//// - WASM traps are routed to kernel quarantine for restartable process objects
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: FAULT CONTAINMENT REGION TYPES
// ============================================================================

/// Unique identifier for a fault containment region
pub type FcrId {
  FcrId(value: Int)
}

/// Types of Fault Containment Regions in the system
pub type FcrType {
  /// Kernel FCR - Core microkernel operations
  /// Highest trust level, minimal fault surface
  KernelFcr
  /// Driver FCR for Apache Kafka connections
  DriverKafkaFcr
  /// Driver FCR for Redis connections
  DriverRedisFcr
  /// Driver FCR for PostgreSQL connections
  DriverPostgresFcr
  /// Application process FCR - User-level WASM modules
  ApplicationFcr(module_id: Int)
  /// Tauri host boundary FCR - Native app interface
  TauriFcr
}

/// Current state of a Fault Containment Region
pub type FcrState {
  /// Region is operating normally
  FcrHealthy
  /// Region has detected a fault but is still operational
  FcrDegraded(fault_count: Int, last_fault_at: Int)
  /// Region is in quarantine awaiting recovery
  FcrQuarantined(reason: QuarantineReason, quarantined_at: Int)
  /// Region has been shut down
  FcrShutdown
}

/// Reasons for region quarantine
pub type QuarantineReason {
  /// WASM trap occurred
  QuarantineWasmTrap(trap_code: Int, trap_message: String)
  /// Resource exhaustion (memory, time, etc.)
  QuarantineResourceExhausted(resource: String)
  /// Repeated faults exceeded threshold
  QuarantineFaultThresholdExceeded(count: Int, window_ms: Int)
  /// Security violation detected
  QuarantineSecurityViolation(violation_type: String)
  /// Manual quarantine request
  QuarantineManual(reason: String)
  /// Driver connection failure
  QuarantineDriverFailure(driver_type: String, error: String)
}

/// Complete descriptor for a Fault Containment Region
pub type FcrDescriptor {
  FcrDescriptor(
    /// Unique region identifier
    id: FcrId,
    /// Type of the region
    fcr_type: FcrType,
    /// Current state
    state: FcrState,
    /// Parent region (for cascading fault handling)
    parent: Result(FcrId, Nil),
    /// Child regions
    children: List(FcrId),
    /// Configuration
    config: FcrConfig,
    /// Fault history
    fault_history: List(FaultRecord),
    /// Creation timestamp
    created_at: Int,
    /// Last state change timestamp
    last_state_change: Int,
  )
}

/// Configuration for a Fault Containment Region
pub type FcrConfig {
  FcrConfig(
    /// Maximum faults before quarantine
    fault_threshold: Int,
    /// Time window for fault counting (milliseconds)
    fault_window_ms: Int,
    /// Maximum time in quarantine before escalation (milliseconds)
    quarantine_timeout_ms: Int,
    /// Whether region can be automatically restarted
    auto_restart: Bool,
    /// Maximum restart attempts
    max_restart_attempts: Int,
    /// Restart delay (milliseconds)
    restart_delay_ms: Int,
  )
}

/// Record of a fault that occurred in a region
pub type FaultRecord {
  FaultRecord(
    /// Fault identifier
    fault_id: Int,
    /// Timestamp when fault occurred
    timestamp: Int,
    /// Type of fault
    fault_type: FaultType,
    /// Fault severity
    severity: FaultSeverity,
    /// Human-readable description
    description: String,
    /// Associated process ID (if applicable)
    pid: Result(Int, Nil),
    /// Recovery action taken
    recovery_action: RecoveryAction,
  )
}

/// Types of faults that can occur
pub type FaultType {
  /// WASM execution trap
  FaultWasmTrap(trap_code: Int)
  /// Memory access violation
  FaultMemoryViolation
  /// Timeout exceeded
  FaultTimeout
  /// Resource exhaustion
  FaultResourceExhausted
  /// Protocol violation
  FaultProtocolViolation
  /// Driver error
  FaultDriverError(driver: String)
  /// Security fault
  FaultSecurity
  /// Unknown/unexpected fault
  FaultUnknown
}

/// Severity levels for faults
pub type FaultSeverity {
  /// Informational, no action needed
  SeverityInfo
  /// Warning, may need attention
  SeverityWarning
  /// Error, recovery needed
  SeverityError
  /// Critical, immediate action required
  SeverityCritical
  /// Fatal, region must be quarantined
  SeverityFatal
}

/// Recovery actions for faults
pub type RecoveryAction {
  /// No action taken
  RecoveryNone
  /// Process restarted
  RecoveryRestart
  /// Process killed
  RecoveryKill
  /// Region quarantined
  RecoveryQuarantine
  /// Fault escalated to parent
  RecoveryEscalate
  /// Logged and ignored
  RecoveryIgnore
}

// ============================================================================
// SECTION 2: QUARANTINE GATEWAY TYPES
// ============================================================================

/// Quarantine gateway - the only path for faults to cross FCR boundaries
pub type QuarantineGateway {
  QuarantineGateway(
    /// Source region where fault originated
    source_fcr: FcrId,
    /// Target region (usually kernel for escalation)
    target_fcr: FcrId,
    /// Pending fault events to process
    pending_events: List(GatewayEvent),
    /// Gateway state
    state: GatewayState,
    /// Processing policy
    policy: GatewayPolicy,
  )
}

/// Events that flow through the quarantine gateway
pub type GatewayEvent {
  GatewayEvent(
    /// Event identifier
    event_id: Int,
    /// Event timestamp
    timestamp: Int,
    /// Event type
    event_type: GatewayEventType,
    /// Source region
    source: FcrId,
    /// Event data
    data: GatewayEventData,
  )
}

/// Types of gateway events
pub type GatewayEventType {
  /// Fault notification
  EventFault
  /// Quarantine request
  EventQuarantineRequest
  /// Restart request
  EventRestartRequest
  /// Health check
  EventHealthCheck
  /// Escalation
  EventEscalation
  /// Recovery complete
  EventRecoveryComplete
}

/// Data associated with gateway events
pub type GatewayEventData {
  /// Fault event data
  FaultEventData(fault: FaultRecord)
  /// Quarantine request data
  QuarantineRequestData(reason: QuarantineReason)
  /// Restart request data
  RestartRequestData(attempt: Int, max_attempts: Int)
  /// Health check data
  HealthCheckData(fcr_state: FcrState)
  /// Escalation data
  EscalationData(level: Int, reason: String)
  /// Recovery complete data
  RecoveryCompleteData(result: RecoveryResult)
}

/// Result of recovery attempt
pub type RecoveryResult {
  /// Recovery succeeded
  RecoverySuccess
  /// Recovery failed, will retry
  RecoveryFailedRetry(next_attempt_at: Int)
  /// Recovery failed permanently
  RecoveryFailedPermanent(reason: String)
}

/// Gateway operational state
pub type GatewayState {
  /// Gateway is accepting events
  GatewayOpen
  /// Gateway is processing events
  GatewayProcessing
  /// Gateway is paused (backpressure)
  GatewayPaused
  /// Gateway is closed
  GatewayClosed
}

/// Policy for gateway event handling
pub type GatewayPolicy {
  GatewayPolicy(
    /// Maximum pending events before backpressure
    max_pending_events: Int,
    /// Event processing timeout (milliseconds)
    processing_timeout_ms: Int,
    /// Whether to batch similar events
    batch_similar_events: Bool,
    /// Priority ordering for events
    priority_order: List(GatewayEventType),
  )
}

// ============================================================================
// SECTION 3: WASM TRAP TO KERNEL QUARANTINE
// ============================================================================

/// WASM trap information for quarantine processing
pub type WasmTrapInfo {
  WasmTrapInfo(
    /// Trap code
    trap_code: Int,
    /// Program counter at trap
    program_counter: Int,
    /// Stack depth at trap
    stack_depth: Int,
    /// Last safe yield point
    last_safe_point: Int,
    /// Module ID
    module_id: Int,
    /// Process ID
    pid: Int,
    /// Trap timestamp
    timestamp: Int,
    /// Trap message
    message: String,
  )
}

/// Restartable process object created from quarantined WASM trap
pub type RestartableProcess {
  RestartableProcess(
    /// Process identifier
    pid: Int,
    /// Module identifier
    module_id: Int,
    /// Saved state for restart
    saved_state: ProcessState,
    /// Restart configuration
    restart_config: RestartConfig,
    /// Trap that caused quarantine
    trap_info: WasmTrapInfo,
    /// Current restart attempt
    restart_attempt: Int,
    /// Quarantine entry time
    quarantined_at: Int,
  )
}

/// Saved process state for restart
pub type ProcessState {
  ProcessState(
    /// Process priority
    priority: Int,
    /// Mailbox contents (message IDs only)
    mailbox_message_ids: List(Int),
    /// Memory snapshot identifier (optional)
    memory_snapshot_id: Result(Int, Nil),
    /// Last known safe point
    safe_point: Int,
    /// Environment variables
    env: List(#(String, String)),
  )
}

/// Configuration for process restart
pub type RestartConfig {
  RestartConfig(
    /// Maximum restart attempts
    max_attempts: Int,
    /// Delay between restarts (milliseconds)
    delay_ms: Int,
    /// Exponential backoff factor
    backoff_factor: Float,
    /// Maximum delay after backoff (milliseconds)
    max_delay_ms: Int,
    /// Whether to restore state on restart
    restore_state: Bool,
    /// Whether to preserve mailbox
    preserve_mailbox: Bool,
  )
}

/// Result of attempting to restart a quarantined process
pub type RestartResult {
  /// Process restarted successfully
  RestartedSuccessfully(new_pid: Int)
  /// Restart pending (delayed)
  RestartPending(next_attempt_at: Int)
  /// Restart failed, will retry
  RestartFailed(reason: String, retry_at: Result(Int, Nil))
  /// Restart permanently failed
  RestartAbandoned(reason: String)
}

// ============================================================================
// SECTION 4: TEMPORAL ISOLATION
// ============================================================================

/// Temporal isolation configuration for predictable scheduling
pub type TemporalConfig {
  TemporalConfig(
    /// Maximum execution time per operation (milliseconds)
    max_operation_time_ms: Int,
    /// Maximum time slice for scheduling (milliseconds)
    max_time_slice_ms: Int,
    /// Deadline for message delivery (milliseconds)
    message_delivery_deadline_ms: Int,
    /// Watchdog timer interval (milliseconds)
    watchdog_interval_ms: Int,
    /// Maximum queue wait time before timeout (milliseconds)
    max_queue_wait_ms: Int,
  )
}

/// Result of temporal bound check
pub type TemporalCheckResult {
  /// Operation is within temporal bounds
  TemporalOk
  /// Operation exceeded time limit
  TemporalExceeded(elapsed_ms: Int, limit_ms: Int)
  /// Operation deadline missed
  TemporalDeadlineMissed(deadline: Int, actual: Int)
  /// Watchdog triggered
  TemporalWatchdogTriggered
}

/// Temporal guard for bounded operations
pub type TemporalGuard {
  TemporalGuard(
    /// Operation start timestamp
    start_time: Int,
    /// Deadline timestamp
    deadline: Int,
    /// Guard identifier
    guard_id: Int,
    /// Operation description
    operation: String,
    /// Associated FCR
    fcr_id: FcrId,
  )
}

/// Default temporal configuration
pub fn default_temporal_config() -> TemporalConfig {
  TemporalConfig(
    max_operation_time_ms: 100,
    max_time_slice_ms: 25,
    message_delivery_deadline_ms: 1000,
    watchdog_interval_ms: 500,
    max_queue_wait_ms: 5000,
  )
}

/// Create a temporal guard for an operation
pub fn create_temporal_guard(
  start_time: Int,
  config: TemporalConfig,
  operation: String,
  fcr_id: FcrId,
  guard_id: Int,
) -> TemporalGuard {
  TemporalGuard(
    start_time: start_time,
    deadline: start_time + config.max_operation_time_ms,
    guard_id: guard_id,
    operation: operation,
    fcr_id: fcr_id,
  )
}

/// Check if temporal guard deadline has passed
pub fn check_temporal_guard(guard: TemporalGuard, now: Int) -> TemporalCheckResult {
  case now > guard.deadline {
    True -> 
      TemporalDeadlineMissed(
        deadline: guard.deadline,
        actual: now,
      )
    False -> TemporalOk
  }
}

/// Calculate elapsed time for a guard
pub fn guard_elapsed_time(guard: TemporalGuard, now: Int) -> Int {
  now - guard.start_time
}

// ============================================================================
// SECTION 5: SPATIAL ISOLATION
// ============================================================================

/// Spatial isolation configuration for message payload validation
pub type SpatialConfig {
  SpatialConfig(
    /// Maximum message payload size (bytes)
    max_payload_size: Int,
    /// Maximum total memory per FCR (bytes)
    max_fcr_memory: Int,
    /// Maximum mailbox size (message count)
    max_mailbox_size: Int,
    /// Maximum concurrent connections per driver
    max_driver_connections: Int,
    /// Maximum pending messages in queues
    max_queue_depth: Int,
  )
}

/// Result of spatial bound check
pub type SpatialCheckResult {
  /// Operation is within spatial bounds
  SpatialOk
  /// Payload size exceeded
  SpatialPayloadTooLarge(actual: Int, max: Int)
  /// Memory limit exceeded
  SpatialMemoryExceeded(used: Int, max: Int)
  /// Mailbox full
  SpatialMailboxFull(current: Int, max: Int)
  /// Queue depth exceeded
  SpatialQueueFull(depth: Int, max: Int)
  /// Connection limit reached
  SpatialConnectionLimitReached(current: Int, max: Int)
}

/// Spatial guard for bounded resources
pub type SpatialGuard {
  SpatialGuard(
    /// Guard identifier
    guard_id: Int,
    /// Associated FCR
    fcr_id: FcrId,
    /// Configuration
    config: SpatialConfig,
    /// Current resource usage
    usage: ResourceUsage,
  )
}

/// Current resource usage within a spatial guard
pub type ResourceUsage {
  ResourceUsage(
    /// Current memory usage (bytes)
    memory_used: Int,
    /// Current mailbox depth
    mailbox_depth: Int,
    /// Current queue depth
    queue_depth: Int,
    /// Active connections
    active_connections: Int,
    /// Largest payload seen
    largest_payload: Int,
  )
}

/// Default spatial configuration
pub fn default_spatial_config() -> SpatialConfig {
  SpatialConfig(
    max_payload_size: 1_048_576,
    // 1 MB
    max_fcr_memory: 16_777_216,
    // 16 MB
    max_mailbox_size: 4096,
    max_driver_connections: 100,
    max_queue_depth: 10_000,
  )
}

/// Create a new spatial guard
pub fn create_spatial_guard(
  guard_id: Int,
  fcr_id: FcrId,
  config: SpatialConfig,
) -> SpatialGuard {
  SpatialGuard(
    guard_id: guard_id,
    fcr_id: fcr_id,
    config: config,
    usage: ResourceUsage(
      memory_used: 0,
      mailbox_depth: 0,
      queue_depth: 0,
      active_connections: 0,
      largest_payload: 0,
    ),
  )
}

/// Validate payload size against spatial bounds
pub fn validate_payload_size(
  guard: SpatialGuard,
  payload_size: Int,
) -> SpatialCheckResult {
  case payload_size > guard.config.max_payload_size {
    True -> SpatialPayloadTooLarge(payload_size, guard.config.max_payload_size)
    False -> SpatialOk
  }
}

/// Validate memory usage against spatial bounds
pub fn validate_memory_usage(
  guard: SpatialGuard,
  additional_bytes: Int,
) -> SpatialCheckResult {
  let new_usage = guard.usage.memory_used + additional_bytes
  case new_usage > guard.config.max_fcr_memory {
    True -> SpatialMemoryExceeded(new_usage, guard.config.max_fcr_memory)
    False -> SpatialOk
  }
}

/// Validate mailbox depth against spatial bounds
pub fn validate_mailbox_depth(
  guard: SpatialGuard,
) -> SpatialCheckResult {
  case guard.usage.mailbox_depth >= guard.config.max_mailbox_size {
    True -> SpatialMailboxFull(guard.usage.mailbox_depth, guard.config.max_mailbox_size)
    False -> SpatialOk
  }
}

/// Update resource usage in spatial guard
pub fn update_usage(
  guard: SpatialGuard,
  memory_delta: Int,
  mailbox_delta: Int,
  queue_delta: Int,
  connection_delta: Int,
) -> SpatialGuard {
  let new_usage = ResourceUsage(
    memory_used: max(0, guard.usage.memory_used + memory_delta),
    mailbox_depth: max(0, guard.usage.mailbox_depth + mailbox_delta),
    queue_depth: max(0, guard.usage.queue_depth + queue_delta),
    active_connections: max(0, guard.usage.active_connections + connection_delta),
    largest_payload: guard.usage.largest_payload,
  )
  SpatialGuard(..guard, usage: new_usage)
}

/// Record a payload size in the guard
pub fn record_payload(guard: SpatialGuard, payload_size: Int) -> SpatialGuard {
  let new_largest = max(guard.usage.largest_payload, payload_size)
  let new_usage = ResourceUsage(..guard.usage, largest_payload: new_largest)
  SpatialGuard(..guard, usage: new_usage)
}

// ============================================================================
// SECTION 6: FAIL-FAST BEHAVIOR
// ============================================================================

/// Fail-fast decision based on spatial/temporal check results
pub type FailFastDecision {
  /// Continue operation
  Continue
  /// Fail immediately with reason
  FailImmediately(reason: FailFastReason)
  /// Warn but continue
  WarnAndContinue(warning: String)
}

/// Reasons for fail-fast
pub type FailFastReason {
  /// Payload size violation
  FailFastPayloadSize(actual: Int, max: Int)
  /// Timeout violation
  FailFastTimeout(elapsed_ms: Int, limit_ms: Int)
  /// Memory violation
  FailFastMemory(used: Int, max: Int)
  /// Mailbox full
  FailFastMailboxFull
  /// Queue full
  FailFastQueueFull
  /// Security violation
  FailFastSecurity(reason: String)
  /// Protocol violation
  FailFastProtocol(reason: String)
}

/// Make fail-fast decision based on spatial check
pub fn spatial_fail_fast(check: SpatialCheckResult) -> FailFastDecision {
  case check {
    SpatialOk -> Continue
    SpatialPayloadTooLarge(actual, max) -> 
      FailImmediately(FailFastPayloadSize(actual, max))
    SpatialMemoryExceeded(used, max) -> 
      FailImmediately(FailFastMemory(used, max))
    SpatialMailboxFull(_, _) -> 
      FailImmediately(FailFastMailboxFull)
    SpatialQueueFull(_, _) -> 
      FailImmediately(FailFastQueueFull)
    SpatialConnectionLimitReached(_, _) -> 
      WarnAndContinue("Connection limit reached, request queued")
  }
}

/// Make fail-fast decision based on temporal check
pub fn temporal_fail_fast(check: TemporalCheckResult) -> FailFastDecision {
  case check {
    TemporalOk -> Continue
    TemporalExceeded(elapsed, limit) -> 
      FailImmediately(FailFastTimeout(elapsed, limit))
    TemporalDeadlineMissed(_, _) -> 
      FailImmediately(FailFastTimeout(0, 0))
    TemporalWatchdogTriggered -> 
      FailImmediately(FailFastTimeout(0, 0))
  }
}

// ============================================================================
// SECTION 7: FCR MANAGEMENT FUNCTIONS
// ============================================================================

/// Default FCR configuration
pub fn default_fcr_config() -> FcrConfig {
  FcrConfig(
    fault_threshold: 5,
    fault_window_ms: 60_000,
    quarantine_timeout_ms: 300_000,
    auto_restart: True,
    max_restart_attempts: 3,
    restart_delay_ms: 1000,
  )
}

/// Default restart configuration
pub fn default_restart_config() -> RestartConfig {
  RestartConfig(
    max_attempts: 3,
    delay_ms: 1000,
    backoff_factor: 2.0,
    max_delay_ms: 30_000,
    restore_state: False,
    preserve_mailbox: True,
  )
}

/// Create a new FCR descriptor
pub fn create_fcr(
  id: FcrId,
  fcr_type: FcrType,
  parent: Result(FcrId, Nil),
  config: FcrConfig,
  now: Int,
) -> FcrDescriptor {
  FcrDescriptor(
    id: id,
    fcr_type: fcr_type,
    state: FcrHealthy,
    parent: parent,
    children: [],
    config: config,
    fault_history: [],
    created_at: now,
    last_state_change: now,
  )
}

/// Add a child FCR
pub fn add_child_fcr(parent: FcrDescriptor, child_id: FcrId) -> FcrDescriptor {
  FcrDescriptor(..parent, children: [child_id, ..parent.children])
}

/// Record a fault in an FCR
pub fn record_fault(
  fcr: FcrDescriptor,
  fault: FaultRecord,
  now: Int,
) -> FcrDescriptor {
  let new_history = [fault, ..fcr.fault_history]
  let new_state = evaluate_fcr_state(fcr.config, new_history, now, fcr.state)
  FcrDescriptor(
    ..fcr,
    fault_history: new_history,
    state: new_state,
    last_state_change: case fcr.state == new_state {
      True -> fcr.last_state_change
      False -> now
    },
  )
}

/// Count recent faults within the window
pub fn count_recent_faults(
  history: List(FaultRecord),
  window_ms: Int,
  now: Int,
) -> Int {
  history
  |> list_filter(fn(fault) { now - fault.timestamp < window_ms })
  |> list_length
}

/// Evaluate FCR state based on fault history
fn evaluate_fcr_state(
  config: FcrConfig,
  history: List(FaultRecord),
  now: Int,
  current_state: FcrState,
) -> FcrState {
  let recent_count = count_recent_faults(history, config.fault_window_ms, now)
  
  case current_state {
    FcrShutdown -> FcrShutdown
    FcrQuarantined(_, _) -> current_state
    _ ->
      case recent_count >= config.fault_threshold {
        True -> 
          FcrQuarantined(
            QuarantineFaultThresholdExceeded(recent_count, config.fault_window_ms),
            now,
          )
        False ->
          case recent_count > 0 {
            True -> FcrDegraded(recent_count, now)
            False -> FcrHealthy
          }
      }
  }
}

/// Quarantine an FCR
pub fn quarantine_fcr(
  fcr: FcrDescriptor,
  reason: QuarantineReason,
  now: Int,
) -> FcrDescriptor {
  FcrDescriptor(
    ..fcr,
    state: FcrQuarantined(reason, now),
    last_state_change: now,
  )
}

/// Attempt to recover an FCR from quarantine
pub fn recover_fcr(
  fcr: FcrDescriptor,
  now: Int,
) -> Result(FcrDescriptor, String) {
  case fcr.state {
    FcrQuarantined(_, quarantined_at) ->
      case now - quarantined_at > fcr.config.quarantine_timeout_ms {
        True -> Error("Quarantine timeout exceeded, escalation required")
        False -> Ok(FcrDescriptor(
          ..fcr,
          state: FcrHealthy,
          last_state_change: now,
        ))
      }
    _ -> Error("FCR is not quarantined")
  }
}

/// Create a restartable process from WASM trap
pub fn create_restartable_process(
  trap: WasmTrapInfo,
  state: ProcessState,
  config: RestartConfig,
) -> RestartableProcess {
  RestartableProcess(
    pid: trap.pid,
    module_id: trap.module_id,
    saved_state: state,
    restart_config: config,
    trap_info: trap,
    restart_attempt: 0,
    quarantined_at: trap.timestamp,
  )
}

/// Calculate next restart delay with exponential backoff
pub fn calculate_restart_delay(process: RestartableProcess) -> Int {
  let config = process.restart_config
  let base_delay = config.delay_ms
  let attempt = process.restart_attempt
  let delay = float_to_int(int_to_float(base_delay) *. power(config.backoff_factor, attempt))
  min(delay, config.max_delay_ms)
}

/// Check if process can be restarted
pub fn can_restart(process: RestartableProcess) -> Bool {
  process.restart_attempt < process.restart_config.max_attempts
}

/// Increment restart attempt
pub fn increment_restart_attempt(process: RestartableProcess) -> RestartableProcess {
  RestartableProcess(..process, restart_attempt: process.restart_attempt + 1)
}

// ============================================================================
// SECTION 8: GATEWAY FUNCTIONS
// ============================================================================

/// Create a new quarantine gateway
pub fn create_gateway(
  source: FcrId,
  target: FcrId,
  policy: GatewayPolicy,
) -> QuarantineGateway {
  QuarantineGateway(
    source_fcr: source,
    target_fcr: target,
    pending_events: [],
    state: GatewayOpen,
    policy: policy,
  )
}

/// Default gateway policy
pub fn default_gateway_policy() -> GatewayPolicy {
  GatewayPolicy(
    max_pending_events: 1000,
    processing_timeout_ms: 5000,
    batch_similar_events: True,
    priority_order: [
      EventEscalation,
      EventQuarantineRequest,
      EventFault,
      EventRestartRequest,
      EventRecoveryComplete,
      EventHealthCheck,
    ],
  )
}

/// Submit an event to the gateway
pub fn submit_event(
  gateway: QuarantineGateway,
  event: GatewayEvent,
) -> #(QuarantineGateway, Bool) {
  case gateway.state {
    GatewayClosed -> #(gateway, False)
    GatewayPaused -> #(gateway, False)
    _ ->
      case list_length(gateway.pending_events) >= gateway.policy.max_pending_events {
        True -> #(
          QuarantineGateway(..gateway, state: GatewayPaused),
          False,
        )
        False -> #(
          QuarantineGateway(
            ..gateway,
            pending_events: [event, ..gateway.pending_events],
          ),
          True,
        )
      }
  }
}

/// Get next event to process (respects priority ordering)
pub fn next_event(
  gateway: QuarantineGateway,
) -> #(QuarantineGateway, Result(GatewayEvent, Nil)) {
  case gateway.pending_events {
    [] -> #(gateway, Error(Nil))
    events -> {
      let sorted = sort_by_event_priority(events, gateway.policy.priority_order)
      case sorted {
        [] -> #(gateway, Error(Nil))
        [first, ..rest] -> #(
          QuarantineGateway(..gateway, pending_events: rest),
          Ok(first),
        )
      }
    }
  }
}

/// Close the gateway
pub fn close_gateway(gateway: QuarantineGateway) -> QuarantineGateway {
  QuarantineGateway(..gateway, state: GatewayClosed)
}

/// Resume a paused gateway
pub fn resume_gateway(gateway: QuarantineGateway) -> QuarantineGateway {
  case gateway.state {
    GatewayPaused -> QuarantineGateway(..gateway, state: GatewayOpen)
    _ -> gateway
  }
}

// ============================================================================
// SECTION 9: HELPER FUNCTIONS
// ============================================================================

/// Filter a list based on a predicate
fn list_filter(list: List(a), predicate: fn(a) -> Bool) -> List(a) {
  case list {
    [] -> []
    [head, ..tail] ->
      case predicate(head) {
        True -> [head, ..list_filter(tail, predicate)]
        False -> list_filter(tail, predicate)
      }
  }
}

/// Get length of a list
fn list_length(list: List(a)) -> Int {
  case list {
    [] -> 0
    [_, ..tail] -> 1 + list_length(tail)
  }
}

/// Minimum of two integers
fn min(a: Int, b: Int) -> Int {
  case a < b {
    True -> a
    False -> b
  }
}

/// Maximum of two integers
fn max(a: Int, b: Int) -> Int {
  case a > b {
    True -> a
    False -> b
  }
}

/// Convert int to float
fn int_to_float(n: Int) -> Float {
  case n {
    0 -> 0.0
    _ -> 1.0 +. int_to_float(n - 1)
  }
}

/// Convert float to int (truncate)
fn float_to_int(f: Float) -> Int {
  case f <. 1.0 {
    True -> 0
    False -> 1 + float_to_int(f -. 1.0)
  }
}

/// Calculate power (float base, int exponent)
fn power(base: Float, exponent: Int) -> Float {
  case exponent {
    0 -> 1.0
    1 -> base
    _ -> base *. power(base, exponent - 1)
  }
}

/// Find index of event type in priority list
fn event_type_priority(
  event_type: GatewayEventType,
  priority_order: List(GatewayEventType),
) -> Int {
  find_index(priority_order, event_type, 0)
}

fn find_index(
  list: List(GatewayEventType),
  target: GatewayEventType,
  current: Int,
) -> Int {
  case list {
    [] -> 999
    [head, ..tail] ->
      case event_type_equals(head, target) {
        True -> current
        False -> find_index(tail, target, current + 1)
      }
  }
}

/// Check if two event types are equal
fn event_type_equals(a: GatewayEventType, b: GatewayEventType) -> Bool {
  case a, b {
    EventFault, EventFault -> True
    EventQuarantineRequest, EventQuarantineRequest -> True
    EventRestartRequest, EventRestartRequest -> True
    EventHealthCheck, EventHealthCheck -> True
    EventEscalation, EventEscalation -> True
    EventRecoveryComplete, EventRecoveryComplete -> True
    _, _ -> False
  }
}

/// Sort events by priority
fn sort_by_event_priority(
  events: List(GatewayEvent),
  priority_order: List(GatewayEventType),
) -> List(GatewayEvent) {
  // Simple insertion sort by priority
  case events {
    [] -> []
    [x] -> [x]
    [x, ..rest] -> 
      insert_by_priority(x, sort_by_event_priority(rest, priority_order), priority_order)
  }
}

fn insert_by_priority(
  event: GatewayEvent,
  sorted: List(GatewayEvent),
  priority_order: List(GatewayEventType),
) -> List(GatewayEvent) {
  case sorted {
    [] -> [event]
    [head, ..rest] -> {
      let event_pri = event_type_priority(event.event_type, priority_order)
      let head_pri = event_type_priority(head.event_type, priority_order)
      case event_pri <= head_pri {
        True -> [event, ..sorted]
        False -> [head, ..insert_by_priority(event, rest, priority_order)]
      }
    }
  }
}

// ============================================================================
// SECTION 10: FCR INVARIANT CHECKS
// ============================================================================

/// Check that an FCR hierarchy is valid
pub fn check_fcr_hierarchy_valid(fcr: FcrDescriptor, all_fcrs: List(FcrDescriptor)) -> Bool {
  // Parent must exist if specified
  let parent_valid = case fcr.parent {
    Error(Nil) -> True
    Ok(parent_id) -> fcr_exists(parent_id, all_fcrs)
  }
  
  // All children must exist
  let children_valid = list_all(fcr.children, fn(child_id) {
    fcr_exists(child_id, all_fcrs)
  })
  
  parent_valid && children_valid
}

/// Check if an FCR exists in the list
fn fcr_exists(id: FcrId, fcrs: List(FcrDescriptor)) -> Bool {
  case fcrs {
    [] -> False
    [fcr, ..rest] ->
      case fcr.id.value == id.value {
        True -> True
        False -> fcr_exists(id, rest)
      }
  }
}

/// Check all elements satisfy a predicate
fn list_all(list: List(a), predicate: fn(a) -> Bool) -> Bool {
  case list {
    [] -> True
    [head, ..tail] ->
      case predicate(head) {
        True -> list_all(tail, predicate)
        False -> False
      }
  }
}

/// Check that no fault can cascade without going through quarantine
pub fn check_fault_containment_invariant(
  source_fcr: FcrDescriptor,
  target_fcr: FcrDescriptor,
  gateway: QuarantineGateway,
) -> Bool {
  // Gateway must connect source to target
  gateway.source_fcr.value == source_fcr.id.value &&
  gateway.target_fcr.value == target_fcr.id.value &&
  // Gateway must be operational
  case gateway.state {
    GatewayClosed -> False
    _ -> True
  }
}
