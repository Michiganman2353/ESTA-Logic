// tauri-shell/src/kernel_bridge.rs
//
// Kernel Bridge for ESTA Logic Tauri Shell
//
// This module provides the Rust-side bridge between the Tauri application
// and the ESTA Logic kernel.
//
// Version: 1.0.0

use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;

/// Kernel state managed by Tauri
pub struct KernelState {
    initialized: bool,
    module_count: usize,
}

impl Default for KernelState {
    fn default() -> Self {
        Self {
            initialized: false,
            module_count: 0,
        }
    }
}

/// Kernel state wrapper for thread-safe access
pub struct ManagedKernelState(pub Mutex<KernelState>);

/// Initialize the kernel
#[tauri::command]
pub fn initialize_kernel(state: State<ManagedKernelState>) -> Result<(), String> {
    let mut kernel = state.0.lock().map_err(|e| e.to_string())?;
    kernel.initialized = true;
    Ok(())
}

/// Execute a kernel command
#[tauri::command]
pub fn kernel_command(
    command: String,
    payload: serde_json::Value,
    state: State<ManagedKernelState>,
) -> Result<serde_json::Value, String> {
    let kernel = state.0.lock().map_err(|e| e.to_string())?;
    
    if !kernel.initialized {
        return Err("Kernel not initialized".to_string());
    }

    // Process command
    match command.as_str() {
        "ping" => Ok(serde_json::json!({"status": "pong"})),
        "status" => Ok(serde_json::json!({
            "initialized": kernel.initialized,
            "module_count": kernel.module_count,
        })),
        _ => Err(format!("Unknown command: {}", command)),
    }
}

/// Get kernel state
#[tauri::command]
pub fn get_kernel_state(state: State<ManagedKernelState>) -> Result<serde_json::Value, String> {
    let kernel = state.0.lock().map_err(|e| e.to_string())?;
    
    Ok(serde_json::json!({
        "initialized": kernel.initialized,
        "module_count": kernel.module_count,
    }))
}

/// Shutdown the kernel
#[tauri::command]
pub fn shutdown_kernel(state: State<ManagedKernelState>) -> Result<(), String> {
    let mut kernel = state.0.lock().map_err(|e| e.to_string())?;
    kernel.initialized = false;
    Ok(())
}
