//// kernel/drivers/tauri_bridge.gleam
////
//// ESTA Logic Tauri Bridge Driver
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

/// Tauri command
pub type Command {
  Command(name: String, args: List(#(String, String)))
}

/// Tauri event
pub type TauriEvent {
  TauriEvent(name: String, payload: String)
}

/// Bridge state
pub type BridgeState {
  Connected
  Disconnected
  Connecting
}

/// Invoke a Tauri command
pub fn invoke(
  _command: Command,
  _capability: Int,
) -> Result(String, String) {
  Ok("")
}

/// Listen for Tauri events
pub fn listen(
  _event_name: String,
  _handler_id: Int,
) -> Result(Int, String) {
  Ok(1)
}

/// Unlisten from Tauri events
pub fn unlisten(_listener_id: Int) -> Result(Nil, String) {
  Ok(Nil)
}

/// Emit a Tauri event
pub fn emit(_event: TauriEvent) -> Result(Nil, String) {
  Ok(Nil)
}

/// Get bridge state
pub fn get_state() -> BridgeState {
  Connected
}

/// Open a file dialog
pub fn open_file_dialog(
  _title: String,
  _filters: List(#(String, List(String))),
) -> Result(Result(String, Nil), String) {
  Ok(Error(Nil))
}

/// Save file dialog
pub fn save_file_dialog(
  _title: String,
  _default_name: String,
) -> Result(Result(String, Nil), String) {
  Ok(Error(Nil))
}
