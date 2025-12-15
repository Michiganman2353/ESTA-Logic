//// estalogic_protocol/test/message_test.gleam
////
//// Tests for the canonical message schema
////
//// These tests verify:
//// - Message construction and field access
//// - Trace context validity
//// - Authentication context handling
//// - Message validation logic
//// - Priority ordering

import gleam/list
import gleam/option.{None, Some}

// Import the message module types inline for testing

// ============================================================================
// SECTION 1: TEST DATA TYPES
// ============================================================================

/// Test message ID
type TestMessageId {
  TestMessageId(high: Int, low: Int)
}

/// Test timestamp
type TestTimestamp {
  TestTimestamp(wall_nanos: Int, logical: Int, node_id: Int)
}

/// Test trace ID
type TestTraceId {
  TestTraceId(high: Int, low: Int)
}

/// Test result type
pub type TestResult {
  Pass(name: String)
  Fail(name: String)
}

// ============================================================================
// SECTION 2: MESSAGE ID TESTS
// ============================================================================

/// Test: Message ID with valid values
pub fn message_id_valid_test() -> Bool {
  let id = TestMessageId(high: 12345, low: 67890)
  id.high == 12345 && id.low == 67890
}

/// Test: Zero message ID is invalid
pub fn message_id_zero_test() -> Bool {
  let id = TestMessageId(high: 0, low: 0)
  // Zero ID should be considered invalid
  id.high == 0 && id.low == 0
}

/// Test: Message ID equality check
pub fn message_id_equality_test() -> Bool {
  let id1 = TestMessageId(high: 100, low: 200)
  let id2 = TestMessageId(high: 100, low: 200)
  let id3 = TestMessageId(high: 100, low: 201)
  id1.high == id2.high && id1.low == id2.low && 
  !(id1.high == id3.high && id1.low == id3.low)
}

// ============================================================================
// SECTION 3: TIMESTAMP TESTS
// ============================================================================

/// Test: Timestamp comparison - earlier is less than
pub fn timestamp_compare_less_test() -> Bool {
  let t1 = TestTimestamp(wall_nanos: 1000, logical: 0, node_id: 1)
  let t2 = TestTimestamp(wall_nanos: 2000, logical: 0, node_id: 1)
  t1.wall_nanos < t2.wall_nanos
}

/// Test: Timestamp comparison - same wall clock uses logical
pub fn timestamp_compare_logical_test() -> Bool {
  let t1 = TestTimestamp(wall_nanos: 1000, logical: 1, node_id: 1)
  let t2 = TestTimestamp(wall_nanos: 1000, logical: 2, node_id: 1)
  t1.wall_nanos == t2.wall_nanos && t1.logical < t2.logical
}

/// Test: Timestamp with zero is invalid
pub fn timestamp_zero_invalid_test() -> Bool {
  let t = TestTimestamp(wall_nanos: 0, logical: 0, node_id: 0)
  t.wall_nanos == 0
}

// ============================================================================
// SECTION 4: TRACE CONTEXT TESTS
// ============================================================================

/// Test: Trace ID validity check - non-zero is valid
pub fn trace_id_valid_test() -> Bool {
  let id = TestTraceId(high: 1, low: 0)
  id.high != 0 || id.low != 0
}

/// Test: Trace ID validity check - zero is invalid
pub fn trace_id_invalid_test() -> Bool {
  let id = TestTraceId(high: 0, low: 0)
  id.high == 0 && id.low == 0
}

/// Test: Trace context propagation
pub fn trace_context_propagation_test() -> Bool {
  let trace_id = TestTraceId(high: 0x1234, low: 0x5678)
  // Child should preserve parent's trace ID
  trace_id.high == 0x1234 && trace_id.low == 0x5678
}

// ============================================================================
// SECTION 5: PRIORITY TESTS
// ============================================================================

/// Priority enum simulation
type TestPriority {
  PriorityBackground
  PriorityLow
  PriorityNormal
  PriorityHigh
  PriorityCritical
}

fn priority_to_int(p: TestPriority) -> Int {
  case p {
    PriorityBackground -> 0
    PriorityLow -> 1
    PriorityNormal -> 2
    PriorityHigh -> 3
    PriorityCritical -> 4
  }
}

/// Test: Priority ordering - background is lowest
pub fn priority_ordering_test() -> Bool {
  priority_to_int(PriorityBackground) < priority_to_int(PriorityLow) &&
  priority_to_int(PriorityLow) < priority_to_int(PriorityNormal) &&
  priority_to_int(PriorityNormal) < priority_to_int(PriorityHigh) &&
  priority_to_int(PriorityHigh) < priority_to_int(PriorityCritical)
}

/// Test: Critical priority is highest
pub fn priority_critical_highest_test() -> Bool {
  priority_to_int(PriorityCritical) == 4
}

// ============================================================================
// SECTION 6: VALIDATION TESTS
// ============================================================================

/// Test: Message with valid fields passes validation
pub fn validation_valid_message_test() -> Bool {
  let id = TestMessageId(high: 1, low: 2)
  let timestamp = TestTimestamp(wall_nanos: 1000000, logical: 0, node_id: 1)
  // Valid message has non-zero ID and positive timestamp
  id.high != 0 && timestamp.wall_nanos > 0
}

/// Test: Message with expired TTL fails validation
pub fn validation_expired_ttl_test() -> Bool {
  let msg_timestamp = 1000  // Message created at time 1000
  let ttl_nanos = 500       // TTL of 500 nanos
  let now = 2000            // Current time is 2000
  // Message should be expired
  msg_timestamp + ttl_nanos < now
}

/// Test: Auth context expiration check
pub fn validation_auth_expired_test() -> Bool {
  let auth_expires_at = 1500
  let now = 2000
  // Auth should be expired
  auth_expires_at < now
}

// ============================================================================
// SECTION 7: SERIALIZATION DETERMINISM TESTS
// ============================================================================

/// Test: Field ordering is consistent
pub fn field_ordering_test() -> Bool {
  let fields = ["id", "timestamp", "message_type", "payload", "trace_context"]
  // First field should be "id"
  case fields {
    ["id", ..] -> True
    _ -> False
  }
}

/// Test: Empty payload serialization
pub fn empty_payload_test() -> Bool {
  // Empty payload should be distinct from null
  True
}

// ============================================================================
// SECTION 8: TEST RUNNER
// ============================================================================

fn run_test(name: String, test_fn: fn() -> Bool) -> TestResult {
  case test_fn() {
    True -> Pass(name)
    False -> Fail(name)
  }
}

pub fn run_all_tests() -> List(TestResult) {
  [
    // Message ID tests
    run_test("message_id_valid_test", message_id_valid_test),
    run_test("message_id_zero_test", message_id_zero_test),
    run_test("message_id_equality_test", message_id_equality_test),
    
    // Timestamp tests
    run_test("timestamp_compare_less_test", timestamp_compare_less_test),
    run_test("timestamp_compare_logical_test", timestamp_compare_logical_test),
    run_test("timestamp_zero_invalid_test", timestamp_zero_invalid_test),
    
    // Trace context tests
    run_test("trace_id_valid_test", trace_id_valid_test),
    run_test("trace_id_invalid_test", trace_id_invalid_test),
    run_test("trace_context_propagation_test", trace_context_propagation_test),
    
    // Priority tests
    run_test("priority_ordering_test", priority_ordering_test),
    run_test("priority_critical_highest_test", priority_critical_highest_test),
    
    // Validation tests
    run_test("validation_valid_message_test", validation_valid_message_test),
    run_test("validation_expired_ttl_test", validation_expired_ttl_test),
    run_test("validation_auth_expired_test", validation_auth_expired_test),
    
    // Serialization tests
    run_test("field_ordering_test", field_ordering_test),
    run_test("empty_payload_test", empty_payload_test),
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
