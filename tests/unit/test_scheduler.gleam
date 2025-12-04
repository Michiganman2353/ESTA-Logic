//// tests/unit/test_scheduler.gleam
////
//// Unit Test: Scheduler
////
//// Version: 1.0.0

import gleeunit/should

/// Test scheduler creation
pub fn test_scheduler_creation() {
  let scheduler = create_scheduler()
  should.equal(scheduler.process_count, 0)
}

/// Test process addition
pub fn test_add_process() {
  let scheduler = create_scheduler()
  let scheduler = add_process(scheduler, 1, Normal)
  should.equal(scheduler.process_count, 1)
}

/// Test priority ordering
pub fn test_priority_ordering() {
  let scheduler = create_scheduler()
  let scheduler = add_process(scheduler, 1, Low)
  let scheduler = add_process(scheduler, 2, High)
  let next = get_next_process(scheduler)
  should.equal(next, Ok(2))
}

/// Priority levels
pub type Priority {
  Low
  Normal
  High
  System
}

/// Scheduler state
pub type Scheduler {
  Scheduler(process_count: Int, processes: List(#(Int, Priority)))
}

fn create_scheduler() -> Scheduler {
  Scheduler(process_count: 0, processes: [])
}

fn add_process(scheduler: Scheduler, pid: Int, priority: Priority) -> Scheduler {
  Scheduler(
    process_count: scheduler.process_count + 1,
    processes: [#(pid, priority), ..scheduler.processes],
  )
}

fn get_next_process(scheduler: Scheduler) -> Result(Int, Nil) {
  find_highest_priority(scheduler.processes)
}

fn find_highest_priority(processes: List(#(Int, Priority))) -> Result(Int, Nil) {
  case processes {
    [] -> Error(Nil)
    [#(pid, _)] -> Ok(pid)
    [#(pid1, p1), #(pid2, p2), ..rest] ->
      case priority_gt(p1, p2) {
        True -> find_highest_priority([#(pid1, p1), ..rest])
        False -> find_highest_priority([#(pid2, p2), ..rest])
      }
  }
}

fn priority_gt(a: Priority, b: Priority) -> Bool {
  priority_to_int(a) > priority_to_int(b)
}

fn priority_to_int(p: Priority) -> Int {
  case p {
    Low -> 0
    Normal -> 1
    High -> 2
    System -> 3
  }
}
