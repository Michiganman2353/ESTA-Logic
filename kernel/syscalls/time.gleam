//// kernel/syscalls/time.gleam
////
//// ESTA Logic Time Syscalls
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

/// Timer identifier
pub type TimerId {
  TimerId(value: Int)
}

/// Time source
pub type TimeSource {
  Monotonic
  Realtime
  ProcessCpu
}

/// Get current time in nanoseconds
pub fn get_time(_source: TimeSource) -> Int {
  0
}

/// Sleep for specified duration
pub fn sleep(_duration_ns: Int) -> Result(Nil, String) {
  Ok(Nil)
}

/// Create a timer
pub fn create_timer(
  _interval_ns: Int,
  _repeat: Bool,
) -> Result(TimerId, String) {
  Ok(TimerId(1))
}

/// Cancel a timer
pub fn cancel_timer(_timer_id: TimerId) -> Result(Nil, String) {
  Ok(Nil)
}

/// Get timer remaining time
pub fn timer_remaining(_timer_id: TimerId) -> Result(Int, String) {
  Ok(0)
}
