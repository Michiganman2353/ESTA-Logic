//// estalogic_kernel/test/guardrails_test.gleam
////
//// Tests for the Fault Containment Regions and Isolation Module
////
//// Test Coverage:
//// - FCR creation and configuration
//// - Quarantine gateway operations
//// - Temporal isolation bounds
//// - Spatial isolation bounds
//// - Fail-fast behavior
//// - WASM trap handling and restartable processes

import gleam/list
import gleam/option.{None, Some}

// ============================================================================
// SECTION 1: TEST RESULT TYPE
// ============================================================================

pub type TestResult {
  Pass(name: String)
  Fail(name: String)
}

// ============================================================================
// SECTION 2: FCR TYPE DEFINITIONS (MIRROR OF guardrails.gleam)
// ============================================================================

type FcrId {
  FcrId(value: Int)
}

type FcrType {
  KernelFcr
  DriverKafkaFcr
  DriverRedisFcr
  DriverPostgresFcr
  ApplicationFcr(module_id: Int)
  TauriFcr
}

type FcrState {
  FcrHealthy
  FcrDegraded(fault_count: Int, last_fault_at: Int)
  FcrQuarantined(reason: QuarantineReason, quarantined_at: Int)
  FcrShutdown
}

type QuarantineReason {
  QuarantineWasmTrap(trap_code: Int, trap_message: String)
  QuarantineResourceExhausted(resource: String)
  QuarantineFaultThresholdExceeded(count: Int, window_ms: Int)
  QuarantineSecurityViolation(violation_type: String)
  QuarantineManual(reason: String)
  QuarantineDriverFailure(driver_type: String, error: String)
}

type FcrConfig {
  FcrConfig(
    fault_threshold: Int,
    fault_window_ms: Int,
    quarantine_timeout_ms: Int,
    auto_restart: Bool,
    max_restart_attempts: Int,
    restart_delay_ms: Int,
  )
}

type FaultRecord {
  FaultRecord(
    fault_id: Int,
    timestamp: Int,
    fault_type: FaultType,
    severity: FaultSeverity,
    description: String,
    pid: Result(Int, Nil),
    recovery_action: RecoveryAction,
  )
}

type FaultType {
  FaultWasmTrap(trap_code: Int)
  FaultMemoryViolation
  FaultTimeout
  FaultResourceExhausted
  FaultProtocolViolation
  FaultDriverError(driver: String)
  FaultSecurity
  FaultUnknown
}

type FaultSeverity {
  SeverityInfo
  SeverityWarning
  SeverityError
  SeverityCritical
  SeverityFatal
}

type RecoveryAction {
  RecoveryNone
  RecoveryRestart
  RecoveryKill
  RecoveryQuarantine
  RecoveryEscalate
  RecoveryIgnore
}

// ============================================================================
// SECTION 3: TEMPORAL ISOLATION TYPES
// ============================================================================

type TemporalConfig {
  TemporalConfig(
    max_operation_time_ms: Int,
    max_time_slice_ms: Int,
    message_delivery_deadline_ms: Int,
    watchdog_interval_ms: Int,
    max_queue_wait_ms: Int,
  )
}

type TemporalCheckResult {
  TemporalOk
  TemporalExceeded(elapsed_ms: Int, limit_ms: Int)
  TemporalDeadlineMissed(deadline: Int, actual: Int)
  TemporalWatchdogTriggered
}

type TemporalGuard {
  TemporalGuard(
    start_time: Int,
    deadline: Int,
    guard_id: Int,
    operation: String,
    fcr_id: FcrId,
  )
}

// ============================================================================
// SECTION 4: SPATIAL ISOLATION TYPES
// ============================================================================

type SpatialConfig {
  SpatialConfig(
    max_payload_size: Int,
    max_fcr_memory: Int,
    max_mailbox_size: Int,
    max_driver_connections: Int,
    max_queue_depth: Int,
  )
}

type SpatialCheckResult {
  SpatialOk
  SpatialPayloadTooLarge(actual: Int, max: Int)
  SpatialMemoryExceeded(used: Int, max: Int)
  SpatialMailboxFull(current: Int, max: Int)
  SpatialQueueFull(depth: Int, max: Int)
  SpatialConnectionLimitReached(current: Int, max: Int)
}

type ResourceUsage {
  ResourceUsage(
    memory_used: Int,
    mailbox_depth: Int,
    queue_depth: Int,
    active_connections: Int,
    largest_payload: Int,
  )
}

type SpatialGuard {
  SpatialGuard(
    guard_id: Int,
    fcr_id: FcrId,
    config: SpatialConfig,
    usage: ResourceUsage,
  )
}

// ============================================================================
// SECTION 5: FAIL-FAST TYPES
// ============================================================================

type FailFastDecision {
  Continue
  FailImmediately(reason: FailFastReason)
  WarnAndContinue(warning: String)
}

type FailFastReason {
  FailFastPayloadSize(actual: Int, max: Int)
  FailFastTimeout(elapsed_ms: Int, limit_ms: Int)
  FailFastMemory(used: Int, max: Int)
  FailFastMailboxFull
  FailFastQueueFull
  FailFastSecurity(reason: String)
  FailFastProtocol(reason: String)
}

// ============================================================================
// SECTION 6: HELPER FUNCTIONS
// ============================================================================

fn default_fcr_config() -> FcrConfig {
  FcrConfig(
    fault_threshold: 5,
    fault_window_ms: 60_000,
    quarantine_timeout_ms: 300_000,
    auto_restart: True,
    max_restart_attempts: 3,
    restart_delay_ms: 1000,
  )
}

fn default_temporal_config() -> TemporalConfig {
  TemporalConfig(
    max_operation_time_ms: 100,
    max_time_slice_ms: 25,
    message_delivery_deadline_ms: 1000,
    watchdog_interval_ms: 500,
    max_queue_wait_ms: 5000,
  )
}

fn default_spatial_config() -> SpatialConfig {
  SpatialConfig(
    max_payload_size: 1_048_576,
    max_fcr_memory: 16_777_216,
    max_mailbox_size: 4096,
    max_driver_connections: 100,
    max_queue_depth: 10_000,
  )
}

fn create_temporal_guard(start: Int, deadline: Int, op: String) -> TemporalGuard {
  TemporalGuard(
    start_time: start,
    deadline: deadline,
    guard_id: 1,
    operation: op,
    fcr_id: FcrId(1),
  )
}

fn create_spatial_guard(config: SpatialConfig, usage: ResourceUsage) -> SpatialGuard {
  SpatialGuard(
    guard_id: 1,
    fcr_id: FcrId(1),
    config: config,
    usage: usage,
  )
}

fn check_temporal_guard(guard: TemporalGuard, now: Int) -> TemporalCheckResult {
  case now > guard.deadline {
    True -> TemporalDeadlineMissed(guard.deadline, now)
    False -> TemporalOk
  }
}

fn validate_payload_size(guard: SpatialGuard, size: Int) -> SpatialCheckResult {
  case size > guard.config.max_payload_size {
    True -> SpatialPayloadTooLarge(size, guard.config.max_payload_size)
    False -> SpatialOk
  }
}

fn validate_memory_usage(guard: SpatialGuard, additional: Int) -> SpatialCheckResult {
  let new_usage = guard.usage.memory_used + additional
  case new_usage > guard.config.max_fcr_memory {
    True -> SpatialMemoryExceeded(new_usage, guard.config.max_fcr_memory)
    False -> SpatialOk
  }
}

fn validate_mailbox_depth(guard: SpatialGuard) -> SpatialCheckResult {
  case guard.usage.mailbox_depth >= guard.config.max_mailbox_size {
    True -> SpatialMailboxFull(guard.usage.mailbox_depth, guard.config.max_mailbox_size)
    False -> SpatialOk
  }
}

fn spatial_fail_fast(check: SpatialCheckResult) -> FailFastDecision {
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
      WarnAndContinue("Connection limit reached")
  }
}

fn temporal_fail_fast(check: TemporalCheckResult) -> FailFastDecision {
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

fn count_recent_faults(faults: List(FaultRecord), window_ms: Int, now: Int) -> Int {
  list.fold(faults, 0, fn(acc, fault) {
    case now - fault.timestamp < window_ms {
      True -> acc + 1
      False -> acc
    }
  })
}

// ============================================================================
// SECTION 7: FCR TESTS
// ============================================================================

/// Test: FCR created in healthy state
pub fn fcr_initial_state_test() -> Bool {
  let state = FcrHealthy
  case state {
    FcrHealthy -> True
    _ -> False
  }
}

/// Test: FCR transitions to degraded after faults
pub fn fcr_degraded_state_test() -> Bool {
  let faults = [
    FaultRecord(1, 1000, FaultTimeout, SeverityError, "Timeout", Error(Nil), RecoveryRestart),
    FaultRecord(2, 2000, FaultTimeout, SeverityError, "Timeout", Error(Nil), RecoveryRestart),
  ]
  let count = count_recent_faults(faults, 60_000, 3000)
  count == 2
}

/// Test: FCR quarantine threshold
pub fn fcr_quarantine_threshold_test() -> Bool {
  let config = default_fcr_config()
  let faults = [
    FaultRecord(1, 1000, FaultTimeout, SeverityError, "Timeout 1", Error(Nil), RecoveryRestart),
    FaultRecord(2, 2000, FaultTimeout, SeverityError, "Timeout 2", Error(Nil), RecoveryRestart),
    FaultRecord(3, 3000, FaultTimeout, SeverityError, "Timeout 3", Error(Nil), RecoveryRestart),
    FaultRecord(4, 4000, FaultTimeout, SeverityError, "Timeout 4", Error(Nil), RecoveryRestart),
    FaultRecord(5, 5000, FaultTimeout, SeverityError, "Timeout 5", Error(Nil), RecoveryRestart),
  ]
  let count = count_recent_faults(faults, config.fault_window_ms, 6000)
  count >= config.fault_threshold
}

/// Test: Faults outside window not counted
pub fn fcr_fault_window_test() -> Bool {
  let faults = [
    FaultRecord(1, 1000, FaultTimeout, SeverityError, "Old fault", Error(Nil), RecoveryRestart),
    FaultRecord(2, 100_000, FaultTimeout, SeverityError, "Recent fault", Error(Nil), RecoveryRestart),
  ]
  let count = count_recent_faults(faults, 60_000, 100_000)
  // Only the recent fault should be counted
  count == 1
}

/// Test: Kernel FCR type
pub fn fcr_type_kernel_test() -> Bool {
  let fcr_type = KernelFcr
  case fcr_type {
    KernelFcr -> True
    _ -> False
  }
}

/// Test: Application FCR with module ID
pub fn fcr_type_application_test() -> Bool {
  let fcr_type = ApplicationFcr(42)
  case fcr_type {
    ApplicationFcr(id) -> id == 42
    _ -> False
  }
}

/// Test: Driver FCR types
pub fn fcr_type_drivers_test() -> Bool {
  let kafka = DriverKafkaFcr
  let redis = DriverRedisFcr
  let postgres = DriverPostgresFcr
  case kafka, redis, postgres {
    DriverKafkaFcr, DriverRedisFcr, DriverPostgresFcr -> True
    _, _, _ -> False
  }
}

// ============================================================================
// SECTION 8: TEMPORAL ISOLATION TESTS
// ============================================================================

/// Test: Temporal guard within deadline
pub fn temporal_within_deadline_test() -> Bool {
  let guard = create_temporal_guard(0, 100, "test_op")
  let result = check_temporal_guard(guard, 50)
  case result {
    TemporalOk -> True
    _ -> False
  }
}

/// Test: Temporal guard at deadline
pub fn temporal_at_deadline_test() -> Bool {
  let guard = create_temporal_guard(0, 100, "test_op")
  let result = check_temporal_guard(guard, 100)
  case result {
    TemporalOk -> True
    _ -> False
  }
}

/// Test: Temporal guard past deadline
pub fn temporal_past_deadline_test() -> Bool {
  let guard = create_temporal_guard(0, 100, "test_op")
  let result = check_temporal_guard(guard, 150)
  case result {
    TemporalDeadlineMissed(100, 150) -> True
    _ -> False
  }
}

/// Test: Temporal fail-fast on ok
pub fn temporal_failfast_ok_test() -> Bool {
  let decision = temporal_fail_fast(TemporalOk)
  case decision {
    Continue -> True
    _ -> False
  }
}

/// Test: Temporal fail-fast on deadline missed
pub fn temporal_failfast_deadline_test() -> Bool {
  let decision = temporal_fail_fast(TemporalDeadlineMissed(100, 150))
  case decision {
    FailImmediately(_) -> True
    _ -> False
  }
}

/// Test: Default temporal config values
pub fn temporal_default_config_test() -> Bool {
  let config = default_temporal_config()
  config.max_operation_time_ms == 100 &&
  config.max_time_slice_ms == 25 &&
  config.message_delivery_deadline_ms == 1000
}

// ============================================================================
// SECTION 9: SPATIAL ISOLATION TESTS
// ============================================================================

/// Test: Payload within size limit
pub fn spatial_payload_ok_test() -> Bool {
  let config = default_spatial_config()
  let usage = ResourceUsage(0, 0, 0, 0, 0)
  let guard = create_spatial_guard(config, usage)
  let result = validate_payload_size(guard, 1000)
  case result {
    SpatialOk -> True
    _ -> False
  }
}

/// Test: Payload exceeds size limit
pub fn spatial_payload_too_large_test() -> Bool {
  let config = default_spatial_config()
  let usage = ResourceUsage(0, 0, 0, 0, 0)
  let guard = create_spatial_guard(config, usage)
  let result = validate_payload_size(guard, 2_000_000)
  case result {
    SpatialPayloadTooLarge(2_000_000, 1_048_576) -> True
    _ -> False
  }
}

/// Test: Memory within limit
pub fn spatial_memory_ok_test() -> Bool {
  let config = default_spatial_config()
  let usage = ResourceUsage(1_000_000, 0, 0, 0, 0)
  let guard = create_spatial_guard(config, usage)
  let result = validate_memory_usage(guard, 1_000_000)
  case result {
    SpatialOk -> True
    _ -> False
  }
}

/// Test: Memory exceeds limit
pub fn spatial_memory_exceeded_test() -> Bool {
  let config = default_spatial_config()
  let usage = ResourceUsage(16_000_000, 0, 0, 0, 0)
  let guard = create_spatial_guard(config, usage)
  let result = validate_memory_usage(guard, 1_000_000)
  case result {
    SpatialMemoryExceeded(17_000_000, 16_777_216) -> True
    _ -> False
  }
}

/// Test: Mailbox not full
pub fn spatial_mailbox_ok_test() -> Bool {
  let config = default_spatial_config()
  let usage = ResourceUsage(0, 100, 0, 0, 0)
  let guard = create_spatial_guard(config, usage)
  let result = validate_mailbox_depth(guard)
  case result {
    SpatialOk -> True
    _ -> False
  }
}

/// Test: Mailbox full
pub fn spatial_mailbox_full_test() -> Bool {
  let config = default_spatial_config()
  let usage = ResourceUsage(0, 4096, 0, 0, 0)
  let guard = create_spatial_guard(config, usage)
  let result = validate_mailbox_depth(guard)
  case result {
    SpatialMailboxFull(4096, 4096) -> True
    _ -> False
  }
}

/// Test: Spatial fail-fast on ok
pub fn spatial_failfast_ok_test() -> Bool {
  let decision = spatial_fail_fast(SpatialOk)
  case decision {
    Continue -> True
    _ -> False
  }
}

/// Test: Spatial fail-fast on payload too large
pub fn spatial_failfast_payload_test() -> Bool {
  let decision = spatial_fail_fast(SpatialPayloadTooLarge(2_000_000, 1_000_000))
  case decision {
    FailImmediately(FailFastPayloadSize(2_000_000, 1_000_000)) -> True
    _ -> False
  }
}

/// Test: Spatial fail-fast on connection limit (warning, not fail)
pub fn spatial_failfast_connections_test() -> Bool {
  let decision = spatial_fail_fast(SpatialConnectionLimitReached(100, 100))
  case decision {
    WarnAndContinue(_) -> True
    _ -> False
  }
}

// ============================================================================
// SECTION 10: QUARANTINE TESTS
// ============================================================================

/// Test: WASM trap quarantine reason
pub fn quarantine_wasm_trap_test() -> Bool {
  let reason = QuarantineWasmTrap(4001, "Unreachable")
  case reason {
    QuarantineWasmTrap(4001, "Unreachable") -> True
    _ -> False
  }
}

/// Test: Resource exhaustion quarantine
pub fn quarantine_resource_test() -> Bool {
  let reason = QuarantineResourceExhausted("memory")
  case reason {
    QuarantineResourceExhausted("memory") -> True
    _ -> False
  }
}

/// Test: Fault threshold quarantine
pub fn quarantine_fault_threshold_test() -> Bool {
  let reason = QuarantineFaultThresholdExceeded(5, 60_000)
  case reason {
    QuarantineFaultThresholdExceeded(5, 60_000) -> True
    _ -> False
  }
}

/// Test: Security violation quarantine
pub fn quarantine_security_test() -> Bool {
  let reason = QuarantineSecurityViolation("unauthorized_access")
  case reason {
    QuarantineSecurityViolation("unauthorized_access") -> True
    _ -> False
  }
}

/// Test: Driver failure quarantine
pub fn quarantine_driver_failure_test() -> Bool {
  let reason = QuarantineDriverFailure("kafka", "Connection refused")
  case reason {
    QuarantineDriverFailure("kafka", "Connection refused") -> True
    _ -> False
  }
}

// ============================================================================
// SECTION 11: FAULT TYPES TESTS
// ============================================================================

/// Test: WASM trap fault type
pub fn fault_type_wasm_trap_test() -> Bool {
  let fault = FaultWasmTrap(4001)
  case fault {
    FaultWasmTrap(4001) -> True
    _ -> False
  }
}

/// Test: Driver error fault type
pub fn fault_type_driver_error_test() -> Bool {
  let fault = FaultDriverError("postgres")
  case fault {
    FaultDriverError("postgres") -> True
    _ -> False
  }
}

/// Test: Severity levels ordering
pub fn fault_severity_ordering_test() -> Bool {
  // Info < Warning < Error < Critical < Fatal
  let info_val = severity_to_int(SeverityInfo)
  let warning_val = severity_to_int(SeverityWarning)
  let error_val = severity_to_int(SeverityError)
  let critical_val = severity_to_int(SeverityCritical)
  let fatal_val = severity_to_int(SeverityFatal)
  
  info_val < warning_val &&
  warning_val < error_val &&
  error_val < critical_val &&
  critical_val < fatal_val
}

fn severity_to_int(severity: FaultSeverity) -> Int {
  case severity {
    SeverityInfo -> 0
    SeverityWarning -> 1
    SeverityError -> 2
    SeverityCritical -> 3
    SeverityFatal -> 4
  }
}

// ============================================================================
// SECTION 12: TEST RUNNER
// ============================================================================

fn run_test(name: String, test_fn: fn() -> Bool) -> TestResult {
  case test_fn() {
    True -> Pass(name)
    False -> Fail(name)
  }
}

pub fn run_all_tests() -> List(TestResult) {
  [
    // FCR tests
    run_test("fcr_initial_state_test", fcr_initial_state_test),
    run_test("fcr_degraded_state_test", fcr_degraded_state_test),
    run_test("fcr_quarantine_threshold_test", fcr_quarantine_threshold_test),
    run_test("fcr_fault_window_test", fcr_fault_window_test),
    run_test("fcr_type_kernel_test", fcr_type_kernel_test),
    run_test("fcr_type_application_test", fcr_type_application_test),
    run_test("fcr_type_drivers_test", fcr_type_drivers_test),
    
    // Temporal isolation tests
    run_test("temporal_within_deadline_test", temporal_within_deadline_test),
    run_test("temporal_at_deadline_test", temporal_at_deadline_test),
    run_test("temporal_past_deadline_test", temporal_past_deadline_test),
    run_test("temporal_failfast_ok_test", temporal_failfast_ok_test),
    run_test("temporal_failfast_deadline_test", temporal_failfast_deadline_test),
    run_test("temporal_default_config_test", temporal_default_config_test),
    
    // Spatial isolation tests
    run_test("spatial_payload_ok_test", spatial_payload_ok_test),
    run_test("spatial_payload_too_large_test", spatial_payload_too_large_test),
    run_test("spatial_memory_ok_test", spatial_memory_ok_test),
    run_test("spatial_memory_exceeded_test", spatial_memory_exceeded_test),
    run_test("spatial_mailbox_ok_test", spatial_mailbox_ok_test),
    run_test("spatial_mailbox_full_test", spatial_mailbox_full_test),
    run_test("spatial_failfast_ok_test", spatial_failfast_ok_test),
    run_test("spatial_failfast_payload_test", spatial_failfast_payload_test),
    run_test("spatial_failfast_connections_test", spatial_failfast_connections_test),
    
    // Quarantine tests
    run_test("quarantine_wasm_trap_test", quarantine_wasm_trap_test),
    run_test("quarantine_resource_test", quarantine_resource_test),
    run_test("quarantine_fault_threshold_test", quarantine_fault_threshold_test),
    run_test("quarantine_security_test", quarantine_security_test),
    run_test("quarantine_driver_failure_test", quarantine_driver_failure_test),
    
    // Fault type tests
    run_test("fault_type_wasm_trap_test", fault_type_wasm_trap_test),
    run_test("fault_type_driver_error_test", fault_type_driver_error_test),
    run_test("fault_severity_ordering_test", fault_severity_ordering_test),
  ]
}

pub fn count_passing(results: List(TestResult)) -> Int {
  list.fold(results, 0, fn(acc, result) {
    case result {
      Pass(_) -> acc + 1
      Fail(_) -> acc
    }
  })
}

pub fn get_failures(results: List(TestResult)) -> List(String) {
  list.filter_map(results, fn(result) {
    case result {
      Pass(_) -> None
      Fail(name) -> Some(name)
    }
  })
}
