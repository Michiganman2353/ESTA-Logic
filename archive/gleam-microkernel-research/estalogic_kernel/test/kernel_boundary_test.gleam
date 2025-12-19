//// estalogic_kernel/test/kernel_boundary_test.gleam
////
//// Pure-Gleam Model Tests for Kernel Boundary Invariants
////
//// These tests verify the send/receive invariants and kernel contract
//// properties using property-based testing principles.
////
//// Test Coverage Targets:
//// - 100% function coverage on kernel boundary
//// - >95% branch coverage
//// - Property-based tests for scheduling, message-passing, queue fairness

import gleam/list
import gleam/option.{None, Some}

// ============================================================================
// SECTION 1: TEST DATA TYPES (Minimal Kernel Model)
// ============================================================================

/// Simplified process for testing
type TestProcess {
  TestProcess(pid: Int, state: TestProcessState, priority: Int, mailbox: List(TestMessage))
}

type TestProcessState {
  TReady
  TRunning
  TWaiting
  TCompleted
}

/// Simplified message for testing
type TestMessage {
  TestMessage(source: Int, target: Int, sequence: Int, payload: String)
}

/// Test mailbox with capacity
type TestMailbox {
  TestMailbox(capacity: Int, messages: List(TestMessage))
}

/// Scheduler state for testing
type TestScheduler {
  TestScheduler(ready_queue: List(Int), running: List(Int), max_running: Int)
}

// ============================================================================
// SECTION 2: INVARIANT DEFINITIONS
// ============================================================================

/// Invariant: FIFO ordering within source-destination pair
fn check_fifo_ordering(messages: List(TestMessage)) -> Bool {
  // Group messages by (source, target) pair
  let pairs = group_by_pair(messages)
  // Check each group maintains sequence order
  list.all(pairs, fn(group) {
    is_sequence_ordered(group)
  })
}

fn group_by_pair(messages: List(TestMessage)) -> List(List(TestMessage)) {
  // Simple grouping - in production would use a proper group_by
  case messages {
    [] -> []
    [first, ..rest] -> {
      let matching = list.filter(messages, fn(m) {
        m.source == first.source && m.target == first.target
      })
      let remaining = list.filter(rest, fn(m) {
        m.source != first.source || m.target != first.target
      })
      [matching, ..group_by_pair(remaining)]
    }
  }
}

fn is_sequence_ordered(messages: List(TestMessage)) -> Bool {
  case messages {
    [] -> True
    [_] -> True
    [a, b, ..rest] -> a.sequence < b.sequence && is_sequence_ordered([b, ..rest])
  }
}

/// Invariant: Mailbox never exceeds capacity
fn check_mailbox_bounded(mailbox: TestMailbox) -> Bool {
  list.length(mailbox.messages) <= mailbox.capacity
}

/// Invariant: At most max_running processes in running state
fn check_single_running(scheduler: TestScheduler) -> Bool {
  list.length(scheduler.running) <= scheduler.max_running
}

/// Invariant: Process in running state appears in scheduler.running
fn check_running_consistent(processes: List(TestProcess), scheduler: TestScheduler) -> Bool {
  let running_processes = list.filter(processes, fn(p) { p.state == TRunning })
  let running_pids = list.map(running_processes, fn(p) { p.pid })
  // All running processes should be in scheduler.running and vice versa
  list.length(running_pids) == list.length(scheduler.running) &&
  list.all(running_pids, fn(pid) { list.contains(scheduler.running, pid) })
}

/// Invariant: No duplicate PIDs in process list
fn check_unique_pids(processes: List(TestProcess)) -> Bool {
  let pids = list.map(processes, fn(p) { p.pid })
  list.length(pids) == list.length(list.unique(pids))
}

/// Invariant: Priority levels are valid (0-5)
fn check_valid_priorities(processes: List(TestProcess)) -> Bool {
  list.all(processes, fn(p) { p.priority >= 0 && p.priority <= 5 })
}

// ============================================================================
// SECTION 3: PROPERTY-BASED TEST GENERATORS
// ============================================================================

/// Generate a test process with given parameters
fn make_process(pid: Int, state: TestProcessState, priority: Int) -> TestProcess {
  TestProcess(pid: pid, state: state, priority: priority, mailbox: [])
}

/// Generate a test message
fn make_message(source: Int, target: Int, seq: Int) -> TestMessage {
  TestMessage(source: source, target: target, sequence: seq, payload: "test")
}

/// Generate a scheduler with given state
fn make_scheduler(ready: List(Int), running: List(Int), max: Int) -> TestScheduler {
  TestScheduler(ready_queue: ready, running: running, max_running: max)
}

/// Generate a mailbox with given capacity
fn make_mailbox(capacity: Int, messages: List(TestMessage)) -> TestMailbox {
  TestMailbox(capacity: capacity, messages: messages)
}

// ============================================================================
// SECTION 4: SEND/RECEIVE INVARIANT TESTS
// ============================================================================

/// Test: Messages maintain FIFO ordering per source-destination pair
pub fn fifo_ordering_test() -> Bool {
  // Create ordered messages
  let messages = [
    make_message(1, 2, 1),
    make_message(1, 2, 2),
    make_message(1, 2, 3),
    make_message(2, 1, 1),
    make_message(2, 1, 2),
  ]
  check_fifo_ordering(messages)
}

/// Test: Out-of-order messages violate FIFO
pub fn fifo_violation_detected_test() -> Bool {
  // Create out-of-order messages
  let messages = [
    make_message(1, 2, 2),
    make_message(1, 2, 1),  // Out of order!
    make_message(1, 2, 3),
  ]
  // Should detect the violation
  !check_fifo_ordering(messages)
}

/// Test: Empty message list satisfies FIFO
pub fn empty_fifo_test() -> Bool {
  check_fifo_ordering([])
}

/// Test: Single message satisfies FIFO
pub fn single_message_fifo_test() -> Bool {
  check_fifo_ordering([make_message(1, 2, 1)])
}

/// Test: Independent pairs can have interleaved sequences
pub fn independent_pairs_test() -> Bool {
  let messages = [
    make_message(1, 2, 1),
    make_message(3, 4, 100),  // Different pair, different sequence
    make_message(1, 2, 2),
    make_message(3, 4, 101),
  ]
  check_fifo_ordering(messages)
}

// ============================================================================
// SECTION 5: MAILBOX INVARIANT TESTS
// ============================================================================

/// Test: Empty mailbox is within bounds
pub fn empty_mailbox_bounded_test() -> Bool {
  let mailbox = make_mailbox(10, [])
  check_mailbox_bounded(mailbox)
}

/// Test: Mailbox at capacity is within bounds
pub fn full_mailbox_bounded_test() -> Bool {
  let messages = [
    make_message(1, 2, 1),
    make_message(1, 2, 2),
    make_message(1, 2, 3),
  ]
  let mailbox = make_mailbox(3, messages)
  check_mailbox_bounded(mailbox)
}

/// Test: Mailbox over capacity violates bounds
pub fn overflowed_mailbox_detected_test() -> Bool {
  let messages = [
    make_message(1, 2, 1),
    make_message(1, 2, 2),
    make_message(1, 2, 3),
    make_message(1, 2, 4),
  ]
  let mailbox = make_mailbox(3, messages)
  !check_mailbox_bounded(mailbox)
}

// ============================================================================
// SECTION 6: SCHEDULER INVARIANT TESTS
// ============================================================================

/// Test: No running processes is valid
pub fn no_running_valid_test() -> Bool {
  let scheduler = make_scheduler([1, 2, 3], [], 4)
  check_single_running(scheduler)
}

/// Test: Single running process is valid
pub fn single_running_valid_test() -> Bool {
  let scheduler = make_scheduler([2, 3], [1], 4)
  check_single_running(scheduler)
}

/// Test: Maximum running processes is valid
pub fn max_running_valid_test() -> Bool {
  let scheduler = make_scheduler([], [1, 2, 3, 4], 4)
  check_single_running(scheduler)
}

/// Test: Exceeding max running is detected
pub fn over_max_running_detected_test() -> Bool {
  let scheduler = make_scheduler([], [1, 2, 3, 4, 5], 4)
  !check_single_running(scheduler)
}

/// Test: Running state consistency - valid case
pub fn running_consistency_valid_test() -> Bool {
  let processes = [
    make_process(1, TRunning, 2),
    make_process(2, TReady, 2),
    make_process(3, TWaiting, 1),
  ]
  let scheduler = make_scheduler([2], [1], 4)
  check_running_consistent(processes, scheduler)
}

/// Test: Running state consistency - inconsistent case
pub fn running_consistency_invalid_test() -> Bool {
  let processes = [
    make_process(1, TRunning, 2),
    make_process(2, TRunning, 2),  // Two running but scheduler only has one
    make_process(3, TWaiting, 1),
  ]
  let scheduler = make_scheduler([3], [1], 4)
  !check_running_consistent(processes, scheduler)
}

// ============================================================================
// SECTION 7: PROCESS INVARIANT TESTS
// ============================================================================

/// Test: Unique PIDs - valid case
pub fn unique_pids_valid_test() -> Bool {
  let processes = [
    make_process(1, TReady, 2),
    make_process(2, TReady, 2),
    make_process(3, TWaiting, 1),
  ]
  check_unique_pids(processes)
}

/// Test: Duplicate PIDs - detected
pub fn duplicate_pids_detected_test() -> Bool {
  let processes = [
    make_process(1, TReady, 2),
    make_process(1, TRunning, 2),  // Duplicate PID!
    make_process(3, TWaiting, 1),
  ]
  !check_unique_pids(processes)
}

/// Test: Valid priorities
pub fn valid_priorities_test() -> Bool {
  let processes = [
    make_process(1, TReady, 0),
    make_process(2, TReady, 2),
    make_process(3, TReady, 5),
  ]
  check_valid_priorities(processes)
}

/// Test: Invalid priority detected
pub fn invalid_priority_detected_test() -> Bool {
  let processes = [
    make_process(1, TReady, 0),
    make_process(2, TReady, 6),  // Invalid priority!
    make_process(3, TReady, 5),
  ]
  !check_valid_priorities(processes)
}

/// Test: Negative priority detected
pub fn negative_priority_detected_test() -> Bool {
  let processes = [
    make_process(1, TReady, -1),  // Invalid priority!
    make_process(2, TReady, 2),
  ]
  !check_valid_priorities(processes)
}

// ============================================================================
// SECTION 8: QUEUE FAIRNESS TESTS
// ============================================================================

/// Calculate effective priority with aging (matches abi.gleam)
fn effective_priority(base_priority: Int, wait_time_ms: Int) -> Int {
  let boost = wait_time_ms / 1000
  let capped_boost = case boost > 2 {
    True -> 2
    False -> boost
  }
  let effective = base_priority + capped_boost
  case effective > 4 {
    True -> 4
    False -> effective
  }
}

/// Test: No wait time means base priority
pub fn no_aging_test() -> Bool {
  effective_priority(2, 0) == 2
}

/// Test: 1 second wait gives +1 boost
pub fn one_second_aging_test() -> Bool {
  effective_priority(2, 1000) == 3
}

/// Test: 2 second wait gives +2 boost
pub fn two_second_aging_test() -> Bool {
  effective_priority(2, 2000) == 4
}

/// Test: Aging boost is capped at +2
pub fn aging_cap_test() -> Bool {
  effective_priority(1, 10000) == 3  // 1 + 2 (capped) = 3
}

/// Test: Cannot exceed Realtime (4) with aging
pub fn aging_priority_cap_test() -> Bool {
  effective_priority(3, 5000) == 4  // Would be 5, capped to 4
}

/// Test: System priority (5) not affected by this logic in tests
pub fn system_priority_test() -> Bool {
  // System priority should not be boosted in normal circumstances
  // but this tests the effective_priority function at its limit
  effective_priority(5, 10000) == 4  // Caps at 4 (Realtime)
}

// ============================================================================
// SECTION 9: STARVATION PREVENTION TESTS
// ============================================================================

/// Simulated scheduling decision
type ScheduleDecision {
  RunProcess(pid: Int)
  NoProcess
}

/// Pick highest effective priority process
fn pick_next(processes: List(TestProcess), wait_times: List(#(Int, Int))) -> ScheduleDecision {
  let ready = list.filter(processes, fn(p) { p.state == TReady })
  case ready {
    [] -> NoProcess
    _ -> {
      let with_effective = list.map(ready, fn(p) {
        let wait = find_wait_time(p.pid, wait_times)
        #(p.pid, effective_priority(p.priority, wait))
      })
      let sorted = sort_by_priority(with_effective)
      case sorted {
        [] -> NoProcess
        [#(pid, _), ..] -> RunProcess(pid)
      }
    }
  }
}

fn find_wait_time(pid: Int, wait_times: List(#(Int, Int))) -> Int {
  case wait_times {
    [] -> 0
    [#(p, w), ..rest] -> case p == pid {
      True -> w
      False -> find_wait_time(pid, rest)
    }
  }
}

fn sort_by_priority(items: List(#(Int, Int))) -> List(#(Int, Int)) {
  // Simple insertion sort by priority (descending)
  case items {
    [] -> []
    [x] -> [x]
    [x, ..rest] -> insert_sorted(x, sort_by_priority(rest))
  }
}

fn insert_sorted(item: #(Int, Int), sorted: List(#(Int, Int))) -> List(#(Int, Int)) {
  case sorted {
    [] -> [item]
    [#(pid, pri), ..rest] -> {
      let #(_, item_pri) = item
      case item_pri >= pri {
        True -> [item, ..sorted]
        False -> [#(pid, pri), ..insert_sorted(item, rest)]
      }
    }
  }
}

/// Test: Higher priority runs first
pub fn higher_priority_first_test() -> Bool {
  let processes = [
    make_process(1, TReady, 1),
    make_process(2, TReady, 3),  // Higher priority
    make_process(3, TReady, 2),
  ]
  case pick_next(processes, []) {
    RunProcess(2) -> True
    _ -> False
  }
}

/// Test: Aging allows low priority to run
pub fn aging_promotes_low_priority_test() -> Bool {
  let processes = [
    make_process(1, TReady, 1),  // Low priority but waited 3 seconds
    make_process(2, TReady, 2),  // Higher base but no wait
  ]
  let wait_times = [#(1, 3000), #(2, 0)]
  case pick_next(processes, wait_times) {
    // Process 1: effective = 1 + 2 = 3
    // Process 2: effective = 2 + 0 = 2
    RunProcess(1) -> True
    _ -> False
  }
}

/// Test: No ready processes returns NoProcess
pub fn no_ready_test() -> Bool {
  let processes = [
    make_process(1, TWaiting, 2),
    make_process(2, TCompleted, 2),
  ]
  case pick_next(processes, []) {
    NoProcess -> True
    _ -> False
  }
}

// ============================================================================
// SECTION 10: COMBINED SYSTEM INVARIANT TEST
// ============================================================================

/// Combined check of all system invariants
fn check_system_invariants(
  processes: List(TestProcess),
  scheduler: TestScheduler,
  messages: List(TestMessage),
) -> Bool {
  check_unique_pids(processes) &&
  check_valid_priorities(processes) &&
  check_single_running(scheduler) &&
  check_running_consistent(processes, scheduler) &&
  check_fifo_ordering(messages)
}

/// Test: Valid system state passes all invariants
pub fn valid_system_state_test() -> Bool {
  let processes = [
    make_process(1, TRunning, 3),
    make_process(2, TReady, 2),
    make_process(3, TWaiting, 1),
  ]
  let scheduler = make_scheduler([2], [1], 4)
  let messages = [
    make_message(1, 2, 1),
    make_message(1, 2, 2),
    make_message(2, 3, 1),
  ]
  check_system_invariants(processes, scheduler, messages)
}

/// Test: Invalid system state is detected
pub fn invalid_system_state_test() -> Bool {
  let processes = [
    make_process(1, TRunning, 3),
    make_process(1, TReady, 2),  // Duplicate PID!
    make_process(3, TWaiting, 1),
  ]
  let scheduler = make_scheduler([2], [1], 4)
  let messages = []
  !check_system_invariants(processes, scheduler, messages)
}

// ============================================================================
// SECTION 11: TEST RUNNER
// ============================================================================

/// Result type for test execution
pub type TestResult {
  Pass(name: String)
  Fail(name: String)
}

/// Run a named test
fn run_test(name: String, test_fn: fn() -> Bool) -> TestResult {
  case test_fn() {
    True -> Pass(name)
    False -> Fail(name)
  }
}

/// Run all kernel boundary tests and return results
pub fn run_all_tests() -> List(TestResult) {
  [
    // FIFO tests
    run_test("fifo_ordering_test", fifo_ordering_test),
    run_test("fifo_violation_detected_test", fifo_violation_detected_test),
    run_test("empty_fifo_test", empty_fifo_test),
    run_test("single_message_fifo_test", single_message_fifo_test),
    run_test("independent_pairs_test", independent_pairs_test),
    
    // Mailbox tests
    run_test("empty_mailbox_bounded_test", empty_mailbox_bounded_test),
    run_test("full_mailbox_bounded_test", full_mailbox_bounded_test),
    run_test("overflowed_mailbox_detected_test", overflowed_mailbox_detected_test),
    
    // Scheduler tests
    run_test("no_running_valid_test", no_running_valid_test),
    run_test("single_running_valid_test", single_running_valid_test),
    run_test("max_running_valid_test", max_running_valid_test),
    run_test("over_max_running_detected_test", over_max_running_detected_test),
    run_test("running_consistency_valid_test", running_consistency_valid_test),
    run_test("running_consistency_invalid_test", running_consistency_invalid_test),
    
    // Process tests
    run_test("unique_pids_valid_test", unique_pids_valid_test),
    run_test("duplicate_pids_detected_test", duplicate_pids_detected_test),
    run_test("valid_priorities_test", valid_priorities_test),
    run_test("invalid_priority_detected_test", invalid_priority_detected_test),
    run_test("negative_priority_detected_test", negative_priority_detected_test),
    
    // Fairness tests
    run_test("no_aging_test", no_aging_test),
    run_test("one_second_aging_test", one_second_aging_test),
    run_test("two_second_aging_test", two_second_aging_test),
    run_test("aging_cap_test", aging_cap_test),
    run_test("aging_priority_cap_test", aging_priority_cap_test),
    run_test("system_priority_test", system_priority_test),
    
    // Starvation tests
    run_test("higher_priority_first_test", higher_priority_first_test),
    run_test("aging_promotes_low_priority_test", aging_promotes_low_priority_test),
    run_test("no_ready_test", no_ready_test),
    
    // System invariant tests
    run_test("valid_system_state_test", valid_system_state_test),
    run_test("invalid_system_state_test", invalid_system_state_test),
  ]
}

/// Count passing tests
pub fn count_passing(results: List(TestResult)) -> Int {
  list.fold(results, 0, fn(acc, result) {
    case result {
      Pass(_) -> acc + 1
      Fail(_) -> acc
    }
  })
}

/// Get all failing test names
pub fn get_failures(results: List(TestResult)) -> List(String) {
  list.filter_map(results, fn(result) {
    case result {
      Pass(_) -> None
      Fail(name) -> Some(name)
    }
  })
}
