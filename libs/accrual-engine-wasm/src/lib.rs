// Accrual engine compiled to WASM
// Expose a minimal `accrue` export that accepts JSON input and returns JSON output.

use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Deserialize, Serialize)]
pub struct AccrualInput {
    pub employee_id: String,
    pub minutes_worked: u64,
    pub employer_policy: Value,
}

#[derive(Deserialize, Serialize)]
pub struct AccrualOutput {
    pub employee_id: String,
    pub accrued_minutes: u64,
    pub metadata: Value,
}

#[no_mangle]
pub extern "C" fn allocate_input(_ptr: *const u8, _len: usize) -> i32 {
    // Minimal allocator helper when using raw memory calls (WASI-compatible wrappers recommended)
    // Placeholder: implement per selected ABI
    0
}

// Example pure function - for WASM: prefer an ABI via wasm-bindgen or WASI.
pub fn accrue(input: AccrualInput) -> AccrualOutput {
    // Deterministic calculation using 1:30 ratio
    // 60 minutes worked yields 2 minutes accrued (60/30=2)
    let rate_num = 1u64;
    let rate_den = 30u64;
    let accrued = input.minutes_worked * rate_num / rate_den;

    AccrualOutput {
        employee_id: input.employee_id,
        accrued_minutes: accrued,
        metadata: serde_json::json!({"source":"accrual.wasm","calc":"1:30"}),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn sample_accrual() {
        let inpt = AccrualInput {
            employee_id: "e1".into(),
            minutes_worked: 120,
            employer_policy: serde_json::json!({"cap": 480}),
        };
        let out = accrue(inpt);
        assert_eq!(out.accrued_minutes, 4); // 120/30 = 4
    }
}
