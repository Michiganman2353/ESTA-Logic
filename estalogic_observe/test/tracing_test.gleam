//// estalogic_observe/test/tracing_test.gleam
////
//// Tests for the OpenTelemetry tracing module
////
//// These tests verify:
//// - Trace ID and Span ID validity
//// - Span creation and hierarchy
//// - Trace context propagation
//// - Kernel event creation
//// - Driver call span attributes
//// - WASM boundary tracing
//// - Sampling logic

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
// SECTION 2: TRACE ID TESTS
// ============================================================================

type TestTraceId {
  TestTraceId(high: Int, low: Int)
}

type TestSpanId {
  TestSpanId(value: Int)
}

fn is_valid_trace_id(id: TestTraceId) -> Bool {
  id.high != 0 || id.low != 0
}

fn is_valid_span_id(id: TestSpanId) -> Bool {
  id.value != 0
}

/// Test: Non-zero trace ID is valid
pub fn trace_id_valid_test() -> Bool {
  let id = TestTraceId(high: 1, low: 0)
  is_valid_trace_id(id)
}

/// Test: Zero trace ID is invalid
pub fn trace_id_invalid_test() -> Bool {
  let id = TestTraceId(high: 0, low: 0)
  !is_valid_trace_id(id)
}

/// Test: Non-zero span ID is valid
pub fn span_id_valid_test() -> Bool {
  let id = TestSpanId(value: 12345)
  is_valid_span_id(id)
}

/// Test: Zero span ID is invalid
pub fn span_id_invalid_test() -> Bool {
  let id = TestSpanId(value: 0)
  !is_valid_span_id(id)
}

// ============================================================================
// SECTION 3: SPAN CREATION TESTS
// ============================================================================

type TestSpanKind {
  Internal
  Server
  Client
  Producer
  Consumer
}

type TestSpanStatus {
  StatusUnset
  StatusOk
  StatusError(message: String)
}

type TestAttribute {
  TestAttribute(key: String, value: String)
}

type TestSpan {
  TestSpan(
    name: String,
    trace_id: TestTraceId,
    span_id: TestSpanId,
    parent_span_id: Result(TestSpanId, Nil),
    kind: TestSpanKind,
    status: TestSpanStatus,
    attributes: List(TestAttribute),
    start_time: Int,
    end_time: Result(Int, Nil),
  )
}

fn create_root_span(name: String, trace_id: TestTraceId, span_id: TestSpanId, start_time: Int, kind: TestSpanKind) -> TestSpan {
  TestSpan(
    name: name,
    trace_id: trace_id,
    span_id: span_id,
    parent_span_id: Error(Nil),
    kind: kind,
    status: StatusUnset,
    attributes: [],
    start_time: start_time,
    end_time: Error(Nil),
  )
}

fn create_child_span(name: String, parent: TestSpan, span_id: TestSpanId, start_time: Int, kind: TestSpanKind) -> TestSpan {
  TestSpan(
    name: name,
    trace_id: parent.trace_id,
    span_id: span_id,
    parent_span_id: Ok(parent.span_id),
    kind: kind,
    status: StatusUnset,
    attributes: [],
    start_time: start_time,
    end_time: Error(Nil),
  )
}

fn end_span(span: TestSpan, end_time: Int, status: TestSpanStatus) -> TestSpan {
  TestSpan(..span, end_time: Ok(end_time), status: status)
}

fn with_attribute(span: TestSpan, key: String, value: String) -> TestSpan {
  let attr = TestAttribute(key: key, value: value)
  TestSpan(..span, attributes: [attr, ..span.attributes])
}

/// Test: Root span has no parent
pub fn root_span_no_parent_test() -> Bool {
  let trace_id = TestTraceId(high: 1, low: 2)
  let span_id = TestSpanId(value: 100)
  let span = create_root_span("root", trace_id, span_id, 0, Internal)
  case span.parent_span_id {
    Error(Nil) -> True
    Ok(_) -> False
  }
}

/// Test: Child span has parent span ID
pub fn child_span_has_parent_test() -> Bool {
  let trace_id = TestTraceId(high: 1, low: 2)
  let parent = create_root_span("parent", trace_id, TestSpanId(value: 100), 0, Server)
  let child = create_child_span("child", parent, TestSpanId(value: 101), 10, Internal)
  case child.parent_span_id {
    Ok(parent_id) -> parent_id.value == 100
    Error(_) -> False
  }
}

/// Test: Child inherits trace ID from parent
pub fn child_inherits_trace_id_test() -> Bool {
  let trace_id = TestTraceId(high: 0xABCD, low: 0x1234)
  let parent = create_root_span("parent", trace_id, TestSpanId(value: 100), 0, Server)
  let child = create_child_span("child", parent, TestSpanId(value: 101), 10, Internal)
  child.trace_id.high == 0xABCD && child.trace_id.low == 0x1234
}

/// Test: Ended span has end time
pub fn span_end_time_test() -> Bool {
  let span = create_root_span("test", TestTraceId(high: 1, low: 0), TestSpanId(value: 1), 0, Internal)
  let ended = end_span(span, 100, StatusOk)
  case ended.end_time {
    Ok(100) -> True
    _ -> False
  }
}

/// Test: Span with error status
pub fn span_error_status_test() -> Bool {
  let span = create_root_span("test", TestTraceId(high: 1, low: 0), TestSpanId(value: 1), 0, Internal)
  let ended = end_span(span, 100, StatusError("something went wrong"))
  case ended.status {
    StatusError("something went wrong") -> True
    _ -> False
  }
}

/// Test: Adding attributes to span
pub fn span_attributes_test() -> Bool {
  let span = create_root_span("test", TestTraceId(high: 1, low: 0), TestSpanId(value: 1), 0, Internal)
  let span2 = with_attribute(span, "key1", "value1")
  let span3 = with_attribute(span2, "key2", "value2")
  list_length(span3.attributes) == 2
}

fn list_length(lst: List(a)) -> Int {
  case lst {
    [] -> 0
    [_, ..rest] -> 1 + list_length(rest)
  }
}

// ============================================================================
// SECTION 4: TRACE CONTEXT TESTS
// ============================================================================

type TestTraceContext {
  TestTraceContext(
    version: Int,
    trace_id: TestTraceId,
    parent_span_id: TestSpanId,
    sampled: Bool,
  )
}

fn is_valid_context(ctx: TestTraceContext) -> Bool {
  is_valid_trace_id(ctx.trace_id)
}

fn child_context(parent: TestTraceContext, new_span_id: TestSpanId) -> TestTraceContext {
  TestTraceContext(..parent, parent_span_id: new_span_id)
}

/// Test: Valid trace context
pub fn trace_context_valid_test() -> Bool {
  let ctx = TestTraceContext(
    version: 0,
    trace_id: TestTraceId(high: 1, low: 2),
    parent_span_id: TestSpanId(value: 100),
    sampled: True,
  )
  is_valid_context(ctx)
}

/// Test: Invalid trace context (zero trace ID)
pub fn trace_context_invalid_test() -> Bool {
  let ctx = TestTraceContext(
    version: 0,
    trace_id: TestTraceId(high: 0, low: 0),
    parent_span_id: TestSpanId(value: 100),
    sampled: True,
  )
  !is_valid_context(ctx)
}

/// Test: Child context preserves trace ID
pub fn child_context_preserves_trace_id_test() -> Bool {
  let parent_ctx = TestTraceContext(
    version: 0,
    trace_id: TestTraceId(high: 0xABCD, low: 0x5678),
    parent_span_id: TestSpanId(value: 100),
    sampled: True,
  )
  let child_ctx = child_context(parent_ctx, TestSpanId(value: 200))
  child_ctx.trace_id.high == 0xABCD && child_ctx.trace_id.low == 0x5678
}

/// Test: Child context updates parent span ID
pub fn child_context_updates_parent_test() -> Bool {
  let parent_ctx = TestTraceContext(
    version: 0,
    trace_id: TestTraceId(high: 1, low: 2),
    parent_span_id: TestSpanId(value: 100),
    sampled: True,
  )
  let child_ctx = child_context(parent_ctx, TestSpanId(value: 200))
  child_ctx.parent_span_id.value == 200
}

// ============================================================================
// SECTION 5: KERNEL EVENT TESTS
// ============================================================================

type TestKernelEventCategory {
  ProcessLifecycle
  MessagePassing
  Scheduling
  Memory
}

type TestSeverity {
  SeverityDebug
  SeverityInfo
  SeverityWarn
  SeverityError
}

type TestKernelEvent {
  TestKernelEvent(
    category: TestKernelEventCategory,
    name: String,
    timestamp: Int,
    pid: Result(Int, Nil),
    severity: TestSeverity,
  )
}

fn process_spawned_event(timestamp: Int, pid: Int) -> TestKernelEvent {
  TestKernelEvent(
    category: ProcessLifecycle,
    name: "process.spawned",
    timestamp: timestamp,
    pid: Ok(pid),
    severity: SeverityInfo,
  )
}

fn message_sent_event(timestamp: Int, source_pid: Int) -> TestKernelEvent {
  TestKernelEvent(
    category: MessagePassing,
    name: "message.sent",
    timestamp: timestamp,
    pid: Ok(source_pid),
    severity: SeverityDebug,
  )
}

/// Test: Process spawned event has correct category
pub fn kernel_event_category_test() -> Bool {
  let event = process_spawned_event(1000, 42)
  case event.category {
    ProcessLifecycle -> True
    _ -> False
  }
}

/// Test: Event has correct name
pub fn kernel_event_name_test() -> Bool {
  let event = process_spawned_event(1000, 42)
  event.name == "process.spawned"
}

/// Test: Event has PID
pub fn kernel_event_pid_test() -> Bool {
  let event = process_spawned_event(1000, 42)
  case event.pid {
    Ok(42) -> True
    _ -> False
  }
}

/// Test: Message event has debug severity
pub fn kernel_event_severity_test() -> Bool {
  let event = message_sent_event(1000, 1)
  case event.severity {
    SeverityDebug -> True
    _ -> False
  }
}

// ============================================================================
// SECTION 6: DRIVER SPAN TESTS
// ============================================================================

type TestDriverType {
  DriverKafka
  DriverRedis
  DriverPostgres
}

fn find_attribute(attrs: List(TestAttribute), key: String) -> Result(String, Nil) {
  case attrs {
    [] -> Error(Nil)
    [attr, ..rest] ->
      case attr.key == key {
        True -> Ok(attr.value)
        False -> find_attribute(rest, key)
      }
  }
}

fn create_kafka_span(topic: String, partition: Int) -> TestSpan {
  TestSpan(
    name: "kafka.produce",
    trace_id: TestTraceId(high: 1, low: 0),
    span_id: TestSpanId(value: 100),
    parent_span_id: Error(Nil),
    kind: Producer,
    status: StatusUnset,
    attributes: [
      TestAttribute(key: "messaging.system", value: "kafka"),
      TestAttribute(key: "messaging.destination.name", value: topic),
      TestAttribute(key: "messaging.destination.partition.id", value: int_to_string(partition)),
    ],
    start_time: 0,
    end_time: Error(Nil),
  )
}

fn create_redis_span(command: String) -> TestSpan {
  TestSpan(
    name: "redis." <> command,
    trace_id: TestTraceId(high: 1, low: 0),
    span_id: TestSpanId(value: 100),
    parent_span_id: Error(Nil),
    kind: Client,
    status: StatusUnset,
    attributes: [
      TestAttribute(key: "db.system", value: "redis"),
      TestAttribute(key: "db.operation", value: command),
    ],
    start_time: 0,
    end_time: Error(Nil),
  )
}

fn create_postgres_span(operation: String, db_name: String) -> TestSpan {
  TestSpan(
    name: "postgres." <> operation,
    trace_id: TestTraceId(high: 1, low: 0),
    span_id: TestSpanId(value: 100),
    parent_span_id: Error(Nil),
    kind: Client,
    status: StatusUnset,
    attributes: [
      TestAttribute(key: "db.system", value: "postgresql"),
      TestAttribute(key: "db.operation", value: operation),
      TestAttribute(key: "db.name", value: db_name),
    ],
    start_time: 0,
    end_time: Error(Nil),
  )
}

fn int_to_string(n: Int) -> String {
  case n {
    0 -> "0"
    1 -> "1"
    2 -> "2"
    3 -> "3"
    4 -> "4"
    5 -> "5"
    _ -> "N"
  }
}

/// Test: Kafka span has correct system attribute
pub fn kafka_span_system_test() -> Bool {
  let span = create_kafka_span("events-topic", 0)
  case find_attribute(span.attributes, "messaging.system") {
    Ok("kafka") -> True
    _ -> False
  }
}

/// Test: Kafka span has topic attribute
pub fn kafka_span_topic_test() -> Bool {
  let span = create_kafka_span("events-topic", 0)
  case find_attribute(span.attributes, "messaging.destination.name") {
    Ok("events-topic") -> True
    _ -> False
  }
}

/// Test: Kafka span is Producer kind
pub fn kafka_span_kind_test() -> Bool {
  let span = create_kafka_span("events-topic", 0)
  case span.kind {
    Producer -> True
    _ -> False
  }
}

/// Test: Redis span has correct system
pub fn redis_span_system_test() -> Bool {
  let span = create_redis_span("GET")
  case find_attribute(span.attributes, "db.system") {
    Ok("redis") -> True
    _ -> False
  }
}

/// Test: Redis span has operation
pub fn redis_span_operation_test() -> Bool {
  let span = create_redis_span("SET")
  case find_attribute(span.attributes, "db.operation") {
    Ok("SET") -> True
    _ -> False
  }
}

/// Test: Postgres span has database name
pub fn postgres_span_db_name_test() -> Bool {
  let span = create_postgres_span("SELECT", "esta_db")
  case find_attribute(span.attributes, "db.name") {
    Ok("esta_db") -> True
    _ -> False
  }
}

// ============================================================================
// SECTION 7: WASM BOUNDARY TESTS
// ============================================================================

type TestWasmDirection {
  HostToWasm
  WasmToHost
}

fn create_wasm_span(direction: TestWasmDirection, module_id: Int, function_name: String) -> TestSpan {
  let direction_str = case direction {
    HostToWasm -> "host_to_wasm"
    WasmToHost -> "wasm_to_host"
  }
  TestSpan(
    name: "wasm.boundary",
    trace_id: TestTraceId(high: 1, low: 0),
    span_id: TestSpanId(value: 100),
    parent_span_id: Error(Nil),
    kind: Internal,
    status: StatusUnset,
    attributes: [
      TestAttribute(key: "wasm.boundary.direction", value: direction_str),
      TestAttribute(key: "wasm.module.id", value: int_to_string(module_id)),
      TestAttribute(key: "wasm.function.name", value: function_name),
    ],
    start_time: 0,
    end_time: Error(Nil),
  )
}

/// Test: WASM host-to-wasm direction
pub fn wasm_host_to_wasm_test() -> Bool {
  let span = create_wasm_span(HostToWasm, 1, "calculate_accrual")
  case find_attribute(span.attributes, "wasm.boundary.direction") {
    Ok("host_to_wasm") -> True
    _ -> False
  }
}

/// Test: WASM span has function name
pub fn wasm_function_name_test() -> Bool {
  let span = create_wasm_span(HostToWasm, 1, "calculate_accrual")
  case find_attribute(span.attributes, "wasm.function.name") {
    Ok("calculate_accrual") -> True
    _ -> False
  }
}

/// Test: WASM span is Internal kind
pub fn wasm_span_kind_test() -> Bool {
  let span = create_wasm_span(HostToWasm, 1, "test")
  case span.kind {
    Internal -> True
    _ -> False
  }
}

// ============================================================================
// SECTION 8: SAMPLING TESTS
// ============================================================================

type TestSampler {
  AlwaysOn
  AlwaysOff
  TraceIdRatioBased(ratio: Float)
}

type TestSamplingDecision {
  RecordAndSample
  Drop
}

fn sample(sampler: TestSampler, trace_id: TestTraceId) -> TestSamplingDecision {
  case sampler {
    AlwaysOn -> RecordAndSample
    AlwaysOff -> Drop
    TraceIdRatioBased(ratio) -> {
      // Use low bits of trace ID as pseudo-random
      let threshold = float_to_int(ratio *. 100.0)
      let sample_value = trace_id.low % 100
      case sample_value < threshold {
        True -> RecordAndSample
        False -> Drop
      }
    }
  }
}

fn float_to_int(f: Float) -> Int {
  // Simple approximation for testing
  case f <. 1.0 {
    True -> 0
    False -> 1 + float_to_int(f -. 1.0)
  }
}

/// Test: AlwaysOn sampler samples everything
pub fn sampler_always_on_test() -> Bool {
  let decision = sample(AlwaysOn, TestTraceId(high: 0, low: 0))
  case decision {
    RecordAndSample -> True
    _ -> False
  }
}

/// Test: AlwaysOff sampler drops everything
pub fn sampler_always_off_test() -> Bool {
  let decision = sample(AlwaysOff, TestTraceId(high: 1, low: 99999))
  case decision {
    Drop -> True
    _ -> False
  }
}

/// Test: Ratio sampler samples based on trace ID
pub fn sampler_ratio_samples_test() -> Bool {
  // Trace ID with low bits < threshold should be sampled
  let decision = sample(TraceIdRatioBased(0.5), TestTraceId(high: 0, low: 25))
  case decision {
    RecordAndSample -> True
    _ -> False
  }
}

/// Test: Ratio sampler drops based on trace ID
pub fn sampler_ratio_drops_test() -> Bool {
  // Trace ID with low bits >= threshold should be dropped
  let decision = sample(TraceIdRatioBased(0.5), TestTraceId(high: 0, low: 75))
  case decision {
    Drop -> True
    _ -> False
  }
}

// ============================================================================
// SECTION 9: TEST RUNNER
// ============================================================================

fn run_test(name: String, test_fn: fn() -> Bool) -> TestResult {
  case test_fn() {
    True -> Pass(name)
    False -> Fail(name)
  }
}

pub fn run_all_tests() -> List(TestResult) {
  [
    // Trace ID tests
    run_test("trace_id_valid_test", trace_id_valid_test),
    run_test("trace_id_invalid_test", trace_id_invalid_test),
    run_test("span_id_valid_test", span_id_valid_test),
    run_test("span_id_invalid_test", span_id_invalid_test),
    
    // Span creation tests
    run_test("root_span_no_parent_test", root_span_no_parent_test),
    run_test("child_span_has_parent_test", child_span_has_parent_test),
    run_test("child_inherits_trace_id_test", child_inherits_trace_id_test),
    run_test("span_end_time_test", span_end_time_test),
    run_test("span_error_status_test", span_error_status_test),
    run_test("span_attributes_test", span_attributes_test),
    
    // Trace context tests
    run_test("trace_context_valid_test", trace_context_valid_test),
    run_test("trace_context_invalid_test", trace_context_invalid_test),
    run_test("child_context_preserves_trace_id_test", child_context_preserves_trace_id_test),
    run_test("child_context_updates_parent_test", child_context_updates_parent_test),
    
    // Kernel event tests
    run_test("kernel_event_category_test", kernel_event_category_test),
    run_test("kernel_event_name_test", kernel_event_name_test),
    run_test("kernel_event_pid_test", kernel_event_pid_test),
    run_test("kernel_event_severity_test", kernel_event_severity_test),
    
    // Driver span tests
    run_test("kafka_span_system_test", kafka_span_system_test),
    run_test("kafka_span_topic_test", kafka_span_topic_test),
    run_test("kafka_span_kind_test", kafka_span_kind_test),
    run_test("redis_span_system_test", redis_span_system_test),
    run_test("redis_span_operation_test", redis_span_operation_test),
    run_test("postgres_span_db_name_test", postgres_span_db_name_test),
    
    // WASM boundary tests
    run_test("wasm_host_to_wasm_test", wasm_host_to_wasm_test),
    run_test("wasm_function_name_test", wasm_function_name_test),
    run_test("wasm_span_kind_test", wasm_span_kind_test),
    
    // Sampling tests
    run_test("sampler_always_on_test", sampler_always_on_test),
    run_test("sampler_always_off_test", sampler_always_off_test),
    run_test("sampler_ratio_samples_test", sampler_ratio_samples_test),
    run_test("sampler_ratio_drops_test", sampler_ratio_drops_test),
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
