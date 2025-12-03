use proptest::prelude::*;
use accrual_engine_wasm::{AccrualInput, accrue};

proptest! {
    #[test]
    fn accrual_never_negative(minutes in 0u64..10_000u64) {
        let inp = AccrualInput {
            employee_id: "test".into(),
            minutes_worked: minutes,
            employer_policy: serde_json::json!({}),
        };
        let out = accrue(inp);
        prop_assert!(out.accrued_minutes <= minutes);
    }
}
