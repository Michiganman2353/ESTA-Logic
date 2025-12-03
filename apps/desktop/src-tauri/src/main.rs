//! ESTA Rainforest Desktop Application
//!
//! This is the Tauri command handler module for the ESTA kernel.
//! All IPC commands from the frontend must go through validated handlers.
//!
//! ## Command Handlers
//!
//! - `invoke_kernel` - General kernel invocation for accrual/validation
//! - `kernel_get_status` - Get kernel status and loaded modules
//! - `kernel_load_module` - Load a WASM module by manifest path
//! - `kernel_execute` - Execute a function on a loaded module
//! - `kernel_get_logs` - Get recent audit log entries
//! - `tenant_set_policy` - Set tenant policy configuration
//! - `tenant_get_accruals` - Get accrual data for tenant
//! - `employee_view_accruals` - Get accrual data for employee

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};
use tauri::command;
use log::{info, error, warn};
use std::collections::HashMap;

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

/// Request to load a module
#[derive(Debug, Deserialize)]
pub struct LoadModuleRequest {
    /// Path to the module manifest
    pub manifest_path: String,
}

/// Request to execute a module function
#[derive(Debug, Deserialize)]
pub struct ExecuteRequest {
    /// Module name
    pub module: String,
    /// Function name
    pub function: String,
    /// Input data as JSON
    pub input: serde_json::Value,
}

/// Request for log entries
#[derive(Debug, Deserialize)]
pub struct GetLogsRequest {
    /// Number of entries to retrieve
    pub limit: Option<usize>,
    /// Filter by source
    pub source: Option<String>,
    /// Get entries after this sequence number
    pub after_sequence: Option<u64>,
}

/// Tenant policy configuration
#[derive(Debug, Deserialize)]
pub struct TenantPolicy {
    pub tenant_id: String,
    pub employer_size: String, // "small" (< 10) or "large" (>= 10)
    pub accrual_rate: f64,     // Default 1:30 (1 minute per 30 minutes worked)
    pub max_carryover_hours: u32,
    pub max_usage_hours: u32,
}

/// Employee accrual query
#[derive(Debug, Deserialize)]
pub struct EmployeeAccrualQuery {
    pub tenant_id: String,
    pub employee_id: String,
}

/// Maximum allowed payload size (1MB)
const MAX_PAYLOAD_SIZE: usize = 1_048_576;

/// Allowed actions for kernel invocation
const ALLOWED_ACTIONS: &[&str] = &[
    "accrue", 
    "validate", 
    "audit", 
    "status", 
    "calculate",
    "report",
];

/// Allowed modules for kernel invocation
const ALLOWED_MODULES: &[&str] = &[
    "accrual", 
    "compliance", 
    "audit",
    "policy",
    "reporting",
];

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

/// MI-ESTA accrual rate: 1 minute per 30 minutes worked
const ACCRUAL_RATE: u64 = 30;

/// Calculate accrued sick time based on MI-ESTA rules
fn calculate_accrual(minutes_worked: u64, employer_size: &str) -> u64 {
    // MI-ESTA: 1 hour of sick time per 30 hours worked
    // For simplicity, we use 1 minute per 30 minutes
    // Note: employer_size may affect caps in future, but rate is same for all
    let _ = employer_size; // Currently unused, rate is the same
    minutes_worked / ACCRUAL_RATE
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

    match request.action.as_str() {
        "status" => Ok(KernelResponse {
            success: true,
            data: Some(serde_json::json!({
                "kernel_version": env!("CARGO_PKG_VERSION"),
                "status": "running",
                "modules_loaded": [],
                "fuel_limit": 20_000_000,
                "memory_limit_bytes": 33_554_432
            })),
            error: None,
        }),
        "accrue" => {
            let minutes = request.payload.get("minutes_worked")
                .and_then(|v| v.as_u64())
                .unwrap_or(0);
            let employer_size = request.payload.get("employer_size")
                .and_then(|v| v.as_str())
                .unwrap_or("small");
            
            let accrued = calculate_accrual(minutes, employer_size);
            
            Ok(KernelResponse {
                success: true,
                data: Some(serde_json::json!({
                    "accrued_minutes": accrued,
                    "minutes_worked": minutes,
                    "employer_size": employer_size,
                    "rate": "1:30",
                    "source": "kernel"
                })),
                error: None,
            })
        },
        "validate" => {
            // Validate accrual data
            let employee_id = request.payload.get("employee_id")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let accrued = request.payload.get("accrued_minutes")
                .and_then(|v| v.as_u64())
                .unwrap_or(0);
            let used = request.payload.get("used_minutes")
                .and_then(|v| v.as_u64())
                .unwrap_or(0);

            let valid = accrued >= used;
            
            Ok(KernelResponse {
                success: true,
                data: Some(serde_json::json!({
                    "valid": valid,
                    "employee_id": employee_id,
                    "balance": accrued.saturating_sub(used),
                    "validation_errors": if valid { vec![] } else { vec!["Used exceeds accrued"] }
                })),
                error: None,
            })
        },
        "audit" => {
            // Return audit information
            Ok(KernelResponse {
                success: true,
                data: Some(serde_json::json!({
                    "audit_enabled": true,
                    "log_entries": 0,
                    "chain_valid": true
                })),
                error: None,
            })
        },
        "calculate" => {
            // Generic calculation endpoint
            let operation = request.payload.get("operation")
                .and_then(|v| v.as_str())
                .unwrap_or("accrual");
                
            match operation {
                "accrual" => {
                    let minutes = request.payload.get("minutes_worked")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);
                    Ok(KernelResponse {
                        success: true,
                        data: Some(serde_json::json!({
                            "result": minutes / 30,
                            "operation": "accrual"
                        })),
                        error: None,
                    })
                },
                "balance" => {
                    let accrued = request.payload.get("accrued")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);
                    let used = request.payload.get("used")
                        .and_then(|v| v.as_u64())
                        .unwrap_or(0);
                    Ok(KernelResponse {
                        success: true,
                        data: Some(serde_json::json!({
                            "result": accrued.saturating_sub(used),
                            "operation": "balance"
                        })),
                        error: None,
                    })
                },
                _ => Ok(KernelResponse {
                    success: false,
                    data: None,
                    error: Some(format!("Unknown calculation operation: {}", operation)),
                }),
            }
        },
        _ => Ok(KernelResponse {
            success: false,
            data: None,
            error: Some(format!("Action '{}' not yet implemented", request.action)),
        }),
    }
}

/// Get kernel status including loaded modules and configuration
#[command]
pub async fn kernel_get_status() -> Result<KernelResponse, String> {
    info!("Getting kernel status");
    
    Ok(KernelResponse {
        success: true,
        data: Some(serde_json::json!({
            "version": env!("CARGO_PKG_VERSION"),
            "status": "running",
            "modules": [],
            "config": {
                "max_fuel": 20_000_000,
                "max_memory_bytes": 33_554_432,
                "require_signatures": false
            },
            "audit": {
                "enabled": true,
                "entries": 0
            }
        })),
        error: None,
    })
}

/// Load a WASM module from its manifest
#[command]
pub async fn kernel_load_module(request: LoadModuleRequest) -> Result<KernelResponse, String> {
    info!("Loading module from manifest: {}", request.manifest_path);
    
    // Validate manifest path doesn't escape allowed directories
    if request.manifest_path.contains("..") {
        warn!("Attempted path traversal in manifest_path: {}", request.manifest_path);
        return Ok(KernelResponse {
            success: false,
            data: None,
            error: Some("Invalid manifest path".to_string()),
        });
    }
    
    // In a full implementation, this would load the actual module
    Ok(KernelResponse {
        success: true,
        data: Some(serde_json::json!({
            "loaded": true,
            "manifest_path": request.manifest_path,
            "message": "Module loading not yet implemented in Tauri handler"
        })),
        error: None,
    })
}

/// Execute a function on a loaded module
#[command]
pub async fn kernel_execute(request: ExecuteRequest) -> Result<KernelResponse, String> {
    info!("Executing {}::{}", request.module, request.function);
    
    // Validate module name
    if !ALLOWED_MODULES.contains(&request.module.as_str()) {
        return Ok(KernelResponse {
            success: false,
            data: None,
            error: Some(format!("Module '{}' is not allowed", request.module)),
        });
    }
    
    // Validate payload size
    let input_size = serde_json::to_string(&request.input)
        .map(|s| s.len())
        .unwrap_or(0);
    if input_size > MAX_PAYLOAD_SIZE {
        return Ok(KernelResponse {
            success: false,
            data: None,
            error: Some("Input payload too large".to_string()),
        });
    }
    
    // In a full implementation, this would execute the module function
    Ok(KernelResponse {
        success: true,
        data: Some(serde_json::json!({
            "executed": true,
            "module": request.module,
            "function": request.function,
            "result": null,
            "fuel_consumed": 0,
            "message": "Execution not yet implemented in Tauri handler"
        })),
        error: None,
    })
}

/// Get audit log entries
#[command]
pub async fn kernel_get_logs(request: GetLogsRequest) -> Result<KernelResponse, String> {
    info!("Getting audit logs, limit: {:?}, source: {:?}", request.limit, request.source);
    
    let limit = request.limit.unwrap_or(100).min(1000); // Cap at 1000
    
    // In a full implementation, this would query the actual audit log
    Ok(KernelResponse {
        success: true,
        data: Some(serde_json::json!({
            "entries": [],
            "total": 0,
            "limit": limit,
            "source_filter": request.source,
            "after_sequence": request.after_sequence
        })),
        error: None,
    })
}

/// Set tenant policy configuration
#[command]
pub async fn tenant_set_policy(policy: TenantPolicy) -> Result<KernelResponse, String> {
    info!("Setting policy for tenant: {}", policy.tenant_id);
    
    // Validate employer size
    if !["small", "large"].contains(&policy.employer_size.as_str()) {
        return Ok(KernelResponse {
            success: false,
            data: None,
            error: Some("employer_size must be 'small' or 'large'".to_string()),
        });
    }
    
    // Validate accrual rate
    if policy.accrual_rate <= 0.0 || policy.accrual_rate > 1.0 {
        return Ok(KernelResponse {
            success: false,
            data: None,
            error: Some("accrual_rate must be between 0 and 1".to_string()),
        });
    }
    
    // In a full implementation, this would persist the policy
    Ok(KernelResponse {
        success: true,
        data: Some(serde_json::json!({
            "tenant_id": policy.tenant_id,
            "policy_set": true,
            "employer_size": policy.employer_size,
            "accrual_rate": policy.accrual_rate,
            "max_carryover_hours": policy.max_carryover_hours,
            "max_usage_hours": policy.max_usage_hours
        })),
        error: None,
    })
}

/// Get accrual data for a tenant
#[command]
pub async fn tenant_get_accruals(tenant_id: String) -> Result<KernelResponse, String> {
    info!("Getting accruals for tenant: {}", tenant_id);
    
    // In a full implementation, this would query actual accrual data
    Ok(KernelResponse {
        success: true,
        data: Some(serde_json::json!({
            "tenant_id": tenant_id,
            "employees": [],
            "total_accrued_hours": 0,
            "total_used_hours": 0,
            "period": "current"
        })),
        error: None,
    })
}

/// Get accrual data for a specific employee
#[command]
pub async fn employee_view_accruals(query: EmployeeAccrualQuery) -> Result<KernelResponse, String> {
    info!("Getting accruals for employee: {} in tenant: {}", query.employee_id, query.tenant_id);
    
    // In a full implementation, this would query actual employee accrual data
    Ok(KernelResponse {
        success: true,
        data: Some(serde_json::json!({
            "tenant_id": query.tenant_id,
            "employee_id": query.employee_id,
            "accrued_minutes": 0,
            "used_minutes": 0,
            "balance_minutes": 0,
            "carryover_minutes": 0,
            "policy": {
                "rate": "1:30",
                "employer_size": "unknown"
            }
        })),
        error: None,
    })
}

fn main() {
    env_logger::init();
    
    info!("Starting ESTA Rainforest Desktop Application v{}", env!("CARGO_PKG_VERSION"));

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            invoke_kernel,
            kernel_get_status,
            kernel_load_module,
            kernel_execute,
            kernel_get_logs,
            tenant_set_policy,
            tenant_get_accruals,
            employee_view_accruals,
        ])
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

    #[test]
    fn test_calculate_accrual() {
        assert_eq!(calculate_accrual(60, "small"), 2);  // 60/30 = 2
        assert_eq!(calculate_accrual(120, "large"), 4); // 120/30 = 4
        assert_eq!(calculate_accrual(0, "small"), 0);
        assert_eq!(calculate_accrual(29, "small"), 0);  // < 30 = 0
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

    #[tokio::test]
    async fn test_invoke_kernel_validate() {
        let request = KernelRequest {
            action: "validate".to_string(),
            module: "compliance".to_string(),
            payload: serde_json::json!({
                "employee_id": "emp1",
                "accrued_minutes": 100,
                "used_minutes": 50
            }),
        };
        let response = invoke_kernel(request).await.unwrap();
        assert!(response.success);
        let data = response.data.unwrap();
        assert_eq!(data["valid"], true);
        assert_eq!(data["balance"], 50);
    }

    #[tokio::test]
    async fn test_kernel_get_status() {
        let response = kernel_get_status().await.unwrap();
        assert!(response.success);
        let data = response.data.unwrap();
        assert_eq!(data["status"], "running");
    }

    #[tokio::test]
    async fn test_tenant_set_policy_valid() {
        let policy = TenantPolicy {
            tenant_id: "tenant1".to_string(),
            employer_size: "small".to_string(),
            accrual_rate: 0.0333, // ~1:30
            max_carryover_hours: 40,
            max_usage_hours: 72,
        };
        let response = tenant_set_policy(policy).await.unwrap();
        assert!(response.success);
    }

    #[tokio::test]
    async fn test_tenant_set_policy_invalid_size() {
        let policy = TenantPolicy {
            tenant_id: "tenant1".to_string(),
            employer_size: "medium".to_string(), // Invalid
            accrual_rate: 0.0333,
            max_carryover_hours: 40,
            max_usage_hours: 72,
        };
        let response = tenant_set_policy(policy).await.unwrap();
        assert!(!response.success);
        assert!(response.error.is_some());
    }

    #[tokio::test]
    async fn test_kernel_load_module_path_traversal() {
        let request = LoadModuleRequest {
            manifest_path: "../../../etc/passwd".to_string(),
        };
        let response = kernel_load_module(request).await.unwrap();
        assert!(!response.success);
        assert!(response.error.unwrap().contains("Invalid"));
    }
}
