//// services/accrual-engine/handlers/on_policy_change.gleam
////
//// Handler for policy change events
////
//// Version: 1.0.0

/// Policy change event payload
pub type PolicyChangeEvent {
  PolicyChangeEvent(
    employer_id: String,
    old_policy: String,
    new_policy: String,
    effective_date: String,
  )
}

/// Handle policy change event
pub fn handle(_event: PolicyChangeEvent) -> Result(Nil, String) {
  Ok(Nil)
}
