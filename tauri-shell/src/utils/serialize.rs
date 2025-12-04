// tauri-shell/src/utils/serialize.rs
//
// Serialization Utilities for ESTA Logic Tauri Shell
//
// Version: 1.0.0

use serde::{Deserialize, Serialize};
use serde_json;

/// Serialize value to JSON string
pub fn to_json<T: Serialize>(value: &T) -> Result<String, String> {
    serde_json::to_string(value).map_err(|e| e.to_string())
}

/// Serialize value to pretty JSON string
pub fn to_json_pretty<T: Serialize>(value: &T) -> Result<String, String> {
    serde_json::to_string_pretty(value).map_err(|e| e.to_string())
}

/// Deserialize JSON string to value
pub fn from_json<'a, T: Deserialize<'a>>(json: &'a str) -> Result<T, String> {
    serde_json::from_str(json).map_err(|e| e.to_string())
}

/// Serialize value to bytes
pub fn to_bytes<T: Serialize>(value: &T) -> Result<Vec<u8>, String> {
    serde_json::to_vec(value).map_err(|e| e.to_string())
}

/// Deserialize bytes to value
pub fn from_bytes<'a, T: Deserialize<'a>>(bytes: &'a [u8]) -> Result<T, String> {
    serde_json::from_slice(bytes).map_err(|e| e.to_string())
}
