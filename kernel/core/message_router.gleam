//// kernel/core/message_router.gleam
////
//// ESTA Logic Microkernel Message Router
////
//// This module implements the central message routing system for the
//// ESTA Logic microkernel. It handles message delivery, routing decisions,
//// and ensures reliable communication between processes.
////
//// Key Design Principles:
//// 1. All inter-process communication goes through the message router
//// 2. Messages are delivered in FIFO order within priority classes
//// 3. Backpressure mechanisms prevent mailbox overflow
//// 4. All message operations are traceable
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: ROUTER TYPES
// ============================================================================

/// Process identifier
pub type Pid {
  Pid(id: Int)
}

/// Message sequence number
pub type SequenceNumber {
  SequenceNumber(value: Int)
}

/// Message priority
pub type MessagePriority {
  Low
  Normal
  High
  Critical
}

/// Message envelope
pub type Envelope(payload) {
  Envelope(
    source: Pid,
    target: Pid,
    sequence: SequenceNumber,
    priority: MessagePriority,
    payload: payload,
    timestamp_ns: Int,
    require_ack: Bool,
  )
}

/// Mailbox for a process
pub type Mailbox(payload) {
  Mailbox(
    owner: Pid,
    messages: List(Envelope(payload)),
    capacity: Int,
    overflow_mode: OverflowMode,
  )
}

/// Overflow handling mode
pub type OverflowMode {
  /// Drop newest message when full
  DropNewest
  /// Drop oldest message when full
  DropOldest
  /// Block sender until space available
  BlockSender
  /// Notify sender of failure
  NotifySender
}

/// Message router state
pub type Router(payload) {
  Router(
    mailboxes: List(Mailbox(payload)),
    next_sequence: Int,
    pending_acks: List(PendingAck),
    pending_acks_count: Int,
    stats: RouterStats,
    config: RouterConfig,
  )
}

/// Pending acknowledgment
pub type PendingAck {
  PendingAck(
    sequence: SequenceNumber,
    source: Pid,
    target: Pid,
    sent_at_ns: Int,
    timeout_ns: Int,
  )
}

/// Router statistics
pub type RouterStats {
  RouterStats(
    messages_sent: Int,
    messages_delivered: Int,
    messages_dropped: Int,
    acks_pending: Int,
    acks_timeout: Int,
  )
}

/// Router configuration
pub type RouterConfig {
  RouterConfig(
    default_mailbox_capacity: Int,
    ack_timeout_ns: Int,
    max_pending_acks: Int,
  )
}

/// Send result
pub type SendResult {
  /// Message sent successfully
  SendOk(sequence: SequenceNumber)
  /// Target mailbox is full
  MailboxFull
  /// Target process not found
  TargetNotFound
  /// Too many pending acks
  BackpressureTriggered
}

/// Receive result
pub type ReceiveResult(payload) {
  /// Message received
  ReceiveOk(envelope: Envelope(payload))
  /// No messages available
  ReceiveEmpty
  /// Process not found
  ProcessNotFound
}

// ============================================================================
// SECTION 2: ROUTER CREATION
// ============================================================================

/// Create a new message router
pub fn new() -> Router(payload) {
  new_with_config(default_config())
}

/// Create a router with custom configuration
pub fn new_with_config(config: RouterConfig) -> Router(payload) {
  Router(
    mailboxes: [],
    next_sequence: 1,
    pending_acks: [],
    pending_acks_count: 0,
    stats: RouterStats(
      messages_sent: 0,
      messages_delivered: 0,
      messages_dropped: 0,
      acks_pending: 0,
      acks_timeout: 0,
    ),
    config: config,
  )
}

/// Default router configuration
pub fn default_config() -> RouterConfig {
  RouterConfig(
    default_mailbox_capacity: 1024,
    ack_timeout_ns: 5_000_000_000,
    max_pending_acks: 10_000,
  )
}

// ============================================================================
// SECTION 3: MAILBOX MANAGEMENT
// ============================================================================

/// Register a process with the router
pub fn register_process(
  router: Router(payload),
  pid: Pid,
  capacity: Int,
  overflow_mode: OverflowMode,
) -> Router(payload) {
  let mailbox = Mailbox(
    owner: pid,
    messages: [],
    capacity: capacity,
    overflow_mode: overflow_mode,
  )
  Router(..router, mailboxes: [mailbox, ..router.mailboxes])
}

/// Unregister a process from the router
pub fn unregister_process(router: Router(payload), pid: Pid) -> Router(payload) {
  let mailboxes = filter_out_mailbox(router.mailboxes, pid)
  Router(..router, mailboxes: mailboxes)
}

/// Get mailbox status for a process
pub fn mailbox_status(
  router: Router(payload),
  pid: Pid,
) -> Result(#(Int, Int), Nil) {
  case find_mailbox(router.mailboxes, pid) {
    Error(Nil) -> Error(Nil)
    Ok(mailbox) -> Ok(#(list_length(mailbox.messages), mailbox.capacity))
  }
}

// ============================================================================
// SECTION 4: MESSAGE SENDING
// ============================================================================

/// Send a message to a target process
pub fn send(
  router: Router(payload),
  source: Pid,
  target: Pid,
  payload: payload,
  priority: MessagePriority,
  require_ack: Bool,
  now_ns: Int,
) -> #(Router(payload), SendResult) {
  // Check if target exists
  case find_mailbox(router.mailboxes, target) {
    Error(Nil) -> #(router, TargetNotFound)
    Ok(mailbox) -> {
      // Check backpressure using O(1) counter instead of O(n) list_length
      case require_ack && router.pending_acks_count >= router.config.max_pending_acks {
        True -> #(router, BackpressureTriggered)
        False -> {
          // Check mailbox capacity
          let current_size = list_length(mailbox.messages)
          case current_size >= mailbox.capacity {
            True -> handle_overflow(router, mailbox, source, target, payload, priority, require_ack, now_ns)
            False -> deliver_message(router, mailbox, source, target, payload, priority, require_ack, now_ns)
          }
        }
      }
    }
  }
}

/// Broadcast a message to all processes
pub fn broadcast(
  router: Router(payload),
  source: Pid,
  payload: payload,
  priority: MessagePriority,
  now_ns: Int,
) -> Router(payload) {
  broadcast_to_mailboxes(router, router.mailboxes, source, payload, priority, now_ns)
}

// ============================================================================
// SECTION 5: MESSAGE RECEIVING
// ============================================================================

/// Receive a message for a process
pub fn receive(
  router: Router(payload),
  pid: Pid,
) -> #(Router(payload), ReceiveResult(payload)) {
  case find_mailbox(router.mailboxes, pid) {
    Error(Nil) -> #(router, ProcessNotFound)
    Ok(mailbox) ->
      case mailbox.messages {
        [] -> #(router, ReceiveEmpty)
        [msg, ..rest] -> {
          let new_mailbox = Mailbox(..mailbox, messages: rest)
          let new_router = update_mailbox(router, new_mailbox)
          let new_router = Router(
            ..new_router,
            stats: RouterStats(
              ..new_router.stats,
              messages_delivered: new_router.stats.messages_delivered + 1,
            ),
          )
          #(new_router, ReceiveOk(msg))
        }
      }
  }
}

/// Receive a message with priority filter
pub fn receive_priority(
  router: Router(payload),
  pid: Pid,
  min_priority: MessagePriority,
) -> #(Router(payload), ReceiveResult(payload)) {
  case find_mailbox(router.mailboxes, pid) {
    Error(Nil) -> #(router, ProcessNotFound)
    Ok(mailbox) -> {
      case find_by_priority(mailbox.messages, min_priority) {
        Error(Nil) -> #(router, ReceiveEmpty)
        Ok(#(msg, remaining)) -> {
          let new_mailbox = Mailbox(..mailbox, messages: remaining)
          let new_router = update_mailbox(router, new_mailbox)
          let new_router = Router(
            ..new_router,
            stats: RouterStats(
              ..new_router.stats,
              messages_delivered: new_router.stats.messages_delivered + 1,
            ),
          )
          #(new_router, ReceiveOk(msg))
        }
      }
    }
  }
}

/// Peek at the next message without removing it
pub fn peek(
  router: Router(payload),
  pid: Pid,
) -> Result(Envelope(payload), Nil) {
  case find_mailbox(router.mailboxes, pid) {
    Error(Nil) -> Error(Nil)
    Ok(mailbox) ->
      case mailbox.messages {
        [] -> Error(Nil)
        [msg, ..] -> Ok(msg)
      }
  }
}

// ============================================================================
// SECTION 6: ACKNOWLEDGMENT HANDLING
// ============================================================================

/// Acknowledge receipt of a message
pub fn acknowledge(
  router: Router(payload),
  sequence: SequenceNumber,
) -> Router(payload) {
  let pending = remove_pending_ack(router.pending_acks, sequence)
  let new_count = router.pending_acks_count - 1
  let new_count = case new_count < 0 {
    True -> 0
    False -> new_count
  }
  Router(
    ..router,
    pending_acks: pending,
    pending_acks_count: new_count,
    stats: RouterStats(
      ..router.stats,
      acks_pending: new_count,
    ),
  )
}

/// Check for timed out acknowledgments
pub fn check_ack_timeouts(
  router: Router(payload),
  now_ns: Int,
) -> #(Router(payload), List(SequenceNumber)) {
  let #(timed_out, remaining) = partition_timeouts(router.pending_acks, now_ns)
  let timeout_sequences = extract_sequences(timed_out)
  let timeout_count = list_length(timed_out)
  let remaining_count = router.pending_acks_count - timeout_count
  let remaining_count = case remaining_count < 0 {
    True -> 0
    False -> remaining_count
  }
  let new_router = Router(
    ..router,
    pending_acks: remaining,
    pending_acks_count: remaining_count,
    stats: RouterStats(
      ..router.stats,
      acks_pending: remaining_count,
      acks_timeout: router.stats.acks_timeout + timeout_count,
    ),
  )
  #(new_router, timeout_sequences)
}

// ============================================================================
// SECTION 7: HELPER FUNCTIONS
// ============================================================================

fn deliver_message(
  router: Router(payload),
  mailbox: Mailbox(payload),
  source: Pid,
  target: Pid,
  payload: payload,
  priority: MessagePriority,
  require_ack: Bool,
  now_ns: Int,
) -> #(Router(payload), SendResult) {
  let sequence = SequenceNumber(router.next_sequence)
  let envelope = Envelope(
    source: source,
    target: target,
    sequence: sequence,
    priority: priority,
    payload: payload,
    timestamp_ns: now_ns,
    require_ack: require_ack,
  )
  
  // Add message to mailbox (at end for FIFO)
  let new_messages = append_message(mailbox.messages, envelope)
  let new_mailbox = Mailbox(..mailbox, messages: new_messages)
  
  // Update pending acks if needed
  let #(pending, new_count) = case require_ack {
    True -> #([
      PendingAck(
        sequence: sequence,
        source: source,
        target: target,
        sent_at_ns: now_ns,
        timeout_ns: now_ns + router.config.ack_timeout_ns,
      ),
      ..router.pending_acks
    ], router.pending_acks_count + 1)
    False -> #(router.pending_acks, router.pending_acks_count)
  }
  
  let new_router = Router(
    ..update_mailbox(router, new_mailbox),
    next_sequence: router.next_sequence + 1,
    pending_acks: pending,
    pending_acks_count: new_count,
    stats: RouterStats(
      ..router.stats,
      messages_sent: router.stats.messages_sent + 1,
      acks_pending: new_count,
    ),
  )
  
  #(new_router, SendOk(sequence))
}

fn handle_overflow(
  router: Router(payload),
  mailbox: Mailbox(payload),
  source: Pid,
  target: Pid,
  payload: payload,
  priority: MessagePriority,
  require_ack: Bool,
  now_ns: Int,
) -> #(Router(payload), SendResult) {
  case mailbox.overflow_mode {
    DropNewest -> {
      let new_router = Router(
        ..router,
        stats: RouterStats(
          ..router.stats,
          messages_dropped: router.stats.messages_dropped + 1,
        ),
      )
      #(new_router, MailboxFull)
    }
    DropOldest -> {
      // Remove oldest message and deliver new one
      let new_messages = drop_oldest(mailbox.messages)
      let new_mailbox = Mailbox(..mailbox, messages: new_messages)
      let new_router = Router(
        ..update_mailbox(router, new_mailbox),
        stats: RouterStats(
          ..router.stats,
          messages_dropped: router.stats.messages_dropped + 1,
        ),
      )
      deliver_message(new_router, new_mailbox, source, target, payload, priority, require_ack, now_ns)
    }
    BlockSender -> #(router, MailboxFull)
    NotifySender -> {
      let new_router = Router(
        ..router,
        stats: RouterStats(
          ..router.stats,
          messages_dropped: router.stats.messages_dropped + 1,
        ),
      )
      #(new_router, MailboxFull)
    }
  }
}

fn find_mailbox(
  mailboxes: List(Mailbox(payload)),
  pid: Pid,
) -> Result(Mailbox(payload), Nil) {
  case mailboxes {
    [] -> Error(Nil)
    [mb, ..rest] ->
      case mb.owner.id == pid.id {
        True -> Ok(mb)
        False -> find_mailbox(rest, pid)
      }
  }
}

fn filter_out_mailbox(
  mailboxes: List(Mailbox(payload)),
  pid: Pid,
) -> List(Mailbox(payload)) {
  case mailboxes {
    [] -> []
    [mb, ..rest] ->
      case mb.owner.id == pid.id {
        True -> filter_out_mailbox(rest, pid)
        False -> [mb, ..filter_out_mailbox(rest, pid)]
      }
  }
}

fn update_mailbox(
  router: Router(payload),
  mailbox: Mailbox(payload),
) -> Router(payload) {
  let mailboxes = update_mailbox_in_list(router.mailboxes, mailbox)
  Router(..router, mailboxes: mailboxes)
}

fn update_mailbox_in_list(
  mailboxes: List(Mailbox(payload)),
  mailbox: Mailbox(payload),
) -> List(Mailbox(payload)) {
  case mailboxes {
    [] -> []
    [mb, ..rest] ->
      case mb.owner.id == mailbox.owner.id {
        True -> [mailbox, ..rest]
        False -> [mb, ..update_mailbox_in_list(rest, mailbox)]
      }
  }
}

fn append_message(
  messages: List(Envelope(payload)),
  msg: Envelope(payload),
) -> List(Envelope(payload)) {
  case messages {
    [] -> [msg]
    [first, ..rest] -> [first, ..append_message(rest, msg)]
  }
}

fn drop_oldest(messages: List(Envelope(payload))) -> List(Envelope(payload)) {
  case messages {
    [] -> []
    [_, ..rest] -> rest
  }
}

fn find_by_priority(
  messages: List(Envelope(payload)),
  min_priority: MessagePriority,
) -> Result(#(Envelope(payload), List(Envelope(payload))), Nil) {
  find_by_priority_helper(messages, min_priority, [])
}

fn find_by_priority_helper(
  messages: List(Envelope(payload)),
  min_priority: MessagePriority,
  acc: List(Envelope(payload)),
) -> Result(#(Envelope(payload), List(Envelope(payload))), Nil) {
  case messages {
    [] -> Error(Nil)
    [msg, ..rest] ->
      case priority_gte(msg.priority, min_priority) {
        True -> Ok(#(msg, reverse_append(acc, rest)))
        False -> find_by_priority_helper(rest, min_priority, [msg, ..acc])
      }
  }
}

fn priority_gte(a: MessagePriority, b: MessagePriority) -> Bool {
  priority_to_int(a) >= priority_to_int(b)
}

fn priority_to_int(p: MessagePriority) -> Int {
  case p {
    Low -> 0
    Normal -> 1
    High -> 2
    Critical -> 3
  }
}

fn remove_pending_ack(
  pending: List(PendingAck),
  sequence: SequenceNumber,
) -> List(PendingAck) {
  case pending {
    [] -> []
    [ack, ..rest] ->
      case ack.sequence.value == sequence.value {
        True -> rest
        False -> [ack, ..remove_pending_ack(rest, sequence)]
      }
  }
}

fn partition_timeouts(
  pending: List(PendingAck),
  now_ns: Int,
) -> #(List(PendingAck), List(PendingAck)) {
  partition_timeouts_helper(pending, now_ns, [], [])
}

fn partition_timeouts_helper(
  pending: List(PendingAck),
  now_ns: Int,
  timed_out: List(PendingAck),
  remaining: List(PendingAck),
) -> #(List(PendingAck), List(PendingAck)) {
  case pending {
    [] -> #(timed_out, remaining)
    [ack, ..rest] ->
      case now_ns > ack.timeout_ns {
        True -> partition_timeouts_helper(rest, now_ns, [ack, ..timed_out], remaining)
        False -> partition_timeouts_helper(rest, now_ns, timed_out, [ack, ..remaining])
      }
  }
}

fn extract_sequences(pending: List(PendingAck)) -> List(SequenceNumber) {
  case pending {
    [] -> []
    [ack, ..rest] -> [ack.sequence, ..extract_sequences(rest)]
  }
}

fn broadcast_to_mailboxes(
  router: Router(payload),
  mailboxes: List(Mailbox(payload)),
  source: Pid,
  payload: payload,
  priority: MessagePriority,
  now_ns: Int,
) -> Router(payload) {
  case mailboxes {
    [] -> router
    [mb, ..rest] -> {
      let #(new_router, _) = send(router, source, mb.owner, payload, priority, False, now_ns)
      broadcast_to_mailboxes(new_router, rest, source, payload, priority, now_ns)
    }
  }
}

fn list_length(list: List(a)) -> Int {
  case list {
    [] -> 0
    [_, ..rest] -> 1 + list_length(rest)
  }
}

fn reverse_append(reversed: List(a), rest: List(a)) -> List(a) {
  case reversed {
    [] -> rest
    [first, ..tail] -> reverse_append(tail, [first, ..rest])
  }
}
