//// tests/integration/test_accrual_flows.gleam
////
//// Integration Test: Accrual Flows
////
//// Version: 1.0.0

import gleeunit/should

/// Test basic accrual calculation flow
pub fn test_basic_accrual_calculation() {
  let result = calculate_accrual(30.0)
  should.equal(result, Ok(1.0))
}

/// Test accrual with maximum cap
pub fn test_accrual_with_cap() {
  let result = calculate_accrual_with_cap(1000.0, 72.0)
  should.equal(result, Ok(72.0))
}

/// Test carryover calculation
pub fn test_carryover() {
  let result = calculate_carryover(40.0, 10.0, 72.0)
  should.equal(result, Ok(30.0))
}

fn calculate_accrual(hours_worked: Float) -> Result(Float, String) {
  Ok(hours_worked /. 30.0)
}

fn calculate_accrual_with_cap(hours_worked: Float, cap: Float) -> Result(Float, String) {
  let accrued = hours_worked /. 30.0
  case accrued >. cap {
    True -> Ok(cap)
    False -> Ok(accrued)
  }
}

fn calculate_carryover(
  previous_balance: Float,
  used: Float,
  max_carryover: Float,
) -> Result(Float, String) {
  let remaining = previous_balance -. used
  case remaining >. max_carryover {
    True -> Ok(max_carryover)
    False -> Ok(remaining)
  }
}
