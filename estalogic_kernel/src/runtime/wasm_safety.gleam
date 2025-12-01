//// estalogic_kernel/runtime/wasm_safety.gleam
////
//// Deterministic Execution Rules for WASM
////
//// This module defines internal invariants for WASM execution to ensure
//// safety-critical compliance with the microkernel contract.
////
//// Key Invariants:
//// 1. WASM cannot block - all calls must be async & latency-bounded
//// 2. WASM memory access must be monotonic or guarded with linear types
//// 3. Panic/trap semantics are well-defined with explicit escalation
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

import gleam/result

// ============================================================================
// SECTION 1: EXECUTION CONSTRAINTS
// ============================================================================

/// Maximum instructions a WASM module can execute before mandatory yield
/// This ensures no module can monopolize the CPU
pub const max_instructions_per_slice: Int = 1_000_000

/// Maximum time in milliseconds for any WASM call
/// Calls exceeding this limit are terminated with TrapTimeout
pub const max_call_latency_ms: Int = 100

/// Maximum memory growth per allocation request
/// 1 MB limit prevents excessive single allocations
pub const max_allocation_size: Int = 1_048_576

/// Maximum total memory for a user module
/// 16 MB provides adequate space for compliance logic
pub const max_user_memory: Int = 16_777_216

/// Maximum total memory for a system module
/// 64 MB allows for system-level operations
pub const max_system_memory: Int = 67_108_864

/// Memory page size in bytes (WASM standard)
/// 64 KB as per WebAssembly specification
pub const memory_page_size: Int = 65_536

// ============================================================================
// SECTION 2: EXECUTION CONTEXT TYPES
// ============================================================================

/// Execution mode determines blocking behavior
pub type ExecutionMode {
  /// Fully synchronous execution (only for kernel calls)
  Synchronous
  /// Async execution with latency bounds (standard mode)
  AsyncBounded(max_latency_ms: Int)
  /// Fire-and-forget, no result expected
  AsyncUnbounded
}

/// Execution budget tracks resource consumption
pub type ExecutionBudget {
  ExecutionBudget(
    /// Instructions remaining in current slice
    instructions_remaining: Int,
    /// Memory bytes remaining for allocation
    memory_remaining: Int,
    /// Time budget remaining in milliseconds
    time_remaining_ms: Int,
    /// Current gas consumed (for metering)
    gas_consumed: Int,
  )
}

/// Result of budget check
pub type BudgetCheckResult {
  /// Execution can continue
  BudgetOk
  /// Instruction limit reached, must yield
  BudgetInstructionsExhausted
  /// Memory limit reached, cannot allocate
  BudgetMemoryExhausted
  /// Time limit reached, must yield or terminate
  BudgetTimeExhausted
  /// Gas limit reached (for metered execution)
  BudgetGasExhausted
}

/// WASM module execution state
pub type WasmExecutionState {
  /// Module is idle, awaiting invocation
  WasmIdle
  /// Module is executing within budget
  WasmExecuting(budget: ExecutionBudget)
  /// Module has yielded at safe point
  WasmYielded(resume_point: Int, budget: ExecutionBudget)
  /// Module is suspended waiting for async result
  WasmSuspended(continuation_id: Int)
  /// Module has trapped with error
  WasmTrapped(trap: TrapInfo)
  /// Module has completed execution normally
  WasmCompleted(result: WasmResult)
}

/// Detailed trap information for debugging and escalation
pub type TrapInfo {
  TrapInfo(
    /// Type of trap that occurred
    trap_type: TrapType,
    /// Program counter at trap point
    program_counter: Int,
    /// Stack depth at trap point
    stack_depth: Int,
    /// Last known safe yield point
    last_safe_point: Int,
    /// Trap timestamp (kernel clock)
    timestamp: Int,
    /// Human-readable message
    message: String,
  )
}

/// WASM trap types (matches abi.gleam)
pub type TrapType {
  /// Explicit unreachable instruction
  TrapUnreachable
  /// Division by zero
  TrapIntegerDivByZero
  /// Integer overflow
  TrapIntegerOverflow
  /// Memory access out of bounds
  TrapOutOfBounds
  /// Indirect call type mismatch
  TrapIndirectCallType
  /// Call stack exhausted
  TrapStackOverflow
  /// Execution timeout
  TrapTimeout
  /// Out of memory
  TrapOutOfMemory
  /// Custom trap with code
  TrapCustom(code: Int)
}

/// Result value from WASM execution
pub type WasmResult {
  /// 32-bit integer result
  ResultI32(value: Int)
  /// 64-bit integer result
  ResultI64(value: Int)
  /// 32-bit float result
  ResultF32(value: Float)
  /// 64-bit float result
  ResultF64(value: Float)
  /// No return value
  ResultVoid
  /// Multiple return values
  ResultMulti(values: List(WasmResult))
}

// ============================================================================
// SECTION 3: MEMORY SAFETY TYPES
// ============================================================================

/// Memory access type for monotonic checking
pub type MemoryAccessType {
  /// Read operation
  AccessRead
  /// Write operation
  AccessWrite
  /// Allocate operation
  AccessAlloc
  /// Deallocate operation  
  AccessDealloc
}

/// Memory access record for audit trail
pub type MemoryAccess {
  MemoryAccess(
    /// Type of access
    access_type: MemoryAccessType,
    /// Starting address
    address: Int,
    /// Size in bytes
    size: Int,
    /// Timestamp of access
    timestamp: Int,
  )
}

/// Linear type ownership token
/// Represents exclusive ownership of a memory region
pub type OwnershipToken {
  OwnershipToken(
    /// Token identifier
    id: Int,
    /// Memory region start address
    address: Int,
    /// Region size in bytes
    size: Int,
    /// Owner process ID
    owner_pid: Int,
    /// Creation timestamp
    created_at: Int,
  )
}

/// Borrow type for temporary memory access
pub type Borrow {
  /// Immutable borrow (multiple allowed)
  ImmutableBorrow(token_id: Int, expires_at: Int)
  /// Mutable borrow (exclusive)
  MutableBorrow(token_id: Int, expires_at: Int)
}

/// Memory region state
pub type MemoryRegionState {
  /// Region is free
  RegionFree
  /// Region is owned (with linear type)
  RegionOwned(token: OwnershipToken)
  /// Region has active borrow
  RegionBorrowed(token: OwnershipToken, borrow: Borrow)
}

/// Memory validation result
pub type MemoryValidation {
  /// Access is valid
  MemoryValid
  /// Address is out of bounds
  MemoryOutOfBounds(address: Int, size: Int, max_address: Int)
  /// Access violates ownership rules
  MemoryOwnershipViolation(address: Int, expected_owner: Int, actual_owner: Int)
  /// Borrow has expired
  MemoryBorrowExpired(address: Int, expired_at: Int)
  /// Write to immutably borrowed region
  MemoryMutabilityViolation(address: Int)
  /// Alignment violation
  MemoryMisaligned(address: Int, required_alignment: Int)
}

// ============================================================================
// SECTION 4: ESCALATION AND RECOVERY TYPES
// ============================================================================

/// Escalation level for trap handling
pub type EscalationLevel {
  /// Restart with preserved state
  Level1RestartWithState
  /// Restart with clean state
  Level2RestartClean
  /// Reload the module
  Level3ReloadModule
  /// Restart supervisor
  Level4RestartSupervisor
  /// System restart
  Level5SystemRestart
}

/// Escalation decision from supervisor
pub type EscalationDecision {
  EscalationDecision(
    /// Chosen escalation level
    level: EscalationLevel,
    /// Delay before restart (milliseconds)
    delay_ms: Int,
    /// Maximum retries at this level
    max_retries: Int,
    /// Current retry count
    current_retries: Int,
  )
}

/// Recovery action to take after trap
pub type RecoveryAction {
  /// Immediately restart the module
  RecoverRestart
  /// Wait and retry after delay
  RecoverDelayedRestart(delay_ms: Int)
  /// Permanently stop the module
  RecoverStop
  /// Escalate to parent supervisor
  RecoverEscalate
  /// Log and ignore (for non-critical traps)
  RecoverIgnore
}

/// Failure history for escalation decisions
pub type FailureHistory {
  FailureHistory(
    /// Recent failures within window
    failures: List(TrapInfo),
    /// Time window in milliseconds
    window_ms: Int,
    /// Current escalation level
    current_level: EscalationLevel,
  )
}

// ============================================================================
// SECTION 5: ASYNC CALL TYPES  
// ============================================================================

/// Async call handle for tracking non-blocking operations
pub type AsyncHandle {
  AsyncHandle(
    /// Unique call identifier
    call_id: Int,
    /// Maximum wait time before timeout
    timeout_ms: Int,
    /// Callback continuation point
    continuation: Int,
  )
}

/// Async call state
pub type AsyncCallState {
  /// Call is pending execution
  AsyncPending
  /// Call is executing
  AsyncExecuting
  /// Call completed with result
  AsyncCompleted(result: WasmResult)
  /// Call failed with trap
  AsyncFailed(trap: TrapInfo)
  /// Call timed out
  AsyncTimedOut
  /// Call was cancelled
  AsyncCancelled
}

/// Async call descriptor
pub type AsyncCall {
  AsyncCall(
    /// Handle for this call
    handle: AsyncHandle,
    /// Current state
    state: AsyncCallState,
    /// Start timestamp
    started_at: Int,
    /// Calling module ID
    caller_module: Int,
    /// Target function name
    target_function: String,
  )
}

// ============================================================================
// SECTION 6: INVARIANT CHECKING FUNCTIONS
// ============================================================================

/// Check if execution budget allows continuation
pub fn check_budget(budget: ExecutionBudget) -> BudgetCheckResult {
  case budget {
    ExecutionBudget(
      instructions_remaining: i,
      memory_remaining: _,
      time_remaining_ms: t,
      gas_consumed: _,
    ) if i <= 0 -> BudgetInstructionsExhausted
    ExecutionBudget(
      instructions_remaining: _,
      memory_remaining: _,
      time_remaining_ms: t,
      gas_consumed: _,
    ) if t <= 0 -> BudgetTimeExhausted
    ExecutionBudget(
      instructions_remaining: _,
      memory_remaining: m,
      time_remaining_ms: _,
      gas_consumed: _,
    ) if m <= 0 -> BudgetMemoryExhausted
    _ -> BudgetOk
  }
}

/// Consume instructions from budget
pub fn consume_instructions(
  budget: ExecutionBudget,
  count: Int,
) -> ExecutionBudget {
  ExecutionBudget(
    ..budget,
    instructions_remaining: budget.instructions_remaining - count,
  )
}

/// Consume memory from budget
pub fn consume_memory(budget: ExecutionBudget, bytes: Int) -> ExecutionBudget {
  ExecutionBudget(..budget, memory_remaining: budget.memory_remaining - bytes)
}

/// Consume time from budget
pub fn consume_time(budget: ExecutionBudget, ms: Int) -> ExecutionBudget {
  ExecutionBudget(..budget, time_remaining_ms: budget.time_remaining_ms - ms)
}

/// Add gas consumption
pub fn add_gas(budget: ExecutionBudget, gas: Int) -> ExecutionBudget {
  ExecutionBudget(..budget, gas_consumed: budget.gas_consumed + gas)
}

/// Create initial execution budget for a module
pub fn create_budget(is_system: Bool) -> ExecutionBudget {
  let memory_limit = case is_system {
    True -> max_system_memory
    False -> max_user_memory
  }
  ExecutionBudget(
    instructions_remaining: max_instructions_per_slice,
    memory_remaining: memory_limit,
    time_remaining_ms: max_call_latency_ms,
    gas_consumed: 0,
  )
}

// ============================================================================
// SECTION 7: MEMORY VALIDATION FUNCTIONS
// ============================================================================

/// Validate memory access is within bounds
pub fn validate_bounds(
  address: Int,
  size: Int,
  max_address: Int,
) -> MemoryValidation {
  case address >= 0 && address + size <= max_address {
    True -> MemoryValid
    False -> MemoryOutOfBounds(address, size, max_address)
  }
}

/// Validate memory alignment
pub fn validate_alignment(
  address: Int,
  required_alignment: Int,
) -> MemoryValidation {
  case address % required_alignment == 0 {
    True -> MemoryValid
    False -> MemoryMisaligned(address, required_alignment)
  }
}

/// Validate ownership for write access
pub fn validate_ownership(
  address: Int,
  accessing_pid: Int,
  region: MemoryRegionState,
) -> MemoryValidation {
  case region {
    RegionFree -> MemoryOwnershipViolation(address, 0, accessing_pid)
    RegionOwned(token) ->
      case token.owner_pid == accessing_pid {
        True -> MemoryValid
        False ->
          MemoryOwnershipViolation(address, token.owner_pid, accessing_pid)
      }
    RegionBorrowed(token, borrow) ->
      case borrow {
        ImmutableBorrow(_, _) -> MemoryMutabilityViolation(address)
        MutableBorrow(_, expires_at) ->
          case token.owner_pid == accessing_pid {
            True -> MemoryValid
            False ->
              MemoryOwnershipViolation(address, token.owner_pid, accessing_pid)
          }
      }
  }
}

// ============================================================================
// SECTION 8: TRAP HANDLING FUNCTIONS
// ============================================================================

/// Determine if trap is recoverable
pub fn is_recoverable(trap: TrapType) -> Bool {
  case trap {
    TrapTimeout -> True
    TrapOutOfMemory -> True
    TrapCustom(_) -> True
    _ -> False
  }
}

/// Get error code for trap type
pub fn trap_code(trap: TrapType) -> Int {
  case trap {
    TrapUnreachable -> 4001
    TrapIntegerDivByZero -> 4002
    TrapIntegerOverflow -> 4003
    TrapOutOfBounds -> 4004
    TrapIndirectCallType -> 4005
    TrapStackOverflow -> 4006
    TrapTimeout -> 3001
    TrapOutOfMemory -> 3002
    TrapCustom(code) -> code
  }
}

/// Create trap info from trap type and execution context
pub fn create_trap_info(
  trap_type: TrapType,
  pc: Int,
  stack_depth: Int,
  last_safe: Int,
  timestamp: Int,
) -> TrapInfo {
  TrapInfo(
    trap_type: trap_type,
    program_counter: pc,
    stack_depth: stack_depth,
    last_safe_point: last_safe,
    timestamp: timestamp,
    message: trap_message(trap_type),
  )
}

/// Get human-readable message for trap type
fn trap_message(trap: TrapType) -> String {
  case trap {
    TrapUnreachable -> "Execution reached unreachable instruction"
    TrapIntegerDivByZero -> "Integer division by zero"
    TrapIntegerOverflow -> "Integer operation overflow"
    TrapOutOfBounds -> "Memory access out of bounds"
    TrapIndirectCallType -> "Indirect call type mismatch"
    TrapStackOverflow -> "Call stack exhausted"
    TrapTimeout -> "Execution time limit exceeded"
    TrapOutOfMemory -> "Memory allocation failed"
    TrapCustom(code) -> "Custom trap: " <> int_to_string(code)
  }
}

// Convert integer to string for trap codes
fn int_to_string(n: Int) -> String {
  case n {
    _ if n < 0 -> "-" <> int_to_string(-n)
    _ if n < 10 -> digit_to_string(n)
    _ -> int_to_string(n / 10) <> digit_to_string(n % 10)
  }
}

// Convert single digit to string
fn digit_to_string(d: Int) -> String {
  case d {
    0 -> "0"
    1 -> "1"
    2 -> "2"
    3 -> "3"
    4 -> "4"
    5 -> "5"
    6 -> "6"
    7 -> "7"
    8 -> "8"
    9 -> "9"
    _ -> "?"
  }
}

// ============================================================================
// SECTION 9: ESCALATION LOGIC
// ============================================================================

/// Count failures within time window
pub fn count_recent_failures(history: FailureHistory, now: Int) -> Int {
  history.failures
  |> list_filter(fn(trap) { now - trap.timestamp < history.window_ms })
  |> list_length
}

// Helper: filter a list
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

// Helper: get list length
fn list_length(list: List(a)) -> Int {
  case list {
    [] -> 0
    [_, ..tail] -> 1 + list_length(tail)
  }
}

/// Determine recovery action based on failure history
pub fn determine_recovery(
  trap: TrapType,
  history: FailureHistory,
  now: Int,
) -> RecoveryAction {
  let recent_count = count_recent_failures(history, now)
  let recoverable = is_recoverable(trap)

  case recoverable, recent_count {
    // Non-recoverable traps always stop
    False, _ -> RecoverStop

    // First failure, just restart
    True, n if n < 3 -> RecoverRestart

    // Multiple failures, add delay
    True, n if n < 6 ->
      RecoverDelayedRestart(1000 * { n - 2 })

    // Too many failures, escalate
    True, _ -> RecoverEscalate
  }
}

/// Get next escalation level
pub fn next_escalation_level(current: EscalationLevel) -> EscalationLevel {
  case current {
    Level1RestartWithState -> Level2RestartClean
    Level2RestartClean -> Level3ReloadModule
    Level3ReloadModule -> Level4RestartSupervisor
    Level4RestartSupervisor -> Level5SystemRestart
    Level5SystemRestart -> Level5SystemRestart
  }
}

// ============================================================================
// SECTION 10: EXECUTION STATE TRANSITIONS
// ============================================================================

/// Start execution with fresh budget
pub fn start_execution(is_system: Bool) -> WasmExecutionState {
  WasmExecuting(budget: create_budget(is_system))
}

/// Yield at safe point
pub fn yield_at_safe_point(
  state: WasmExecutionState,
  resume_point: Int,
) -> WasmExecutionState {
  case state {
    WasmExecuting(budget) -> WasmYielded(resume_point, budget)
    _ -> state
  }
}

/// Resume from yield with refreshed time budget
pub fn resume_from_yield(state: WasmExecutionState) -> WasmExecutionState {
  case state {
    WasmYielded(_, budget) ->
      WasmExecuting(
        budget: ExecutionBudget(
          ..budget,
          instructions_remaining: max_instructions_per_slice,
          time_remaining_ms: max_call_latency_ms,
        ),
      )
    _ -> state
  }
}

/// Transition to suspended state for async call
pub fn suspend_for_async(
  state: WasmExecutionState,
  continuation_id: Int,
) -> WasmExecutionState {
  case state {
    WasmExecuting(_) -> WasmSuspended(continuation_id)
    _ -> state
  }
}

/// Handle trap and create trapped state
pub fn handle_trap(
  trap_type: TrapType,
  pc: Int,
  stack_depth: Int,
  last_safe: Int,
  timestamp: Int,
) -> WasmExecutionState {
  WasmTrapped(create_trap_info(trap_type, pc, stack_depth, last_safe, timestamp))
}

/// Complete execution with result
pub fn complete_execution(result: WasmResult) -> WasmExecutionState {
  WasmCompleted(result)
}

// ============================================================================
// SECTION 11: DETERMINISM INVARIANTS
// ============================================================================

/// Verify execution is deterministic by checking no external dependencies
pub type DeterminismCheck {
  /// Execution is deterministic
  Deterministic
  /// Non-deterministic time access
  NonDeterministicTime
  /// Non-deterministic random access
  NonDeterministicRandom
  /// Non-deterministic I/O
  NonDeterministicIO
  /// Non-deterministic threading
  NonDeterministicThread
}

/// Opcodes that require determinism guards
pub type GuardedOpcode {
  /// Memory load (requires bounds check)
  OpcodeLoad(address: Int, size: Int)
  /// Memory store (requires bounds and ownership check)
  OpcodeStore(address: Int, size: Int)
  /// Indirect call (requires type check)
  OpcodeCallIndirect(table_index: Int, type_index: Int)
  /// Memory grow (requires limit check)
  OpcodeMemoryGrow(pages: Int)
  /// External call (requires capability check)
  OpcodeExternalCall(function_name: String)
}

/// Result of opcode guard check
pub type GuardResult {
  /// Opcode is safe to execute
  GuardPass
  /// Opcode failed guard, execution should trap
  GuardFail(trap: TrapType)
}

/// Check opcode against safety guards
pub fn check_opcode_guard(
  opcode: GuardedOpcode,
  max_address: Int,
  max_pages: Int,
) -> GuardResult {
  case opcode {
    OpcodeLoad(address, size) ->
      case address >= 0 && address + size <= max_address {
        True -> GuardPass
        False -> GuardFail(TrapOutOfBounds)
      }
    OpcodeStore(address, size) ->
      case address >= 0 && address + size <= max_address {
        True -> GuardPass
        False -> GuardFail(TrapOutOfBounds)
      }
    OpcodeMemoryGrow(pages) ->
      case pages <= max_pages {
        True -> GuardPass
        False -> GuardFail(TrapOutOfMemory)
      }
    OpcodeCallIndirect(_, _) ->
      // Type checking handled by WASM runtime
      GuardPass
    OpcodeExternalCall(_) ->
      // Capability checking handled by kernel
      GuardPass
  }
}
