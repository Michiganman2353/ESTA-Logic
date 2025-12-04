//// services/compliance-engine/state/compliance_state.gleam
////
//// Compliance Engine State Management
////
//// Version: 1.0.0

/// Compliance record
pub type ComplianceRecord {
  ComplianceRecord(
    employer_id: String,
    status: ComplianceStatus,
    last_evaluated_ns: Int,
    violations: List(Violation),
  )
}

/// Compliance status
pub type ComplianceStatus {
  Compliant
  NonCompliant
  PendingReview
  Unknown
}

/// Violation
pub type Violation {
  Violation(
    rule_id: String,
    description: String,
    severity: ViolationSeverity,
    detected_at_ns: Int,
  )
}

/// Violation severity
pub type ViolationSeverity {
  Low
  Medium
  High
  Critical
}

/// Compliance state
pub type ComplianceState {
  ComplianceState(
    records: List(ComplianceRecord),
    last_updated_ns: Int,
  )
}

/// Create new state
pub fn new() -> ComplianceState {
  ComplianceState(records: [], last_updated_ns: 0)
}
