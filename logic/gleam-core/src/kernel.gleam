/// ESTA-Logic Gleam Microkernel
/// 
/// This module provides the core accrual calculation logic for ESTA compliance.
/// It serves as the foundation of the L4/seL4-style microkernel architecture,
/// compiled to WebAssembly for deterministic cross-platform execution.

import gleam/float

/// Michigan ESTA accrual ratio: 1 hour of sick time per 35 hours worked
const accrual_ratio = 35.0

/// Cap for small employers (10 or fewer employees)
const small_employer_cap = 40.0

/// Cap for large employers (more than 10 employees)
const large_employer_cap = 72.0

/// Microkernel version string
pub fn version() -> String {
  "ESTA-Logic Gleam Microkernel v0.1.0"
}

/// Calculate sick time accrual based on hours worked.
/// 
/// Michigan ESTA law requires:
/// - 1 hour of sick time per 35 hours worked
/// 
/// ## Examples
/// 
/// ```gleam
/// compute_accrual(70)  // Returns 2
/// compute_accrual(35)  // Returns 1
/// compute_accrual(34)  // Returns 0
/// ```
pub fn compute_accrual(hours_worked: Int) -> Int {
  // Use truncated accrual ratio for integer division
  let ratio_int = float.truncate(accrual_ratio)
  hours_worked / ratio_int
}

/// Accrual result with breakdown
pub type AccrualResult {
  AccrualResult(hours_accrued: Float, cap: Float, total: Float)
}

/// Get employer size threshold for cap calculation.
/// Returns 72 hours for large employers (>10 employees), 40 hours for small.
pub fn employer_cap(employer_size: Int) -> Float {
  case employer_size > 10 {
    True -> large_employer_cap
    False -> small_employer_cap
  }
}

/// Calculate ESTA sick time accrual with cap enforcement.
/// 
/// ## Arguments
/// - hours_worked: Total hours worked in the period
/// - employer_size: Number of employees at the company
/// 
/// ## Returns
/// AccrualResult with hours accrued, applicable cap, and total available
pub fn calculate_with_cap(
  hours_worked: Float,
  employer_size: Int,
) -> AccrualResult {
  let base = hours_worked /. accrual_ratio
  let cap = employer_cap(employer_size)
  let total = float.min(base, cap)
  AccrualResult(hours_accrued: base, cap: cap, total: total)
}
