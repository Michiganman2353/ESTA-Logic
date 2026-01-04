import gleeunit
import gleeunit/should
import accrual.{Accrual}

/// Test suite for ESTA accrual calculations
/// Run with `gleam test` – pure assertions for immutable accrual logic

pub fn main() {
  gleeunit.main()
}

/// Test 1: Standard accrual - under 5 years service uses 1:40 ratio
pub fn standard_accrual_test() {
  let result = accrual.calculate(160.0, 4.0, 15)
  
  // 160 / 40 = 4.0 hours regular
  result.regular
  |> should.equal(4.0)
  
  // No bonus since hours <= 160
  result.bonus
  |> should.equal(0.0)
  
  // Large employer (>10) = 72 hour cap
  result.cap
  |> should.equal(72.0)
}

/// Test 2: Accelerated accrual - 5+ years service uses 1:30 ratio
pub fn accelerated_accrual_test() {
  let result = accrual.calculate(150.0, 6.0, 12)
  
  // 150 / 30 = 5.0 hours regular
  result.regular
  |> should.equal(5.0)
  
  // No bonus since hours <= 160
  result.bonus
  |> should.equal(0.0)
  
  // Large employer cap
  result.cap
  |> should.equal(72.0)
}

/// Test 3: Overtime bonus - hours over 160 grants 8-hour bonus
pub fn overtime_bonus_test() {
  let result = accrual.calculate(200.0, 3.0, 8)
  
  // 200 / 40 = 5.0 hours regular
  result.regular
  |> should.equal(5.0)
  
  // Bonus granted for >160 hours
  result.bonus
  |> should.equal(8.0)
  
  // Small employer (<=10) = 40 hour cap
  result.cap
  |> should.equal(40.0)
}

/// Test 4: Regular accrual cap - maximum 40 hours regular accrual
pub fn regular_cap_test() {
  let result = accrual.calculate(2000.0, 2.0, 5)
  
  // 2000 / 40 = 50, but capped at 40
  result.regular
  |> should.equal(40.0)
  
  // Bonus granted for >160 hours
  result.bonus
  |> should.equal(8.0)
  
  // Small employer cap
  result.cap
  |> should.equal(40.0)
}

/// Test 5: Employer cap - small vs large employer thresholds
pub fn employer_cap_test() {
  // Small employer (<=10)
  accrual.employer_cap(10)
  |> should.equal(40.0)
  
  accrual.employer_cap(5)
  |> should.equal(40.0)
  
  // Large employer (>10)
  accrual.employer_cap(11)
  |> should.equal(72.0)
  
  accrual.employer_cap(100)
  |> should.equal(72.0)
}

/// Test 6: Edge case - exactly 5 years service (threshold)
pub fn five_year_threshold_test() {
  // Exactly 5 years should use accelerated 1:30 ratio
  let result = accrual.calculate(120.0, 5.0, 20)
  
  // 120 / 30 = 4.0 hours regular
  result.regular
  |> should.equal(4.0)
}

/// Test 7: Edge case - exactly 160 hours (no bonus threshold)
pub fn exactly_160_hours_test() {
  let result = accrual.calculate(160.0, 3.0, 15)
  
  // 160 hours should NOT trigger bonus (only > 160)
  result.bonus
  |> should.equal(0.0)
}

/// Test 8: Combined scenario - accelerated with overtime bonus
pub fn accelerated_with_bonus_test() {
  let result = accrual.calculate(300.0, 7.0, 50)
  
  // 300 / 30 = 10.0 hours regular
  result.regular
  |> should.equal(10.0)
  
  // Bonus for >160 hours
  result.bonus
  |> should.equal(8.0)
  
  // Large employer cap
  result.cap
  |> should.equal(72.0)
}
