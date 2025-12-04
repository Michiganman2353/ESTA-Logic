// tauri-shell/src/api/time.rs
//
// Time API for ESTA Logic Tauri Shell
//
// Version: 1.0.0

use std::time::{SystemTime, UNIX_EPOCH, Instant};

/// Get current time in nanoseconds since Unix epoch
#[tauri::command]
pub fn get_current_time_ns() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos() as u64
}

/// Get monotonic time in nanoseconds
#[tauri::command]
pub fn get_monotonic_time_ns() -> u64 {
    // Note: This returns time since process start
    static START: std::sync::OnceLock<Instant> = std::sync::OnceLock::new();
    let start = START.get_or_init(Instant::now);
    start.elapsed().as_nanos() as u64
}

/// Sleep for specified milliseconds
#[tauri::command]
pub async fn sleep_ms(ms: u64) {
    tokio::time::sleep(tokio::time::Duration::from_millis(ms)).await;
}
