//// tests/integration/test_compliance_eval.gleam
////
//// Integration Test: Compliance Evaluation
////
//// Version: 1.0.0

import gleeunit/should

/// Test basic compliance evaluation
pub fn test_basic_compliance_check() {
  let result = evaluate_compliance(72.0, 80.0)
  should.equal(result, Compliant)
}

/// Test non-compliant case
pub fn test_non_compliant_case() {
  let result = evaluate_compliance(50.0, 72.0)
  should.equal(result, NonCompliant("Insufficient accrual"))
}

/// Compliance result type
pub type ComplianceResult {
  Compliant
  NonCompliant(reason: String)
}

fn evaluate_compliance(
  accrued: Float,
  required: Float,
) -> ComplianceResult {
  case accrued >=. required {
    True -> Compliant
    False -> NonCompliant("Insufficient accrual")
  }
}
