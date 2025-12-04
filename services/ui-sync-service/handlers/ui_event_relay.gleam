//// services/ui-sync-service/handlers/ui_event_relay.gleam
////
//// Handler for relaying UI events to services
////
//// Version: 1.0.0

/// UI event
pub type UiEvent {
  UiEvent(
    event_type: String,
    component_id: String,
    payload: String,
    timestamp_ns: Int,
  )
}

/// Relay UI event to appropriate service
pub fn relay(_event: UiEvent) -> Result(Nil, String) {
  Ok(Nil)
}
