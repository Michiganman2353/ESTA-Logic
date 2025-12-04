//// kernel/abi/errors.gleam
////
//// ESTA Logic Kernel ABI Error Definitions
////
//// This module defines all error types used in the kernel ABI.
//// Errors are categorized for proper escalation and recovery.
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: ERROR CATEGORIES
// ============================================================================

/// Error category for escalation model
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

// ============================================================================
// SECTION 2: TRAP TYPES
// ============================================================================

/// WASM trap types
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

// ============================================================================
// SECTION 3: ESCALATION LEVELS
// ============================================================================

/// Escalation level in supervisor hierarchy
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

/// Recovery strategy
pub type RecoveryStrategy {
  /// Restart the failed process
  Restart(level: EscalationLevel)
  /// Ignore the failure
  Ignore
  /// Stop the process permanently
  Stop
  /// Escalate to parent supervisor
  Escalate
}

// ============================================================================
// SECTION 4: PROCESS ERRORS
// ============================================================================

/// Process exit codes
pub type ExitCode {
  ExitNormal
  ExitCode(code: Int)
  ExitKilled
  ExitCrashed(reason: ErrorCategory)
}

/// Process operation errors
pub type ProcessError {
  ProcessNotFound(pid: Int)
  ProcessAlreadyExists(pid: Int)
  ProcessNotRunning(pid: Int)
  ProcessBlocked(pid: Int)
  InvalidProcessState(expected: String, actual: String)
}

// ============================================================================
// SECTION 5: MESSAGE ERRORS
// ============================================================================

/// Message operation errors
pub type MessageError {
  MailboxFull(pid: Int, capacity: Int)
  TargetNotFound(pid: Int)
  MessageTooLarge(size: Int, max: Int)
  InvalidMessageFormat
  DeliveryTimeout
  ChannelClosed
}

// ============================================================================
// SECTION 6: CAPABILITY ERRORS
// ============================================================================

/// Capability operation errors
pub type CapabilityError {
  CapabilityNotFound(id: Int)
  CapabilityExpired(id: Int)
  CapabilityRevoked(id: Int)
  InsufficientRights(required: List(String), actual: List(String))
  DelegationNotAllowed(id: Int)
  InvalidCapability(reason: String)
}

// ============================================================================
// SECTION 7: RESOURCE ERRORS
// ============================================================================

/// Resource operation errors
pub type ResourceError {
  ResourceNotFound(resource_type: String, id: String)
  ResourceBusy(resource_type: String, id: String)
  ResourceExhausted(resource_type: String)
  ResourceLocked(resource_type: String, id: String, holder: Int)
  InvalidResourceState(resource_type: String, id: String)
}

// ============================================================================
// SECTION 8: HELPER FUNCTIONS
// ============================================================================

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

/// Check if trap is recoverable
pub fn is_recoverable(trap: TrapType) -> Bool {
  case trap {
    TrapTimeout -> True
    TrapOutOfMemory -> True
    _ -> False
  }
}

/// Get category from error code
pub fn code_to_category(code: Int) -> String {
  case code {
    n if n >= 1000 && n < 2000 -> "user"
    n if n >= 2000 && n < 3000 -> "logic"
    n if n >= 3000 && n < 4000 -> "resource"
    n if n >= 4000 && n < 5000 -> "integrity"
    n if n >= 5000 && n < 6000 -> "system"
    _ -> "unknown"
  }
}

/// Create a user error
pub fn user_error(code: Int, message: String) -> ErrorCategory {
  UserError(1000 + code, message)
}

/// Create a logic error
pub fn logic_error(code: Int, message: String) -> ErrorCategory {
  LogicError(2000 + code, message)
}

/// Create a resource error
pub fn resource_error(code: Int, message: String) -> ErrorCategory {
  ResourceError(3000 + code, message)
}

/// Create an integrity error
pub fn integrity_error(code: Int, message: String) -> ErrorCategory {
  IntegrityError(4000 + code, message)
}

/// Create a system error
pub fn system_error(code: Int, message: String) -> ErrorCategory {
  SystemError(5000 + code, message)
}
