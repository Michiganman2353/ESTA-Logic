// tauri-shell/src/api/fs.rs
//
// File System API for ESTA Logic Tauri Shell
//
// Version: 1.0.0

use std::path::PathBuf;
use tauri::State;

/// Read a file
#[tauri::command]
pub async fn read_file(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(&path).map_err(|e| e.to_string())
}

/// Write a file
#[tauri::command]
pub async fn write_file(path: String, content: Vec<u8>) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

/// Check if file exists
#[tauri::command]
pub async fn file_exists(path: String) -> bool {
    PathBuf::from(&path).exists()
}

/// Get file metadata
#[tauri::command]
pub async fn get_file_metadata(path: String) -> Result<serde_json::Value, String> {
    let metadata = std::fs::metadata(&path).map_err(|e| e.to_string())?;
    
    Ok(serde_json::json!({
        "size": metadata.len(),
        "is_file": metadata.is_file(),
        "is_dir": metadata.is_dir(),
    }))
}
