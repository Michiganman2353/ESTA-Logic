//// cli/commands/show-capabilities.gleam
////
//// Show Capabilities Command
////
//// Version: 1.0.0

/// Capability info for display
pub type CapabilityInfo {
  CapabilityInfo(
    id: Int,
    resource_type: String,
    rights: List(String),
    owner_pid: Int,
    expires_at: Result(Int, Nil),
  )
}

/// Execute show-capabilities command
pub fn execute(_module_id: Int) -> Result(List(CapabilityInfo), String) {
  Ok([])
}

/// Format capability info for display
pub fn format(info: CapabilityInfo) -> String {
  info.resource_type <> " [" <> format_rights(info.rights) <> "]"
}

fn format_rights(rights: List(String)) -> String {
  case rights {
    [] -> ""
    [r] -> r
    [r, ..rest] -> r <> ", " <> format_rights(rest)
  }
}
