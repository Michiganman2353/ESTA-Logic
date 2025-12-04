//// kernel/syscalls/notifications.gleam
////
//// ESTA Logic Notification Syscalls
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

/// Notification identifier
pub type NotificationId {
  NotificationId(value: Int)
}

/// Notification priority
pub type NotificationPriority {
  Low
  Normal
  High
  Urgent
}

/// Notification
pub type Notification {
  Notification(
    title: String,
    body: String,
    priority: NotificationPriority,
    icon: Result(String, Nil),
    actions: List(NotificationAction),
  )
}

/// Notification action
pub type NotificationAction {
  NotificationAction(label: String, action_id: String)
}

/// Show a notification
pub fn show(
  _notification: Notification,
  _capability: Int,
) -> Result(NotificationId, String) {
  Ok(NotificationId(1))
}

/// Cancel a notification
pub fn cancel(_id: NotificationId) -> Result(Nil, String) {
  Ok(Nil)
}

/// Cancel all notifications
pub fn cancel_all() -> Result(Nil, String) {
  Ok(Nil)
}

/// Get notification permissions
pub fn get_permission() -> Bool {
  True
}

/// Request notification permissions
pub fn request_permission() -> Bool {
  True
}
