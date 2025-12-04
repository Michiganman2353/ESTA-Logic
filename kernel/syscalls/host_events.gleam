//// kernel/syscalls/host_events.gleam
////
//// ESTA Logic Host Event Syscalls
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

/// Event type
pub type EventType {
  EventType(name: String)
}

/// Event payload
pub type Event {
  Event(
    event_type: EventType,
    payload: String,
    timestamp_ns: Int,
    source: String,
  )
}

/// Event subscription
pub type Subscription {
  Subscription(value: Int)
}

/// Subscribe to events
pub fn subscribe(
  _event_type: EventType,
  _callback_id: Int,
) -> Result(Subscription, String) {
  Ok(Subscription(1))
}

/// Unsubscribe from events
pub fn unsubscribe(_subscription: Subscription) -> Result(Nil, String) {
  Ok(Nil)
}

/// Emit an event
pub fn emit(_event: Event) -> Result(Nil, String) {
  Ok(Nil)
}

/// Poll for events
pub fn poll(_timeout_ms: Int) -> Result(List(Event), String) {
  Ok([])
}
