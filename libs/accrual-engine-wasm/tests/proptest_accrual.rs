use proptest::prelude::*;
use accrual_engine_wasm::{AccrualInput, accrue};

proptest! {
    #[test]
    fn accrual_never_exceeds_input(minutes in 0u64..10_000u64) {
        let inp = AccrualInput {
            employee_id: "test".into(),
            minutes_worked: minutes,
            employer_policy: serde_json::json!({}),
        };
        let out = accrue(inp);
        prop_assert!(out.accrued_minutes <= minutes, "Accrued {} must be <= worked {}", out.accrued_minutes, minutes);
    }

    #[test]
    fn accrual_is_deterministic(minutes in 0u64..10_000u64) {
        let inp1 = AccrualInput {
            employee_id: "test".into(),
            minutes_worked: minutes,
            employer_policy: serde_json::json!({}),
        };
        let inp2 = AccrualInput {
            employee_id: "test".into(),
            minutes_worked: minutes,
            employer_policy: serde_json::json!({}),
        };
        let out1 = accrue(inp1);
        let out2 = accrue(inp2);
        prop_assert_eq!(out1.accrued_minutes, out2.accrued_minutes);
    }

    #[test]
    fn accrual_ratio_is_correct(minutes in 30u64..10_000u64) {
        // For any input >= 30, accrued should be at least 1 (due to 1:30 ratio)
        let inp = AccrualInput {
            employee_id: "test".into(),
            minutes_worked: minutes,
            employer_policy: serde_json::json!({}),
        };
        let out = accrue(inp);
        let expected = minutes / 30;
        prop_assert_eq!(out.accrued_minutes, expected, "For {} minutes, expected {} accrued", minutes, expected);
    }

    #[test]
    fn output_has_required_metadata(minutes in 0u64..1000u64) {
        let inp = AccrualInput {
            employee_id: "test".into(),
            minutes_worked: minutes,
            employer_policy: serde_json::json!({}),
        };
        let out = accrue(inp);
        prop_assert!(out.metadata.contains_key("source"));
        prop_assert!(out.metadata.contains_key("calc"));
        prop_assert!(out.metadata.contains_key("version"));
    }
}
