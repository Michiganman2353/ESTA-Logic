//// kernel/abi/syscalls.gleam
////
//// ESTA Logic Kernel ABI System Call Definitions
////
//// This module defines the system call interface between user-space
//// processes and the kernel. All syscalls are explicit and typed.
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: SYSCALL IDENTIFIERS
// ============================================================================

/// System call numbers
pub type SyscallId {
  /// Process management
  SysSpawn
  SysExit
  SysYield
  SysWait
  /// Message passing
  SysSend
  SysReceive
  SysReply
  /// Memory management
  SysAlloc
  SysFree
  SysMap
  /// Capability management
  SysCapCreate
  SysCapValidate
  SysCapDelegate
  SysCapRevoke
  /// File system
  SysOpen
  SysClose
  SysRead
  SysWrite
  SysStat
  /// Network
  SysConnect
  SysListen
  SysAccept
  /// Time
  SysGetTime
  SysSleep
  SysSetTimer
  /// Database
  SysDbQuery
  SysDbExecute
  SysDbTransaction
  /// Custom syscall
  SysCustom(id: Int)
}

// ============================================================================
// SECTION 2: SYSCALL REQUESTS
// ============================================================================

/// Spawn a new process
pub type SpawnRequest {
  SpawnRequest(
    module_id: Int,
    entry_point: String,
    args: List(String),
    priority: Int,
  )
}

/// Exit the current process
pub type ExitRequest {
  ExitRequest(code: Int)
}

/// Yield CPU voluntarily
pub type YieldRequest {
  YieldRequest(reason: YieldReason)
}

/// Yield reason
pub type YieldReason {
  YieldVoluntary
  YieldWaitingMessage
  YieldWaitingIO
  YieldSliceExpired
}

/// Send a message
pub type SendRequest {
  SendRequest(target: Int, msg_type: Int, payload_size: Int)
}

/// Receive a message
pub type ReceiveRequest {
  ReceiveRequest(timeout_ms: Int, type_filter: Result(Int, Nil))
}

/// Allocate memory
pub type AllocRequest {
  AllocRequest(size: Int, alignment: Int, region: Int)
}

/// Free memory
pub type FreeRequest {
  FreeRequest(address: Int, size: Int)
}

// ============================================================================
// SECTION 3: SYSCALL RESULTS
// ============================================================================

/// Generic syscall result
pub type SyscallResult {
  SyscallOk(value: Int)
  SyscallError(code: Int, message: String)
  SyscallBlocked
  SyscallTimeout
}

/// Spawn result
pub type SpawnResult {
  SpawnOk(pid: Int)
  SpawnModuleNotFound
  SpawnEntryPointNotFound
  SpawnResourceExhausted
  SpawnPermissionDenied
}

/// Alloc result
pub type AllocResult {
  AllocOk(address: Int, actual_size: Int)
  AllocOutOfMemory
  AllocInvalidAlignment
  AllocPermissionDenied
}

// ============================================================================
// SECTION 4: SYSCALL DISPATCH
// ============================================================================

/// Syscall context
pub type SyscallContext {
  SyscallContext(
    caller_pid: Int,
    syscall_id: SyscallId,
    timestamp_ns: Int,
    capability_id: Result(Int, Nil),
  )
}

/// Dispatch a syscall
pub fn dispatch(
  context: SyscallContext,
  _request: SyscallRequest,
) -> SyscallResult {
  // Placeholder implementation
  case context.syscall_id {
    SysExit -> SyscallOk(0)
    SysYield -> SyscallOk(0)
    _ -> SyscallError(1, "Not implemented")
  }
}

/// Syscall request union type
pub type SyscallRequest {
  SpawnReq(request: SpawnRequest)
  ExitReq(request: ExitRequest)
  YieldReq(request: YieldRequest)
  SendReq(request: SendRequest)
  ReceiveReq(request: ReceiveRequest)
  AllocReq(request: AllocRequest)
  FreeReq(request: FreeRequest)
}

// ============================================================================
// SECTION 5: HELPER FUNCTIONS
// ============================================================================

/// Get syscall number
pub fn syscall_to_int(syscall: SyscallId) -> Int {
  case syscall {
    SysSpawn -> 1
    SysExit -> 2
    SysYield -> 3
    SysWait -> 4
    SysSend -> 10
    SysReceive -> 11
    SysReply -> 12
    SysAlloc -> 20
    SysFree -> 21
    SysMap -> 22
    SysCapCreate -> 30
    SysCapValidate -> 31
    SysCapDelegate -> 32
    SysCapRevoke -> 33
    SysOpen -> 40
    SysClose -> 41
    SysRead -> 42
    SysWrite -> 43
    SysStat -> 44
    SysConnect -> 50
    SysListen -> 51
    SysAccept -> 52
    SysGetTime -> 60
    SysSleep -> 61
    SysSetTimer -> 62
    SysDbQuery -> 70
    SysDbExecute -> 71
    SysDbTransaction -> 72
    SysCustom(id) -> 1000 + id
  }
}
