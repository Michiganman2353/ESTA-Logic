// Accrual engine compiled to WASM
// Expose a minimal `accrue` export that accepts JSON input and returns JSON output.
// Uses pure Rust types with deterministic serialization.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;

#[derive(Deserialize, Serialize)]
pub struct AccrualInput {
    pub employee_id: String,
    pub minutes_worked: u64,
    pub employer_policy: Value,
}

/// Output with deterministic serialization using BTreeMap for consistent key ordering
#[derive(Deserialize, Serialize)]
pub struct AccrualOutput {
    pub employee_id: String,
    pub accrued_minutes: u64,
    /// Metadata with sorted keys for byte-level reproducibility
    pub metadata: BTreeMap<String, Value>,
}

/// Memory allocation for WASM host communication.
/// 
/// # Safety Note
/// This function is provided for WASM host-to-guest memory allocation.
/// For production use, prefer wasm-bindgen or WASI interfaces over raw pointers.
/// This is a minimal implementation for prototype purposes.
/// Memory is zero-initialized to prevent potential information leakage.
#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut u8 {
    // Zero-initialize memory to prevent potential information leakage
    let mut buf = vec![0u8; size];
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

/// Free memory allocated by alloc.
/// 
/// # Safety
/// The caller must ensure ptr was allocated by alloc with the given size.
#[no_mangle]
pub unsafe extern "C" fn dealloc(ptr: *mut u8, size: usize) {
    if !ptr.is_null() {
        let _ = Vec::from_raw_parts(ptr, 0, size);
    }
}

/// Maximum allowed input size (1MB) to prevent resource exhaustion
const MAX_INPUT_SIZE: usize = 1_048_576;

/// Compute accrual based on input JSON.
/// Returns JSON string for WASM boundary crossing.
///
/// # Arguments
/// * `input_ptr` - Pointer to JSON input bytes
/// * `input_len` - Length of input bytes
///
/// # Returns
/// Pointer to JSON output string (caller must read length from first 4 bytes)
/// Returns null pointer if input is invalid (null pointer or exceeds size limit)
#[no_mangle]
pub extern "C" fn accrue_json(input_ptr: *const u8, input_len: usize) -> *const u8 {
    // Validate input pointer and size
    if input_ptr.is_null() || input_len == 0 || input_len > MAX_INPUT_SIZE {
        return std::ptr::null();
    }

    // Safety: We've validated the pointer is non-null and size is reasonable
    let input_slice = unsafe { std::slice::from_raw_parts(input_ptr, input_len) };

    let result = match serde_json::from_slice::<AccrualInput>(input_slice) {
        Ok(input) => {
            let output = accrue(input);
            serde_json::to_vec(&output).unwrap_or_else(|_| b"{}".to_vec())
        }
        Err(_) => b"{}".to_vec(),
    };

    // Allocate result with length prefix
    let len = result.len();
    let total_len = 4 + len;
    let ptr = alloc(total_len);

    unsafe {
        // Write length as first 4 bytes (little-endian)
        std::ptr::copy_nonoverlapping(
            (len as u32).to_le_bytes().as_ptr(),
            ptr,
            4,
        );
        // Write JSON data
        std::ptr::copy_nonoverlapping(result.as_ptr(), ptr.add(4), len);
    }

    ptr
}

/// Pure function for accrual calculation.
/// Deterministic: identical inputs always produce identical outputs.
pub fn accrue(input: AccrualInput) -> AccrualOutput {
    // Deterministic calculation using 1:30 ratio (integer arithmetic only)
    // 60 minutes worked yields 2 minutes accrued (60/30=2)
    let rate_num = 1u64;
    let rate_den = 30u64;
    let accrued = input.minutes_worked * rate_num / rate_den;

    // Use BTreeMap for deterministic key ordering in JSON serialization
    let mut metadata = BTreeMap::new();
    metadata.insert("calc".to_string(), Value::String("1:30".to_string()));
    metadata.insert("source".to_string(), Value::String("accrual.wasm".to_string()));
    metadata.insert("version".to_string(), Value::String("0.1.0".to_string()));

    AccrualOutput {
        employee_id: input.employee_id,
        accrued_minutes: accrued,
        metadata,
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

    #[test]
    fn deterministic_output() {
        // Verify that serialization is deterministic
        let inpt1 = AccrualInput {
            employee_id: "e1".into(),
            minutes_worked: 60,
            employer_policy: serde_json::json!({}),
        };
        let inpt2 = AccrualInput {
            employee_id: "e1".into(),
            minutes_worked: 60,
            employer_policy: serde_json::json!({}),
        };

        let out1 = serde_json::to_string(&accrue(inpt1)).unwrap();
        let out2 = serde_json::to_string(&accrue(inpt2)).unwrap();

        assert_eq!(out1, out2, "Outputs must be byte-identical for identical inputs");
    }

    #[test]
    fn zero_minutes() {
        let inpt = AccrualInput {
            employee_id: "e1".into(),
            minutes_worked: 0,
            employer_policy: serde_json::json!({}),
        };
        let out = accrue(inpt);
        assert_eq!(out.accrued_minutes, 0);
    }

    #[test]
    fn large_minutes() {
        let inpt = AccrualInput {
            employee_id: "e1".into(),
            minutes_worked: 10_000,
            employer_policy: serde_json::json!({}),
        };
        let out = accrue(inpt);
        assert_eq!(out.accrued_minutes, 333); // 10000/30 = 333
    }
}
