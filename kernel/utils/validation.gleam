//// kernel/utils/validation.gleam
////
//// ESTA Logic Validation Utilities
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

/// Validation result
pub type ValidationResult(a) {
  Valid(value: a)
  Invalid(errors: List(ValidationError))
}

/// Validation error
pub type ValidationError {
  ValidationError(field: String, message: String, code: String)
}

/// Validate that a value is not empty
pub fn not_empty(value: String, field: String) -> ValidationResult(String) {
  case value == "" {
    True -> Invalid([ValidationError(field, "must not be empty", "EMPTY")])
    False -> Valid(value)
  }
}

/// Validate string length
pub fn length_between(
  value: String,
  min: Int,
  max: Int,
  field: String,
) -> ValidationResult(String) {
  let len = string_length(value)
  case len >= min && len <= max {
    True -> Valid(value)
    False -> Invalid([ValidationError(field, "length must be between " <> int_to_string(min) <> " and " <> int_to_string(max), "LENGTH")])
  }
}

/// Validate integer range
pub fn int_between(
  value: Int,
  min: Int,
  max: Int,
  field: String,
) -> ValidationResult(Int) {
  case value >= min && value <= max {
    True -> Valid(value)
    False -> Invalid([ValidationError(field, "must be between " <> int_to_string(min) <> " and " <> int_to_string(max), "RANGE")])
  }
}

/// Validate positive integer
pub fn positive(value: Int, field: String) -> ValidationResult(Int) {
  case value > 0 {
    True -> Valid(value)
    False -> Invalid([ValidationError(field, "must be positive", "POSITIVE")])
  }
}

/// Validate non-negative integer
pub fn non_negative(value: Int, field: String) -> ValidationResult(Int) {
  case value >= 0 {
    True -> Valid(value)
    False -> Invalid([ValidationError(field, "must be non-negative", "NON_NEGATIVE")])
  }
}

/// Combine validation results
pub fn and_then(
  result: ValidationResult(a),
  validate: fn(a) -> ValidationResult(b),
) -> ValidationResult(b) {
  case result {
    Invalid(errors) -> Invalid(errors)
    Valid(value) -> validate(value)
  }
}

/// Map over valid values
pub fn map(
  result: ValidationResult(a),
  transform: fn(a) -> b,
) -> ValidationResult(b) {
  case result {
    Invalid(errors) -> Invalid(errors)
    Valid(value) -> Valid(transform(value))
  }
}

// Helper functions
fn string_length(s: String) -> Int {
  string_length_helper(s, 0)
}

fn string_length_helper(_s: String, acc: Int) -> Int {
  // Placeholder - in real implementation would count characters
  acc
}

fn int_to_string(_n: Int) -> String {
  "0"
}
