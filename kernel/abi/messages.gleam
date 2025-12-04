//// kernel/abi/messages.gleam
////
//// ESTA Logic Kernel ABI Message Definitions
////
//// This module defines the message types used for kernel-level
//// communication. All message formats are explicitly typed and
//// designed for deterministic serialization.
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: MESSAGE IDENTIFIER TYPES
// ============================================================================

/// Unique message identifier
pub type MessageId {
  MessageId(high: Int, low: Int)
}

/// Sequence number for ordering
pub type SequenceNumber {
  SequenceNumber(value: Int)
}

/// Timestamp in nanoseconds
pub type Timestamp {
  Timestamp(nanos: Int)
}

// ============================================================================
// SECTION 2: MESSAGE ENVELOPE
// ============================================================================

/// Message header containing routing and metadata
pub type MessageHeader {
  MessageHeader(
    id: MessageId,
    source: Int,
    target: Int,
    sequence: SequenceNumber,
    timestamp: Timestamp,
    priority: MessagePriority,
    flags: MessageFlags,
  )
}

/// Message priority levels
pub type MessagePriority {
  PriorityLow
  PriorityNormal
  PriorityHigh
  PriorityCritical
}

/// Message flags
pub type MessageFlags {
  MessageFlags(
    require_ack: Bool,
    transactional: Bool,
    persistent: Bool,
    encrypted: Bool,
  )
}

/// Complete message with header and payload
pub type Message(payload) {
  Message(header: MessageHeader, msg_type: MessageType, payload: payload)
}

// ============================================================================
// SECTION 3: MESSAGE TYPES
// ============================================================================

/// Standard kernel message types
pub type MessageType {
  /// Health check request
  Ping
  /// Health check response
  Pong
  /// Accrual calculation request
  AccrualRequest
  /// Accrual calculation response
  AccrualResponse
  /// Audit start
  AuditStart
  /// Audit record
  AuditRecord
  /// Audit end
  AuditEnd
  /// System shutdown
  SystemShutdown
  /// Custom message type
  Custom(type_id: Int)
}

// ============================================================================
// SECTION 4: MESSAGE RESULTS
// ============================================================================

/// Result of sending a message
pub type SendResult {
  SendOk(sequence: SequenceNumber)
  SendMailboxFull
  SendTargetNotFound
  SendPermissionDenied
  SendPayloadTooLarge
}

/// Result of receiving a message
pub type ReceiveResult(payload) {
  ReceiveOk(message: Message(payload))
  ReceiveTimeout
  ReceiveEmpty
  ReceiveShuttingDown
}

// ============================================================================
// SECTION 5: HELPER FUNCTIONS
// ============================================================================

/// Create a new message ID
pub fn new_message_id(high: Int, low: Int) -> MessageId {
  MessageId(high: high, low: low)
}

/// Create default flags
pub fn default_flags() -> MessageFlags {
  MessageFlags(
    require_ack: False,
    transactional: False,
    persistent: False,
    encrypted: False,
  )
}

/// Convert priority to integer
pub fn priority_to_int(priority: MessagePriority) -> Int {
  case priority {
    PriorityLow -> 0
    PriorityNormal -> 1
    PriorityHigh -> 2
    PriorityCritical -> 3
  }
}

/// Compare priorities
pub fn priority_gte(a: MessagePriority, b: MessagePriority) -> Bool {
  priority_to_int(a) >= priority_to_int(b)
}
