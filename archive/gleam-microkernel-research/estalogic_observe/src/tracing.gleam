//// estalogic_observe/tracing.gleam
////
//// OpenTelemetry Tracing for ESTA Logic
////
//// This module provides flight-recorder level observability with:
//// - Kernel internal event tracing
//// - Driver call tracing (Kafka, Redis, Postgres)
//// - WASM boundary transition tracing
////
//// Implements W3C Trace Context propagation for distributed tracing
//// across WASM ↔ Tauri ↔ Kafka boundaries.
////
//// Design Note on Type Duplication:
//// TraceId and SpanId types are defined here and in message.gleam.
//// Each Gleam package is a standalone compilation unit. The types
//// are structurally identical to ensure wire-format compatibility
//// when serializing/deserializing across package boundaries.
////
//// Reference: https://www.w3.org/TR/trace-context/
//// Version: 1.0.0

// ============================================================================
// SECTION 1: TRACE AND SPAN IDENTIFIERS
// ============================================================================

/// 128-bit trace identifier
/// Shared by all spans in a distributed trace
pub type TraceId {
  TraceId(
    /// High 64 bits
    high: Int,
    /// Low 64 bits
    low: Int,
  )
}

/// 64-bit span identifier
/// Unique within a trace
pub type SpanId {
  SpanId(value: Int)
}

/// Generate a null/invalid trace ID
pub fn null_trace_id() -> TraceId {
  TraceId(high: 0, low: 0)
}

/// Generate a null/invalid span ID
pub fn null_span_id() -> SpanId {
  SpanId(value: 0)
}

/// Check if trace ID is valid (non-zero)
pub fn is_valid_trace_id(id: TraceId) -> Bool {
  id.high != 0 || id.low != 0
}

/// Check if span ID is valid (non-zero)
pub fn is_valid_span_id(id: SpanId) -> Bool {
  id.value != 0
}

// ============================================================================
// SECTION 2: SPAN TYPES AND STATUS
// ============================================================================

/// Span kind as per OpenTelemetry specification
pub type SpanKind {
  /// Internal operation (default)
  Internal
  /// Server handling an incoming request
  Server
  /// Client making an outgoing request
  Client
  /// Producer sending a message
  Producer
  /// Consumer receiving a message
  Consumer
}

/// Span status as per OpenTelemetry specification
pub type SpanStatus {
  /// Status unset - use default based on HTTP/gRPC status
  StatusUnset
  /// Operation completed successfully
  StatusOk
  /// Error occurred during operation
  StatusError(message: String)
}

/// Timestamp in nanoseconds since Unix epoch
pub type Timestamp {
  Timestamp(nanos: Int)
}

/// Duration in nanoseconds
pub type Duration {
  Duration(nanos: Int)
}

// ============================================================================
// SECTION 3: SPAN ATTRIBUTES
// ============================================================================

/// Attribute value types supported by OpenTelemetry
pub type AttributeValue {
  /// String value
  StringValue(value: String)
  /// Boolean value
  BoolValue(value: Bool)
  /// Integer value
  IntValue(value: Int)
  /// Float value
  FloatValue(value: Float)
  /// Array of strings
  StringArrayValue(values: List(String))
  /// Array of integers
  IntArrayValue(values: List(Int))
  /// Array of booleans
  BoolArrayValue(values: List(Bool))
}

/// Span attribute (key-value pair)
pub type Attribute {
  Attribute(key: String, value: AttributeValue)
}

/// Create a string attribute
pub fn string_attr(key: String, value: String) -> Attribute {
  Attribute(key: key, value: StringValue(value))
}

/// Create a boolean attribute
pub fn bool_attr(key: String, value: Bool) -> Attribute {
  Attribute(key: key, value: BoolValue(value))
}

/// Create an integer attribute
pub fn int_attr(key: String, value: Int) -> Attribute {
  Attribute(key: key, value: IntValue(value))
}

/// Create a float attribute
pub fn float_attr(key: String, value: Float) -> Attribute {
  Attribute(key: key, value: FloatValue(value))
}

// ============================================================================
// SECTION 4: SPAN EVENTS AND LINKS
// ============================================================================

/// Event recorded within a span
pub type SpanEvent {
  SpanEvent(
    /// Event name
    name: String,
    /// Event timestamp
    timestamp: Timestamp,
    /// Event attributes
    attributes: List(Attribute),
  )
}

/// Link to another span (for batch processing, fan-out, etc.)
pub type SpanLink {
  SpanLink(
    /// Linked span's trace ID
    trace_id: TraceId,
    /// Linked span's span ID
    span_id: SpanId,
    /// Link attributes
    attributes: List(Attribute),
  )
}

/// Create a span event
pub fn span_event(
  name: String,
  timestamp: Timestamp,
  attributes: List(Attribute),
) -> SpanEvent {
  SpanEvent(name: name, timestamp: timestamp, attributes: attributes)
}

/// Create a span link
pub fn span_link(
  trace_id: TraceId,
  span_id: SpanId,
  attributes: List(Attribute),
) -> SpanLink {
  SpanLink(trace_id: trace_id, span_id: span_id, attributes: attributes)
}

// ============================================================================
// SECTION 5: TRACE CONTEXT (W3C COMPATIBLE)
// ============================================================================

/// W3C Trace Context for propagation across boundaries
pub type TraceContext {
  TraceContext(
    /// Version (currently 0x00)
    version: Int,
    /// Trace identifier
    trace_id: TraceId,
    /// Parent span identifier
    parent_span_id: SpanId,
    /// Trace flags
    trace_flags: TraceFlags,
  )
}

/// Trace flags as per W3C specification
pub type TraceFlags {
  TraceFlags(
    /// Whether trace is sampled for recording
    sampled: Bool,
  )
}

/// Vendor-specific trace state
pub type TraceState {
  TraceState(entries: List(TraceStateEntry))
}

/// Single trace state entry
pub type TraceStateEntry {
  TraceStateEntry(key: String, value: String)
}

/// Create an empty trace context
pub fn empty_context() -> TraceContext {
  TraceContext(
    version: 0,
    trace_id: null_trace_id(),
    parent_span_id: null_span_id(),
    trace_flags: TraceFlags(sampled: False),
  )
}

/// Check if context is valid
pub fn is_valid_context(ctx: TraceContext) -> Bool {
  is_valid_trace_id(ctx.trace_id)
}

/// Create a child context with new span ID
pub fn child_context(parent: TraceContext, child_span_id: SpanId) -> TraceContext {
  TraceContext(..parent, parent_span_id: child_span_id)
}

// ============================================================================
// SECTION 6: SPAN DATA STRUCTURE
// ============================================================================

/// Complete span data structure
pub type Span {
  Span(
    /// Span name (operation name)
    name: String,
    /// Trace ID
    trace_id: TraceId,
    /// Span ID
    span_id: SpanId,
    /// Parent span ID (null for root spans)
    parent_span_id: Result(SpanId, Nil),
    /// Span kind
    kind: SpanKind,
    /// Start timestamp
    start_time: Timestamp,
    /// End timestamp (None if still active)
    end_time: Result(Timestamp, Nil),
    /// Span status
    status: SpanStatus,
    /// Span attributes
    attributes: List(Attribute),
    /// Events recorded within the span
    events: List(SpanEvent),
    /// Links to other spans
    links: List(SpanLink),
    /// Resource describing the entity producing the span
    resource: Resource,
    /// Instrumentation scope
    scope: InstrumentationScope,
  )
}

/// Resource describes the entity producing telemetry
pub type Resource {
  Resource(attributes: List(Attribute))
}

/// Instrumentation scope identifies the instrumentation library
pub type InstrumentationScope {
  InstrumentationScope(
    /// Library/module name
    name: String,
    /// Library version
    version: String,
    /// Schema URL
    schema_url: Result(String, Nil),
  )
}

/// Create a new root span
pub fn root_span(
  name: String,
  trace_id: TraceId,
  span_id: SpanId,
  start_time: Timestamp,
  kind: SpanKind,
  resource: Resource,
  scope: InstrumentationScope,
) -> Span {
  Span(
    name: name,
    trace_id: trace_id,
    span_id: span_id,
    parent_span_id: Error(Nil),
    kind: kind,
    start_time: start_time,
    end_time: Error(Nil),
    status: StatusUnset,
    attributes: [],
    events: [],
    links: [],
    resource: resource,
    scope: scope,
  )
}

/// Create a child span
pub fn child_span(
  name: String,
  parent: Span,
  span_id: SpanId,
  start_time: Timestamp,
  kind: SpanKind,
) -> Span {
  Span(
    name: name,
    trace_id: parent.trace_id,
    span_id: span_id,
    parent_span_id: Ok(parent.span_id),
    kind: kind,
    start_time: start_time,
    end_time: Error(Nil),
    status: StatusUnset,
    attributes: [],
    events: [],
    links: [],
    resource: parent.resource,
    scope: parent.scope,
  )
}

/// End a span
pub fn end_span(span: Span, end_time: Timestamp, status: SpanStatus) -> Span {
  Span(..span, end_time: Ok(end_time), status: status)
}

/// Add an attribute to a span
pub fn with_attribute(span: Span, attr: Attribute) -> Span {
  Span(..span, attributes: [attr, ..span.attributes])
}

/// Add multiple attributes to a span
pub fn with_attributes(span: Span, attrs: List(Attribute)) -> Span {
  Span(..span, attributes: list_append(attrs, span.attributes))
}

/// Add an event to a span
pub fn with_event(span: Span, event: SpanEvent) -> Span {
  Span(..span, events: [event, ..span.events])
}

/// Add a link to a span
pub fn with_link(span: Span, link: SpanLink) -> Span {
  Span(..span, links: [link, ..span.links])
}

// Helper to append lists
fn list_append(a: List(x), b: List(x)) -> List(x) {
  case a {
    [] -> b
    [head, ..tail] -> [head, ..list_append(tail, b)]
  }
}

// ============================================================================
// SECTION 7: KERNEL EVENT TRACING
// ============================================================================

/// Kernel event categories for internal tracing
pub type KernelEventCategory {
  /// Process lifecycle events
  ProcessLifecycle
  /// Message passing events
  MessagePassing
  /// Scheduling decisions
  Scheduling
  /// Memory operations
  Memory
  /// Capability checks
  Capability
  /// Error handling
  ErrorHandling
}

/// Kernel internal event
pub type KernelEvent {
  KernelEvent(
    /// Event category
    category: KernelEventCategory,
    /// Event name
    name: String,
    /// Event timestamp
    timestamp: Timestamp,
    /// Associated process ID
    pid: Result(Int, Nil),
    /// Event attributes
    attributes: List(Attribute),
    /// Severity level
    severity: Severity,
  )
}

/// Event severity levels
pub type Severity {
  SeverityTrace
  SeverityDebug
  SeverityInfo
  SeverityWarn
  SeverityError
  SeverityFatal
}

/// Create a kernel event
pub fn kernel_event(
  category: KernelEventCategory,
  name: String,
  timestamp: Timestamp,
  severity: Severity,
) -> KernelEvent {
  KernelEvent(
    category: category,
    name: name,
    timestamp: timestamp,
    pid: Error(Nil),
    attributes: [],
    severity: severity,
  )
}

/// Add PID to kernel event
pub fn with_pid(event: KernelEvent, pid: Int) -> KernelEvent {
  KernelEvent(..event, pid: Ok(pid))
}

/// Add attribute to kernel event
pub fn with_kernel_attr(event: KernelEvent, attr: Attribute) -> KernelEvent {
  KernelEvent(..event, attributes: [attr, ..event.attributes])
}

/// Predefined kernel event: process spawned
pub fn process_spawned_event(
  timestamp: Timestamp,
  pid: Int,
  module_id: Int,
  priority: Int,
) -> KernelEvent {
  KernelEvent(
    category: ProcessLifecycle,
    name: "process.spawned",
    timestamp: timestamp,
    pid: Ok(pid),
    attributes: [
      int_attr("module_id", module_id),
      int_attr("priority", priority),
    ],
    severity: SeverityInfo,
  )
}

/// Predefined kernel event: process exited
pub fn process_exited_event(
  timestamp: Timestamp,
  pid: Int,
  exit_code: Int,
) -> KernelEvent {
  KernelEvent(
    category: ProcessLifecycle,
    name: "process.exited",
    timestamp: timestamp,
    pid: Ok(pid),
    attributes: [int_attr("exit_code", exit_code)],
    severity: SeverityInfo,
  )
}

/// Predefined kernel event: message sent
pub fn message_sent_event(
  timestamp: Timestamp,
  source_pid: Int,
  target_pid: Int,
  message_size: Int,
) -> KernelEvent {
  KernelEvent(
    category: MessagePassing,
    name: "message.sent",
    timestamp: timestamp,
    pid: Ok(source_pid),
    attributes: [
      int_attr("target_pid", target_pid),
      int_attr("message_size", message_size),
    ],
    severity: SeverityDebug,
  )
}

/// Predefined kernel event: message received
pub fn message_received_event(
  timestamp: Timestamp,
  pid: Int,
  source_pid: Int,
  message_size: Int,
) -> KernelEvent {
  KernelEvent(
    category: MessagePassing,
    name: "message.received",
    timestamp: timestamp,
    pid: Ok(pid),
    attributes: [
      int_attr("source_pid", source_pid),
      int_attr("message_size", message_size),
    ],
    severity: SeverityDebug,
  )
}

/// Predefined kernel event: context switch
pub fn context_switch_event(
  timestamp: Timestamp,
  from_pid: Int,
  to_pid: Int,
  reason: String,
) -> KernelEvent {
  KernelEvent(
    category: Scheduling,
    name: "scheduler.context_switch",
    timestamp: timestamp,
    pid: Ok(to_pid),
    attributes: [
      int_attr("from_pid", from_pid),
      string_attr("reason", reason),
    ],
    severity: SeverityDebug,
  )
}

// ============================================================================
// SECTION 8: DRIVER CALL TRACING
// ============================================================================

/// Driver types for external service calls
pub type DriverType {
  /// Apache Kafka
  DriverKafka
  /// Redis
  DriverRedis
  /// PostgreSQL
  DriverPostgres
  /// Firebase
  DriverFirebase
  /// HTTP/REST
  DriverHttp
}

/// Driver call span attributes
pub type DriverCallSpan {
  DriverCallSpan(
    /// Base span
    span: Span,
    /// Driver type
    driver: DriverType,
    /// Operation name
    operation: String,
    /// Target address/host
    target: String,
  )
}

/// Create a Kafka producer span
pub fn kafka_producer_span(
  name: String,
  trace_id: TraceId,
  span_id: SpanId,
  parent_span_id: SpanId,
  start_time: Timestamp,
  topic: String,
  partition: Result(Int, Nil),
  resource: Resource,
  scope: InstrumentationScope,
) -> Span {
  let span =
    Span(
      name: name,
      trace_id: trace_id,
      span_id: span_id,
      parent_span_id: Ok(parent_span_id),
      kind: Producer,
      start_time: start_time,
      end_time: Error(Nil),
      status: StatusUnset,
      attributes: [
        string_attr("messaging.system", "kafka"),
        string_attr("messaging.destination.name", topic),
        string_attr("messaging.operation", "publish"),
      ],
      events: [],
      links: [],
      resource: resource,
      scope: scope,
    )

  case partition {
    Ok(p) -> with_attribute(span, int_attr("messaging.destination.partition.id", p))
    Error(_) -> span
  }
}

/// Create a Kafka consumer span
pub fn kafka_consumer_span(
  name: String,
  trace_id: TraceId,
  span_id: SpanId,
  parent_span_id: SpanId,
  start_time: Timestamp,
  topic: String,
  partition: Int,
  offset: Int,
  consumer_group: String,
  resource: Resource,
  scope: InstrumentationScope,
) -> Span {
  Span(
    name: name,
    trace_id: trace_id,
    span_id: span_id,
    parent_span_id: Ok(parent_span_id),
    kind: Consumer,
    start_time: start_time,
    end_time: Error(Nil),
    status: StatusUnset,
    attributes: [
      string_attr("messaging.system", "kafka"),
      string_attr("messaging.destination.name", topic),
      int_attr("messaging.destination.partition.id", partition),
      int_attr("messaging.kafka.message.offset", offset),
      string_attr("messaging.consumer.group.name", consumer_group),
      string_attr("messaging.operation", "receive"),
    ],
    events: [],
    links: [],
    resource: resource,
    scope: scope,
  )
}

/// Create a Redis client span
pub fn redis_span(
  name: String,
  trace_id: TraceId,
  span_id: SpanId,
  parent_span_id: SpanId,
  start_time: Timestamp,
  command: String,
  db_index: Int,
  resource: Resource,
  scope: InstrumentationScope,
) -> Span {
  Span(
    name: name,
    trace_id: trace_id,
    span_id: span_id,
    parent_span_id: Ok(parent_span_id),
    kind: Client,
    start_time: start_time,
    end_time: Error(Nil),
    status: StatusUnset,
    attributes: [
      string_attr("db.system", "redis"),
      string_attr("db.operation", command),
      int_attr("db.redis.database_index", db_index),
    ],
    events: [],
    links: [],
    resource: resource,
    scope: scope,
  )
}

/// Create a PostgreSQL client span
pub fn postgres_span(
  name: String,
  trace_id: TraceId,
  span_id: SpanId,
  parent_span_id: SpanId,
  start_time: Timestamp,
  operation: String,
  db_name: String,
  table: Result(String, Nil),
  resource: Resource,
  scope: InstrumentationScope,
) -> Span {
  let span =
    Span(
      name: name,
      trace_id: trace_id,
      span_id: span_id,
      parent_span_id: Ok(parent_span_id),
      kind: Client,
      start_time: start_time,
      end_time: Error(Nil),
      status: StatusUnset,
      attributes: [
        string_attr("db.system", "postgresql"),
        string_attr("db.operation", operation),
        string_attr("db.name", db_name),
      ],
      events: [],
      links: [],
      resource: resource,
      scope: scope,
    )

  case table {
    Ok(t) -> with_attribute(span, string_attr("db.sql.table", t))
    Error(_) -> span
  }
}

// ============================================================================
// SECTION 9: WASM BOUNDARY TRACING
// ============================================================================

/// WASM boundary crossing direction
pub type WasmBoundaryDirection {
  /// Host calling into WASM module
  HostToWasm
  /// WASM module calling host function
  WasmToHost
}

/// WASM boundary span
pub fn wasm_boundary_span(
  name: String,
  trace_id: TraceId,
  span_id: SpanId,
  parent_span_id: SpanId,
  start_time: Timestamp,
  direction: WasmBoundaryDirection,
  module_id: Int,
  function_name: String,
  resource: Resource,
  scope: InstrumentationScope,
) -> Span {
  let direction_str = case direction {
    HostToWasm -> "host_to_wasm"
    WasmToHost -> "wasm_to_host"
  }

  Span(
    name: name,
    trace_id: trace_id,
    span_id: span_id,
    parent_span_id: Ok(parent_span_id),
    kind: Internal,
    start_time: start_time,
    end_time: Error(Nil),
    status: StatusUnset,
    attributes: [
      string_attr("wasm.boundary.direction", direction_str),
      int_attr("wasm.module.id", module_id),
      string_attr("wasm.function.name", function_name),
    ],
    events: [],
    links: [],
    resource: resource,
    scope: scope,
  )
}

/// Create a Tauri IPC span
pub fn tauri_ipc_span(
  name: String,
  trace_id: TraceId,
  span_id: SpanId,
  parent_span_id: SpanId,
  start_time: Timestamp,
  command: String,
  is_invoke: Bool,
  resource: Resource,
  scope: InstrumentationScope,
) -> Span {
  Span(
    name: name,
    trace_id: trace_id,
    span_id: span_id,
    parent_span_id: Ok(parent_span_id),
    kind: case is_invoke {
      True -> Client
      False -> Server
    },
    start_time: start_time,
    end_time: Error(Nil),
    status: StatusUnset,
    attributes: [
      string_attr("tauri.command", command),
      bool_attr("tauri.is_invoke", is_invoke),
    ],
    events: [],
    links: [],
    resource: resource,
    scope: scope,
  )
}

// ============================================================================
// SECTION 10: SPAN PROCESSOR AND EXPORTER INTERFACES
// ============================================================================

/// Span processor for batching and exporting
pub type SpanProcessor {
  SpanProcessor(
    /// Maximum batch size before export
    max_batch_size: Int,
    /// Maximum delay before export (milliseconds)
    max_delay_ms: Int,
    /// Current batch of spans
    batch: List(Span),
    /// Export destination
    exporter: ExporterConfig,
  )
}

/// Exporter configuration
pub type ExporterConfig {
  /// Console exporter (for debugging)
  ConsoleExporter
  /// OTLP HTTP exporter
  OtlpHttpExporter(endpoint: String)
  /// OTLP gRPC exporter
  OtlpGrpcExporter(endpoint: String)
  /// Jaeger exporter
  JaegerExporter(endpoint: String)
  /// No-op exporter (for disabled tracing)
  NoopExporter
}

/// Create a new span processor
pub fn new_processor(
  max_batch_size: Int,
  max_delay_ms: Int,
  exporter: ExporterConfig,
) -> SpanProcessor {
  SpanProcessor(
    max_batch_size: max_batch_size,
    max_delay_ms: max_delay_ms,
    batch: [],
    exporter: exporter,
  )
}

/// Add a span to the processor
pub fn add_span(processor: SpanProcessor, span: Span) -> SpanProcessor {
  SpanProcessor(..processor, batch: [span, ..processor.batch])
}

/// Check if batch should be exported
pub fn should_export(processor: SpanProcessor) -> Bool {
  list_length(processor.batch) >= processor.max_batch_size
}

/// Clear the batch after export
pub fn clear_batch(processor: SpanProcessor) -> SpanProcessor {
  SpanProcessor(..processor, batch: [])
}

// Helper to get list length
fn list_length(lst: List(a)) -> Int {
  case lst {
    [] -> 0
    [_, ..rest] -> 1 + list_length(rest)
  }
}

// ============================================================================
// SECTION 11: SAMPLING STRATEGIES
// ============================================================================

/// Sampling decision
pub type SamplingDecision {
  /// Record and sample the span
  RecordAndSample
  /// Record but don't sample
  RecordOnly
  /// Drop the span entirely
  Drop
}

/// Sampling result
pub type SamplingResult {
  SamplingResult(
    /// Sampling decision
    decision: SamplingDecision,
    /// Additional attributes to add
    attributes: List(Attribute),
  )
}

/// Sampler configuration
pub type Sampler {
  /// Always sample
  AlwaysOn
  /// Never sample
  AlwaysOff
  /// Sample based on trace ID
  TraceIdRatioBased(ratio: Float)
  /// Sample based on parent
  ParentBased(root: Sampler)
}

/// Make sampling decision
pub fn sample(
  sampler: Sampler,
  trace_id: TraceId,
  has_parent: Bool,
  parent_sampled: Bool,
) -> SamplingResult {
  case sampler {
    AlwaysOn ->
      SamplingResult(decision: RecordAndSample, attributes: [])
    AlwaysOff ->
      SamplingResult(decision: Drop, attributes: [])
    TraceIdRatioBased(ratio) -> {
      // Use low bits of trace ID as pseudo-random number
      let threshold = float_to_int(ratio *. 1000.0)
      let sample_value = trace_id.low % 1000
      case sample_value < threshold {
        True -> SamplingResult(decision: RecordAndSample, attributes: [])
        False -> SamplingResult(decision: Drop, attributes: [])
      }
    }
    ParentBased(root) ->
      case has_parent {
        True ->
          case parent_sampled {
            True -> SamplingResult(decision: RecordAndSample, attributes: [])
            False -> SamplingResult(decision: Drop, attributes: [])
          }
        False -> sample(root, trace_id, False, False)
      }
  }
}

// Helper to convert float to int (truncate)
fn float_to_int(f: Float) -> Int {
  // Simple truncation - in production would use proper rounding
  case f <. 0.0 {
    True -> 0 - float_to_int(0.0 -. f)
    False ->
      case f <. 1.0 {
        True -> 0
        False -> 1 + float_to_int(f -. 1.0)
      }
  }
}

// ============================================================================
// SECTION 12: ESTA LOGIC SPECIFIC INSTRUMENTATION
// ============================================================================

/// Create the ESTA Logic resource
pub fn esta_resource(
  service_name: String,
  service_version: String,
  environment: String,
) -> Resource {
  Resource(attributes: [
    string_attr("service.name", service_name),
    string_attr("service.version", service_version),
    string_attr("deployment.environment", environment),
    string_attr("telemetry.sdk.name", "estalogic_observe"),
    string_attr("telemetry.sdk.language", "gleam"),
    string_attr("telemetry.sdk.version", "1.0.0"),
  ])
}

/// Create the ESTA Logic kernel scope
pub fn kernel_scope() -> InstrumentationScope {
  InstrumentationScope(
    name: "estalogic_kernel",
    version: "1.0.0",
    schema_url: Ok("https://estalogic.dev/schemas/1.0.0"),
  )
}

/// Create the ESTA Logic protocol scope
pub fn protocol_scope() -> InstrumentationScope {
  InstrumentationScope(
    name: "estalogic_protocol",
    version: "1.0.0",
    schema_url: Ok("https://estalogic.dev/schemas/1.0.0"),
  )
}

/// Create the ESTA Logic observe scope
pub fn observe_scope() -> InstrumentationScope {
  InstrumentationScope(
    name: "estalogic_observe",
    version: "1.0.0",
    schema_url: Ok("https://estalogic.dev/schemas/1.0.0"),
  )
}
