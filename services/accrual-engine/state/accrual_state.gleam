//// services/accrual-engine/state/accrual_state.gleam
////
//// Accrual Engine State Management
////
//// Version: 1.0.0

/// Accrual record
pub type AccrualRecord {
  AccrualRecord(
    employee_id: String,
    hours_accrued: Float,
    hours_used: Float,
    hours_available: Float,
    carryover: Float,
    year: Int,
  )
}

/// Accrual state
pub type AccrualState {
  AccrualState(
    records: List(AccrualRecord),
    last_updated_ns: Int,
  )
}

/// Create new state
pub fn new() -> AccrualState {
  AccrualState(records: [], last_updated_ns: 0)
}

/// Get accrual for employee
pub fn get_for_employee(
  state: AccrualState,
  employee_id: String,
) -> Result(AccrualRecord, Nil) {
  find_record(state.records, employee_id)
}

fn find_record(
  records: List(AccrualRecord),
  employee_id: String,
) -> Result(AccrualRecord, Nil) {
  case records {
    [] -> Error(Nil)
    [r, ..rest] ->
      case r.employee_id == employee_id {
        True -> Ok(r)
        False -> find_record(rest, employee_id)
      }
  }
}
