//// estalogic_kernel/abi.gleam
//// 
//// Type-Level Representation of the ESTA Logic Microkernel ABI
//// 
//// This module defines the formal type contracts for all kernel operations.
//// No module shall implicitly define protocol behavior - all contracts are explicit.
//// 
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: PROCESS LIFECYCLE TYPES
// ============================================================================

/// Unique process identifier assigned by the kernel
pub type Pid {
  Pid(id: Int)
}

/// Process priority levels (0-5, higher = more urgent)
/// Corresponds to kernel_contract.md Section: Scheduling Rules
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

/// Process states as defined in the lifecycle contract
/// Corresponds to kernel_contract.md Section: Process States
pub type ProcessState {
  /// Process created but not yet scheduled
  Created
  /// Process ready to run, awaiting scheduler
  Ready
  /// Process currently executing on a core
  Running
  /// Process waiting for a message
  Waiting
  /// Process blocked on I/O or resource
  Blocked
  /// Process has completed execution
  Completed
}

/// Process exit codes for termination
pub type ExitCode {
  /// Normal successful completion
  ExitNormal
  /// Process explicitly exited with code
  ExitCode(code: Int)
  /// Process killed by supervisor
  ExitKilled
  /// Process crashed with error
  ExitCrashed(reason: ErrorCategory)
}

/// Process descriptor containing full process information
pub type ProcessDescriptor {
  ProcessDescriptor(
    pid: Pid,
    state: ProcessState,
    priority: Priority,
    mailbox_size: Int,
    mailbox_capacity: Int,
    cpu_time_ms: Int,
    wait_time_ms: Int,
    parent: Pid,
  )
}

// ============================================================================
// SECTION 2: MESSAGE-PASSING TYPES
// ============================================================================

/// Monotonically increasing sequence number for message ordering
pub type SequenceNumber {
  SequenceNumber(value: Int)
}

/// Timestamp in nanoseconds since kernel start
pub type Timestamp {
  Timestamp(nanos: Int)
}

/// Message priority hint (0-7, higher = more urgent)
pub type MessagePriority {
  MessagePriority(level: Int)
}

/// Message flags for delivery options
pub type MessageFlags {
  MessageFlags(
    /// Request acknowledgment from receiver
    require_ack: Bool,
    /// Message is part of a transaction
    transactional: Bool,
    /// Message should be persisted before delivery
    persistent: Bool,
  )
}

/// Message header as defined in the ABI contract
/// All fields are explicitly typed for formal verification
pub type MessageHeader {
  MessageHeader(
    source: Pid,
    target: Pid,
    sequence: SequenceNumber,
    timestamp: Timestamp,
    priority: MessagePriority,
    flags: MessageFlags,
  )
}

/// Standard message types in the kernel protocol
/// Corresponds to kernel_contract.md Appendix B
pub type MessageType {
  /// Health check request
  Ping
  /// Health check response
  Pong
  /// Request ESTA accrual calculation
  AccrualRequest
  /// Response with accrual result
  AccrualResponse
  /// Begin audit session
  AuditStart
  /// Single audit record entry
  AuditRecord
  /// Complete audit session
  AuditEnd
  /// System shutdown notification
  SystemShutdown
  /// User-defined message type
  Custom(type_id: Int)
}

/// Complete message structure with header and payload
pub type Message(payload) {
  Message(header: MessageHeader, msg_type: MessageType, payload: payload)
}

/// Mailbox overflow behavior modes
/// Corresponds to kernel_contract.md Section: Backpressure Mechanism
pub type OverflowMode {
  /// Discard incoming message when mailbox full
  DropNewest
  /// Remove oldest message, accept new
  DropOldest
  /// Suspend sender until space available
  BlockSender
  /// Return failure immediately to sender
  NotifySender
}

/// Mailbox configuration for a process
pub type MailboxConfig {
  MailboxConfig(capacity: Int, overflow_mode: OverflowMode)
}

/// Result of send operation
pub type SendResult {
  /// Message accepted for delivery
  SendOk(sequence: SequenceNumber)
  /// Mailbox full, message not delivered
  SendMailboxFull
  /// Target process does not exist
  SendTargetNotFound
  /// Sender lacks capability to send to target
  SendPermissionDenied
  /// Message payload too large
  SendPayloadTooLarge
}

/// Result of receive operation
pub type ReceiveResult(payload) {
  /// Message successfully received
  ReceiveOk(message: Message(payload))
  /// Timeout expired, no message received
  ReceiveTimeout
  /// Mailbox is empty (non-blocking receive)
  ReceiveEmpty
  /// Process is terminating
  ReceiveShuttingDown
}

// ============================================================================
// SECTION 3: SCHEDULING TYPES
// ============================================================================

/// Time slice in milliseconds
pub type TimeSlice {
  TimeSlice(ms: Int)
}

/// Scheduler decision for a process
pub type ScheduleDecision {
  /// Run the process for given time slice
  Run(pid: Pid, slice: TimeSlice)
  /// Preempt current process for higher priority
  Preempt(current: Pid, next: Pid)
  /// No runnable processes, enter idle
  Idle
}

/// Yield reason when process voluntarily gives up CPU
pub type YieldReason {
  /// Process has no more work
  YieldVoluntary
  /// Process is waiting for message
  YieldWaitingMessage
  /// Process is waiting for I/O
  YieldWaitingIO
  /// Process time slice expired
  YieldSliceExpired
}

/// Scheduler statistics for fairness monitoring
pub type SchedulerStats {
  SchedulerStats(
    /// Total processes in system
    total_processes: Int,
    /// Processes in ready queue
    ready_count: Int,
    /// Processes in waiting state
    waiting_count: Int,
    /// Processes in blocked state
    blocked_count: Int,
    /// Minimum fairness ratio (target >= 0.8)
    min_fairness_ratio: Float,
    /// Context switches in last second
    context_switches_per_sec: Int,
  )
}

// ============================================================================
// SECTION 4: MEMORY MODEL TYPES
// ============================================================================

/// Memory region identifier
pub type MemoryRegion {
  /// Kernel-only shared memory
  KernelSpace
  /// Per-module WASM linear memory
  WasmLinear(module_id: Int)
  /// Message buffer pool
  MessageBuffers
  /// Audit log storage
  AuditLogs
}

/// Memory access rights
pub type MemoryAccess {
  /// No access permitted
  NoAccess
  /// Read-only access
  ReadOnly
  /// Read and write access
  ReadWrite
  /// Execute permission (for code segments)
  Execute
}

/// Memory allocation request
pub type AllocRequest {
  AllocRequest(
    /// Requested size in bytes
    size: Int,
    /// Alignment requirement (power of 2)
    alignment: Int,
    /// Target memory region
    region: MemoryRegion,
  )
}

/// Memory allocation result
pub type AllocResult {
  /// Allocation successful
  AllocOk(
    /// Starting address
    address: Int,
    /// Actual allocated size (may be larger)
    actual_size: Int,
  )
  /// Insufficient memory
  AllocOutOfMemory
  /// Invalid alignment
  AllocInvalidAlignment
  /// Region not accessible
  AllocPermissionDenied
}

/// Linear type marker for unique ownership
/// Ensures mutable references are not aliased
pub type Unique(a) {
  Unique(value: a)
}

/// Linear type marker for shared immutable access
pub type Shared(a) {
  Shared(value: a)
}

// ============================================================================
// SECTION 5: ERROR HANDLING TYPES
// ============================================================================

/// Error categories as defined in the escalation model
/// Corresponds to kernel_contract.md Section: Error Categories
pub type ErrorCategory {
  /// User-level errors (code 1000-1999)
  UserError(code: Int, message: String)
  /// Logic errors requiring retry (code 2000-2999)
  LogicError(code: Int, message: String)
  /// Resource errors requiring supervisor (code 3000-3999)
  ResourceError(code: Int, message: String)
  /// Integrity errors requiring isolation (code 4000-4999)
  IntegrityError(code: Int, message: String)
  /// System errors requiring restart (code 5000-5999)
  SystemError(code: Int, message: String)
}

/// WASM trap types
/// Corresponds to kernel_contract.md Section: Trap Types
pub type TrapType {
  /// Explicit unreachable instruction (4001)
  TrapUnreachable
  /// Division by zero (4002)
  TrapIntegerDivByZero
  /// Integer overflow (4003)
  TrapIntegerOverflow
  /// Memory access out of bounds (4004)
  TrapOutOfBounds
  /// Indirect call type mismatch (4005)
  TrapIndirectCallType
  /// Call stack exhausted (4006)
  TrapStackOverflow
  /// Execution timeout (3001)
  TrapTimeout
  /// Out of memory (3002)
  TrapOutOfMemory
}

/// Escalation level in the supervisor hierarchy
pub type EscalationLevel {
  /// Restart process with same state
  Level1RestartSameState
  /// Restart process with clean state
  Level2RestartCleanState
  /// Reload the module
  Level3ModuleReload
  /// Restart the supervisor
  Level4SupervisorRestart
  /// Restart the system
  Level5SystemRestart
}

/// Recovery strategy chosen by supervisor
pub type RecoveryStrategy {
  /// Restart the failed process
  Restart(level: EscalationLevel)
  /// Ignore the failure and continue
  Ignore
  /// Stop the process permanently
  Stop
  /// Escalate to parent supervisor
  Escalate
}

// ============================================================================
// SECTION 6: CAPABILITY TYPES
// ============================================================================

/// Unforgeable capability token
pub type Capability {
  Capability(
    /// Unique capability identifier
    id: Int,
    /// Resource type this capability grants access to
    resource_type: ResourceType,
    /// Access rights granted
    rights: List(CapabilityRight),
    /// Capability expiration (None = never expires)
    expires_at: Result(Timestamp, Nil),
  )
}

/// Types of resources that capabilities can reference
pub type ResourceType {
  /// Process handle
  ResourceProcess
  /// Memory region
  ResourceMemory
  /// Message channel
  ResourceChannel
  /// External I/O device
  ResourceDevice
  /// Audit log
  ResourceAuditLog
}

/// Rights that can be granted by a capability
pub type CapabilityRight {
  /// Permission to read
  RightRead
  /// Permission to write
  RightWrite
  /// Permission to execute
  RightExecute
  /// Permission to delegate capability to others
  RightDelegate
  /// Permission to revoke capability
  RightRevoke
}

// ============================================================================
// SECTION 7: KERNEL SYSCALL INTERFACE
// ============================================================================

/// Spawn a new process
/// Returns Pid on success or error on failure
pub type SpawnRequest {
  SpawnRequest(
    /// WASM module identifier
    module_id: Int,
    /// Entry point function name
    entry_point: String,
    /// Initial arguments
    args: List(String),
    /// Process priority
    priority: Priority,
    /// Mailbox configuration
    mailbox_config: MailboxConfig,
  )
}

pub type SpawnResult {
  SpawnOk(pid: Pid)
  SpawnModuleNotFound
  SpawnEntryPointNotFound
  SpawnResourceExhausted
  SpawnPermissionDenied
}

/// Exit the current process
pub type ExitRequest {
  ExitRequest(code: ExitCode)
}

/// Send a message to another process
pub type SendRequest(payload) {
  SendRequest(target: Pid, msg_type: MessageType, payload: payload)
}

/// Receive a message with optional timeout
pub type ReceiveRequest {
  ReceiveRequest(
    /// Timeout in milliseconds (0 = non-blocking, -1 = infinite)
    timeout_ms: Int,
    /// Optional type filter
    type_filter: Result(MessageType, Nil),
  )
}

/// Yield CPU voluntarily
pub type YieldRequest {
  YieldRequest(reason: YieldReason)
}

/// Allocate memory
pub type AllocRequestSyscall {
  AllocRequestSyscall(request: AllocRequest)
}

/// Deallocate memory
pub type DeallocRequest {
  DeallocRequest(address: Int, size: Int, region: MemoryRegion)
}

pub type DeallocResult {
  DeallocOk
  DeallocInvalidAddress
  DeallocPermissionDenied
}

// ============================================================================
// SECTION 8: INVARIANT TYPES (FOR VERIFICATION)
// ============================================================================

/// System-wide invariant that must always hold
pub type SystemInvariant {
  /// All processes are in valid states
  InvariantValidStates
  /// At most one process running per core
  InvariantSingleRunning
  /// All mailboxes within capacity
  InvariantMailboxBounded
  /// All messages have valid source/target
  InvariantMessageValidity
}

/// Liveness property that must eventually hold
pub type LivenessProperty {
  /// If any process ready, some process runs
  PropertyProgress
  /// All messages eventually delivered or failed
  PropertyMessageDelivery
  /// Waiting processes eventually make progress
  PropertyNoStarvation
}

/// Verification result from model checker
pub type VerificationResult {
  /// Property verified to hold
  Verified(property: String)
  /// Counterexample found
  Counterexample(property: String, trace: List(String))
  /// Verification timed out
  Timeout(property: String, states_explored: Int)
}

// ============================================================================
// SECTION 9: HELPER FUNCTIONS
// ============================================================================

/// Convert priority level to time slice in milliseconds
pub fn priority_to_slice(priority: Priority) -> TimeSlice {
  case priority {
    Idle -> TimeSlice(100)
    Low -> TimeSlice(50)
    Normal -> TimeSlice(25)
    High -> TimeSlice(15)
    Realtime -> TimeSlice(10)
    System -> TimeSlice(0)
    // System runs to completion
  }
}

/// Convert priority level to integer for comparison
pub fn priority_to_int(priority: Priority) -> Int {
  case priority {
    Idle -> 0
    Low -> 1
    Normal -> 2
    High -> 3
    Realtime -> 4
    System -> 5
  }
}

/// Check if priority level is preemptible
pub fn is_preemptible(priority: Priority) -> Bool {
  case priority {
    System -> False
    Realtime -> True
    // Limited preemption, but technically preemptible
    _ -> True
  }
}

/// Get default mailbox capacity for priority level
pub fn default_mailbox_capacity(priority: Priority) -> Int {
  case priority {
    System -> 16_384
    Realtime -> 4096
    High -> 4096
    _ -> 1024
  }
}

/// Check if an error category is recoverable
pub fn is_recoverable(trap: TrapType) -> Bool {
  case trap {
    TrapTimeout -> True
    TrapOutOfMemory -> True
    _ -> False
  }
}

/// Get error code from trap type
pub fn trap_to_code(trap: TrapType) -> Int {
  case trap {
    TrapUnreachable -> 4001
    TrapIntegerDivByZero -> 4002
    TrapIntegerOverflow -> 4003
    TrapOutOfBounds -> 4004
    TrapIndirectCallType -> 4005
    TrapStackOverflow -> 4006
    TrapTimeout -> 3001
    TrapOutOfMemory -> 3002
  }
}

/// Calculate effective priority with aging
/// wait_time_ms: Time spent waiting in milliseconds
/// Returns: Effective priority (capped at Realtime)
pub fn calculate_effective_priority(
  base: Priority,
  wait_time_ms: Int,
) -> Priority {
  let base_int = priority_to_int(base)
  let boost = wait_time_ms / 1000
  // +1 level per second of waiting
  let effective = base_int + { boost |> min(2) }
  // Cap boost at +2
  case effective {
    n if n >= 4 -> Realtime
    3 -> High
    2 -> Normal
    1 -> Low
    _ -> Idle
  }
}

// Helper function for minimum of two integers
fn min(a: Int, b: Int) -> Int {
  case a < b {
    True -> a
    False -> b
  }
}

/// Create a new message with auto-generated header fields
/// Note: Actual timestamp and sequence would be provided by kernel
pub fn create_message(
  source: Pid,
  target: Pid,
  msg_type: MessageType,
  payload: payload,
) -> Message(payload) {
  Message(
    header: MessageHeader(
      source: source,
      target: target,
      sequence: SequenceNumber(0),
      // Kernel assigns
      timestamp: Timestamp(0),
      // Kernel assigns
      priority: MessagePriority(3),
      // Default normal priority
      flags: MessageFlags(
        require_ack: False,
        transactional: False,
        persistent: False,
      ),
    ),
    msg_type: msg_type,
    payload: payload,
  )
}
