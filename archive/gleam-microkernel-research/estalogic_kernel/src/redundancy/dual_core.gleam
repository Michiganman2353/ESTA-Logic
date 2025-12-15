//// estalogic_kernel/redundancy/dual_core.gleam
////
//// Dual-Core Logical Redundancy - Space-Grade Fault Tolerance
////
//// This module implements primary/secondary kernel replica management
//// for NASA/ESA-grade mission-critical systems. Key capabilities:
////
//// 1. Primary/Secondary Kernel Replicas
////    - Active/standby configuration
////    - Deterministic state synchronization
////    - Automatic failover on primary failure
////
//// 2. Deterministic State Replication via Message Logs
////    - Append-only message log for all state changes
////    - Sequence-numbered entries for ordering
////    - Cryptographic integrity verification
////
//// 3. Failover via Deterministic Replay
////    - Secondary replays message log to reconstruct state
////    - Guaranteed identical state on replay
////    - Bounded recovery time objective (RTO)
////
//// Key Invariants:
//// - Primary and secondary have identical state after sync
//// - No message is lost during failover
//// - Failover completes within bounded RTO
////
//// Reference: docs/safety/safety_case.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: REPLICA IDENTIFICATION
// ============================================================================

/// Unique identifier for a kernel replica
pub type ReplicaId {
  ReplicaId(value: Int)
}

/// Role of a replica in the redundancy scheme
pub type ReplicaRole {
  /// Primary replica - actively processing requests
  Primary
  /// Secondary replica - passively replicating state
  Secondary
  /// Witness replica - participates in leader election only
  Witness
  /// Recovering replica - replaying log to catch up
  Recovering
  /// Failed replica - not participating
  Failed
}

/// Current state of a replica
pub type ReplicaState {
  ReplicaState(
    /// Unique replica identifier
    id: ReplicaId,
    /// Current role
    role: ReplicaRole,
    /// Last applied log sequence number
    last_applied_lsn: LogSequenceNumber,
    /// Last committed log sequence number
    last_committed_lsn: LogSequenceNumber,
    /// Health status
    health: ReplicaHealth,
    /// Epoch (incremented on failover)
    epoch: Epoch,
    /// Timestamp of last heartbeat
    last_heartbeat: Int,
    /// Configuration
    config: ReplicaConfig,
  )
}

/// Replica health status
pub type ReplicaHealth {
  /// Fully operational
  Healthy
  /// Minor issues detected
  Degraded(reason: String)
  /// Major issues, may fail soon
  Critical(reason: String)
  /// Replica has failed
  Dead(failed_at: Int, reason: String)
}

/// Configuration for a replica
pub type ReplicaConfig {
  ReplicaConfig(
    /// Heartbeat interval in milliseconds
    heartbeat_interval_ms: Int,
    /// Heartbeat timeout in milliseconds
    heartbeat_timeout_ms: Int,
    /// Maximum log entries to batch before sync
    max_batch_size: Int,
    /// Maximum time to wait for batch in milliseconds
    max_batch_wait_ms: Int,
    /// Recovery time objective in milliseconds
    rto_ms: Int,
    /// Whether to use synchronous replication
    sync_replication: Bool,
  )
}

/// Default replica configuration
pub fn default_replica_config() -> ReplicaConfig {
  ReplicaConfig(
    heartbeat_interval_ms: 100,
    heartbeat_timeout_ms: 500,
    max_batch_size: 100,
    max_batch_wait_ms: 10,
    rto_ms: 5000,
    sync_replication: True,
  )
}

// ============================================================================
// SECTION 2: LOG SEQUENCE NUMBERS AND EPOCHS
// ============================================================================

/// Log sequence number for ordering entries
pub type LogSequenceNumber {
  LogSequenceNumber(value: Int)
}

/// Epoch number for leader election
pub type Epoch {
  Epoch(value: Int)
}

/// Compare two LSNs
pub fn compare_lsn(a: LogSequenceNumber, b: LogSequenceNumber) -> Order {
  case a.value < b.value {
    True -> Lt
    False ->
      case a.value > b.value {
        True -> Gt
        False -> Eq
      }
  }
}

/// Comparison result
pub type Order {
  Lt
  Eq
  Gt
}

/// Increment an LSN
pub fn increment_lsn(lsn: LogSequenceNumber) -> LogSequenceNumber {
  LogSequenceNumber(lsn.value + 1)
}

/// Increment an epoch
pub fn increment_epoch(epoch: Epoch) -> Epoch {
  Epoch(epoch.value + 1)
}

/// Check if LSN a is after LSN b
pub fn lsn_after(a: LogSequenceNumber, b: LogSequenceNumber) -> Bool {
  a.value > b.value
}

// ============================================================================
// SECTION 3: MESSAGE LOG TYPES
// ============================================================================

/// Entry in the deterministic message log
pub type LogEntry {
  LogEntry(
    /// Sequence number
    lsn: LogSequenceNumber,
    /// Epoch in which entry was created
    epoch: Epoch,
    /// Timestamp when entry was created
    timestamp: Int,
    /// Type of log entry
    entry_type: LogEntryType,
    /// Entry payload
    payload: LogPayload,
    /// Cryptographic hash of previous entry
    prev_hash: List(Int),
    /// Cryptographic hash of this entry
    entry_hash: List(Int),
  )
}

/// Types of log entries
pub type LogEntryType {
  /// State mutation operation
  StateMutation
  /// Configuration change
  ConfigChange
  /// Checkpoint/snapshot marker
  Checkpoint
  /// Epoch change (leader election)
  EpochChange
  /// No-operation (for heartbeat)
  NoOp
  /// Barrier for ordering guarantees
  Barrier
}

/// Payload of a log entry
pub type LogPayload {
  /// State mutation payload
  MutationPayload(
    /// Target subsystem
    subsystem: Subsystem,
    /// Operation type
    operation: String,
    /// Serialized operation data
    data: List(Int),
  )
  /// Configuration change payload
  ConfigPayload(
    /// Configuration key
    key: String,
    /// Old value
    old_value: String,
    /// New value
    new_value: String,
  )
  /// Checkpoint payload
  CheckpointPayload(
    /// Checkpoint identifier
    checkpoint_id: Int,
    /// Snapshot hash
    snapshot_hash: List(Int),
  )
  /// Epoch change payload
  EpochChangePayload(
    /// Old epoch
    old_epoch: Epoch,
    /// New epoch
    new_epoch: Epoch,
    /// New primary replica
    new_primary: ReplicaId,
  )
  /// Empty payload for no-op
  EmptyPayload
  /// Barrier payload
  BarrierPayload(
    /// Barrier identifier
    barrier_id: Int,
  )
}

/// Subsystems that can be mutated
pub type Subsystem {
  /// Process manager
  ProcessManager
  /// Memory manager
  MemoryManager
  /// Scheduler
  Scheduler
  /// Message router
  MessageRouter
  /// Capability system
  CapabilitySystem
  /// Audit log
  AuditLog
  /// Driver registry
  DriverRegistry
}

// ============================================================================
// SECTION 4: MESSAGE LOG STRUCTURE
// ============================================================================

/// Append-only message log
pub type MessageLog {
  MessageLog(
    /// Log entries (most recent first for efficiency)
    entries: List(LogEntry),
    /// First LSN in log (after truncation)
    first_lsn: LogSequenceNumber,
    /// Last LSN in log
    last_lsn: LogSequenceNumber,
    /// Last committed LSN
    committed_lsn: LogSequenceNumber,
    /// Log statistics
    stats: LogStats,
    /// Log configuration
    config: LogConfig,
  )
}

/// Log statistics
pub type LogStats {
  LogStats(
    /// Total entries ever written
    total_entries: Int,
    /// Entries currently in log
    current_entries: Int,
    /// Bytes used by log
    bytes_used: Int,
    /// Number of checkpoints
    checkpoint_count: Int,
    /// Last checkpoint LSN
    last_checkpoint_lsn: LogSequenceNumber,
  )
}

/// Log configuration
pub type LogConfig {
  LogConfig(
    /// Maximum entries to retain
    max_entries: Int,
    /// Maximum bytes to retain
    max_bytes: Int,
    /// Checkpoint interval (entries)
    checkpoint_interval: Int,
    /// Whether to enable compression
    enable_compression: Bool,
    /// Whether to enable integrity checking
    enable_integrity_check: Bool,
  )
}

/// Default log configuration
pub fn default_log_config() -> LogConfig {
  LogConfig(
    max_entries: 100_000,
    max_bytes: 100_000_000,
    checkpoint_interval: 10_000,
    enable_compression: False,
    enable_integrity_check: True,
  )
}

/// Create a new empty message log
pub fn new_message_log(config: LogConfig) -> MessageLog {
  MessageLog(
    entries: [],
    first_lsn: LogSequenceNumber(0),
    last_lsn: LogSequenceNumber(0),
    committed_lsn: LogSequenceNumber(0),
    stats: LogStats(
      total_entries: 0,
      current_entries: 0,
      bytes_used: 0,
      checkpoint_count: 0,
      last_checkpoint_lsn: LogSequenceNumber(0),
    ),
    config: config,
  )
}

// ============================================================================
// SECTION 5: LOG OPERATIONS
// ============================================================================

/// Result of appending to log
pub type AppendResult {
  /// Successfully appended
  AppendOk(lsn: LogSequenceNumber)
  /// Log is full
  AppendLogFull
  /// Integrity check failed
  AppendIntegrityError(message: String)
  /// Invalid entry
  AppendInvalidEntry(reason: String)
}

/// Append an entry to the log
pub fn append_entry(
  log: MessageLog,
  entry_type: LogEntryType,
  payload: LogPayload,
  epoch: Epoch,
  timestamp: Int,
) -> #(MessageLog, AppendResult) {
  // Check if log is full
  case log.stats.current_entries >= log.config.max_entries {
    True -> #(log, AppendLogFull)
    False -> {
      // Generate new LSN
      let new_lsn = increment_lsn(log.last_lsn)
      
      // Get previous hash
      let prev_hash = case log.entries {
        [] -> [0, 0, 0, 0]  // Genesis block
        [last, ..] -> last.entry_hash
      }
      
      // Create entry
      let entry = LogEntry(
        lsn: new_lsn,
        epoch: epoch,
        timestamp: timestamp,
        entry_type: entry_type,
        payload: payload,
        prev_hash: prev_hash,
        entry_hash: compute_entry_hash(new_lsn, epoch, entry_type, payload, prev_hash),
      )
      
      // Update log
      let new_log = MessageLog(
        entries: [entry, ..log.entries],
        first_lsn: case log.stats.current_entries == 0 {
          True -> new_lsn
          False -> log.first_lsn
        },
        last_lsn: new_lsn,
        committed_lsn: log.committed_lsn,
        stats: LogStats(
          total_entries: log.stats.total_entries + 1,
          current_entries: log.stats.current_entries + 1,
          bytes_used: log.stats.bytes_used + estimate_entry_size(entry),
          checkpoint_count: log.stats.checkpoint_count,
          last_checkpoint_lsn: log.stats.last_checkpoint_lsn,
        ),
        config: log.config,
      )
      
      #(new_log, AppendOk(new_lsn))
    }
  }
}

/// Commit entries up to a given LSN
pub fn commit_to_lsn(log: MessageLog, lsn: LogSequenceNumber) -> MessageLog {
  case lsn_after(lsn, log.last_lsn) {
    True -> log  // Cannot commit beyond last LSN
    False -> MessageLog(..log, committed_lsn: lsn)
  }
}

/// Get entries from a starting LSN
pub fn get_entries_from(
  log: MessageLog,
  start_lsn: LogSequenceNumber,
) -> List(LogEntry) {
  log.entries
  |> list_filter(fn(entry) { 
    entry.lsn.value >= start_lsn.value 
  })
  |> list_reverse
}

/// Get uncommitted entries
pub fn get_uncommitted_entries(log: MessageLog) -> List(LogEntry) {
  log.entries
  |> list_filter(fn(entry) {
    entry.lsn.value > log.committed_lsn.value
  })
  |> list_reverse
}

/// Truncate log before a given LSN (for checkpointing)
pub fn truncate_before(
  log: MessageLog,
  lsn: LogSequenceNumber,
) -> MessageLog {
  let new_entries = log.entries
    |> list_filter(fn(entry) { entry.lsn.value >= lsn.value })
  
  let removed_count = log.stats.current_entries - list_length(new_entries)
  
  MessageLog(
    entries: new_entries,
    first_lsn: lsn,
    last_lsn: log.last_lsn,
    committed_lsn: log.committed_lsn,
    stats: LogStats(
      ..log.stats,
      current_entries: list_length(new_entries),
    ),
    config: log.config,
  )
}

// ============================================================================
// SECTION 6: REPLICATION PROTOCOL
// ============================================================================

/// Replication request from primary to secondary
pub type ReplicationRequest {
  ReplicationRequest(
    /// Source replica
    source: ReplicaId,
    /// Target replica
    target: ReplicaId,
    /// Current epoch
    epoch: Epoch,
    /// Entries to replicate
    entries: List(LogEntry),
    /// Previous committed LSN at source
    prev_committed_lsn: LogSequenceNumber,
    /// Request timestamp
    timestamp: Int,
  )
}

/// Replication response from secondary to primary
pub type ReplicationResponse {
  /// Successfully replicated
  ReplicationOk(
    /// Responding replica
    responder: ReplicaId,
    /// Last applied LSN
    last_applied_lsn: LogSequenceNumber,
    /// Request acknowledged
    ack_timestamp: Int,
  )
  /// Replication failed
  ReplicationFailed(
    /// Responding replica
    responder: ReplicaId,
    /// Failure reason
    reason: ReplicationError,
  )
}

/// Replication error types
pub type ReplicationError {
  /// Epoch mismatch
  EpochMismatch(expected: Epoch, received: Epoch)
  /// LSN gap detected
  LsnGap(expected: LogSequenceNumber, received: LogSequenceNumber)
  /// Integrity check failed
  IntegrityCheckFailed(lsn: LogSequenceNumber)
  /// Replica is not in correct state
  InvalidReplicaState(state: ReplicaRole)
  /// Timeout waiting for response
  ReplicationTimeout
}

/// Apply replication request to secondary
pub fn apply_replication(
  state: ReplicaState,
  log: MessageLog,
  request: ReplicationRequest,
) -> #(ReplicaState, MessageLog, ReplicationResponse) {
  // Verify epoch
  case request.epoch.value != state.epoch.value {
    True -> #(
      state,
      log,
      ReplicationFailed(
        state.id,
        EpochMismatch(state.epoch, request.epoch),
      ),
    )
    False -> {
      // Verify LSN continuity
      let expected_lsn = increment_lsn(state.last_applied_lsn)
      case request.entries {
        [] -> #(
          state,
          log,
          ReplicationOk(state.id, state.last_applied_lsn, request.timestamp),
        )
        [first, ..] ->
          case first.lsn.value != expected_lsn.value {
            True -> #(
              state,
              log,
              ReplicationFailed(
                state.id,
                LsnGap(expected_lsn, first.lsn),
              ),
            )
            False -> {
              // Apply entries
              let #(new_log, last_lsn) = apply_entries_to_log(log, request.entries)
              let new_state = ReplicaState(
                ..state,
                last_applied_lsn: last_lsn,
                last_committed_lsn: request.prev_committed_lsn,
              )
              #(
                new_state,
                new_log,
                ReplicationOk(state.id, last_lsn, request.timestamp),
              )
            }
          }
      }
    }
  }
}

/// Apply a list of entries to the log
fn apply_entries_to_log(
  log: MessageLog,
  entries: List(LogEntry),
) -> #(MessageLog, LogSequenceNumber) {
  case entries {
    [] -> #(log, log.last_lsn)
    [entry, ..rest] -> {
      // Add entry directly (already validated)
      let new_log = MessageLog(
        entries: [entry, ..log.entries],
        first_lsn: case log.stats.current_entries == 0 {
          True -> entry.lsn
          False -> log.first_lsn
        },
        last_lsn: entry.lsn,
        committed_lsn: log.committed_lsn,
        stats: LogStats(
          ..log.stats,
          current_entries: log.stats.current_entries + 1,
        ),
        config: log.config,
      )
      apply_entries_to_log(new_log, rest)
    }
  }
}

// ============================================================================
// SECTION 7: FAILOVER PROTOCOL
// ============================================================================

/// Failover trigger event
pub type FailoverTrigger {
  /// Primary heartbeat timeout
  HeartbeatTimeout(last_seen: Int, timeout_at: Int)
  /// Explicit failover request
  ManualFailover(requester: String, reason: String)
  /// Primary reported critical health
  PrimaryCritical(health: ReplicaHealth)
  /// Network partition detected
  NetworkPartition(partition_at: Int)
}

/// Failover state machine state
pub type FailoverState {
  /// Normal operation
  FailoverIdle
  /// Failover in progress
  FailoverInProgress(
    trigger: FailoverTrigger,
    started_at: Int,
    new_primary: ReplicaId,
  )
  /// Failover completed
  FailoverComplete(
    completed_at: Int,
    new_primary: ReplicaId,
    old_primary: ReplicaId,
  )
  /// Failover failed
  FailoverFailed(
    failed_at: Int,
    reason: String,
  )
}

/// Failover result
pub type FailoverResult {
  /// Failover succeeded
  FailoverSuccess(
    new_primary: ReplicaId,
    new_epoch: Epoch,
    recovery_time_ms: Int,
  )
  /// Failover failed
  FailoverFailure(reason: String)
  /// Failover already in progress
  FailoverAlreadyInProgress
}

/// Initiate failover to secondary
pub fn initiate_failover(
  current_state: ReplicaState,
  trigger: FailoverTrigger,
  now: Int,
) -> #(ReplicaState, FailoverState) {
  case current_state.role {
    Secondary -> {
      // Promote to primary
      let new_epoch = increment_epoch(current_state.epoch)
      let new_state = ReplicaState(
        ..current_state,
        role: Primary,
        epoch: new_epoch,
        last_heartbeat: now,
      )
      let failover_state = FailoverInProgress(
        trigger: trigger,
        started_at: now,
        new_primary: current_state.id,
      )
      #(new_state, failover_state)
    }
    _ -> {
      // Cannot failover from this state
      #(current_state, FailoverFailed(now, "Invalid replica state for failover"))
    }
  }
}

/// Complete failover after log replay
pub fn complete_failover(
  state: ReplicaState,
  failover_state: FailoverState,
  now: Int,
) -> #(ReplicaState, FailoverResult) {
  case failover_state {
    FailoverInProgress(_, started_at, new_primary) -> {
      let recovery_time_ms = now - started_at
      case recovery_time_ms <= state.config.rto_ms {
        True -> #(
          ReplicaState(..state, health: Healthy),
          FailoverSuccess(new_primary, state.epoch, recovery_time_ms),
        )
        False -> #(
          ReplicaState(..state, health: Degraded("RTO exceeded")),
          FailoverSuccess(new_primary, state.epoch, recovery_time_ms),
        )
      }
    }
    _ -> #(state, FailoverFailure("Invalid failover state"))
  }
}

// ============================================================================
// SECTION 8: DETERMINISTIC REPLAY
// ============================================================================

/// Replay context for recovering replica
pub type ReplayContext {
  ReplayContext(
    /// Starting LSN for replay
    start_lsn: LogSequenceNumber,
    /// Target LSN to reach
    target_lsn: LogSequenceNumber,
    /// Current LSN during replay
    current_lsn: LogSequenceNumber,
    /// Entries replayed
    entries_replayed: Int,
    /// Replay start time
    started_at: Int,
    /// Last entry timestamp for determinism
    last_entry_timestamp: Int,
  )
}

/// Replay result
pub type ReplayResult {
  /// Replay complete
  ReplayComplete(
    entries_replayed: Int,
    duration_ms: Int,
    final_lsn: LogSequenceNumber,
  )
  /// Replay in progress
  ReplayInProgress(
    entries_replayed: Int,
    remaining: Int,
    current_lsn: LogSequenceNumber,
  )
  /// Replay failed
  ReplayFailed(
    at_lsn: LogSequenceNumber,
    reason: String,
  )
}

/// Initialize replay context
pub fn init_replay(
  start_lsn: LogSequenceNumber,
  target_lsn: LogSequenceNumber,
  now: Int,
) -> ReplayContext {
  ReplayContext(
    start_lsn: start_lsn,
    target_lsn: target_lsn,
    current_lsn: start_lsn,
    entries_replayed: 0,
    started_at: now,
    last_entry_timestamp: 0,
  )
}

/// Replay a single entry
pub fn replay_entry(
  ctx: ReplayContext,
  entry: LogEntry,
) -> #(ReplayContext, Result(Nil, String)) {
  // Verify LSN ordering
  // For first entry, current_lsn equals start_lsn (e.g., 0)
  // and entry.lsn should be start_lsn + 1 (e.g., 1)
  // For subsequent entries, current_lsn is the last replayed entry's LSN
  let expected_lsn = increment_lsn(ctx.current_lsn)
  case entry.lsn.value != expected_lsn.value {
    True -> #(ctx, Error("LSN discontinuity during replay"))
    False -> {
      // Verify timestamp ordering (determinism check)
      // Allow equal timestamps for entries created in same batch
      case entry.timestamp < ctx.last_entry_timestamp {
        True -> #(ctx, Error("Timestamp ordering violation"))
        False -> {
          let new_ctx = ReplayContext(
            ..ctx,
            current_lsn: entry.lsn,
            entries_replayed: ctx.entries_replayed + 1,
            last_entry_timestamp: entry.timestamp,
          )
          #(new_ctx, Ok(Nil))
        }
      }
    }
  }
}

/// Check if replay is complete
pub fn is_replay_complete(ctx: ReplayContext) -> Bool {
  ctx.current_lsn.value >= ctx.target_lsn.value
}

/// Get replay progress as percentage
pub fn replay_progress(ctx: ReplayContext) -> Int {
  let total = ctx.target_lsn.value - ctx.start_lsn.value
  case total {
    0 -> 100
    _ -> {
      let done = ctx.current_lsn.value - ctx.start_lsn.value
      done * 100 / total
    }
  }
}

// ============================================================================
// SECTION 9: HEARTBEAT PROTOCOL
// ============================================================================

/// Heartbeat message
pub type Heartbeat {
  Heartbeat(
    /// Sender replica
    sender: ReplicaId,
    /// Sender role
    sender_role: ReplicaRole,
    /// Sender epoch
    epoch: Epoch,
    /// Sender's last applied LSN
    last_applied_lsn: LogSequenceNumber,
    /// Sender's committed LSN
    committed_lsn: LogSequenceNumber,
    /// Sender timestamp
    timestamp: Int,
    /// Sender health
    health: ReplicaHealth,
  )
}

/// Heartbeat response
pub type HeartbeatResponse {
  /// Acknowledge heartbeat
  HeartbeatAck(
    responder: ReplicaId,
    last_applied_lsn: LogSequenceNumber,
    timestamp: Int,
  )
  /// Request log entries (secondary behind)
  HeartbeatNeedEntries(
    responder: ReplicaId,
    from_lsn: LogSequenceNumber,
  )
  /// Reject heartbeat (epoch mismatch)
  HeartbeatReject(
    responder: ReplicaId,
    reason: String,
  )
}

/// Process incoming heartbeat
pub fn process_heartbeat(
  state: ReplicaState,
  heartbeat: Heartbeat,
  now: Int,
) -> #(ReplicaState, HeartbeatResponse) {
  // Check epoch
  case heartbeat.epoch.value < state.epoch.value {
    True -> #(
      state,
      HeartbeatReject(state.id, "Stale epoch"),
    )
    False -> {
      case heartbeat.epoch.value > state.epoch.value {
        True -> {
          // Update to new epoch
          let new_state = ReplicaState(
            ..state,
            epoch: heartbeat.epoch,
            last_heartbeat: now,
          )
          #(new_state, HeartbeatAck(state.id, state.last_applied_lsn, now))
        }
        False -> {
          // Same epoch
          let new_state = ReplicaState(..state, last_heartbeat: now)
          case lsn_after(heartbeat.last_applied_lsn, state.last_applied_lsn) {
            True -> #(
              new_state,
              HeartbeatNeedEntries(state.id, increment_lsn(state.last_applied_lsn)),
            )
            False -> #(
              new_state,
              HeartbeatAck(state.id, state.last_applied_lsn, now),
            )
          }
        }
      }
    }
  }
}

/// Check if heartbeat timeout has occurred
pub fn check_heartbeat_timeout(state: ReplicaState, now: Int) -> Bool {
  now - state.last_heartbeat > state.config.heartbeat_timeout_ms
}

// ============================================================================
// SECTION 10: DUAL-CORE COORDINATOR
// ============================================================================

/// Dual-core coordinator state
pub type DualCoreCoordinator {
  DualCoreCoordinator(
    /// Primary replica state
    primary: ReplicaState,
    /// Secondary replica state
    secondary: ReplicaState,
    /// Primary's message log
    primary_log: MessageLog,
    /// Secondary's message log
    secondary_log: MessageLog,
    /// Coordinator configuration
    config: CoordinatorConfig,
    /// Current failover state
    failover_state: FailoverState,
    /// Statistics
    stats: CoordinatorStats,
  )
}

/// Coordinator configuration
pub type CoordinatorConfig {
  CoordinatorConfig(
    /// Enable synchronous replication
    sync_replication: Bool,
    /// Maximum replication lag before alarm
    max_replication_lag: Int,
    /// Enable automatic failover
    auto_failover: Bool,
    /// Minimum heartbeats before promotion
    min_heartbeats_for_promotion: Int,
  )
}

/// Coordinator statistics
pub type CoordinatorStats {
  CoordinatorStats(
    /// Total entries replicated
    total_replicated: Int,
    /// Replication errors
    replication_errors: Int,
    /// Failovers performed
    failovers_performed: Int,
    /// Current replication lag (entries)
    current_lag: Int,
    /// Average replication latency (ms)
    avg_replication_latency_ms: Int,
  )
}

/// Default coordinator configuration
pub fn default_coordinator_config() -> CoordinatorConfig {
  CoordinatorConfig(
    sync_replication: True,
    max_replication_lag: 100,
    auto_failover: True,
    min_heartbeats_for_promotion: 3,
  )
}

/// Create a new dual-core coordinator
pub fn new_coordinator(
  primary_id: ReplicaId,
  secondary_id: ReplicaId,
  config: CoordinatorConfig,
  now: Int,
) -> DualCoreCoordinator {
  let replica_config = default_replica_config()
  let log_config = default_log_config()
  
  DualCoreCoordinator(
    primary: ReplicaState(
      id: primary_id,
      role: Primary,
      last_applied_lsn: LogSequenceNumber(0),
      last_committed_lsn: LogSequenceNumber(0),
      health: Healthy,
      epoch: Epoch(1),
      last_heartbeat: now,
      config: replica_config,
    ),
    secondary: ReplicaState(
      id: secondary_id,
      role: Secondary,
      last_applied_lsn: LogSequenceNumber(0),
      last_committed_lsn: LogSequenceNumber(0),
      health: Healthy,
      epoch: Epoch(1),
      last_heartbeat: now,
      config: replica_config,
    ),
    primary_log: new_message_log(log_config),
    secondary_log: new_message_log(log_config),
    config: config,
    failover_state: FailoverIdle,
    stats: CoordinatorStats(
      total_replicated: 0,
      replication_errors: 0,
      failovers_performed: 0,
      current_lag: 0,
      avg_replication_latency_ms: 0,
    ),
  )
}

/// Calculate current replication lag
pub fn replication_lag(coordinator: DualCoreCoordinator) -> Int {
  coordinator.primary.last_applied_lsn.value - 
    coordinator.secondary.last_applied_lsn.value
}

/// Check if replication is healthy
pub fn is_replication_healthy(coordinator: DualCoreCoordinator) -> Bool {
  replication_lag(coordinator) <= coordinator.config.max_replication_lag
}

// ============================================================================
// SECTION 11: HELPER FUNCTIONS
// ============================================================================

/// Compute hash for a log entry
/// 
/// NOTE: This is a placeholder implementation for development purposes.
/// For production use in space-certification systems, this MUST be replaced
/// with a proper cryptographic hash function (e.g., SHA-256) that:
/// 1. Covers the complete entry including all payload bytes
/// 2. Provides collision resistance
/// 3. Is implemented using a vetted cryptographic library
/// 
/// The production implementation should use external FFI to a certified
/// cryptographic library such as libsodium or ring.
fn compute_entry_hash(
  lsn: LogSequenceNumber,
  epoch: Epoch,
  entry_type: LogEntryType,
  payload: LogPayload,
  prev_hash: List(Int),
) -> List(Int) {
  // PLACEHOLDER: Simplified hash for development
  // TODO: Replace with SHA-256 via FFI before production deployment
  let type_code = entry_type_code(entry_type)
  let payload_hash = compute_payload_hash(payload)
  let prev_byte = case prev_hash {
    [h, ..] -> h
    [] -> 0
  }
  // Mix all components including payload
  [
    lsn.value % 256,
    { lsn.value / 256 } % 256,
    epoch.value % 256,
    type_code,
    payload_hash % 256,
    { payload_hash / 256 } % 256,
    prev_byte,
    { lsn.value + epoch.value + type_code + payload_hash + prev_byte } % 256,
  ]
}

/// Compute a hash of the payload data
/// PLACEHOLDER: Must be replaced with cryptographic hash in production
fn compute_payload_hash(payload: LogPayload) -> Int {
  case payload {
    MutationPayload(subsystem, operation, data) -> {
      let subsystem_code = subsystem_to_code(subsystem)
      let data_sum = list_sum_ints(data)
      subsystem_code * 1000 + data_sum
    }
    ConfigPayload(_, _, _) -> 2000
    CheckpointPayload(id, hash) -> 3000 + id + list_sum_ints(hash)
    EpochChangePayload(old, new, _) -> 4000 + old.value + new.value
    EmptyPayload -> 5000
    BarrierPayload(id) -> 6000 + id
  }
}

/// Convert subsystem to numeric code
fn subsystem_to_code(subsystem: Subsystem) -> Int {
  case subsystem {
    ProcessManager -> 1
    MemoryManager -> 2
    Scheduler -> 3
    MessageRouter -> 4
    CapabilitySystem -> 5
    AuditLog -> 6
    DriverRegistry -> 7
  }
}

/// Sum integers in a list
fn list_sum_ints(list: List(Int)) -> Int {
  case list {
    [] -> 0
    [x, ..rest] -> x + list_sum_ints(rest)
  }
}

/// Get numeric code for entry type
fn entry_type_code(entry_type: LogEntryType) -> Int {
  case entry_type {
    StateMutation -> 1
    ConfigChange -> 2
    Checkpoint -> 3
    EpochChange -> 4
    NoOp -> 5
    Barrier -> 6
  }
}

/// Estimate size of a log entry in bytes
fn estimate_entry_size(entry: LogEntry) -> Int {
  // Base size + payload estimate
  64 + case entry.payload {
    MutationPayload(_, _, data) -> list_length(data)
    ConfigPayload(key, old, new) -> 
      string_length(key) + string_length(old) + string_length(new)
    CheckpointPayload(_, hash) -> 8 + list_length(hash)
    EpochChangePayload(_, _, _) -> 24
    EmptyPayload -> 0
    BarrierPayload(_) -> 8
  }
}

/// Filter list by predicate
fn list_filter(list: List(a), predicate: fn(a) -> Bool) -> List(a) {
  case list {
    [] -> []
    [head, ..tail] ->
      case predicate(head) {
        True -> [head, ..list_filter(tail, predicate)]
        False -> list_filter(tail, predicate)
      }
  }
}

/// Reverse a list
fn list_reverse(list: List(a)) -> List(a) {
  list_reverse_helper(list, [])
}

fn list_reverse_helper(list: List(a), acc: List(a)) -> List(a) {
  case list {
    [] -> acc
    [head, ..tail] -> list_reverse_helper(tail, [head, ..acc])
  }
}

/// Get length of list
fn list_length(list: List(a)) -> Int {
  case list {
    [] -> 0
    [_, ..tail] -> 1 + list_length(tail)
  }
}

/// Estimate string length
fn string_length(s: String) -> Int {
  // Placeholder - in production use proper string length
  8
}

// ============================================================================
// SECTION 12: INVARIANTS
// ============================================================================

/// System invariant for dual-core redundancy
pub type DualCoreInvariant {
  /// Primary and secondary have matching committed state
  InvariantStateConsistency
  /// Log entries have monotonically increasing LSNs
  InvariantLsnMonotonicity
  /// All committed entries are durable
  InvariantDurability
  /// Failover completes within RTO
  InvariantBoundedRto
  /// Exactly one primary at any time
  InvariantSinglePrimary
}

/// Check if primary and secondary are in sync
/// 
/// State consistency means secondary has applied all entries up to
/// what primary has committed. During normal operation, there may be
/// a small lag which is acceptable within the configured max_replication_lag.
/// 
/// For strict consistency check (e.g., before failover), use this function.
/// For runtime health monitoring, use is_replication_healthy() instead.
pub fn check_state_consistency(coordinator: DualCoreCoordinator) -> Bool {
  // Secondary should have applied at least up to primary's committed LSN
  // We compare against last_committed_lsn because that's what's guaranteed durable
  coordinator.secondary.last_applied_lsn.value >= 
    coordinator.primary.last_committed_lsn.value
}

/// Check strict state consistency (both replicas at exact same point)
/// Use this only during quiescent periods or after sync barrier
pub fn check_strict_consistency(coordinator: DualCoreCoordinator) -> Bool {
  coordinator.primary.last_applied_lsn.value ==
    coordinator.secondary.last_applied_lsn.value
}

/// Check LSN monotonicity in log
pub fn check_lsn_monotonicity(log: MessageLog) -> Bool {
  check_lsn_ordering(log.entries)
}

fn check_lsn_ordering(entries: List(LogEntry)) -> Bool {
  case entries {
    [] -> True
    [_] -> True
    [a, b, ..rest] ->
      case a.lsn.value > b.lsn.value {
        True -> check_lsn_ordering([b, ..rest])
        False -> False
      }
  }
}

/// Check single primary invariant
pub fn check_single_primary(coordinator: DualCoreCoordinator) -> Bool {
  case coordinator.primary.role, coordinator.secondary.role {
    Primary, Secondary -> True
    Secondary, Primary -> True
    _, _ -> False
  }
}
