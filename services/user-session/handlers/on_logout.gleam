//// services/user-session/handlers/on_logout.gleam
////
//// Handler for user logout events
////
//// Version: 1.0.0

/// Logout request
pub type LogoutRequest {
  LogoutRequest(
    session_id: String,
    reason: LogoutReason,
  )
}

/// Logout reason
pub type LogoutReason {
  UserInitiated
  SessionExpired
  ForcedLogout
}

/// Handle logout request
pub fn handle(_request: LogoutRequest) -> Result(Nil, String) {
  Ok(Nil)
}
