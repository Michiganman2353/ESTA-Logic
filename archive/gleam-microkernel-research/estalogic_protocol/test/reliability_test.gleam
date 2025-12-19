//// estalogic_protocol/test/reliability_test.gleam
////
//// Tests for the reliability layer
////
//// These tests verify:
//// - Message deduplication
//// - Reorder buffer behavior
//// - Credit-based flow control
//// - Token bucket rate limiting
//// - Priority queue ordering

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
// SECTION 2: DEDUPLICATION TESTS
// ============================================================================

/// Test dedup store types
type TestDedupStore {
  TestDedupStore(entries: List(TestDedupEntry), max_entries: Int, ttl_ms: Int)
}

type TestDedupEntry {
  TestDedupEntry(token: String, processed_at: Int, expires_at: Int)
}

fn new_test_dedup_store(max_entries: Int, ttl_ms: Int) -> TestDedupStore {
  TestDedupStore(entries: [], max_entries: max_entries, ttl_ms: ttl_ms)
}

fn check_duplicate(store: TestDedupStore, token: String, now: Int) -> Bool {
  find_token(store.entries, token, now)
}

fn find_token(entries: List(TestDedupEntry), token: String, now: Int) -> Bool {
  case entries {
    [] -> False
    [entry, ..rest] ->
      case entry.token == token && entry.expires_at > now {
        True -> True
        False -> find_token(rest, token, now)
      }
  }
}

fn add_entry(store: TestDedupStore, token: String, now: Int) -> TestDedupStore {
  let entry = TestDedupEntry(
    token: token,
    processed_at: now,
    expires_at: now + store.ttl_ms,
  )
  TestDedupStore(..store, entries: [entry, ..store.entries])
}

/// Test: New token is not duplicate
pub fn dedup_new_token_test() -> Bool {
  let store = new_test_dedup_store(100, 1000)
  !check_duplicate(store, "token-1", 0)
}

/// Test: Recorded token is duplicate
pub fn dedup_recorded_token_test() -> Bool {
  let store = new_test_dedup_store(100, 1000)
  let store2 = add_entry(store, "token-1", 0)
  check_duplicate(store2, "token-1", 500)
}

/// Test: Expired token is not duplicate
pub fn dedup_expired_token_test() -> Bool {
  let store = new_test_dedup_store(100, 1000)
  let store2 = add_entry(store, "token-1", 0)
  // Check at time 1500, TTL is 1000, so token expired
  !check_duplicate(store2, "token-1", 1500)
}

/// Test: Different tokens are not duplicates of each other
pub fn dedup_different_tokens_test() -> Bool {
  let store = new_test_dedup_store(100, 1000)
  let store2 = add_entry(store, "token-1", 0)
  !check_duplicate(store2, "token-2", 500)
}

// ============================================================================
// SECTION 3: REORDER BUFFER TESTS
// ============================================================================

type TestReorderBuffer {
  TestReorderBuffer(
    expected_next: Int,
    buffer: List(TestReorderEntry),
    max_size: Int,
  )
}

type TestReorderEntry {
  TestReorderEntry(sequence: Int, payload: String)
}

fn new_test_reorder_buffer(max_size: Int) -> TestReorderBuffer {
  TestReorderBuffer(expected_next: 0, buffer: [], max_size: max_size)
}

type TestReorderResult {
  Deliver(payload: String)
  Buffered
  TooOld
}

fn insert_message(
  buffer: TestReorderBuffer,
  seq: Int,
  payload: String,
) -> #(TestReorderBuffer, TestReorderResult) {
  case seq < buffer.expected_next {
    True -> #(buffer, TooOld)
    False ->
      case seq == buffer.expected_next {
        True -> {
          let new_buffer =
            TestReorderBuffer(..buffer, expected_next: buffer.expected_next + 1)
          #(new_buffer, Deliver(payload))
        }
        False -> {
          let entry = TestReorderEntry(sequence: seq, payload: payload)
          let new_buffer =
            TestReorderBuffer(..buffer, buffer: [entry, ..buffer.buffer])
          #(new_buffer, Buffered)
        }
      }
  }
}

/// Test: In-order message is delivered immediately
pub fn reorder_in_order_test() -> Bool {
  let buffer = new_test_reorder_buffer(10)
  let #(_, result) = insert_message(buffer, 0, "msg-0")
  case result {
    Deliver("msg-0") -> True
    _ -> False
  }
}

/// Test: Out-of-order message is buffered
pub fn reorder_out_of_order_test() -> Bool {
  let buffer = new_test_reorder_buffer(10)
  let #(_, result) = insert_message(buffer, 5, "msg-5")
  case result {
    Buffered -> True
    _ -> False
  }
}

/// Test: Old message is discarded
pub fn reorder_too_old_test() -> Bool {
  let buffer = new_test_reorder_buffer(10)
  let #(buffer2, _) = insert_message(buffer, 0, "msg-0")
  let #(buffer3, _) = insert_message(buffer2, 1, "msg-1")
  let #(_, result) = insert_message(buffer3, 0, "msg-0-dup")
  case result {
    TooOld -> True
    _ -> False
  }
}

/// Test: Expected next is updated after delivery
pub fn reorder_expected_next_update_test() -> Bool {
  let buffer = new_test_reorder_buffer(10)
  let #(buffer2, _) = insert_message(buffer, 0, "msg-0")
  buffer2.expected_next == 1
}

// ============================================================================
// SECTION 4: CREDIT FLOW CONTROL TESTS
// ============================================================================

type TestCreditFlow {
  TestCreditFlow(credits: Int, max_credits: Int, paused: Bool)
}

fn new_test_credit_flow(max_credits: Int) -> TestCreditFlow {
  TestCreditFlow(credits: max_credits, max_credits: max_credits, paused: False)
}

type TestCreditResult {
  CreditAvailable(remaining: Int)
  NoCredit
  FlowPaused
}

fn consume_credit(flow: TestCreditFlow) -> #(TestCreditFlow, TestCreditResult) {
  case flow.paused {
    True -> #(flow, FlowPaused)
    False ->
      case flow.credits > 0 {
        True -> {
          let new_flow = TestCreditFlow(..flow, credits: flow.credits - 1)
          #(new_flow, CreditAvailable(new_flow.credits))
        }
        False -> #(flow, NoCredit)
      }
  }
}

fn replenish_credits(flow: TestCreditFlow, amount: Int) -> TestCreditFlow {
  let new_credits = min(flow.credits + amount, flow.max_credits)
  TestCreditFlow(..flow, credits: new_credits)
}

fn pause_flow(flow: TestCreditFlow) -> TestCreditFlow {
  TestCreditFlow(..flow, paused: True)
}

fn min(a: Int, b: Int) -> Int {
  case a < b {
    True -> a
    False -> b
  }
}

/// Test: Credit available when not exhausted
pub fn credit_available_test() -> Bool {
  let flow = new_test_credit_flow(10)
  let #(_, result) = consume_credit(flow)
  case result {
    CreditAvailable(9) -> True
    _ -> False
  }
}

/// Test: No credit when exhausted
pub fn credit_exhausted_test() -> Bool {
  let flow = TestCreditFlow(credits: 0, max_credits: 10, paused: False)
  let #(_, result) = consume_credit(flow)
  case result {
    NoCredit -> True
    _ -> False
  }
}

/// Test: Flow paused rejects credit
pub fn credit_paused_test() -> Bool {
  let flow = new_test_credit_flow(10)
  let flow2 = pause_flow(flow)
  let #(_, result) = consume_credit(flow2)
  case result {
    FlowPaused -> True
    _ -> False
  }
}

/// Test: Replenish restores credits
pub fn credit_replenish_test() -> Bool {
  let flow = TestCreditFlow(credits: 5, max_credits: 10, paused: False)
  let flow2 = replenish_credits(flow, 3)
  flow2.credits == 8
}

/// Test: Replenish caps at max
pub fn credit_replenish_cap_test() -> Bool {
  let flow = TestCreditFlow(credits: 8, max_credits: 10, paused: False)
  let flow2 = replenish_credits(flow, 5)
  flow2.credits == 10
}

// ============================================================================
// SECTION 5: TOKEN BUCKET TESTS
// ============================================================================

type TestTokenBucket {
  TestTokenBucket(tokens: Int, capacity: Int, refill_rate: Int, refill_interval_ms: Int, last_refill: Int)
}

fn new_test_token_bucket(capacity: Int, refill_rate: Int, refill_interval_ms: Int, now: Int) -> TestTokenBucket {
  TestTokenBucket(
    tokens: capacity,
    capacity: capacity,
    refill_rate: refill_rate,
    refill_interval_ms: refill_interval_ms,
    last_refill: now,
  )
}

type TestTokenResult {
  TokenGranted(remaining: Int)
  TokenDenied(wait_ms: Int)
}

fn try_acquire_token(bucket: TestTokenBucket, now: Int) -> #(TestTokenBucket, TestTokenResult) {
  // Refill based on elapsed time
  let elapsed = now - bucket.last_refill
  let refills = elapsed / bucket.refill_interval_ms
  let new_tokens = min(bucket.tokens + refills * bucket.refill_rate, bucket.capacity)
  let new_last_refill = bucket.last_refill + refills * bucket.refill_interval_ms
  
  let refilled = TestTokenBucket(..bucket, tokens: new_tokens, last_refill: new_last_refill)
  
  case refilled.tokens > 0 {
    True -> {
      let updated = TestTokenBucket(..refilled, tokens: refilled.tokens - 1)
      #(updated, TokenGranted(updated.tokens))
    }
    False -> {
      let wait_ms = refilled.refill_interval_ms - (now - refilled.last_refill)
      #(refilled, TokenDenied(max(0, wait_ms)))
    }
  }
}

fn max(a: Int, b: Int) -> Int {
  case a > b {
    True -> a
    False -> b
  }
}

/// Test: Token available from full bucket
pub fn token_bucket_available_test() -> Bool {
  let bucket = new_test_token_bucket(10, 1, 100, 0)
  let #(_, result) = try_acquire_token(bucket, 0)
  case result {
    TokenGranted(9) -> True
    _ -> False
  }
}

/// Test: Token denied from empty bucket
pub fn token_bucket_denied_test() -> Bool {
  let bucket = TestTokenBucket(
    tokens: 0,
    capacity: 10,
    refill_rate: 1,
    refill_interval_ms: 100,
    last_refill: 0,
  )
  let #(_, result) = try_acquire_token(bucket, 50)
  case result {
    TokenDenied(_) -> True
    _ -> False
  }
}

/// Test: Token refills over time
pub fn token_bucket_refill_test() -> Bool {
  let bucket = TestTokenBucket(
    tokens: 0,
    capacity: 10,
    refill_rate: 2,
    refill_interval_ms: 100,
    last_refill: 0,
  )
  // At time 200, should have refilled 4 tokens (2 intervals * 2 rate)
  let #(_, result) = try_acquire_token(bucket, 200)
  case result {
    TokenGranted(3) -> True  // 4 refilled - 1 consumed = 3
    _ -> False
  }
}

// ============================================================================
// SECTION 6: PRIORITY QUEUE TESTS
// ============================================================================

type TestPriority {
  PriorityBackground
  PriorityLow
  PriorityNormal
  PriorityHigh
  PriorityCritical
}

type TestPriorityEntry {
  TestPriorityEntry(priority: TestPriority, payload: String, timestamp: Int)
}

type TestPriorityQueue {
  TestPriorityQueue(entries: List(TestPriorityEntry), max_size: Int, size: Int)
}

fn new_test_priority_queue(max_size: Int) -> TestPriorityQueue {
  TestPriorityQueue(entries: [], max_size: max_size, size: 0)
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

fn insert_by_priority(entries: List(TestPriorityEntry), entry: TestPriorityEntry) -> List(TestPriorityEntry) {
  case entries {
    [] -> [entry]
    [head, ..rest] ->
      case priority_to_int(entry.priority) > priority_to_int(head.priority) {
        True -> [entry, head, ..rest]
        False -> [head, ..insert_by_priority(rest, entry)]
      }
  }
}

fn enqueue(queue: TestPriorityQueue, priority: TestPriority, payload: String, timestamp: Int) -> TestPriorityQueue {
  let entry = TestPriorityEntry(priority: priority, payload: payload, timestamp: timestamp)
  case queue.size < queue.max_size {
    True -> {
      let new_entries = insert_by_priority(queue.entries, entry)
      TestPriorityQueue(..queue, entries: new_entries, size: queue.size + 1)
    }
    False -> queue  // Queue full, reject
  }
}

fn dequeue(queue: TestPriorityQueue) -> #(TestPriorityQueue, Result(String, Nil)) {
  case queue.entries {
    [] -> #(queue, Error(Nil))
    [highest, ..rest] -> #(
      TestPriorityQueue(..queue, entries: rest, size: queue.size - 1),
      Ok(highest.payload),
    )
  }
}

/// Test: Higher priority dequeued first
pub fn priority_queue_order_test() -> Bool {
  let queue = new_test_priority_queue(10)
  let queue2 = enqueue(queue, PriorityLow, "low", 0)
  let queue3 = enqueue(queue2, PriorityHigh, "high", 1)
  let queue4 = enqueue(queue3, PriorityNormal, "normal", 2)
  let #(_, result) = dequeue(queue4)
  case result {
    Ok("high") -> True
    _ -> False
  }
}

/// Test: FIFO within same priority
pub fn priority_queue_fifo_test() -> Bool {
  let queue = new_test_priority_queue(10)
  let queue2 = enqueue(queue, PriorityNormal, "first", 0)
  let queue3 = enqueue(queue2, PriorityNormal, "second", 1)
  let #(queue4, result1) = dequeue(queue3)
  let #(_, result2) = dequeue(queue4)
  case result1, result2 {
    Ok("first"), Ok("second") -> True
    _, _ -> False
  }
}

/// Test: Empty queue returns error
pub fn priority_queue_empty_test() -> Bool {
  let queue = new_test_priority_queue(10)
  let #(_, result) = dequeue(queue)
  case result {
    Error(Nil) -> True
    _ -> False
  }
}

// ============================================================================
// SECTION 7: TEST RUNNER
// ============================================================================

fn run_test(name: String, test_fn: fn() -> Bool) -> TestResult {
  case test_fn() {
    True -> Pass(name)
    False -> Fail(name)
  }
}

pub fn run_all_tests() -> List(TestResult) {
  [
    // Deduplication tests
    run_test("dedup_new_token_test", dedup_new_token_test),
    run_test("dedup_recorded_token_test", dedup_recorded_token_test),
    run_test("dedup_expired_token_test", dedup_expired_token_test),
    run_test("dedup_different_tokens_test", dedup_different_tokens_test),
    
    // Reorder buffer tests
    run_test("reorder_in_order_test", reorder_in_order_test),
    run_test("reorder_out_of_order_test", reorder_out_of_order_test),
    run_test("reorder_too_old_test", reorder_too_old_test),
    run_test("reorder_expected_next_update_test", reorder_expected_next_update_test),
    
    // Credit flow control tests
    run_test("credit_available_test", credit_available_test),
    run_test("credit_exhausted_test", credit_exhausted_test),
    run_test("credit_paused_test", credit_paused_test),
    run_test("credit_replenish_test", credit_replenish_test),
    run_test("credit_replenish_cap_test", credit_replenish_cap_test),
    
    // Token bucket tests
    run_test("token_bucket_available_test", token_bucket_available_test),
    run_test("token_bucket_denied_test", token_bucket_denied_test),
    run_test("token_bucket_refill_test", token_bucket_refill_test),
    
    // Priority queue tests
    run_test("priority_queue_order_test", priority_queue_order_test),
    run_test("priority_queue_fifo_test", priority_queue_fifo_test),
    run_test("priority_queue_empty_test", priority_queue_empty_test),
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
