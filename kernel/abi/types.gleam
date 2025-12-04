//// kernel/abi/types.gleam
////
//// ESTA Logic Kernel ABI Core Type Definitions
////
//// This module defines the core types used across the kernel ABI.
//// All types are explicitly defined for formal verification.
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: PROCESS TYPES
// ============================================================================

/// Process identifier
pub type Pid {
  Pid(id: Int)
}

/// Process state
pub type ProcessState {
  Created
  Ready
  Running
  Waiting
  Blocked
  Completed
}

/// Process priority
pub type Priority {
  Idle
  Low
  Normal
  High
  Realtime
  System
}

/// Process descriptor
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
// SECTION 2: MEMORY TYPES
// ============================================================================

/// Memory region types
pub type MemoryRegion {
  KernelSpace
  WasmLinear(module_id: Int)
  MessageBuffers
  AuditLogs
}

/// Memory access rights
pub type MemoryAccess {
  NoAccess
  ReadOnly
  ReadWrite
  Execute
}

// ============================================================================
// SECTION 3: CAPABILITY TYPES
// ============================================================================

/// Capability token
pub type Capability {
  Capability(
    id: Int,
    resource_type: ResourceType,
    rights: List(CapabilityRight),
    expires_at: Result(Int, Nil),
  )
}

/// Resource types
pub type ResourceType {
  ResourceProcess
  ResourceMemory
  ResourceChannel
  ResourceDevice
  ResourceAuditLog
}

/// Capability rights
pub type CapabilityRight {
  RightRead
  RightWrite
  RightExecute
  RightDelegate
  RightRevoke
}

// ============================================================================
// SECTION 4: TIME TYPES
// ============================================================================

/// Time slice in milliseconds
pub type TimeSlice {
  TimeSlice(ms: Int)
}

/// Timestamp in nanoseconds
pub type Timestamp {
  Timestamp(nanos: Int)
}

/// Duration
pub type Duration {
  Duration(nanos: Int)
}

// ============================================================================
// SECTION 5: HELPER FUNCTIONS
// ============================================================================

/// Convert priority to time slice
pub fn priority_to_slice(priority: Priority) -> TimeSlice {
  case priority {
    Idle -> TimeSlice(100)
    Low -> TimeSlice(50)
    Normal -> TimeSlice(25)
    High -> TimeSlice(15)
    Realtime -> TimeSlice(10)
    System -> TimeSlice(0)
  }
}

/// Convert priority to integer
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

/// Check if priority is preemptible
pub fn is_preemptible(priority: Priority) -> Bool {
  case priority {
    System -> False
    _ -> True
  }
}

/// Create a new PID
pub fn new_pid(id: Int) -> Pid {
  Pid(id: id)
}

/// Get PID value
pub fn pid_value(pid: Pid) -> Int {
  pid.id
}
