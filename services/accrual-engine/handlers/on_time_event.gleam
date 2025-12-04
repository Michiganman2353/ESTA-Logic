//// services/accrual-engine/handlers/on_time_event.gleam
////
//// Handler for time-based accrual events
////
//// Version: 1.0.0

/// Time event payload
pub type TimeEvent {
  TimeEvent(
    timestamp_ns: Int,
    event_type: TimeEventType,
  )
}

/// Time event types
pub type TimeEventType {
  DayEnd
  WeekEnd
  MonthEnd
  PayPeriodEnd
}

/// Handle a time event
pub fn handle(_event: TimeEvent) -> Result(Nil, String) {
  Ok(Nil)
}
