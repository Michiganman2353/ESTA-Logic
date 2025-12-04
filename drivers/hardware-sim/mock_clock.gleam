//// drivers/hardware-sim/mock_clock.gleam
////
//// Mock Clock for Testing
////
//// Version: 1.0.0

/// Mock clock state
pub type MockClock {
  MockClock(
    current_time_ns: Int,
    running: Bool,
    speed_multiplier: Float,
  )
}

/// Create a new mock clock
pub fn new(start_time_ns: Int) -> MockClock {
  MockClock(
    current_time_ns: start_time_ns,
    running: False,
    speed_multiplier: 1.0,
  )
}

/// Get current time
pub fn now(clock: MockClock) -> Int {
  clock.current_time_ns
}

/// Advance time by specified nanoseconds
pub fn advance(clock: MockClock, nanos: Int) -> MockClock {
  MockClock(..clock, current_time_ns: clock.current_time_ns + nanos)
}

/// Set time to specific value
pub fn set_time(clock: MockClock, time_ns: Int) -> MockClock {
  MockClock(..clock, current_time_ns: time_ns)
}

/// Start the clock
pub fn start(clock: MockClock) -> MockClock {
  MockClock(..clock, running: True)
}

/// Stop the clock
pub fn stop(clock: MockClock) -> MockClock {
  MockClock(..clock, running: False)
}

/// Set speed multiplier (2.0 = 2x speed)
pub fn set_speed(clock: MockClock, multiplier: Float) -> MockClock {
  MockClock(..clock, speed_multiplier: multiplier)
}
