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

/// Test basic accrual calculation: 60 hours = 2 hours accrued (60 / 30)
pub fn compute_accrual_60_hours_test() {
  kernel.compute_accrual(60)
  |> should.equal(2)
}

/// Test basic accrual calculation: 30 hours = 1 hour accrued
pub fn compute_accrual_30_hours_test() {
  kernel.compute_accrual(30)
  |> should.equal(1)
}

/// Test edge case: 29 hours = 0 hours accrued (not enough)
pub fn compute_accrual_29_hours_test() {
  kernel.compute_accrual(29)
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
  let result = kernel.calculate_with_cap(300.0, 15)
  
  // 300 / 30 = 10 hours accrued
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
  // 2160 / 30 = 72 exactly (at large employer cap)
  let result = kernel.calculate_with_cap(2160.0, 11)
  
  result.hours_accrued
  |> should.equal(72.0)
  
  result.total
  |> should.equal(72.0)
}

/// Test accrual with cap - exceeds cap
pub fn calculate_with_cap_exceeds_cap_test() {
  // 1500 / 30 = 50 hours, but small employer cap is 40
  let result = kernel.calculate_with_cap(1500.0, 5)
  
  result.hours_accrued
  |> should.equal(50.0)
  
  result.cap
  |> should.equal(40.0)
  
  // Should be capped at 40
  result.total
  |> should.equal(40.0)
}
