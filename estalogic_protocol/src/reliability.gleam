//// estalogic_protocol/reliability.gleam
////
//// Reliability Layer for ESTA Logic Messaging Fabric
////
//// This module implements:
//// 1. Message deduplication using idempotency tokens
//// 2. Reorder correction with bounded CRA (Causal Reorder Avoidance)
//// 3. Flow control with credit-based, token bucket, and priority queue strategies
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: IDEMPOTENCY TOKEN TYPES
// ============================================================================

/// Idempotency token for message deduplication
pub type IdempotencyToken {
  IdempotencyToken(
    /// Unique token value (typically UUID or hash)
    value: String,
    /// Token creation timestamp (for TTL)
    created_at: Int,
    /// Optional scope (e.g., user ID, tenant ID)
    scope: Result(String, Nil),
  )
}

/// Result of deduplication check
pub type DeduplicationResult {
  /// Message is new, should be processed
  NewMessage
  /// Message is a duplicate, should be skipped
  DuplicateMessage(
    /// When the original was processed
    original_processed_at: Int,
    /// Result of original processing (if available)
    original_result: Result(String, Nil),
  )
  /// Token has expired, treat as new message
  TokenExpired
}

/// Deduplication store state
pub type DeduplicationStore {
  DeduplicationStore(
    /// Map of token value to entry (using list for simplicity)
    entries: List(DeduplicationEntry),
    /// Maximum entries before eviction
    max_entries: Int,
    /// Token time-to-live in milliseconds
    ttl_ms: Int,
    /// Current size
    size: Int,
  )
}

/// Single deduplication entry
pub type DeduplicationEntry {
  DeduplicationEntry(
    /// Token value (key)
    token: String,
    /// When the message was processed
    processed_at: Int,
    /// Processing result (for replay)
    result: Result(String, Nil),
    /// Entry expiration timestamp
    expires_at: Int,
  )
}

/// Create a new deduplication store
pub fn new_dedup_store(max_entries: Int, ttl_ms: Int) -> DeduplicationStore {
  DeduplicationStore(
    entries: [],
    max_entries: max_entries,
    ttl_ms: ttl_ms,
    size: 0,
  )
}

/// Check if a token exists (deduplication check)
pub fn check_duplicate(
  store: DeduplicationStore,
  token: IdempotencyToken,
  now: Int,
) -> DeduplicationResult {
  case find_entry(store.entries, token.value) {
    Ok(entry) ->
      case entry.expires_at > now {
        True ->
          DuplicateMessage(
            original_processed_at: entry.processed_at,
            original_result: entry.result,
          )
        False -> TokenExpired
      }
    Error(_) -> NewMessage
  }
}

/// Record a processed message for deduplication
pub fn record_processed(
  store: DeduplicationStore,
  token: IdempotencyToken,
  now: Int,
  result: Result(String, Nil),
) -> DeduplicationStore {
  let expires_at = now + store.ttl_ms
  let entry =
    DeduplicationEntry(
      token: token.value,
      processed_at: now,
      result: result,
      expires_at: expires_at,
    )

  // Remove expired entries first
  let clean_entries = filter_expired(store.entries, now)

  // Check if we need to evict
  let entries = case list_length(clean_entries) >= store.max_entries {
    True ->
      // Remove oldest entry (simple LRU)
      drop_oldest(clean_entries)
    False -> clean_entries
  }

  DeduplicationStore(
    ..store,
    entries: [entry, ..entries],
    size: list_length(entries) + 1,
  )
}

/// Evict expired entries
pub fn evict_expired(store: DeduplicationStore, now: Int) -> DeduplicationStore {
  let entries = filter_expired(store.entries, now)
  DeduplicationStore(..store, entries: entries, size: list_length(entries))
}

// Helper: find entry by token
fn find_entry(
  entries: List(DeduplicationEntry),
  token: String,
) -> Result(DeduplicationEntry, Nil) {
  case entries {
    [] -> Error(Nil)
    [entry, ..rest] ->
      case entry.token == token {
        True -> Ok(entry)
        False -> find_entry(rest, token)
      }
  }
}

// Helper: filter out expired entries
fn filter_expired(entries: List(DeduplicationEntry), now: Int) -> List(DeduplicationEntry) {
  case entries {
    [] -> []
    [entry, ..rest] ->
      case entry.expires_at > now {
        True -> [entry, ..filter_expired(rest, now)]
        False -> filter_expired(rest, now)
      }
  }
}

// Helper: drop oldest entry (by processed_at)
fn drop_oldest(entries: List(DeduplicationEntry)) -> List(DeduplicationEntry) {
  case entries {
    [] -> []
    [_] -> []
    _ -> {
      let oldest = find_oldest(entries)
      filter_not_token(entries, oldest)
    }
  }
}

fn find_oldest(entries: List(DeduplicationEntry)) -> String {
  case entries {
    [] -> ""
    [single] -> single.token
    [a, b, ..rest] ->
      case a.processed_at < b.processed_at {
        True -> find_oldest([a, ..rest])
        False -> find_oldest([b, ..rest])
      }
  }
}

fn filter_not_token(
  entries: List(DeduplicationEntry),
  token: String,
) -> List(DeduplicationEntry) {
  case entries {
    [] -> []
    [entry, ..rest] ->
      case entry.token == token {
        True -> rest
        False -> [entry, ..filter_not_token(rest, token)]
      }
  }
}

// ============================================================================
// SECTION 2: REORDER CORRECTION (BOUNDED CRA)
// ============================================================================

/// Sequence number for ordering
pub type SequenceNumber {
  SequenceNumber(value: Int)
}

/// Reorder buffer entry
pub type ReorderEntry(payload) {
  ReorderEntry(
    /// Sequence number
    sequence: SequenceNumber,
    /// Message payload
    payload: payload,
    /// Arrival timestamp
    arrived_at: Int,
  )
}

/// Reorder buffer state (Bounded CRA - Causal Reorder Avoidance)
pub type ReorderBuffer(payload) {
  ReorderBuffer(
    /// Expected next sequence number
    expected_next: SequenceNumber,
    /// Buffered out-of-order messages
    buffer: List(ReorderEntry(payload)),
    /// Maximum window size (bounded reordering)
    max_window_size: Int,
    /// Maximum wait time before forcing delivery (ms)
    max_wait_ms: Int,
    /// Source identifier for per-source ordering
    source_id: String,
  )
}

/// Result of inserting into reorder buffer
pub type ReorderResult(payload) {
  /// Message is in order, deliver immediately
  Deliver(payload: payload)
  /// Message is out of order, buffered for later
  Buffered
  /// Message is too old (sequence < expected), discard
  TooOld
  /// Window full, flush buffer and deliver
  WindowFull(deliverable: List(payload))
  /// Gap detected, may need to wait or request retransmit
  GapDetected(missing: List(SequenceNumber))
}

/// Create a new reorder buffer
pub fn new_reorder_buffer(
  source_id: String,
  max_window_size: Int,
  max_wait_ms: Int,
) -> ReorderBuffer(payload) {
  ReorderBuffer(
    expected_next: SequenceNumber(0),
    buffer: [],
    max_window_size: max_window_size,
    max_wait_ms: max_wait_ms,
    source_id: source_id,
  )
}

/// Insert a message into the reorder buffer
pub fn insert_message(
  buffer: ReorderBuffer(payload),
  sequence: SequenceNumber,
  payload: payload,
  now: Int,
) -> #(ReorderBuffer(payload), ReorderResult(payload)) {
  let expected = buffer.expected_next.value

  case sequence.value < expected {
    // Message is too old, discard
    True -> #(buffer, TooOld)
    False ->
      case sequence.value == expected {
        // Message is in order, deliver and check buffer for consecutive
        True -> {
          let new_expected = SequenceNumber(expected + 1)
          let #(new_buffer, consecutive) =
            extract_consecutive(buffer.buffer, new_expected)
          let updated_buffer =
            ReorderBuffer(
              ..buffer,
              expected_next: advance_sequence(new_expected, list_length(consecutive)),
              buffer: new_buffer,
            )
          case consecutive {
            [] -> #(updated_buffer, Deliver(payload))
            _ -> #(updated_buffer, WindowFull([payload, ..consecutive]))
          }
        }
        // Message is out of order
        False -> {
          // Check window size
          case list_length(buffer.buffer) >= buffer.max_window_size {
            True -> {
              // Window full, flush everything we can
              let #(new_buffer, deliverable) =
                flush_buffer(buffer.buffer, buffer.expected_next)
              let entry = ReorderEntry(sequence: sequence, payload: payload, arrived_at: now)
              #(
                ReorderBuffer(
                  ..buffer,
                  buffer: [entry, ..new_buffer],
                  expected_next: advance_sequence(
                    buffer.expected_next,
                    list_length(deliverable),
                  ),
                ),
                WindowFull(deliverable),
              )
            }
            False -> {
              // Buffer the out-of-order message
              let entry =
                ReorderEntry(sequence: sequence, payload: payload, arrived_at: now)
              let new_buffer = insert_sorted(buffer.buffer, entry)
              let missing = find_gaps(buffer.expected_next, sequence)
              #(ReorderBuffer(..buffer, buffer: new_buffer), GapDetected(missing))
            }
          }
        }
      }
  }
}

/// Check for timed-out messages and force delivery
pub fn check_timeout(
  buffer: ReorderBuffer(payload),
  now: Int,
) -> #(ReorderBuffer(payload), List(payload)) {
  let timed_out = filter_timed_out(buffer.buffer, now, buffer.max_wait_ms)
  case timed_out {
    [] -> #(buffer, [])
    _ -> {
      let remaining = filter_not_timed_out(buffer.buffer, now, buffer.max_wait_ms)
      let payloads = extract_payloads(timed_out)
      let max_seq = find_max_sequence(timed_out)
      #(
        ReorderBuffer(
          ..buffer,
          buffer: remaining,
          expected_next: SequenceNumber(max_seq + 1),
        ),
        payloads,
      )
    }
  }
}

// Helper: extract consecutive messages starting from expected
fn extract_consecutive(
  buffer: List(ReorderEntry(payload)),
  expected: SequenceNumber,
) -> #(List(ReorderEntry(payload)), List(payload)) {
  case find_by_sequence(buffer, expected) {
    Ok(entry) -> {
      let remaining = filter_sequence(buffer, expected.value)
      let #(new_remaining, more) =
        extract_consecutive(remaining, SequenceNumber(expected.value + 1))
      #(new_remaining, [entry.payload, ..more])
    }
    Error(_) -> #(buffer, [])
  }
}

// Helper: flush buffer and return deliverable messages
fn flush_buffer(
  buffer: List(ReorderEntry(payload)),
  expected: SequenceNumber,
) -> #(List(ReorderEntry(payload)), List(payload)) {
  let sorted = sort_by_sequence(buffer)
  #([], extract_payloads(sorted))
}

// Helper: insert entry maintaining sequence order
fn insert_sorted(
  buffer: List(ReorderEntry(payload)),
  entry: ReorderEntry(payload),
) -> List(ReorderEntry(payload)) {
  case buffer {
    [] -> [entry]
    [head, ..rest] ->
      case entry.sequence.value < head.sequence.value {
        True -> [entry, head, ..rest]
        False -> [head, ..insert_sorted(rest, entry)]
      }
  }
}

// Helper: find gaps between expected and received sequence
fn find_gaps(expected: SequenceNumber, received: SequenceNumber) -> List(SequenceNumber) {
  generate_range(expected.value, received.value - 1)
}

fn generate_range(start: Int, end: Int) -> List(SequenceNumber) {
  case start > end {
    True -> []
    False -> [SequenceNumber(start), ..generate_range(start + 1, end)]
  }
}

fn advance_sequence(seq: SequenceNumber, count: Int) -> SequenceNumber {
  SequenceNumber(seq.value + count)
}

fn find_by_sequence(
  buffer: List(ReorderEntry(payload)),
  seq: SequenceNumber,
) -> Result(ReorderEntry(payload), Nil) {
  case buffer {
    [] -> Error(Nil)
    [entry, ..rest] ->
      case entry.sequence.value == seq.value {
        True -> Ok(entry)
        False -> find_by_sequence(rest, seq)
      }
  }
}

fn filter_sequence(
  buffer: List(ReorderEntry(payload)),
  seq: Int,
) -> List(ReorderEntry(payload)) {
  case buffer {
    [] -> []
    [entry, ..rest] ->
      case entry.sequence.value == seq {
        True -> rest
        False -> [entry, ..filter_sequence(rest, seq)]
      }
  }
}

fn sort_by_sequence(buffer: List(ReorderEntry(payload))) -> List(ReorderEntry(payload)) {
  case buffer {
    [] -> []
    [pivot, ..rest] -> {
      let less = filter_less_than(rest, pivot.sequence.value)
      let greater = filter_greater_equal(rest, pivot.sequence.value)
      list_append(sort_by_sequence(less), [pivot, ..sort_by_sequence(greater)])
    }
  }
}

fn filter_less_than(
  buffer: List(ReorderEntry(payload)),
  seq: Int,
) -> List(ReorderEntry(payload)) {
  case buffer {
    [] -> []
    [entry, ..rest] ->
      case entry.sequence.value < seq {
        True -> [entry, ..filter_less_than(rest, seq)]
        False -> filter_less_than(rest, seq)
      }
  }
}

fn filter_greater_equal(
  buffer: List(ReorderEntry(payload)),
  seq: Int,
) -> List(ReorderEntry(payload)) {
  case buffer {
    [] -> []
    [entry, ..rest] ->
      case entry.sequence.value >= seq {
        True -> [entry, ..filter_greater_equal(rest, seq)]
        False -> filter_greater_equal(rest, seq)
      }
  }
}

fn extract_payloads(buffer: List(ReorderEntry(payload))) -> List(payload) {
  case buffer {
    [] -> []
    [entry, ..rest] -> [entry.payload, ..extract_payloads(rest)]
  }
}

fn filter_timed_out(
  buffer: List(ReorderEntry(payload)),
  now: Int,
  max_wait_ms: Int,
) -> List(ReorderEntry(payload)) {
  case buffer {
    [] -> []
    [entry, ..rest] ->
      case now - entry.arrived_at > max_wait_ms {
        True -> [entry, ..filter_timed_out(rest, now, max_wait_ms)]
        False -> filter_timed_out(rest, now, max_wait_ms)
      }
  }
}

fn filter_not_timed_out(
  buffer: List(ReorderEntry(payload)),
  now: Int,
  max_wait_ms: Int,
) -> List(ReorderEntry(payload)) {
  case buffer {
    [] -> []
    [entry, ..rest] ->
      case now - entry.arrived_at <= max_wait_ms {
        True -> [entry, ..filter_not_timed_out(rest, now, max_wait_ms)]
        False -> filter_not_timed_out(rest, now, max_wait_ms)
      }
  }
}

fn find_max_sequence(buffer: List(ReorderEntry(payload))) -> Int {
  case buffer {
    [] -> 0
    [single] -> single.sequence.value
    [a, b, ..rest] ->
      case a.sequence.value > b.sequence.value {
        True -> find_max_sequence([a, ..rest])
        False -> find_max_sequence([b, ..rest])
      }
  }
}

fn list_append(a: List(x), b: List(x)) -> List(x) {
  case a {
    [] -> b
    [head, ..tail] -> [head, ..list_append(tail, b)]
  }
}

// ============================================================================
// SECTION 3: FLOW CONTROL - CREDIT-BASED
// ============================================================================

/// Credit-based flow control state
pub type CreditFlowControl {
  CreditFlowControl(
    /// Available credits (messages that can be sent)
    credits: Int,
    /// Maximum credits
    max_credits: Int,
    /// Credits to grant on replenish
    replenish_amount: Int,
    /// Whether flow is paused
    paused: Bool,
  )
}

/// Result of credit check
pub type CreditResult {
  /// Credit available, can send
  CreditAvailable(remaining: Int)
  /// No credit, must wait
  NoCredit
  /// Flow is paused
  FlowPaused
}

/// Create a new credit-based flow control
pub fn new_credit_flow(max_credits: Int, replenish_amount: Int) -> CreditFlowControl {
  CreditFlowControl(
    credits: max_credits,
    max_credits: max_credits,
    replenish_amount: replenish_amount,
    paused: False,
  )
}

/// Try to consume a credit
pub fn consume_credit(flow: CreditFlowControl) -> #(CreditFlowControl, CreditResult) {
  case flow.paused {
    True -> #(flow, FlowPaused)
    False ->
      case flow.credits > 0 {
        True -> {
          let new_flow = CreditFlowControl(..flow, credits: flow.credits - 1)
          #(new_flow, CreditAvailable(new_flow.credits))
        }
        False -> #(flow, NoCredit)
      }
  }
}

/// Replenish credits (called by receiver as acknowledgment)
pub fn replenish_credits(flow: CreditFlowControl) -> CreditFlowControl {
  let new_credits = min(flow.credits + flow.replenish_amount, flow.max_credits)
  CreditFlowControl(..flow, credits: new_credits)
}

/// Pause flow
pub fn pause_flow(flow: CreditFlowControl) -> CreditFlowControl {
  CreditFlowControl(..flow, paused: True)
}

/// Resume flow
pub fn resume_flow(flow: CreditFlowControl) -> CreditFlowControl {
  CreditFlowControl(..flow, paused: False)
}

/// Grant specific amount of credits
pub fn grant_credits(flow: CreditFlowControl, amount: Int) -> CreditFlowControl {
  let new_credits = min(flow.credits + amount, flow.max_credits)
  CreditFlowControl(..flow, credits: new_credits)
}

// ============================================================================
// SECTION 4: FLOW CONTROL - TOKEN BUCKET
// ============================================================================

/// Token bucket rate limiter
pub type TokenBucket {
  TokenBucket(
    /// Current number of tokens
    tokens: Int,
    /// Maximum bucket capacity
    capacity: Int,
    /// Tokens to add per refill
    refill_rate: Int,
    /// Refill interval in milliseconds
    refill_interval_ms: Int,
    /// Last refill timestamp
    last_refill: Int,
  )
}

/// Result of token bucket check
pub type TokenBucketResult {
  /// Token available, request allowed
  TokenGranted(remaining: Int)
  /// No tokens, request rejected
  TokenDenied(wait_ms: Int)
}

/// Create a new token bucket
pub fn new_token_bucket(
  capacity: Int,
  refill_rate: Int,
  refill_interval_ms: Int,
  now: Int,
) -> TokenBucket {
  TokenBucket(
    tokens: capacity,
    capacity: capacity,
    refill_rate: refill_rate,
    refill_interval_ms: refill_interval_ms,
    last_refill: now,
  )
}

/// Try to acquire a token (with automatic refill)
pub fn try_acquire_token(
  bucket: TokenBucket,
  now: Int,
) -> #(TokenBucket, TokenBucketResult) {
  // First, refill based on elapsed time
  let elapsed = now - bucket.last_refill
  let refills = elapsed / bucket.refill_interval_ms
  let new_tokens = min(bucket.tokens + refills * bucket.refill_rate, bucket.capacity)
  let new_last_refill = bucket.last_refill + refills * bucket.refill_interval_ms

  let refilled_bucket =
    TokenBucket(..bucket, tokens: new_tokens, last_refill: new_last_refill)

  case refilled_bucket.tokens > 0 {
    True -> {
      let updated = TokenBucket(..refilled_bucket, tokens: refilled_bucket.tokens - 1)
      #(updated, TokenGranted(updated.tokens))
    }
    False -> {
      let wait_ms = refilled_bucket.refill_interval_ms - (now - refilled_bucket.last_refill)
      #(refilled_bucket, TokenDenied(max(0, wait_ms)))
    }
  }
}

/// Force refill the bucket (for testing or burst recovery)
pub fn refill_bucket(bucket: TokenBucket, now: Int) -> TokenBucket {
  TokenBucket(..bucket, tokens: bucket.capacity, last_refill: now)
}

// ============================================================================
// SECTION 5: FLOW CONTROL - PRIORITY QUEUE
// ============================================================================

/// Priority levels
pub type Priority {
  /// Background priority
  PriorityBackground
  /// Low priority
  PriorityLow
  /// Normal priority
  PriorityNormal
  /// High priority
  PriorityHigh
  /// Critical priority
  PriorityCritical
}

/// Priority queue entry
pub type PriorityEntry(payload) {
  PriorityEntry(
    /// Entry priority
    priority: Priority,
    /// Entry payload
    payload: payload,
    /// Entry timestamp (for FIFO within priority)
    timestamp: Int,
  )
}

/// Priority queue state
pub type PriorityQueue(payload) {
  PriorityQueue(
    /// Entries organized by priority (highest first)
    entries: List(PriorityEntry(payload)),
    /// Maximum queue size
    max_size: Int,
    /// Current size
    size: Int,
  )
}

/// Result of enqueue operation
pub type EnqueueResult {
  /// Successfully enqueued
  Enqueued
  /// Queue full, lowest priority dropped
  EnqueuedWithDrop(dropped_priority: Priority)
  /// Queue full, new message rejected (lower priority)
  Rejected
}

/// Create a new priority queue
pub fn new_priority_queue(max_size: Int) -> PriorityQueue(payload) {
  PriorityQueue(entries: [], max_size: max_size, size: 0)
}

/// Enqueue a message with priority
pub fn enqueue(
  queue: PriorityQueue(payload),
  priority: Priority,
  payload: payload,
  timestamp: Int,
) -> #(PriorityQueue(payload), EnqueueResult) {
  let entry = PriorityEntry(priority: priority, payload: payload, timestamp: timestamp)

  case queue.size < queue.max_size {
    // Queue has space, insert maintaining priority order
    True -> {
      let new_entries = insert_by_priority(queue.entries, entry)
      #(PriorityQueue(..queue, entries: new_entries, size: queue.size + 1), Enqueued)
    }
    // Queue full, try to drop lower priority
    False -> {
      let lowest = find_lowest_priority(queue.entries)
      case priority_to_int(priority) > priority_to_int(lowest) {
        // New message has higher priority, drop lowest
        True -> {
          let trimmed = drop_lowest_priority(queue.entries)
          let new_entries = insert_by_priority(trimmed, entry)
          #(
            PriorityQueue(..queue, entries: new_entries),
            EnqueuedWithDrop(lowest),
          )
        }
        // New message has same or lower priority, reject
        False -> #(queue, Rejected)
      }
    }
  }
}

/// Dequeue highest priority message
pub fn dequeue(
  queue: PriorityQueue(payload),
) -> #(PriorityQueue(payload), Result(payload, Nil)) {
  case queue.entries {
    [] -> #(queue, Error(Nil))
    [highest, ..rest] -> #(
      PriorityQueue(..queue, entries: rest, size: queue.size - 1),
      Ok(highest.payload),
    )
  }
}

/// Peek at highest priority message without removing
pub fn peek(queue: PriorityQueue(payload)) -> Result(payload, Nil) {
  case queue.entries {
    [] -> Error(Nil)
    [highest, ..] -> Ok(highest.payload)
  }
}

/// Check if queue is empty
pub fn is_empty(queue: PriorityQueue(payload)) -> Bool {
  queue.size == 0
}

/// Check if queue is full
pub fn is_full(queue: PriorityQueue(payload)) -> Bool {
  queue.size >= queue.max_size
}

/// Get queue size
pub fn queue_size(queue: PriorityQueue(payload)) -> Int {
  queue.size
}

// Helper: convert priority to int for comparison
pub fn priority_to_int(priority: Priority) -> Int {
  case priority {
    PriorityBackground -> 0
    PriorityLow -> 1
    PriorityNormal -> 2
    PriorityHigh -> 3
    PriorityCritical -> 4
  }
}

// Helper: insert entry maintaining priority order (highest first)
fn insert_by_priority(
  entries: List(PriorityEntry(payload)),
  entry: PriorityEntry(payload),
) -> List(PriorityEntry(payload)) {
  case entries {
    [] -> [entry]
    [head, ..rest] ->
      case priority_to_int(entry.priority) > priority_to_int(head.priority) {
        True -> [entry, head, ..rest]
        False ->
          case priority_to_int(entry.priority) == priority_to_int(head.priority) {
            // Same priority, use FIFO (earlier timestamp first)
            True ->
              case entry.timestamp < head.timestamp {
                True -> [entry, head, ..rest]
                False -> [head, ..insert_by_priority(rest, entry)]
              }
            False -> [head, ..insert_by_priority(rest, entry)]
          }
      }
  }
}

// Helper: find lowest priority in list
fn find_lowest_priority(entries: List(PriorityEntry(payload))) -> Priority {
  case entries {
    [] -> PriorityNormal
    [single] -> single.priority
    [a, b, ..rest] ->
      case priority_to_int(a.priority) < priority_to_int(b.priority) {
        True -> find_lowest_priority([a, ..rest])
        False -> find_lowest_priority([b, ..rest])
      }
  }
}

// Helper: drop one entry with lowest priority
fn drop_lowest_priority(
  entries: List(PriorityEntry(payload)),
) -> List(PriorityEntry(payload)) {
  let lowest = find_lowest_priority(entries)
  drop_first_with_priority(entries, lowest)
}

fn drop_first_with_priority(
  entries: List(PriorityEntry(payload)),
  priority: Priority,
) -> List(PriorityEntry(payload)) {
  case entries {
    [] -> []
    [entry, ..rest] ->
      case priority_to_int(entry.priority) == priority_to_int(priority) {
        True -> rest
        False -> [entry, ..drop_first_with_priority(rest, priority)]
      }
  }
}

// ============================================================================
// SECTION 6: COMBINED RELIABILITY CONTROLLER
// ============================================================================

/// Reliability mode configuration
pub type ReliabilityMode {
  /// At-most-once delivery (fire and forget)
  AtMostOnce
  /// At-least-once delivery (may have duplicates)
  AtLeastOnce
  /// Exactly-once delivery (deduplication enabled)
  ExactlyOnce
}

/// Reliability controller combining all mechanisms
pub type ReliabilityController(payload) {
  ReliabilityController(
    /// Delivery mode
    mode: ReliabilityMode,
    /// Deduplication store (for exactly-once)
    dedup_store: DeduplicationStore,
    /// Reorder buffer
    reorder_buffer: ReorderBuffer(payload),
    /// Flow control
    flow_control: FlowControlStrategy,
  )
}

/// Flow control strategy selection
pub type FlowControlStrategy {
  /// Credit-based flow control
  CreditBased(flow: CreditFlowControl)
  /// Token bucket rate limiting
  TokenBucketBased(bucket: TokenBucket)
  /// Priority queue based
  PriorityQueueBased
  /// No flow control
  NoFlowControl
}

/// Create a new reliability controller
pub fn new_controller(
  mode: ReliabilityMode,
  source_id: String,
  max_window_size: Int,
  max_wait_ms: Int,
  dedup_max_entries: Int,
  dedup_ttl_ms: Int,
  flow_control: FlowControlStrategy,
) -> ReliabilityController(payload) {
  ReliabilityController(
    mode: mode,
    dedup_store: new_dedup_store(dedup_max_entries, dedup_ttl_ms),
    reorder_buffer: new_reorder_buffer(source_id, max_window_size, max_wait_ms),
    flow_control: flow_control,
  )
}

/// Process result from reliability controller
pub type ProcessResult(payload) {
  /// Message accepted for delivery
  Accept(payload: payload)
  /// Message is a duplicate, skip
  Duplicate
  /// Message buffered for reordering
  Buffered
  /// Message too old, discard
  Discarded
  /// Flow control rejection
  FlowRejected
  /// Multiple messages ready for delivery (after reordering)
  BatchReady(payloads: List(payload))
}

// ============================================================================
// SECTION 7: ACKNOWLEDGMENT HANDLING
// ============================================================================

/// Acknowledgment types
pub type Ack {
  /// Positive acknowledgment
  AckPositive(sequence: SequenceNumber)
  /// Negative acknowledgment (request retransmit)
  AckNegative(sequence: SequenceNumber, reason: NackReason)
  /// Cumulative acknowledgment (all up to sequence)
  AckCumulative(up_to: SequenceNumber)
  /// Selective acknowledgment (specific sequences)
  AckSelective(sequences: List(SequenceNumber))
}

/// Negative acknowledgment reasons
pub type NackReason {
  /// Message was corrupted
  Corrupted
  /// Message was lost
  Lost
  /// Processing failed
  ProcessingFailed
  /// Resource unavailable
  ResourceUnavailable
}

/// Acknowledgment tracker state
pub type AckTracker {
  AckTracker(
    /// Unacknowledged sequences
    pending: List(PendingAck),
    /// Acknowledgment timeout in milliseconds
    timeout_ms: Int,
    /// Maximum retries before giving up
    max_retries: Int,
  )
}

/// Pending acknowledgment entry
pub type PendingAck {
  PendingAck(
    /// Sequence number
    sequence: SequenceNumber,
    /// Time sent
    sent_at: Int,
    /// Number of retries
    retries: Int,
  )
}

/// Create a new ack tracker
pub fn new_ack_tracker(timeout_ms: Int, max_retries: Int) -> AckTracker {
  AckTracker(pending: [], timeout_ms: timeout_ms, max_retries: max_retries)
}

/// Record a sent message awaiting ack
pub fn record_sent(tracker: AckTracker, sequence: SequenceNumber, now: Int) -> AckTracker {
  let pending = PendingAck(sequence: sequence, sent_at: now, retries: 0)
  AckTracker(..tracker, pending: [pending, ..tracker.pending])
}

/// Process an acknowledgment
pub fn process_ack(tracker: AckTracker, ack: Ack) -> AckTracker {
  case ack {
    AckPositive(seq) ->
      AckTracker(..tracker, pending: filter_acked(tracker.pending, seq))
    AckNegative(_, _) ->
      // Keep in pending for retry
      tracker
    AckCumulative(up_to) ->
      AckTracker(
        ..tracker,
        pending: filter_cumulative_acked(tracker.pending, up_to),
      )
    AckSelective(sequences) ->
      AckTracker(
        ..tracker,
        pending: filter_selective_acked(tracker.pending, sequences),
      )
  }
}

/// Get sequences that need retransmission
pub fn get_retransmit_needed(tracker: AckTracker, now: Int) -> List(SequenceNumber) {
  tracker.pending
  |> filter_timed_out_acks(now, tracker.timeout_ms)
  |> filter_retryable(tracker.max_retries)
  |> extract_sequences
}

fn filter_acked(pending: List(PendingAck), seq: SequenceNumber) -> List(PendingAck) {
  case pending {
    [] -> []
    [p, ..rest] ->
      case p.sequence.value == seq.value {
        True -> rest
        False -> [p, ..filter_acked(rest, seq)]
      }
  }
}

fn filter_cumulative_acked(
  pending: List(PendingAck),
  up_to: SequenceNumber,
) -> List(PendingAck) {
  case pending {
    [] -> []
    [p, ..rest] ->
      case p.sequence.value <= up_to.value {
        True -> filter_cumulative_acked(rest, up_to)
        False -> [p, ..filter_cumulative_acked(rest, up_to)]
      }
  }
}

fn filter_selective_acked(
  pending: List(PendingAck),
  sequences: List(SequenceNumber),
) -> List(PendingAck) {
  case pending {
    [] -> []
    [p, ..rest] ->
      case contains_sequence(sequences, p.sequence) {
        True -> filter_selective_acked(rest, sequences)
        False -> [p, ..filter_selective_acked(rest, sequences)]
      }
  }
}

fn contains_sequence(sequences: List(SequenceNumber), seq: SequenceNumber) -> Bool {
  case sequences {
    [] -> False
    [s, ..rest] ->
      case s.value == seq.value {
        True -> True
        False -> contains_sequence(rest, seq)
      }
  }
}

fn filter_timed_out_acks(
  pending: List(PendingAck),
  now: Int,
  timeout_ms: Int,
) -> List(PendingAck) {
  case pending {
    [] -> []
    [p, ..rest] ->
      case now - p.sent_at > timeout_ms {
        True -> [p, ..filter_timed_out_acks(rest, now, timeout_ms)]
        False -> filter_timed_out_acks(rest, now, timeout_ms)
      }
  }
}

fn filter_retryable(pending: List(PendingAck), max_retries: Int) -> List(PendingAck) {
  case pending {
    [] -> []
    [p, ..rest] ->
      case p.retries < max_retries {
        True -> [p, ..filter_retryable(rest, max_retries)]
        False -> filter_retryable(rest, max_retries)
      }
  }
}

fn extract_sequences(pending: List(PendingAck)) -> List(SequenceNumber) {
  case pending {
    [] -> []
    [p, ..rest] -> [p.sequence, ..extract_sequences(rest)]
  }
}

// ============================================================================
// SECTION 8: HELPER FUNCTIONS
// ============================================================================

fn min(a: Int, b: Int) -> Int {
  case a < b {
    True -> a
    False -> b
  }
}

fn max(a: Int, b: Int) -> Int {
  case a > b {
    True -> a
    False -> b
  }
}

fn list_length(lst: List(a)) -> Int {
  case lst {
    [] -> 0
    [_, ..rest] -> 1 + list_length(rest)
  }
}
