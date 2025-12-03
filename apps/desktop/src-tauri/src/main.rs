//! ESTA Rainforest Desktop Application
//!
//! This is the Tauri command handler module for the ESTA kernel.
//! All IPC commands from the frontend must go through validated handlers.

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};
use tauri::command;
use log::{info, error};

/// Request payload for kernel invocation
#[derive(Debug, Deserialize)]
pub struct KernelRequest {
    /// The action to perform (e.g., "accrue", "validate", "audit")
    pub action: String,
    /// The module to invoke
    pub module: String,
    /// JSON payload for the module
    pub payload: serde_json::Value,
}

/// Response from kernel invocation
#[derive(Debug, Serialize)]
pub struct KernelResponse {
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub error: Option<String>,
}

/// Maximum allowed payload size (1MB)
const MAX_PAYLOAD_SIZE: usize = 1_048_576;

/// Allowed actions for kernel invocation
const ALLOWED_ACTIONS: &[&str] = &["accrue", "validate", "audit", "status"];

/// Allowed modules for kernel invocation
const ALLOWED_MODULES: &[&str] = &["accrual", "compliance", "audit"];

/// Validate the kernel request before processing
fn validate_request(request: &KernelRequest) -> Result<(), String> {
    // Validate action is in allowlist
    if !ALLOWED_ACTIONS.contains(&request.action.as_str()) {
        return Err(format!("Action '{}' is not allowed", request.action));
    }

    // Validate module is in allowlist
    if !ALLOWED_MODULES.contains(&request.module.as_str()) {
        return Err(format!("Module '{}' is not allowed", request.module));
    }

    // Validate payload is not excessively large
    let payload_size = serde_json::to_string(&request.payload)
        .map(|s| s.len())
        .unwrap_or(0);
    if payload_size > MAX_PAYLOAD_SIZE {
        return Err(format!("Payload exceeds maximum size of {} bytes", MAX_PAYLOAD_SIZE));
    }

    Ok(())
}

/// Invoke the ESTA kernel with a validated request.
/// 
/// This is the primary IPC bridge between the React frontend and the Rust kernel.
/// All requests are validated before processing to prevent unauthorized operations.
#[command]
pub async fn invoke_kernel(request: KernelRequest) -> Result<KernelResponse, String> {
    info!("Kernel invocation: action={}, module={}", request.action, request.module);

    // Validate request before processing
    if let Err(e) = validate_request(&request) {
        error!("Request validation failed: {}", e);
        return Ok(KernelResponse {
            success: false,
            data: None,
            error: Some(e),
        });
    }

    // TODO: Route to actual kernel implementation
    // For prototype: return stub response
    match request.action.as_str() {
        "status" => Ok(KernelResponse {
            success: true,
            data: Some(serde_json::json!({
                "kernel_version": "0.1.0",
                "status": "running",
                "modules_loaded": []
            })),
            error: None,
        }),
        "accrue" => {
            // Stub accrual response for prototype
            let minutes = request.payload.get("minutes_worked")
                .and_then(|v| v.as_u64())
                .unwrap_or(0);
            let accrued = minutes / 30;
            
            Ok(KernelResponse {
                success: true,
                data: Some(serde_json::json!({
                    "accrued_minutes": accrued,
                    "source": "kernel_stub"
                })),
                error: None,
            })
        },
        _ => Ok(KernelResponse {
            success: false,
            data: None,
            error: Some(format!("Action '{}' not yet implemented", request.action)),
        }),
    }
}

fn main() {
    env_logger::init();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![invoke_kernel])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_request_valid() {
        let request = KernelRequest {
            action: "accrue".to_string(),
            module: "accrual".to_string(),
            payload: serde_json::json!({"minutes_worked": 60}),
        };
        assert!(validate_request(&request).is_ok());
    }

    #[test]
    fn test_validate_request_invalid_action() {
        let request = KernelRequest {
            action: "delete_all".to_string(),
            module: "accrual".to_string(),
            payload: serde_json::json!({}),
        };
        assert!(validate_request(&request).is_err());
    }

    #[test]
    fn test_validate_request_invalid_module() {
        let request = KernelRequest {
            action: "accrue".to_string(),
            module: "system".to_string(),
            payload: serde_json::json!({}),
        };
        assert!(validate_request(&request).is_err());
    }

    #[tokio::test]
    async fn test_invoke_kernel_status() {
        let request = KernelRequest {
            action: "status".to_string(),
            module: "accrual".to_string(),
            payload: serde_json::json!({}),
        };
        let response = invoke_kernel(request).await.unwrap();
        assert!(response.success);
        assert!(response.data.is_some());
    }

    #[tokio::test]
    async fn test_invoke_kernel_accrue() {
        let request = KernelRequest {
            action: "accrue".to_string(),
            module: "accrual".to_string(),
            payload: serde_json::json!({"minutes_worked": 120}),
        };
        let response = invoke_kernel(request).await.unwrap();
        assert!(response.success);
        let data = response.data.unwrap();
        assert_eq!(data["accrued_minutes"], 4); // 120/30 = 4
    }
}
