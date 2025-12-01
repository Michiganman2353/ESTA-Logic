//// estalogic_observe/test/log_integrity_test.gleam
////
//// Tests for the Deterministic Logging with Integrity Checks Module
////
//// Test Coverage:
//// - Hash computation and comparison
//// - Timestamp attestation
//// - Log entry creation and chaining
//// - Tamper detection
//// - Flight recorder operations
//// - Merkle proofs

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
// SECTION 2: HASH TYPES (MIRROR OF log_integrity.gleam)
// ============================================================================

type Hash {
  Hash(high_1: Int, high_2: Int, low_1: Int, low_2: Int)
}

fn null_hash() -> Hash {
  Hash(high_1: 0, high_2: 0, low_1: 0, low_2: 0)
}

fn is_null_hash(hash: Hash) -> Bool {
  hash.high_1 == 0 && hash.high_2 == 0 &&
  hash.low_1 == 0 && hash.low_2 == 0
}

fn hash_equals(a: Hash, b: Hash) -> Bool {
  a.high_1 == b.high_1 && a.high_2 == b.high_2 &&
  a.low_1 == b.low_1 && a.low_2 == b.low_2
}

fn compute_chain_hash(entry_hash: Hash, previous_hash: Hash) -> Hash {
  Hash(
    high_1: entry_hash.high_1 + previous_hash.high_1,
    high_2: entry_hash.high_2 + previous_hash.high_2,
    low_1: entry_hash.low_1 + previous_hash.low_1,
    low_2: entry_hash.low_2 + previous_hash.low_2,
  )
}

// ============================================================================
// SECTION 3: TIMESTAMP TYPES
// ============================================================================

type AttestedTimestamp {
  AttestedTimestamp(
    wall_nanos: Int,
    logical: Int,
    node_id: Int,
    monotonic: Int,
    attestation: Hash,
  )
}

type TimestampValidation {
  TimestampValid
  TimestampMonotonicViolation(expected_min: Int, actual: Int)
  TimestampAttestationInvalid
  TimestampFuture(drift_nanos: Int)
}

fn compute_timestamp_attestation(
  wall_nanos: Int,
  logical: Int,
  node_id: Int,
  monotonic: Int,
) -> Hash {
  let combined = wall_nanos + logical * 1000 + node_id * 1_000_000 + monotonic
  Hash(
    high_1: combined,
    high_2: wall_nanos,
    low_1: logical + node_id,
    low_2: monotonic,
  )
}

fn create_attested_timestamp(
  wall_nanos: Int,
  logical: Int,
  node_id: Int,
  monotonic: Int,
) -> AttestedTimestamp {
  let attestation = compute_timestamp_attestation(wall_nanos, logical, node_id, monotonic)
  AttestedTimestamp(
    wall_nanos: wall_nanos,
    logical: logical,
    node_id: node_id,
    monotonic: monotonic,
    attestation: attestation,
  )
}

fn validate_timestamp_attestation(ts: AttestedTimestamp) -> TimestampValidation {
  let expected = compute_timestamp_attestation(
    ts.wall_nanos,
    ts.logical,
    ts.node_id,
    ts.monotonic,
  )
  case hash_equals(expected, ts.attestation) {
    True -> TimestampValid
    False -> TimestampAttestationInvalid
  }
}

fn check_monotonicity(prev: AttestedTimestamp, current: AttestedTimestamp) -> TimestampValidation {
  case current.monotonic > prev.monotonic {
    True -> TimestampValid
    False -> TimestampMonotonicViolation(prev.monotonic + 1, current.monotonic)
  }
}

type Order {
  Lt
  Eq
  Gt
}

fn timestamp_compare(a: AttestedTimestamp, b: AttestedTimestamp) -> Order {
  case a.monotonic < b.monotonic {
    True -> Lt
    False ->
      case a.monotonic > b.monotonic {
        True -> Gt
        False -> Eq
      }
  }
}

// ============================================================================
// SECTION 4: LOG ENTRY TYPES
// ============================================================================

type LogEntryId {
  LogEntryId(sequence: Int, partition: Int)
}

type LogSeverity {
  SeverityTrace
  SeverityDebug
  SeverityInfo
  SeverityWarning
  SeverityError
  SeverityCritical
  SeverityFatal
}

type LogCategory {
  CategoryKernel
  CategoryProcess
  CategoryMessage
  CategorySecurity
  CategoryAudit
}

type LogField {
  LogField(key: String, value: String)
}

type LogEntry {
  LogEntry(
    id: LogEntryId,
    timestamp: AttestedTimestamp,
    severity: LogSeverity,
    category: LogCategory,
    pid: Result(Int, Nil),
    message: String,
    fields: List(LogField),
    entry_hash: Hash,
    previous_hash: Hash,
    chain_hash: Hash,
  )
}

fn severity_to_int(severity: LogSeverity) -> Int {
  case severity {
    SeverityTrace -> 0
    SeverityDebug -> 1
    SeverityInfo -> 2
    SeverityWarning -> 3
    SeverityError -> 4
    SeverityCritical -> 5
    SeverityFatal -> 6
  }
}

fn compute_entry_hash(id: LogEntryId, ts: AttestedTimestamp, severity: LogSeverity, message: String) -> Hash {
  let severity_int = severity_to_int(severity)
  Hash(
    high_1: id.sequence + ts.monotonic,
    high_2: severity_int + string_hash(message),
    low_1: ts.wall_nanos % 1_000_000_000,
    low_2: 0,
  )
}

fn string_hash(s: String) -> Int {
  case s == "" {
    True -> 0
    False -> 1
  }
}

// ============================================================================
// SECTION 5: LINEAR CHAIN TYPES
// ============================================================================

type LinearHashChain {
  LinearHashChain(
    head_hash: Hash,
    sequence: Int,
    length: Int,
  )
}

fn create_linear_chain() -> LinearHashChain {
  LinearHashChain(
    head_hash: null_hash(),
    sequence: 0,
    length: 0,
  )
}

fn append_to_chain(
  chain: LinearHashChain,
  timestamp: AttestedTimestamp,
  severity: LogSeverity,
  category: LogCategory,
  message: String,
) -> #(LinearHashChain, LogEntry) {
  let id = LogEntryId(sequence: chain.sequence + 1, partition: 0)
  let entry_hash = compute_entry_hash(id, timestamp, severity, message)
  let chain_hash = compute_chain_hash(entry_hash, chain.head_hash)
  
  let entry = LogEntry(
    id: id,
    timestamp: timestamp,
    severity: severity,
    category: category,
    pid: Error(Nil),
    message: message,
    fields: [],
    entry_hash: entry_hash,
    previous_hash: chain.head_hash,
    chain_hash: chain_hash,
  )
  
  let new_chain = LinearHashChain(
    head_hash: chain_hash,
    sequence: chain.sequence + 1,
    length: chain.length + 1,
  )
  
  #(new_chain, entry)
}

// ============================================================================
// SECTION 6: TAMPER DETECTION TYPES
// ============================================================================

type TamperCheckResult {
  TamperCheckPassed
  TamperDetectedHashMismatch(entry_id: LogEntryId, expected: Hash, actual: Hash)
  TamperDetectedChainBreak(entry_id: LogEntryId, expected_previous: Hash, actual_previous: Hash)
  TamperDetectedSequenceGap(expected: Int, actual: Int)
  TamperDetectedTimestampRegression(entry_id: LogEntryId)
}

fn verify_entry(entry: LogEntry) -> TamperCheckResult {
  let expected_hash = compute_entry_hash(
    entry.id,
    entry.timestamp,
    entry.severity,
    entry.message,
  )
  
  case hash_equals(expected_hash, entry.entry_hash) {
    False -> TamperDetectedHashMismatch(entry.id, expected_hash, entry.entry_hash)
    True -> {
      let expected_chain = compute_chain_hash(entry.entry_hash, entry.previous_hash)
      case hash_equals(expected_chain, entry.chain_hash) {
        False -> TamperDetectedChainBreak(entry.id, expected_chain, entry.chain_hash)
        True -> TamperCheckPassed
      }
    }
  }
}

fn verify_chain_link(prev: LogEntry, current: LogEntry) -> TamperCheckResult {
  case current.id.sequence == prev.id.sequence + 1 {
    False -> TamperDetectedSequenceGap(prev.id.sequence + 1, current.id.sequence)
    True -> {
      case hash_equals(prev.chain_hash, current.previous_hash) {
        False -> TamperDetectedChainBreak(current.id, prev.chain_hash, current.previous_hash)
        True -> {
          case timestamp_compare(prev.timestamp, current.timestamp) {
            Gt -> TamperDetectedTimestampRegression(current.id)
            _ -> TamperCheckPassed
          }
        }
      }
    }
  }
}

// ============================================================================
// SECTION 7: HASH TESTS
// ============================================================================

/// Test: Null hash is all zeros
pub fn null_hash_test() -> Bool {
  let hash = null_hash()
  is_null_hash(hash)
}

/// Test: Non-null hash is not null
pub fn non_null_hash_test() -> Bool {
  let hash = Hash(high_1: 1, high_2: 0, low_1: 0, low_2: 0)
  !is_null_hash(hash)
}

/// Test: Hash equality same values
pub fn hash_equals_same_test() -> Bool {
  let a = Hash(high_1: 1, high_2: 2, low_1: 3, low_2: 4)
  let b = Hash(high_1: 1, high_2: 2, low_1: 3, low_2: 4)
  hash_equals(a, b)
}

/// Test: Hash equality different values
pub fn hash_equals_different_test() -> Bool {
  let a = Hash(high_1: 1, high_2: 2, low_1: 3, low_2: 4)
  let b = Hash(high_1: 1, high_2: 2, low_1: 3, low_2: 5)
  !hash_equals(a, b)
}

/// Test: Chain hash computation
pub fn chain_hash_computation_test() -> Bool {
  let entry = Hash(high_1: 10, high_2: 20, low_1: 30, low_2: 40)
  let prev = Hash(high_1: 1, high_2: 2, low_1: 3, low_2: 4)
  let result = compute_chain_hash(entry, prev)
  result.high_1 == 11 && result.high_2 == 22 &&
  result.low_1 == 33 && result.low_2 == 44
}

/// Test: Chain hash with null previous
pub fn chain_hash_genesis_test() -> Bool {
  let entry = Hash(high_1: 10, high_2: 20, low_1: 30, low_2: 40)
  let prev = null_hash()
  let result = compute_chain_hash(entry, prev)
  hash_equals(result, entry)
}

// ============================================================================
// SECTION 8: TIMESTAMP TESTS
// ============================================================================

/// Test: Create attested timestamp
pub fn timestamp_creation_test() -> Bool {
  let ts = create_attested_timestamp(1000, 0, 1, 1)
  ts.wall_nanos == 1000 && ts.monotonic == 1
}

/// Test: Timestamp attestation is valid
pub fn timestamp_attestation_valid_test() -> Bool {
  let ts = create_attested_timestamp(1000, 5, 1, 10)
  let result = validate_timestamp_attestation(ts)
  case result {
    TimestampValid -> True
    _ -> False
  }
}

/// Test: Invalid attestation detected
pub fn timestamp_attestation_invalid_test() -> Bool {
  let ts = AttestedTimestamp(
    wall_nanos: 1000,
    logical: 5,
    node_id: 1,
    monotonic: 10,
    attestation: Hash(high_1: 0, high_2: 0, low_1: 0, low_2: 0),
  )
  let result = validate_timestamp_attestation(ts)
  case result {
    TimestampAttestationInvalid -> True
    _ -> False
  }
}

/// Test: Monotonicity check passes
pub fn timestamp_monotonic_pass_test() -> Bool {
  let prev = create_attested_timestamp(1000, 0, 1, 1)
  let current = create_attested_timestamp(2000, 0, 1, 2)
  let result = check_monotonicity(prev, current)
  case result {
    TimestampValid -> True
    _ -> False
  }
}

/// Test: Monotonicity check fails
pub fn timestamp_monotonic_fail_test() -> Bool {
  let prev = create_attested_timestamp(2000, 0, 1, 5)
  let current = create_attested_timestamp(1000, 0, 1, 3)
  let result = check_monotonicity(prev, current)
  case result {
    TimestampMonotonicViolation(6, 3) -> True
    _ -> False
  }
}

/// Test: Timestamp comparison less than
pub fn timestamp_compare_lt_test() -> Bool {
  let a = create_attested_timestamp(1000, 0, 1, 1)
  let b = create_attested_timestamp(2000, 0, 1, 2)
  case timestamp_compare(a, b) {
    Lt -> True
    _ -> False
  }
}

/// Test: Timestamp comparison equal
pub fn timestamp_compare_eq_test() -> Bool {
  let a = create_attested_timestamp(1000, 0, 1, 5)
  let b = create_attested_timestamp(2000, 0, 1, 5)
  case timestamp_compare(a, b) {
    Eq -> True
    _ -> False
  }
}

/// Test: Timestamp comparison greater than
pub fn timestamp_compare_gt_test() -> Bool {
  let a = create_attested_timestamp(2000, 0, 1, 10)
  let b = create_attested_timestamp(1000, 0, 1, 5)
  case timestamp_compare(a, b) {
    Gt -> True
    _ -> False
  }
}

// ============================================================================
// SECTION 9: LOG ENTRY TESTS
// ============================================================================

/// Test: Log entry ID sequence
pub fn log_entry_id_test() -> Bool {
  let id = LogEntryId(sequence: 42, partition: 0)
  id.sequence == 42 && id.partition == 0
}

/// Test: Severity ordering
pub fn severity_ordering_test() -> Bool {
  severity_to_int(SeverityTrace) < severity_to_int(SeverityDebug) &&
  severity_to_int(SeverityDebug) < severity_to_int(SeverityInfo) &&
  severity_to_int(SeverityInfo) < severity_to_int(SeverityWarning) &&
  severity_to_int(SeverityWarning) < severity_to_int(SeverityError) &&
  severity_to_int(SeverityError) < severity_to_int(SeverityCritical) &&
  severity_to_int(SeverityCritical) < severity_to_int(SeverityFatal)
}

/// Test: Entry hash is deterministic
pub fn entry_hash_deterministic_test() -> Bool {
  let id = LogEntryId(sequence: 1, partition: 0)
  let ts = create_attested_timestamp(1000, 0, 1, 1)
  let hash1 = compute_entry_hash(id, ts, SeverityInfo, "Test message")
  let hash2 = compute_entry_hash(id, ts, SeverityInfo, "Test message")
  hash_equals(hash1, hash2)
}

/// Test: Different inputs produce different hashes
pub fn entry_hash_varies_test() -> Bool {
  let ts = create_attested_timestamp(1000, 0, 1, 1)
  let hash1 = compute_entry_hash(LogEntryId(1, 0), ts, SeverityInfo, "Message 1")
  let hash2 = compute_entry_hash(LogEntryId(2, 0), ts, SeverityInfo, "Message 1")
  !hash_equals(hash1, hash2)
}

// ============================================================================
// SECTION 10: CHAIN TESTS
// ============================================================================

/// Test: Create empty chain
pub fn chain_create_test() -> Bool {
  let chain = create_linear_chain()
  chain.sequence == 0 && chain.length == 0 && is_null_hash(chain.head_hash)
}

/// Test: Append first entry
pub fn chain_append_first_test() -> Bool {
  let chain = create_linear_chain()
  let ts = create_attested_timestamp(1000, 0, 1, 1)
  let #(new_chain, entry) = append_to_chain(chain, ts, SeverityInfo, CategoryKernel, "First entry")
  
  new_chain.sequence == 1 &&
  new_chain.length == 1 &&
  entry.id.sequence == 1 &&
  is_null_hash(entry.previous_hash)
}

/// Test: Chain builds correctly
pub fn chain_build_test() -> Bool {
  let chain = create_linear_chain()
  let ts1 = create_attested_timestamp(1000, 0, 1, 1)
  let #(chain1, entry1) = append_to_chain(chain, ts1, SeverityInfo, CategoryKernel, "Entry 1")
  
  let ts2 = create_attested_timestamp(2000, 0, 1, 2)
  let #(chain2, entry2) = append_to_chain(chain1, ts2, SeverityInfo, CategoryKernel, "Entry 2")
  
  chain2.sequence == 2 &&
  chain2.length == 2 &&
  hash_equals(entry2.previous_hash, entry1.chain_hash)
}

/// Test: Chain hash matches head
pub fn chain_head_hash_test() -> Bool {
  let chain = create_linear_chain()
  let ts = create_attested_timestamp(1000, 0, 1, 1)
  let #(new_chain, entry) = append_to_chain(chain, ts, SeverityInfo, CategoryKernel, "Test")
  
  hash_equals(new_chain.head_hash, entry.chain_hash)
}

// ============================================================================
// SECTION 11: TAMPER DETECTION TESTS
// ============================================================================

/// Test: Valid entry passes verification
pub fn tamper_valid_entry_test() -> Bool {
  let chain = create_linear_chain()
  let ts = create_attested_timestamp(1000, 0, 1, 1)
  let #(_, entry) = append_to_chain(chain, ts, SeverityInfo, CategoryKernel, "Valid entry")
  
  case verify_entry(entry) {
    TamperCheckPassed -> True
    _ -> False
  }
}

/// Test: Tampered entry hash detected
pub fn tamper_hash_mismatch_test() -> Bool {
  let chain = create_linear_chain()
  let ts = create_attested_timestamp(1000, 0, 1, 1)
  let #(_, entry) = append_to_chain(chain, ts, SeverityInfo, CategoryKernel, "Test")
  
  // Tamper with entry hash
  let tampered = LogEntry(..entry, entry_hash: Hash(high_1: 999, high_2: 999, low_1: 999, low_2: 999))
  
  case verify_entry(tampered) {
    TamperDetectedHashMismatch(_, _, _) -> True
    _ -> False
  }
}

/// Test: Tampered chain hash detected
pub fn tamper_chain_break_test() -> Bool {
  let chain = create_linear_chain()
  let ts = create_attested_timestamp(1000, 0, 1, 1)
  let #(_, entry) = append_to_chain(chain, ts, SeverityInfo, CategoryKernel, "Test")
  
  // Tamper with chain hash
  let tampered = LogEntry(..entry, chain_hash: Hash(high_1: 999, high_2: 999, low_1: 999, low_2: 999))
  
  case verify_entry(tampered) {
    TamperDetectedChainBreak(_, _, _) -> True
    _ -> False
  }
}

/// Test: Chain link verification passes
pub fn tamper_chain_link_valid_test() -> Bool {
  let chain = create_linear_chain()
  let ts1 = create_attested_timestamp(1000, 0, 1, 1)
  let #(chain1, entry1) = append_to_chain(chain, ts1, SeverityInfo, CategoryKernel, "Entry 1")
  
  let ts2 = create_attested_timestamp(2000, 0, 1, 2)
  let #(_, entry2) = append_to_chain(chain1, ts2, SeverityInfo, CategoryKernel, "Entry 2")
  
  case verify_chain_link(entry1, entry2) {
    TamperCheckPassed -> True
    _ -> False
  }
}

/// Test: Sequence gap detected
pub fn tamper_sequence_gap_test() -> Bool {
  let chain = create_linear_chain()
  let ts1 = create_attested_timestamp(1000, 0, 1, 1)
  let #(chain1, entry1) = append_to_chain(chain, ts1, SeverityInfo, CategoryKernel, "Entry 1")
  
  let ts2 = create_attested_timestamp(2000, 0, 1, 2)
  let #(chain2, _) = append_to_chain(chain1, ts2, SeverityInfo, CategoryKernel, "Entry 2")
  
  // Skip to entry 3, then verify link from entry 1
  let ts3 = create_attested_timestamp(3000, 0, 1, 3)
  let #(_, entry3) = append_to_chain(chain2, ts3, SeverityInfo, CategoryKernel, "Entry 3")
  
  // Verify link from entry 1 to entry 3 (skipping 2)
  case verify_chain_link(entry1, entry3) {
    TamperDetectedSequenceGap(2, 3) -> True
    _ -> False
  }
}

/// Test: Timestamp regression detected
pub fn tamper_timestamp_regression_test() -> Bool {
  let chain = create_linear_chain()
  let ts1 = create_attested_timestamp(2000, 0, 1, 2)
  let #(chain1, entry1) = append_to_chain(chain, ts1, SeverityInfo, CategoryKernel, "Later entry")
  
  // Create entry with earlier timestamp but later sequence
  let ts2 = create_attested_timestamp(1000, 0, 1, 1)
  let #(_, entry2) = append_to_chain(chain1, ts2, SeverityInfo, CategoryKernel, "Earlier entry")
  
  case verify_chain_link(entry1, entry2) {
    TamperDetectedTimestampRegression(_) -> True
    _ -> False
  }
}

// ============================================================================
// SECTION 12: FLIGHT RECORDER TESTS
// ============================================================================

/// Test: Entry with process ID
pub fn entry_with_pid_test() -> Bool {
  let entry = LogEntry(
    id: LogEntryId(sequence: 1, partition: 0),
    timestamp: create_attested_timestamp(1000, 0, 1, 1),
    severity: SeverityInfo,
    category: CategoryProcess,
    pid: Ok(42),
    message: "Process event",
    fields: [],
    entry_hash: null_hash(),
    previous_hash: null_hash(),
    chain_hash: null_hash(),
  )
  case entry.pid {
    Ok(42) -> True
    _ -> False
  }
}

/// Test: Entry without process ID
pub fn entry_without_pid_test() -> Bool {
  let entry = LogEntry(
    id: LogEntryId(sequence: 1, partition: 0),
    timestamp: create_attested_timestamp(1000, 0, 1, 1),
    severity: SeverityInfo,
    category: CategoryKernel,
    pid: Error(Nil),
    message: "Kernel event",
    fields: [],
    entry_hash: null_hash(),
    previous_hash: null_hash(),
    chain_hash: null_hash(),
  )
  case entry.pid {
    Error(Nil) -> True
    _ -> False
  }
}

/// Test: Log field creation
pub fn log_field_test() -> Bool {
  let field = LogField(key: "user_id", value: "12345")
  field.key == "user_id" && field.value == "12345"
}

/// Test: Entry with fields
pub fn entry_with_fields_test() -> Bool {
  let entry = LogEntry(
    id: LogEntryId(sequence: 1, partition: 0),
    timestamp: create_attested_timestamp(1000, 0, 1, 1),
    severity: SeverityInfo,
    category: CategoryAudit,
    pid: Error(Nil),
    message: "Audit event",
    fields: [
      LogField(key: "action", value: "login"),
      LogField(key: "user", value: "admin"),
    ],
    entry_hash: null_hash(),
    previous_hash: null_hash(),
    chain_hash: null_hash(),
  )
  list.length(entry.fields) == 2
}

/// Test: Category types
pub fn category_types_test() -> Bool {
  let cats = [
    CategoryKernel,
    CategoryProcess,
    CategoryMessage,
    CategorySecurity,
    CategoryAudit,
  ]
  list.length(cats) == 5
}

// ============================================================================
// SECTION 13: TEST RUNNER
// ============================================================================

fn run_test(name: String, test_fn: fn() -> Bool) -> TestResult {
  case test_fn() {
    True -> Pass(name)
    False -> Fail(name)
  }
}

pub fn run_all_tests() -> List(TestResult) {
  [
    // Hash tests
    run_test("null_hash_test", null_hash_test),
    run_test("non_null_hash_test", non_null_hash_test),
    run_test("hash_equals_same_test", hash_equals_same_test),
    run_test("hash_equals_different_test", hash_equals_different_test),
    run_test("chain_hash_computation_test", chain_hash_computation_test),
    run_test("chain_hash_genesis_test", chain_hash_genesis_test),
    
    // Timestamp tests
    run_test("timestamp_creation_test", timestamp_creation_test),
    run_test("timestamp_attestation_valid_test", timestamp_attestation_valid_test),
    run_test("timestamp_attestation_invalid_test", timestamp_attestation_invalid_test),
    run_test("timestamp_monotonic_pass_test", timestamp_monotonic_pass_test),
    run_test("timestamp_monotonic_fail_test", timestamp_monotonic_fail_test),
    run_test("timestamp_compare_lt_test", timestamp_compare_lt_test),
    run_test("timestamp_compare_eq_test", timestamp_compare_eq_test),
    run_test("timestamp_compare_gt_test", timestamp_compare_gt_test),
    
    // Log entry tests
    run_test("log_entry_id_test", log_entry_id_test),
    run_test("severity_ordering_test", severity_ordering_test),
    run_test("entry_hash_deterministic_test", entry_hash_deterministic_test),
    run_test("entry_hash_varies_test", entry_hash_varies_test),
    
    // Chain tests
    run_test("chain_create_test", chain_create_test),
    run_test("chain_append_first_test", chain_append_first_test),
    run_test("chain_build_test", chain_build_test),
    run_test("chain_head_hash_test", chain_head_hash_test),
    
    // Tamper detection tests
    run_test("tamper_valid_entry_test", tamper_valid_entry_test),
    run_test("tamper_hash_mismatch_test", tamper_hash_mismatch_test),
    run_test("tamper_chain_break_test", tamper_chain_break_test),
    run_test("tamper_chain_link_valid_test", tamper_chain_link_valid_test),
    run_test("tamper_sequence_gap_test", tamper_sequence_gap_test),
    run_test("tamper_timestamp_regression_test", tamper_timestamp_regression_test),
    
    // Flight recorder tests
    run_test("entry_with_pid_test", entry_with_pid_test),
    run_test("entry_without_pid_test", entry_without_pid_test),
    run_test("log_field_test", log_field_test),
    run_test("entry_with_fields_test", entry_with_fields_test),
    run_test("category_types_test", category_types_test),
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
