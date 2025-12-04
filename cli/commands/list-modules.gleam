//// cli/commands/list-modules.gleam
////
//// List Modules Command
////
//// Version: 1.0.0

/// Module info for display
pub type ModuleInfo {
  ModuleInfo(
    id: Int,
    name: String,
    version: String,
    state: String,
    load_time_ms: Int,
  )
}

/// Execute list-modules command
pub fn execute(_filter: Result(String, Nil)) -> Result(List(ModuleInfo), String) {
  Ok([])
}

/// Format module info for display
pub fn format(info: ModuleInfo) -> String {
  info.name <> " v" <> info.version <> " [" <> info.state <> "]"
}
