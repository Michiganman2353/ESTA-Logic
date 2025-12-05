/// Test suite for ESTA-Logic Gleam Microkernel
/// 
/// Run with `gleam test` – pure assertions for immutable accrual logic

import gleeunit
import gleeunit/should
import kernel.{AccrualResult}

pub fn main() {
  gleeunit.main()
}

/// Test version string
pub fn version_test() {
  kernel.version()
  |> should.equal("ESTA-Logic Gleam Microkernel v0.1.0")
}

/// Test basic accrual calculation: 70 hours = 2 hours accrued (70 / 35)
pub fn compute_accrual_70_hours_test() {
  kernel.compute_accrual(70)
  |> should.equal(2)
}

/// Test basic accrual calculation: 35 hours = 1 hour accrued
pub fn compute_accrual_35_hours_test() {
  kernel.compute_accrual(35)
  |> should.equal(1)
}

/// Test edge case: 34 hours = 0 hours accrued (not enough)
pub fn compute_accrual_34_hours_test() {
  kernel.compute_accrual(34)
  |> should.equal(0)
}

/// Test edge case: 0 hours = 0 hours accrued
pub fn compute_accrual_zero_test() {
  kernel.compute_accrual(0)
  |> should.equal(0)
}

/// Test employer cap for small employer (<=10)
pub fn employer_cap_small_test() {
  kernel.employer_cap(10)
  |> should.equal(40.0)

  kernel.employer_cap(5)
  |> should.equal(40.0)
}

/// Test employer cap for large employer (>10)
pub fn employer_cap_large_test() {
  kernel.employer_cap(11)
  |> should.equal(72.0)

  kernel.employer_cap(100)
  |> should.equal(72.0)
}

/// Test accrual with cap - under cap
pub fn calculate_with_cap_under_cap_test() {
  let result = kernel.calculate_with_cap(350.0, 15)
  
  // 350 / 35 = 10 hours accrued
  result.hours_accrued
  |> should.equal(10.0)
  
  // Large employer = 72 hour cap
  result.cap
  |> should.equal(72.0)
  
  // Under cap, so total = accrued
  result.total
  |> should.equal(10.0)
}

/// Test accrual with cap - at cap limit
pub fn calculate_with_cap_at_limit_test() {
  // 2520 / 35 = 72 exactly (at large employer cap)
  let result = kernel.calculate_with_cap(2520.0, 11)
  
  result.hours_accrued
  |> should.equal(72.0)
  
  result.total
  |> should.equal(72.0)
}

/// Test accrual with cap - exceeds cap
pub fn calculate_with_cap_exceeds_cap_test() {
  // 1750 / 35 = 50 hours, but small employer cap is 40
  let result = kernel.calculate_with_cap(1750.0, 5)
  
  result.hours_accrued
  |> should.equal(50.0)
  
  result.cap
  |> should.equal(40.0)
  
  // Should be capped at 40
  result.total
  |> should.equal(40.0)
}
