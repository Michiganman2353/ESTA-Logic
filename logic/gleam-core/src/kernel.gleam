/// ESTA-Logic Gleam Microkernel
/// 
/// This module provides the core accrual calculation logic for ESTA compliance.
/// It serves as the foundation of the L4/seL4-style microkernel architecture,
/// compiled to WebAssembly for deterministic cross-platform execution.

import gleam/float

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
  hours_worked / 35
}

/// Accrual result with breakdown
pub type AccrualResult {
  AccrualResult(hours_accrued: Float, cap: Float, total: Float)
}

/// Get employer size threshold for cap calculation.
/// Returns 72 hours for large employers (>10 employees), 40 hours for small.
pub fn employer_cap(employer_size: Int) -> Float {
  case employer_size > 10 {
    True -> 72.0
    False -> 40.0
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
  let ratio = 35.0
  let base = hours_worked /. ratio
  let cap = employer_cap(employer_size)
  let total = float.min(base, cap)
  AccrualResult(hours_accrued: base, cap: cap, total: total)
}
