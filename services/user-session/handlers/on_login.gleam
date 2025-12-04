//// services/user-session/handlers/on_login.gleam
////
//// Handler for user login events
////
//// Version: 1.0.0

/// Login request
pub type LoginRequest {
  LoginRequest(
    user_id: String,
    auth_token: String,
    ip_address: String,
    user_agent: String,
  )
}

/// Login result
pub type LoginResult {
  LoginSuccess(session_id: String)
  LoginFailed(reason: String)
}

/// Handle login request
pub fn handle(_request: LoginRequest) -> Result(LoginResult, String) {
  Ok(LoginSuccess("session_123"))
}
