//// kernel/drivers/clock_driver.gleam
////
//// ESTA Logic Clock Driver
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

/// Clock source
pub type ClockSource {
  SystemClock
  MonotonicClock
  HighResolutionClock
}

/// Time value
pub type TimeValue {
  TimeValue(
    seconds: Int,
    nanoseconds: Int,
  )
}

/// Get current time from a clock source
pub fn now(_source: ClockSource) -> TimeValue {
  TimeValue(seconds: 0, nanoseconds: 0)
}

/// Get monotonic time in nanoseconds
pub fn monotonic_ns() -> Int {
  0
}

/// Get system time in nanoseconds since epoch
pub fn system_ns() -> Int {
  0
}

/// Calculate duration between two time values
pub fn duration(start: TimeValue, end: TimeValue) -> TimeValue {
  let total_start = start.seconds * 1_000_000_000 + start.nanoseconds
  let total_end = end.seconds * 1_000_000_000 + end.nanoseconds
  let diff = total_end - total_start
  TimeValue(seconds: diff / 1_000_000_000, nanoseconds: diff % 1_000_000_000)
}

/// Convert TimeValue to nanoseconds
pub fn to_nanos(time: TimeValue) -> Int {
  time.seconds * 1_000_000_000 + time.nanoseconds
}

/// Convert nanoseconds to TimeValue
pub fn from_nanos(nanos: Int) -> TimeValue {
  TimeValue(seconds: nanos / 1_000_000_000, nanoseconds: nanos % 1_000_000_000)
}
