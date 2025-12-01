//// estalogic_protocol/message.gleam
////
//// Canonical Message Schema for the ESTA Logic Messaging Fabric
////
//// This module defines a single unified message format used across all
//// communication boundaries: WASM ↔ Tauri ↔ Kafka.
////
//// Key Design Principles:
//// 1. Prefer Gleam custom types over ad-hoc maps for type safety
//// 2. Enforce serialization determinism for cross-boundary consistency
//// 3. All messages are traceable with embedded context
//// 4. Authentication context is always present for security
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: MESSAGE IDENTIFIER TYPES
// ============================================================================

/// Universally unique message identifier
/// Uses UUID v7 format for time-ordered, collision-resistant IDs
pub type MessageId {
  MessageId(
    /// High 64 bits (timestamp + version + variant)
    high: Int,
    /// Low 64 bits (random component)
    low: Int,
  )
}

/// Monotonically increasing sequence number within a channel
/// Used for ordering and gap detection
pub type SequenceNumber {
  SequenceNumber(value: Int)
}

/// Idempotency token for deduplication
/// Clients generate this to ensure exactly-once processing
pub type IdempotencyToken {
  IdempotencyToken(value: String)
}

// ============================================================================
// SECTION 2: TIMESTAMP TYPES
// ============================================================================

/// Logical timestamp with wall-clock and logical counter
/// Implements Hybrid Logical Clock (HLC) semantics
pub type Timestamp {
  Timestamp(
    /// Wall clock in nanoseconds since Unix epoch
    wall_nanos: Int,
    /// Logical counter for same-millisecond ordering
    logical: Int,
    /// Node ID for tie-breaking across nodes
    node_id: Int,
  )
}

/// Duration for timeout and TTL specifications
pub type Duration {
  Duration(nanos: Int)
}

// ============================================================================
// SECTION 3: TRACE CONTEXT TYPES (W3C Trace Context compatible)
// ============================================================================

/// Trace identifier - 128-bit ID shared by all spans in a trace
pub type TraceId {
  TraceId(high: Int, low: Int)
}

/// Span identifier - 64-bit ID unique within a trace
pub type SpanId {
  SpanId(value: Int)
}

/// W3C Trace Context compliant trace context
/// Enables distributed tracing across WASM ↔ Tauri ↔ Kafka boundaries
pub type TraceContext {
  TraceContext(
    /// Version of the trace context format (currently 0x00)
    version: Int,
    /// Trace identifier spanning all related operations
    trace_id: TraceId,
    /// Parent span identifier
    parent_span_id: SpanId,
    /// Trace flags (sampled, random, etc.)
    trace_flags: TraceFlags,
    /// Vendor-specific trace state
    trace_state: List(TraceStateEntry),
  )
}

/// Trace flags as per W3C specification
pub type TraceFlags {
  TraceFlags(
    /// Whether this trace is sampled for recording
    sampled: Bool,
    /// Whether the trace ID is randomly generated
    random: Bool,
  )
}

/// Vendor-specific trace state entry
pub type TraceStateEntry {
  TraceStateEntry(vendor: String, value: String)
}

/// Create an empty trace context (for untraced messages)
pub fn empty_trace_context() -> TraceContext {
  TraceContext(
    version: 0,
    trace_id: TraceId(high: 0, low: 0),
    parent_span_id: SpanId(value: 0),
    trace_flags: TraceFlags(sampled: False, random: False),
    trace_state: [],
  )
}

/// Check if trace context is valid (non-zero trace ID)
pub fn is_valid_trace_context(ctx: TraceContext) -> Bool {
  let TraceId(high, low) = ctx.trace_id
  high != 0 || low != 0
}

// ============================================================================
// SECTION 4: AUTHENTICATION CONTEXT TYPES
// ============================================================================

/// Authentication context embedded in every message
/// Ensures security context travels with the message across all boundaries
pub type AuthContext {
  AuthContext(
    /// Principal identifier (user, service, or system)
    principal: Principal,
    /// Authentication method used
    auth_method: AuthMethod,
    /// Timestamp when auth was established
    authenticated_at: Timestamp,
    /// Expiration time for this auth context
    expires_at: Timestamp,
    /// Capabilities granted to this principal
    capabilities: List(Capability),
    /// Tenant identifier for multi-tenant isolation
    tenant_id: TenantId,
    /// Request-scoped claims
    claims: List(Claim),
  )
}

/// Principal types for multi-entity authentication
pub type Principal {
  /// Human user with unique ID
  UserPrincipal(user_id: String)
  /// System service with service name
  ServicePrincipal(service_name: String)
  /// Machine-to-machine with client ID
  MachinePrincipal(client_id: String)
  /// Anonymous principal (limited capabilities)
  AnonymousPrincipal
  /// System principal (elevated privileges)
  SystemPrincipal
}

/// Authentication methods
pub type AuthMethod {
  /// JWT token authentication
  JwtAuth
  /// Mutual TLS authentication
  MtlsAuth
  /// API key authentication
  ApiKeyAuth
  /// Service account authentication
  ServiceAccountAuth
  /// Anonymous (no authentication)
  NoAuth
}

/// Capability token for fine-grained access control
pub type Capability {
  Capability(
    /// Resource type this capability applies to
    resource: ResourceType,
    /// Actions permitted on the resource
    actions: List(Action),
    /// Optional resource instance ID
    resource_id: Result(String, Nil),
    /// Expiration timestamp
    expires_at: Result(Timestamp, Nil),
  )
}

/// Resource types for capability-based security
pub type ResourceType {
  /// Employee record access
  ResourceEmployee
  /// Accrual calculation access
  ResourceAccrual
  /// Audit log access
  ResourceAuditLog
  /// Report generation access
  ResourceReport
  /// System configuration access
  ResourceConfig
  /// Message channel access
  ResourceChannel
  /// WASM module access
  ResourceModule
}

/// Actions that can be performed on resources
pub type Action {
  ActionRead
  ActionWrite
  ActionDelete
  ActionExecute
  ActionAdmin
}

/// Tenant identifier for multi-tenancy
pub type TenantId {
  TenantId(value: String)
}

/// Claims are key-value pairs for custom assertions
pub type Claim {
  Claim(key: String, value: String)
}

/// Create an anonymous auth context with minimal capabilities
pub fn anonymous_auth_context(now: Timestamp) -> AuthContext {
  AuthContext(
    principal: AnonymousPrincipal,
    auth_method: NoAuth,
    authenticated_at: now,
    expires_at: Timestamp(
      wall_nanos: now.wall_nanos + 3_600_000_000_000,
      logical: 0,
      node_id: now.node_id,
    ),
    capabilities: [],
    tenant_id: TenantId(value: "anonymous"),
    claims: [],
  )
}

/// Create a system auth context with full capabilities
pub fn system_auth_context(now: Timestamp) -> AuthContext {
  AuthContext(
    principal: SystemPrincipal,
    auth_method: ServiceAccountAuth,
    authenticated_at: now,
    expires_at: Timestamp(
      wall_nanos: now.wall_nanos + 86_400_000_000_000,
      logical: 0,
      node_id: now.node_id,
    ),
    capabilities: [
      Capability(
        resource: ResourceEmployee,
        actions: [ActionRead, ActionWrite, ActionDelete, ActionAdmin],
        resource_id: Error(Nil),
        expires_at: Error(Nil),
      ),
      Capability(
        resource: ResourceAccrual,
        actions: [ActionRead, ActionWrite, ActionExecute],
        resource_id: Error(Nil),
        expires_at: Error(Nil),
      ),
      Capability(
        resource: ResourceAuditLog,
        actions: [ActionRead, ActionWrite],
        resource_id: Error(Nil),
        expires_at: Error(Nil),
      ),
      Capability(
        resource: ResourceConfig,
        actions: [ActionRead, ActionWrite, ActionAdmin],
        resource_id: Error(Nil),
        expires_at: Error(Nil),
      ),
    ],
    tenant_id: TenantId(value: "system"),
    claims: [Claim(key: "role", value: "system")],
  )
}

// ============================================================================
// SECTION 5: PAYLOAD TYPES
// ============================================================================

/// Message payload with explicit encoding
/// Ensures deterministic serialization across boundaries
pub type Payload {
  /// Binary payload (raw bytes as list of integers 0-255)
  BinaryPayload(data: List(Int))
  /// JSON payload (must be valid JSON string)
  JsonPayload(json: String)
  /// Protobuf payload (schema ID + binary data)
  ProtobufPayload(schema_id: Int, data: List(Int))
  /// Empty payload (for control messages)
  EmptyPayload
}

/// Encoding format for deterministic serialization
pub type Encoding {
  /// Raw binary (no encoding)
  EncodingRaw
  /// JSON with sorted keys (deterministic)
  EncodingJsonCanonical
  /// Protocol Buffers (deterministic by spec)
  EncodingProtobuf
  /// MessagePack (deterministic with sorted keys)
  EncodingMsgpackCanonical
}

// ============================================================================
// SECTION 6: CANONICAL MESSAGE TYPE
// ============================================================================

/// Canonical message format for the ESTA Logic messaging fabric
/// This is the single source of truth for all message structures
pub type Message {
  Message(
    /// Unique message identifier (UUID v7 recommended)
    id: MessageId,
    /// Hybrid Logical Clock timestamp
    timestamp: Timestamp,
    /// Message payload with explicit encoding
    payload: Payload,
    /// W3C Trace Context for distributed tracing
    trace_context: TraceContext,
    /// Authentication and authorization context
    auth_context: AuthContext,
    /// Message type for routing and handling
    message_type: MessageType,
    /// Correlation ID for request-response patterns
    correlation_id: Result(MessageId, Nil),
    /// Reply-to address for responses
    reply_to: Result(ChannelAddress, Nil),
    /// Idempotency token for deduplication
    idempotency_token: Result(IdempotencyToken, Nil),
    /// Time-to-live before message expires
    ttl: Result(Duration, Nil),
    /// Priority for scheduling
    priority: MessagePriority,
    /// Headers for extensibility
    headers: List(Header),
  )
}

/// Message type enumeration for routing
pub type MessageType {
  /// Command - request to change state
  Command(name: String)
  /// Query - request to read state
  Query(name: String)
  /// Event - notification of state change
  Event(name: String)
  /// Response - result of command or query
  Response(status: ResponseStatus)
  /// System - internal control message
  System(kind: SystemMessageKind)
}

/// Response status for response messages
pub type ResponseStatus {
  StatusOk
  StatusError(code: Int, message: String)
  StatusPending
  StatusTimeout
}

/// System message kinds
pub type SystemMessageKind {
  /// Health check
  Ping
  /// Health check response
  Pong
  /// Graceful shutdown
  Shutdown
  /// Channel subscription
  Subscribe
  /// Channel unsubscription
  Unsubscribe
  /// Acknowledgment
  Ack
  /// Negative acknowledgment
  Nack
  /// Flow control - pause sending
  FlowPause
  /// Flow control - resume sending
  FlowResume
}

/// Channel address for routing
pub type ChannelAddress {
  ChannelAddress(
    /// Transport protocol
    transport: Transport,
    /// Channel name or topic
    channel: String,
    /// Optional partition
    partition: Result(Int, Nil),
  )
}

/// Supported transport protocols
pub type Transport {
  /// In-process message passing
  TransportLocal
  /// Kafka topics
  TransportKafka
  /// Redis pub/sub
  TransportRedis
  /// WASM boundary
  TransportWasm
  /// Tauri IPC
  TransportTauri
  /// HTTP/2 gRPC
  TransportGrpc
}

/// Message priority levels
pub type MessagePriority {
  /// Background priority - fully preemptible
  PriorityBackground
  /// Low priority - may be delayed
  PriorityLow
  /// Normal priority - standard processing
  PriorityNormal
  /// High priority - expedited processing
  PriorityHigh
  /// Critical priority - immediate processing
  PriorityCritical
}

/// Header for extensibility
pub type Header {
  Header(key: String, value: String)
}

// ============================================================================
// SECTION 7: MESSAGE CONSTRUCTION HELPERS
// ============================================================================

/// Create a new message with minimal required fields
pub fn new_message(
  id: MessageId,
  timestamp: Timestamp,
  payload: Payload,
  trace_context: TraceContext,
  auth_context: AuthContext,
  message_type: MessageType,
) -> Message {
  Message(
    id: id,
    timestamp: timestamp,
    payload: payload,
    trace_context: trace_context,
    auth_context: auth_context,
    message_type: message_type,
    correlation_id: Error(Nil),
    reply_to: Error(Nil),
    idempotency_token: Error(Nil),
    ttl: Error(Nil),
    priority: PriorityNormal,
    headers: [],
  )
}

/// Create a command message
pub fn command(
  id: MessageId,
  timestamp: Timestamp,
  name: String,
  payload: Payload,
  trace_context: TraceContext,
  auth_context: AuthContext,
) -> Message {
  new_message(
    id,
    timestamp,
    payload,
    trace_context,
    auth_context,
    Command(name),
  )
}

/// Create a query message
pub fn query(
  id: MessageId,
  timestamp: Timestamp,
  name: String,
  payload: Payload,
  trace_context: TraceContext,
  auth_context: AuthContext,
) -> Message {
  new_message(id, timestamp, payload, trace_context, auth_context, Query(name))
}

/// Create an event message
pub fn event(
  id: MessageId,
  timestamp: Timestamp,
  name: String,
  payload: Payload,
  trace_context: TraceContext,
  auth_context: AuthContext,
) -> Message {
  new_message(id, timestamp, payload, trace_context, auth_context, Event(name))
}

/// Create a success response
pub fn ok_response(
  id: MessageId,
  timestamp: Timestamp,
  payload: Payload,
  trace_context: TraceContext,
  auth_context: AuthContext,
  correlation_id: MessageId,
) -> Message {
  Message(
    ..new_message(
      id,
      timestamp,
      payload,
      trace_context,
      auth_context,
      Response(StatusOk),
    ),
    correlation_id: Ok(correlation_id),
  )
}

/// Create an error response
pub fn error_response(
  id: MessageId,
  timestamp: Timestamp,
  error_code: Int,
  error_message: String,
  trace_context: TraceContext,
  auth_context: AuthContext,
  correlation_id: MessageId,
) -> Message {
  Message(
    ..new_message(
      id,
      timestamp,
      EmptyPayload,
      trace_context,
      auth_context,
      Response(StatusError(error_code, error_message)),
    ),
    correlation_id: Ok(correlation_id),
  )
}

/// Set correlation ID on a message
pub fn with_correlation_id(msg: Message, correlation_id: MessageId) -> Message {
  Message(..msg, correlation_id: Ok(correlation_id))
}

/// Set reply-to address on a message
pub fn with_reply_to(msg: Message, reply_to: ChannelAddress) -> Message {
  Message(..msg, reply_to: Ok(reply_to))
}

/// Set idempotency token on a message
pub fn with_idempotency_token(
  msg: Message,
  token: IdempotencyToken,
) -> Message {
  Message(..msg, idempotency_token: Ok(token))
}

/// Set TTL on a message
pub fn with_ttl(msg: Message, ttl: Duration) -> Message {
  Message(..msg, ttl: Ok(ttl))
}

/// Set priority on a message
pub fn with_priority(msg: Message, priority: MessagePriority) -> Message {
  Message(..msg, priority: priority)
}

/// Add a header to a message
pub fn with_header(msg: Message, key: String, value: String) -> Message {
  Message(..msg, headers: [Header(key, value), ..msg.headers])
}

// ============================================================================
// SECTION 8: SERIALIZATION DETERMINISM
// ============================================================================

/// Message envelope for wire format
/// Ensures consistent ordering of fields for deterministic serialization
pub type MessageEnvelope {
  MessageEnvelope(
    /// Schema version for forward/backward compatibility
    schema_version: Int,
    /// Content encoding
    encoding: Encoding,
    /// Checksum for integrity verification
    checksum: Int,
    /// The actual message
    message: Message,
  )
}

/// Create a message envelope with deterministic encoding
pub fn envelope(
  message: Message,
  encoding: Encoding,
  schema_version: Int,
) -> MessageEnvelope {
  MessageEnvelope(
    schema_version: schema_version,
    encoding: encoding,
    checksum: 0,
    // Placeholder - actual checksum computed during serialization
    message: message,
  )
}

/// Current schema version
pub const current_schema_version: Int = 1

/// Field ordering for deterministic JSON serialization
/// Fields must be serialized in this exact order
pub type FieldOrder {
  FieldOrder(fields: List(String))
}

/// Canonical field order for Message type
pub fn message_field_order() -> FieldOrder {
  FieldOrder(fields: [
    "id",
    "timestamp",
    "message_type",
    "payload",
    "trace_context",
    "auth_context",
    "correlation_id",
    "reply_to",
    "idempotency_token",
    "ttl",
    "priority",
    "headers",
  ])
}

// ============================================================================
// SECTION 9: MESSAGE VALIDATION
// ============================================================================

/// Validation result
pub type ValidationResult {
  /// Message is valid
  Valid
  /// Message has validation errors
  Invalid(errors: List(ValidationError))
}

/// Validation error types
pub type ValidationError {
  /// Missing required field
  MissingField(field: String)
  /// Invalid field value
  InvalidField(field: String, reason: String)
  /// Message has expired
  MessageExpired
  /// Auth context has expired
  AuthExpired
  /// Invalid trace context
  InvalidTraceContext
  /// Payload too large
  PayloadTooLarge(actual: Int, max: Int)
}

/// Maximum payload size in bytes (1 MB default)
pub const max_payload_size: Int = 1_048_576

/// Validate a message for completeness and correctness
pub fn validate_message(msg: Message, now: Timestamp) -> ValidationResult {
  let errors = []

  // Check message ID is valid
  let errors = case msg.id {
    MessageId(0, 0) -> [MissingField("id"), ..errors]
    _ -> errors
  }

  // Check timestamp is valid
  let errors = case msg.timestamp.wall_nanos > 0 {
    True -> errors
    False -> [InvalidField("timestamp", "must be positive"), ..errors]
  }

  // Check auth context hasn't expired
  let errors = case msg.auth_context.expires_at.wall_nanos > now.wall_nanos {
    True -> errors
    False -> [AuthExpired, ..errors]
  }

  // Check TTL if present
  let errors = case msg.ttl {
    Ok(Duration(nanos)) ->
      case msg.timestamp.wall_nanos + nanos > now.wall_nanos {
        True -> errors
        False -> [MessageExpired, ..errors]
      }
    Error(_) -> errors
  }

  // Check payload size
  let errors = case msg.payload {
    BinaryPayload(data) ->
      case list_length(data) > max_payload_size {
        True -> [PayloadTooLarge(list_length(data), max_payload_size), ..errors]
        False -> errors
      }
    _ -> errors
  }

  case errors {
    [] -> Valid
    _ -> Invalid(errors)
  }
}

// Helper to get list length
fn list_length(lst: List(a)) -> Int {
  case lst {
    [] -> 0
    [_, ..rest] -> 1 + list_length(rest)
  }
}

// ============================================================================
// SECTION 10: MESSAGE COMPARISON FOR TESTING
// ============================================================================

/// Compare two message IDs for equality
pub fn message_id_equal(a: MessageId, b: MessageId) -> Bool {
  a.high == b.high && a.low == b.low
}

/// Compare two timestamps for ordering
pub fn timestamp_compare(a: Timestamp, b: Timestamp) -> Order {
  case a.wall_nanos < b.wall_nanos {
    True -> Lt
    False ->
      case a.wall_nanos > b.wall_nanos {
        True -> Gt
        False ->
          case a.logical < b.logical {
            True -> Lt
            False ->
              case a.logical > b.logical {
                True -> Gt
                False -> Eq
              }
          }
      }
  }
}

/// Ordering type
pub type Order {
  Lt
  Eq
  Gt
}

/// Convert priority to integer for comparison
pub fn priority_to_int(priority: MessagePriority) -> Int {
  case priority {
    PriorityBackground -> 0
    PriorityLow -> 1
    PriorityNormal -> 2
    PriorityHigh -> 3
    PriorityCritical -> 4
  }
}
