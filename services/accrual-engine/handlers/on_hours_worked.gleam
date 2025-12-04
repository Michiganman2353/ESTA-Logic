//// services/accrual-engine/handlers/on_hours_worked.gleam
////
//// Handler for hours worked events
////
//// Version: 1.0.0

/// Hours worked event payload
pub type HoursWorkedEvent {
  HoursWorkedEvent(
    employee_id: String,
    hours: Float,
    date: String,
    pay_period: String,
  )
}

/// Handle hours worked event
pub fn handle(_event: HoursWorkedEvent) -> Result(Nil, String) {
  Ok(Nil)
}
