import gleam/float

pub type Accrual {
  Accrual(regular: Float, bonus: Float, cap: Float)
}

/// Get employer size threshold for cap calculation
/// Returns 72 hours for large employers (>10 employees), 40 hours for small
pub fn employer_cap(employer_size: Int) -> Float {
  case employer_size > 10 {
    True -> 72.0
    False -> 40.0
  }
}

/// Calculate ESTA sick time accrual based on hours worked and years of service
/// 
/// Large employers (5+ years service): 1 hour per 30 hours worked
/// Small employers (under 5 years): 1 hour per 40 hours worked
/// Maximum accrual capped at 40 hours
/// Bonus of 8 hours granted for overtime exceeding 160 hours
/// Cap determined by employer size (>10 employees: 72 hours, otherwise 40 hours)
pub fn calculate(hours: Float, years_service: Float, employer_size: Int) -> Accrual {
  let ratio = case years_service >=. 5.0 {
    True -> 30.0
    False -> 40.0
  }
  let base = hours /. ratio
  let bonus = case hours >. 160.0 {
    True -> 8.0
    False -> 0.0
  }
  let cap = employer_cap(employer_size)
  Accrual(regular: float.min(base, 40.0), bonus: bonus, cap: cap)
}
