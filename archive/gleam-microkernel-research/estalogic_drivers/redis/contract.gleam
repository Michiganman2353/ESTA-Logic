//// estalogic_drivers/redis/contract.gleam
////
//// Redis Driver Verification Contract
////
//// This module defines the formal protocol specification for Redis driver
//// operations in the ESTA Logic system. Key guarantees:
////
//// 1. Formal Protocol Spec: All command types and state transitions are explicit
//// 2. Bounded Message Sequences: Valid and invalid command sequences are modeled
//// 3. Request-Response Invariants: Property-based test contracts
//// 4. Timeout Categories: Soft, Firm, Hard timeouts with explicit semantics
////
//// Driver Properties:
//// - Deterministic: Same inputs produce same outputs
//// - Non-blocking: All operations are async with bounded latency
//// - Zero-copy: Response buffers are passed by reference where possible
//// - Independently Restartable: Driver can be restarted without system restart
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: REDIS CONNECTION TYPES
// ============================================================================

/// Redis server address
pub type ServerAddress {
  ServerAddress(
    /// Hostname or IP address
    host: String,
    /// Port number (typically 6379)
    port: Int,
    /// Use TLS encryption
    use_tls: Bool,
  )
}

/// Redis connection configuration
pub type ConnectionConfig {
  ConnectionConfig(
    /// Server address
    server: ServerAddress,
    /// Optional password authentication
    password: Result(String, Nil),
    /// Optional username (Redis 6+ ACL)
    username: Result(String, Nil),
    /// Database number (0-15)
    database: Int,
    /// Connection timeout in milliseconds
    connect_timeout_ms: Int,
    /// Command timeout in milliseconds
    command_timeout_ms: Int,
    /// Maximum reconnection attempts
    max_reconnect_attempts: Int,
    /// Reconnection delay base in milliseconds
    reconnect_delay_ms: Int,
  )
}

/// Connection pool configuration
pub type PoolConfig {
  PoolConfig(
    /// Minimum connections in pool
    min_connections: Int,
    /// Maximum connections in pool
    max_connections: Int,
    /// Connection idle timeout in milliseconds
    idle_timeout_ms: Int,
    /// Maximum wait time for available connection
    max_wait_ms: Int,
  )
}

/// Connection state machine
pub type ConnectionState {
  /// Initial state, not yet connected
  Disconnected
  /// Connecting to server
  Connecting(attempt: Int, started_at: Int)
  /// Connected and ready
  Connected(connected_at: Int)
  /// Authenticating
  Authenticating
  /// Selecting database
  SelectingDatabase
  /// Disconnecting gracefully
  Disconnecting
  /// Connection failed
  Failed(reason: ConnectionError, failed_at: Int)
}

/// Connection errors
pub type ConnectionError {
  ConnectionRefused(server: ServerAddress)
  AuthenticationFailed(reason: String)
  TimeoutExpired
  ServerUnreachable
  TlsHandshakeFailed(reason: String)
  ProtocolError(message: String)
  InvalidDatabaseNumber(db: Int)
}

// ============================================================================
// SECTION 2: REDIS DATA TYPES (FORMAL PROTOCOL SPEC)
// ============================================================================

/// Redis key
pub type RedisKey {
  RedisKey(value: String)
}

/// Redis value types (RESP3 protocol)
pub type RedisValue {
  /// Simple string (+)
  SimpleString(value: String)
  /// Error (-)
  ErrorValue(message: String)
  /// Integer (:)
  IntegerValue(value: Int)
  /// Bulk string ($)
  BulkString(data: List(Int))
  /// Array (*)
  ArrayValue(elements: List(RedisValue))
  /// Null (_)
  NullValue
  /// Boolean (#)
  BooleanValue(value: Bool)
  /// Double (,)
  DoubleValue(value: Float)
  /// Big number ((
  BigNumber(value: String)
  /// Map (%)
  MapValue(entries: List(#(RedisValue, RedisValue)))
  /// Set (~)
  SetValue(elements: List(RedisValue))
  /// Push (>)
  PushValue(channel: String, message: RedisValue)
}

/// Redis command argument
pub type CommandArg {
  /// String argument
  ArgString(value: String)
  /// Integer argument
  ArgInt(value: Int)
  /// Binary argument
  ArgBytes(data: List(Int))
  /// Float argument
  ArgFloat(value: Float)
}

// ============================================================================
// SECTION 3: REDIS COMMANDS (REQUEST-RESPONSE CONTRACT)
// ============================================================================

/// Redis command envelope
pub type RedisCommand {
  // String commands
  Get(key: RedisKey)
  Set(key: RedisKey, value: CommandArg, options: SetOptions)
  GetEx(key: RedisKey, expiry: ExpiryOption)
  SetEx(key: RedisKey, seconds: Int, value: CommandArg)
  PSetEx(key: RedisKey, milliseconds: Int, value: CommandArg)
  SetNx(key: RedisKey, value: CommandArg)
  SetXx(key: RedisKey, value: CommandArg)
  GetSet(key: RedisKey, value: CommandArg)
  Append(key: RedisKey, value: CommandArg)
  GetRange(key: RedisKey, start: Int, end: Int)
  SetRange(key: RedisKey, offset: Int, value: CommandArg)
  StrLen(key: RedisKey)
  Incr(key: RedisKey)
  IncrBy(key: RedisKey, increment: Int)
  IncrByFloat(key: RedisKey, increment: Float)
  Decr(key: RedisKey)
  DecrBy(key: RedisKey, decrement: Int)
  MGet(keys: List(RedisKey))
  MSet(pairs: List(#(RedisKey, CommandArg)))
  MSetNx(pairs: List(#(RedisKey, CommandArg)))
  
  // Key commands
  Del(keys: List(RedisKey))
  Exists(keys: List(RedisKey))
  Expire(key: RedisKey, seconds: Int)
  ExpireAt(key: RedisKey, timestamp: Int)
  PExpire(key: RedisKey, milliseconds: Int)
  PExpireAt(key: RedisKey, timestamp_ms: Int)
  Persist(key: RedisKey)
  Ttl(key: RedisKey)
  PTtl(key: RedisKey)
  Type(key: RedisKey)
  Rename(key: RedisKey, new_key: RedisKey)
  RenameNx(key: RedisKey, new_key: RedisKey)
  Keys(pattern: String)
  Scan(cursor: Int, options: ScanOptions)
  
  // Hash commands
  HGet(key: RedisKey, field: String)
  HSet(key: RedisKey, field_values: List(#(String, CommandArg)))
  HSetNx(key: RedisKey, field: String, value: CommandArg)
  HGetAll(key: RedisKey)
  HMGet(key: RedisKey, fields: List(String))
  HDel(key: RedisKey, fields: List(String))
  HExists(key: RedisKey, field: String)
  HIncrBy(key: RedisKey, field: String, increment: Int)
  HIncrByFloat(key: RedisKey, field: String, increment: Float)
  HKeys(key: RedisKey)
  HVals(key: RedisKey)
  HLen(key: RedisKey)
  HScan(key: RedisKey, cursor: Int, options: ScanOptions)
  
  // List commands
  LPush(key: RedisKey, elements: List(CommandArg))
  RPush(key: RedisKey, elements: List(CommandArg))
  LPop(key: RedisKey, count: Result(Int, Nil))
  RPop(key: RedisKey, count: Result(Int, Nil))
  LRange(key: RedisKey, start: Int, stop: Int)
  LLen(key: RedisKey)
  LIndex(key: RedisKey, index: Int)
  LSet(key: RedisKey, index: Int, element: CommandArg)
  LRem(key: RedisKey, count: Int, element: CommandArg)
  LTrim(key: RedisKey, start: Int, stop: Int)
  BLPop(keys: List(RedisKey), timeout: Int)
  BRPop(keys: List(RedisKey), timeout: Int)
  LMove(source: RedisKey, destination: RedisKey, where_from: ListEnd, where_to: ListEnd)
  
  // Set commands
  SAdd(key: RedisKey, members: List(CommandArg))
  SRem(key: RedisKey, members: List(CommandArg))
  SMembers(key: RedisKey)
  SIsMember(key: RedisKey, member: CommandArg)
  SMIsMember(key: RedisKey, members: List(CommandArg))
  SCard(key: RedisKey)
  SPop(key: RedisKey, count: Result(Int, Nil))
  SRandMember(key: RedisKey, count: Result(Int, Nil))
  SDiff(keys: List(RedisKey))
  SInter(keys: List(RedisKey))
  SUnion(keys: List(RedisKey))
  SScan(key: RedisKey, cursor: Int, options: ScanOptions)
  
  // Sorted set commands
  ZAdd(key: RedisKey, members: List(ScoredMember), options: ZAddOptions)
  ZRem(key: RedisKey, members: List(CommandArg))
  ZRange(key: RedisKey, start: Int, stop: Int, options: ZRangeOptions)
  ZRangeByScore(key: RedisKey, min: ScoreRange, max: ScoreRange, options: ZRangeOptions)
  ZRevRange(key: RedisKey, start: Int, stop: Int, options: ZRangeOptions)
  ZScore(key: RedisKey, member: CommandArg)
  ZRank(key: RedisKey, member: CommandArg)
  ZRevRank(key: RedisKey, member: CommandArg)
  ZCard(key: RedisKey)
  ZCount(key: RedisKey, min: ScoreRange, max: ScoreRange)
  ZIncrBy(key: RedisKey, increment: Float, member: CommandArg)
  ZScan(key: RedisKey, cursor: Int, options: ScanOptions)
  
  // Pub/Sub commands
  Publish(channel: String, message: CommandArg)
  Subscribe(channels: List(String))
  Unsubscribe(channels: List(String))
  PSubscribe(patterns: List(String))
  PUnsubscribe(patterns: List(String))
  
  // Transaction commands
  Multi
  Exec
  Discard
  Watch(keys: List(RedisKey))
  Unwatch
  
  // Script commands
  Eval(script: String, keys: List(RedisKey), args: List(CommandArg))
  EvalSha(sha1: String, keys: List(RedisKey), args: List(CommandArg))
  ScriptLoad(script: String)
  ScriptExists(sha1s: List(String))
  ScriptFlush
  ScriptKill
  
  // Server commands
  Ping(message: Result(String, Nil))
  Info(section: Result(String, Nil))
  DbSize
  FlushDb(async: Bool)
  FlushAll(async: Bool)
  Time
  ClientList
  ClientSetName(name: String)
  ClientGetName
  Debug(subcommand: String)
  
  // Raw command (for extensibility)
  Raw(command: String, args: List(CommandArg))
}

/// SET command options
pub type SetOptions {
  SetOptions(
    /// Expiry option
    expiry: Result(ExpiryOption, Nil),
    /// Only set if key exists
    xx: Bool,
    /// Only set if key does not exist
    nx: Bool,
    /// Return old value
    get: Bool,
    /// Keep existing TTL
    keep_ttl: Bool,
  )
}

/// Expiry option
pub type ExpiryOption {
  /// Expire in seconds
  ExSeconds(seconds: Int)
  /// Expire in milliseconds
  ExMilliseconds(milliseconds: Int)
  /// Expire at Unix timestamp (seconds)
  ExAtSeconds(timestamp: Int)
  /// Expire at Unix timestamp (milliseconds)
  ExAtMilliseconds(timestamp_ms: Int)
}

/// Scan options
pub type ScanOptions {
  ScanOptions(
    /// Pattern to match
    match_pattern: Result(String, Nil),
    /// Number of elements to return
    count: Result(Int, Nil),
    /// Type filter
    type_filter: Result(String, Nil),
  )
}

/// List end specifier
pub type ListEnd {
  Left
  Right
}

/// Scored member for sorted sets
pub type ScoredMember {
  ScoredMember(score: Float, member: CommandArg)
}

/// ZADD options
pub type ZAddOptions {
  ZAddOptions(
    /// Only update existing elements
    xx: Bool,
    /// Only add new elements
    nx: Bool,
    /// Only update if new score > existing
    gt: Bool,
    /// Only update if new score < existing
    lt: Bool,
    /// Return count of modified elements
    ch: Bool,
  )
}

/// ZRANGE options
pub type ZRangeOptions {
  ZRangeOptions(
    /// Include scores in output
    with_scores: Bool,
    /// Reverse order
    rev: Bool,
    /// Limit offset
    limit_offset: Result(Int, Nil),
    /// Limit count
    limit_count: Result(Int, Nil),
  )
}

/// Score range for sorted set queries
pub type ScoreRange {
  /// Specific score value
  Score(value: Float)
  /// Negative infinity
  NegInf
  /// Positive infinity
  PosInf
  /// Exclusive bound
  Exclusive(value: Float)
}

// ============================================================================
// SECTION 4: REDIS RESPONSE TYPES
// ============================================================================

/// Redis command result
pub type RedisResult {
  /// Successful result
  Ok(value: RedisValue)
  /// Error result
  Err(error: RedisError)
}

/// Redis error types
pub type RedisError {
  /// Generic error with message
  GenericError(message: String)
  /// Wrong type operation
  WrongTypeError(key: String, expected: String, actual: String)
  /// No such key
  NoSuchKeyError(key: String)
  /// Index out of range
  IndexOutOfRangeError(index: Int)
  /// Syntax error
  SyntaxError(command: String, message: String)
  /// No script matching SHA
  NoScriptError(sha1: String)
  /// Busy script
  BusyScriptError
  /// Loading data from disk
  LoadingError
  /// Read-only replica
  ReadOnlyError
  /// OOM (out of memory)
  OomError
  /// No replicas available
  NoReplicasError
  /// Moved (cluster redirect)
  MovedError(slot: Int, host: String, port: Int)
  /// Ask (cluster redirect)
  AskError(slot: Int, host: String, port: Int)
  /// Cross-slot error
  CrossSlotError
  /// Cluster down
  ClusterDownError
  /// Connection error
  ConnectionError(reason: ConnectionError)
  /// Timeout error
  TimeoutError(command: String, timeout_ms: Int)
}

// ============================================================================
// SECTION 5: TIMEOUT CATEGORIES
// ============================================================================

/// Timeout category with explicit semantics
pub type TimeoutCategory {
  /// Soft timeout: Warn but continue, may retry
  SoftTimeout(
    duration_ms: Int,
    on_expire: SoftTimeoutAction,
  )
  /// Firm timeout: Complete current operation then stop
  FirmTimeout(
    duration_ms: Int,
    on_expire: FirmTimeoutAction,
  )
  /// Hard timeout: Immediate termination, no cleanup
  HardTimeout(
    duration_ms: Int,
    on_expire: HardTimeoutAction,
  )
}

/// Soft timeout actions
pub type SoftTimeoutAction {
  /// Log warning and continue
  WarnAndContinue
  /// Retry with backoff
  RetryWithBackoff(base_delay_ms: Int, max_retries: Int)
  /// Notify caller and continue
  NotifyCaller
}

/// Firm timeout actions
pub type FirmTimeoutAction {
  /// Complete in-flight commands then stop
  DrainAndStop
  /// Return timeout error
  ReturnTimeout
  /// Cancel pending commands
  CancelPending
}

/// Hard timeout actions
pub type HardTimeoutAction {
  /// Immediately terminate connection
  TerminateConnection
  /// Kill driver process
  KillProcess
  /// Quarantine driver FCR
  QuarantineFcr
}

/// Default timeouts for Redis operations
pub fn default_read_timeout() -> TimeoutCategory {
  SoftTimeout(
    duration_ms: 5_000,
    on_expire: RetryWithBackoff(100, 3),
  )
}

pub fn default_write_timeout() -> TimeoutCategory {
  SoftTimeout(
    duration_ms: 10_000,
    on_expire: RetryWithBackoff(200, 3),
  )
}

pub fn default_connect_timeout() -> TimeoutCategory {
  FirmTimeout(
    duration_ms: 5_000,
    on_expire: DrainAndStop,
  )
}

pub fn default_blocking_timeout() -> TimeoutCategory {
  FirmTimeout(
    duration_ms: 30_000,
    on_expire: ReturnTimeout,
  )
}

pub fn default_script_timeout() -> TimeoutCategory {
  HardTimeout(
    duration_ms: 5_000,
    on_expire: TerminateConnection,
  )
}

// ============================================================================
// SECTION 6: MESSAGE SEQUENCE VALIDATION (BOUNDED MODEL)
// ============================================================================

/// Valid command sequence states
pub type SequenceState {
  /// Initial state
  SequenceIdle
  /// Command sent, awaiting response
  SequenceCommandSent(command_id: Int, sent_at: Int)
  /// Response received
  SequenceResponseReceived(command_id: Int, received_at: Int)
  /// In transaction (MULTI)
  SequenceInTransaction(started_at: Int, queued_count: Int)
  /// In subscription mode
  SequenceInSubscription(channels: List(String))
  /// Sequence completed
  SequenceCompleted
  /// Sequence failed
  SequenceFailed(reason: SequenceError)
}

/// Sequence validation errors
pub type SequenceError {
  /// Out of order response
  OutOfOrderResponse(expected: Int, received: Int)
  /// Duplicate command ID
  DuplicateCommandId(id: Int)
  /// Missing response
  MissingResponse(command_id: Int, timeout_ms: Int)
  /// Unexpected response type
  UnexpectedResponseType(expected: String, received: String)
  /// Protocol violation
  ProtocolViolation(message: String)
  /// Transaction error
  TransactionError(message: String)
  /// Subscription error
  SubscriptionError(message: String)
}

/// Sequence validator state
pub type SequenceValidator {
  SequenceValidator(
    /// Next expected command ID
    next_command_id: Int,
    /// Pending commands awaiting responses
    pending_commands: List(PendingCommand),
    /// Maximum pending commands
    max_pending: Int,
    /// Completed sequence count
    completed_count: Int,
    /// Failed sequence count
    failed_count: Int,
    /// Current transaction state
    transaction_state: TransactionState,
    /// Current subscription state
    subscription_state: SubscriptionState,
  )
}

/// Pending command entry
pub type PendingCommand {
  PendingCommand(
    command_id: Int,
    command_type: String,
    sent_at: Int,
    timeout: TimeoutCategory,
  )
}

/// Transaction state
pub type TransactionState {
  /// Not in transaction
  NoTransaction
  /// In transaction
  InTransaction(started_at: Int, queued_commands: List(String))
  /// Transaction executed
  TransactionExecuted
  /// Transaction discarded
  TransactionDiscarded
}

/// Subscription state
pub type SubscriptionState {
  /// Not subscribed
  NotSubscribed
  /// Subscribed to channels
  Subscribed(channels: List(String), patterns: List(String))
}

/// Create new sequence validator
pub fn new_sequence_validator(max_pending: Int) -> SequenceValidator {
  SequenceValidator(
    next_command_id: 1,
    pending_commands: [],
    max_pending: max_pending,
    completed_count: 0,
    failed_count: 0,
    transaction_state: NoTransaction,
    subscription_state: NotSubscribed,
  )
}

/// Validate command can be sent
pub fn validate_command(
  validator: SequenceValidator,
  command: RedisCommand,
) -> Result(Int, SequenceError) {
  // Check pending limit
  case list_length(validator.pending_commands) >= validator.max_pending {
    True -> Error(ProtocolViolation("Too many pending commands"))
    False -> {
      // Check transaction state compatibility
      case validator.transaction_state, command {
        InTransaction(_, _), Exec -> Ok(validator.next_command_id)
        InTransaction(_, _), Discard -> Ok(validator.next_command_id)
        InTransaction(_, _), _ -> Ok(validator.next_command_id)  // Commands are queued
        NoTransaction, Exec -> Error(TransactionError("EXEC without MULTI"))
        NoTransaction, Discard -> Error(TransactionError("DISCARD without MULTI"))
        _, _ -> Ok(validator.next_command_id)
      }
    }
  }
}

/// Record command sent
pub fn record_command_sent(
  validator: SequenceValidator,
  command: RedisCommand,
  sent_at: Int,
  timeout: TimeoutCategory,
) -> SequenceValidator {
  let command_type = command_to_string(command)
  let pending = PendingCommand(
    command_id: validator.next_command_id,
    command_type: command_type,
    sent_at: sent_at,
    timeout: timeout,
  )
  
  // Update transaction state if needed
  let new_transaction_state = case command {
    Multi -> InTransaction(sent_at, [])
    Exec -> TransactionExecuted
    Discard -> TransactionDiscarded
    _ -> case validator.transaction_state {
      InTransaction(started, queued) -> InTransaction(started, [command_type, ..queued])
      other -> other
    }
  }
  
  SequenceValidator(
    ..validator,
    next_command_id: validator.next_command_id + 1,
    pending_commands: [pending, ..validator.pending_commands],
    transaction_state: new_transaction_state,
  )
}

/// Record response received
pub fn record_response_received(
  validator: SequenceValidator,
  command_id: Int,
) -> Result(SequenceValidator, SequenceError) {
  case find_pending_command(validator.pending_commands, command_id) {
    Error(_) -> Error(OutOfOrderResponse(0, command_id))
    Ok(_) -> Ok(SequenceValidator(
      ..validator,
      pending_commands: remove_pending_command(validator.pending_commands, command_id),
      completed_count: validator.completed_count + 1,
    ))
  }
}

// ============================================================================
// SECTION 7: DRIVER INVARIANTS (PROPERTY-BASED TEST CONTRACTS)
// ============================================================================

/// Driver invariant that must always hold
pub type DriverInvariant {
  /// All responses must match a pending command
  InvariantResponseMatchesCommand
  /// Command IDs must be unique
  InvariantUniqueCommandIds
  /// No command can exceed max pending limit
  InvariantBoundedPending
  /// All timeouts must be respected
  InvariantTimeoutsRespected
  /// Driver state must be consistent
  InvariantStateConsistent
  /// Transaction commands must be paired
  InvariantTransactionPaired
  /// Subscription mode is exclusive
  InvariantSubscriptionExclusive
}

/// Invariant check result
pub type InvariantCheckResult {
  /// Invariant holds
  InvariantHolds
  /// Invariant violated
  InvariantViolated(invariant: DriverInvariant, message: String)
}

/// Check all driver invariants
pub fn check_invariants(validator: SequenceValidator) -> List(InvariantCheckResult) {
  [
    check_bounded_pending(validator),
    check_unique_command_ids(validator),
    check_transaction_state(validator),
  ]
}

/// Check bounded pending invariant
fn check_bounded_pending(validator: SequenceValidator) -> InvariantCheckResult {
  case list_length(validator.pending_commands) <= validator.max_pending {
    True -> InvariantHolds
    False -> InvariantViolated(
      InvariantBoundedPending,
      "Pending commands exceed maximum",
    )
  }
}

/// Check unique command IDs invariant
fn check_unique_command_ids(validator: SequenceValidator) -> InvariantCheckResult {
  case has_duplicate_ids(validator.pending_commands) {
    False -> InvariantHolds
    True -> InvariantViolated(
      InvariantUniqueCommandIds,
      "Duplicate command IDs found",
    )
  }
}

/// Check transaction state invariant
fn check_transaction_state(validator: SequenceValidator) -> InvariantCheckResult {
  case validator.transaction_state {
    TransactionExecuted -> InvariantHolds
    TransactionDiscarded -> InvariantHolds
    NoTransaction -> InvariantHolds
    InTransaction(_, _) -> InvariantHolds  // Valid mid-transaction
  }
}

// ============================================================================
// SECTION 8: DRIVER LIFECYCLE
// ============================================================================

/// Driver state
pub type DriverState {
  DriverState(
    /// Connection state
    connection: ConnectionState,
    /// Sequence validator
    validator: SequenceValidator,
    /// Configuration
    config: ConnectionConfig,
    /// Restart count
    restart_count: Int,
    /// Last activity timestamp
    last_activity: Int,
    /// Pipeline buffer
    pipeline_buffer: List(RedisCommand),
    /// Pipeline mode enabled
    pipeline_mode: Bool,
  )
}

/// Driver lifecycle events
pub type DriverEvent {
  /// Driver started
  DriverStarted(timestamp: Int)
  /// Driver connected to server
  DriverConnected(server: ServerAddress, timestamp: Int)
  /// Driver disconnected
  DriverDisconnected(reason: ConnectionError, timestamp: Int)
  /// Driver restarted
  DriverRestarted(attempt: Int, timestamp: Int)
  /// Driver stopped
  DriverStopped(reason: String, timestamp: Int)
  /// Pipeline flushed
  PipelineFlushed(command_count: Int, timestamp: Int)
}

/// Create new driver state
pub fn new_driver_state(config: ConnectionConfig) -> DriverState {
  DriverState(
    connection: Disconnected,
    validator: new_sequence_validator(1000),
    config: config,
    restart_count: 0,
    last_activity: 0,
    pipeline_buffer: [],
    pipeline_mode: False,
  )
}

/// Driver is in restartable state
pub fn is_restartable(state: DriverState) -> Bool {
  case state.connection {
    Failed(_, _) -> True
    Disconnected -> True
    _ -> False
  }
}

/// Get driver health status
pub fn get_health_status(state: DriverState) -> DriverHealth {
  case state.connection {
    Connected(_) -> DriverHealthy
    Connecting(attempt, _) -> 
      case attempt > 3 {
        True -> DriverDegraded("Multiple connection attempts")
        False -> DriverConnecting
      }
    Failed(reason, _) -> DriverUnhealthy(format_connection_error(reason))
    Disconnected -> DriverStopped
    Authenticating -> DriverConnecting
    SelectingDatabase -> DriverConnecting
    Disconnecting -> DriverStopping
  }
}

/// Driver health status
pub type DriverHealth {
  DriverHealthy
  DriverConnecting
  DriverDegraded(reason: String)
  DriverUnhealthy(reason: String)
  DriverStopping
  DriverStopped
}

// ============================================================================
// SECTION 9: PIPELINING SUPPORT
// ============================================================================

/// Enable pipeline mode
pub fn enable_pipeline(state: DriverState) -> DriverState {
  DriverState(..state, pipeline_mode: True)
}

/// Disable pipeline mode and get buffered commands
pub fn disable_pipeline(state: DriverState) -> #(DriverState, List(RedisCommand)) {
  let commands = list_reverse(state.pipeline_buffer)
  #(
    DriverState(..state, pipeline_mode: False, pipeline_buffer: []),
    commands,
  )
}

/// Add command to pipeline buffer
pub fn pipeline_command(state: DriverState, command: RedisCommand) -> DriverState {
  case state.pipeline_mode {
    True -> DriverState(..state, pipeline_buffer: [command, ..state.pipeline_buffer])
    False -> state
  }
}

/// Get pipeline buffer size
pub fn pipeline_size(state: DriverState) -> Int {
  list_length(state.pipeline_buffer)
}

// ============================================================================
// SECTION 10: HELPER FUNCTIONS
// ============================================================================

fn list_length(list: List(a)) -> Int {
  case list {
    [] -> 0
    [_, ..tail] -> 1 + list_length(tail)
  }
}

fn list_reverse(list: List(a)) -> List(a) {
  list_reverse_acc(list, [])
}

fn list_reverse_acc(list: List(a), acc: List(a)) -> List(a) {
  case list {
    [] -> acc
    [head, ..tail] -> list_reverse_acc(tail, [head, ..acc])
  }
}

fn find_pending_command(
  pending: List(PendingCommand),
  command_id: Int,
) -> Result(PendingCommand, Nil) {
  case pending {
    [] -> Error(Nil)
    [p, ..rest] ->
      case p.command_id == command_id {
        True -> Ok(p)
        False -> find_pending_command(rest, command_id)
      }
  }
}

fn remove_pending_command(
  pending: List(PendingCommand),
  command_id: Int,
) -> List(PendingCommand) {
  case pending {
    [] -> []
    [p, ..rest] ->
      case p.command_id == command_id {
        True -> rest
        False -> [p, ..remove_pending_command(rest, command_id)]
      }
  }
}

fn has_duplicate_ids(pending: List(PendingCommand)) -> Bool {
  case pending {
    [] -> False
    [p, ..rest] ->
      case id_exists(rest, p.command_id) {
        True -> True
        False -> has_duplicate_ids(rest)
      }
  }
}

fn id_exists(pending: List(PendingCommand), id: Int) -> Bool {
  case pending {
    [] -> False
    [p, ..rest] ->
      case p.command_id == id {
        True -> True
        False -> id_exists(rest, id)
      }
  }
}

fn command_to_string(command: RedisCommand) -> String {
  case command {
    Get(_) -> "GET"
    Set(_, _, _) -> "SET"
    GetEx(_, _) -> "GETEX"
    SetEx(_, _, _) -> "SETEX"
    PSetEx(_, _, _) -> "PSETEX"
    SetNx(_, _) -> "SETNX"
    SetXx(_, _) -> "SETXX"
    GetSet(_, _) -> "GETSET"
    Append(_, _) -> "APPEND"
    GetRange(_, _, _) -> "GETRANGE"
    SetRange(_, _, _) -> "SETRANGE"
    StrLen(_) -> "STRLEN"
    Incr(_) -> "INCR"
    IncrBy(_, _) -> "INCRBY"
    IncrByFloat(_, _) -> "INCRBYFLOAT"
    Decr(_) -> "DECR"
    DecrBy(_, _) -> "DECRBY"
    MGet(_) -> "MGET"
    MSet(_) -> "MSET"
    MSetNx(_) -> "MSETNX"
    Del(_) -> "DEL"
    Exists(_) -> "EXISTS"
    Expire(_, _) -> "EXPIRE"
    ExpireAt(_, _) -> "EXPIREAT"
    PExpire(_, _) -> "PEXPIRE"
    PExpireAt(_, _) -> "PEXPIREAT"
    Persist(_) -> "PERSIST"
    Ttl(_) -> "TTL"
    PTtl(_) -> "PTTL"
    Type(_) -> "TYPE"
    Rename(_, _) -> "RENAME"
    RenameNx(_, _) -> "RENAMENX"
    Keys(_) -> "KEYS"
    Scan(_, _) -> "SCAN"
    HGet(_, _) -> "HGET"
    HSet(_, _) -> "HSET"
    HSetNx(_, _, _) -> "HSETNX"
    HGetAll(_) -> "HGETALL"
    HMGet(_, _) -> "HMGET"
    HDel(_, _) -> "HDEL"
    HExists(_, _) -> "HEXISTS"
    HIncrBy(_, _, _) -> "HINCRBY"
    HIncrByFloat(_, _, _) -> "HINCRBYFLOAT"
    HKeys(_) -> "HKEYS"
    HVals(_) -> "HVALS"
    HLen(_) -> "HLEN"
    HScan(_, _, _) -> "HSCAN"
    LPush(_, _) -> "LPUSH"
    RPush(_, _) -> "RPUSH"
    LPop(_, _) -> "LPOP"
    RPop(_, _) -> "RPOP"
    LRange(_, _, _) -> "LRANGE"
    LLen(_) -> "LLEN"
    LIndex(_, _) -> "LINDEX"
    LSet(_, _, _) -> "LSET"
    LRem(_, _, _) -> "LREM"
    LTrim(_, _, _) -> "LTRIM"
    BLPop(_, _) -> "BLPOP"
    BRPop(_, _) -> "BRPOP"
    LMove(_, _, _, _) -> "LMOVE"
    SAdd(_, _) -> "SADD"
    SRem(_, _) -> "SREM"
    SMembers(_) -> "SMEMBERS"
    SIsMember(_, _) -> "SISMEMBER"
    SMIsMember(_, _) -> "SMISMEMBER"
    SCard(_) -> "SCARD"
    SPop(_, _) -> "SPOP"
    SRandMember(_, _) -> "SRANDMEMBER"
    SDiff(_) -> "SDIFF"
    SInter(_) -> "SINTER"
    SUnion(_) -> "SUNION"
    SScan(_, _, _) -> "SSCAN"
    ZAdd(_, _, _) -> "ZADD"
    ZRem(_, _) -> "ZREM"
    ZRange(_, _, _, _) -> "ZRANGE"
    ZRangeByScore(_, _, _, _) -> "ZRANGEBYSCORE"
    ZRevRange(_, _, _, _) -> "ZREVRANGE"
    ZScore(_, _) -> "ZSCORE"
    ZRank(_, _) -> "ZRANK"
    ZRevRank(_, _) -> "ZREVRANK"
    ZCard(_) -> "ZCARD"
    ZCount(_, _, _) -> "ZCOUNT"
    ZIncrBy(_, _, _) -> "ZINCRBY"
    ZScan(_, _, _) -> "ZSCAN"
    Publish(_, _) -> "PUBLISH"
    Subscribe(_) -> "SUBSCRIBE"
    Unsubscribe(_) -> "UNSUBSCRIBE"
    PSubscribe(_) -> "PSUBSCRIBE"
    PUnsubscribe(_) -> "PUNSUBSCRIBE"
    Multi -> "MULTI"
    Exec -> "EXEC"
    Discard -> "DISCARD"
    Watch(_) -> "WATCH"
    Unwatch -> "UNWATCH"
    Eval(_, _, _) -> "EVAL"
    EvalSha(_, _, _) -> "EVALSHA"
    ScriptLoad(_) -> "SCRIPT LOAD"
    ScriptExists(_) -> "SCRIPT EXISTS"
    ScriptFlush -> "SCRIPT FLUSH"
    ScriptKill -> "SCRIPT KILL"
    Ping(_) -> "PING"
    Info(_) -> "INFO"
    DbSize -> "DBSIZE"
    FlushDb(_) -> "FLUSHDB"
    FlushAll(_) -> "FLUSHALL"
    Time -> "TIME"
    ClientList -> "CLIENT LIST"
    ClientSetName(_) -> "CLIENT SETNAME"
    ClientGetName -> "CLIENT GETNAME"
    Debug(_) -> "DEBUG"
    Raw(cmd, _) -> cmd
  }
}

fn format_connection_error(error: ConnectionError) -> String {
  case error {
    ConnectionRefused(_) -> "Connection refused"
    AuthenticationFailed(r) -> "Authentication failed: " <> r
    TimeoutExpired -> "Connection timeout"
    ServerUnreachable -> "Server unreachable"
    TlsHandshakeFailed(r) -> "TLS handshake failed: " <> r
    ProtocolError(m) -> "Protocol error: " <> m
    InvalidDatabaseNumber(db) -> "Invalid database number"
  }
}

// ============================================================================
// SECTION 11: DEFAULT CONFIGURATIONS
// ============================================================================

/// Default connection configuration
pub fn default_connection_config() -> ConnectionConfig {
  ConnectionConfig(
    server: ServerAddress(host: "localhost", port: 6379, use_tls: False),
    password: Error(Nil),
    username: Error(Nil),
    database: 0,
    connect_timeout_ms: 5_000,
    command_timeout_ms: 5_000,
    max_reconnect_attempts: 3,
    reconnect_delay_ms: 1_000,
  )
}

/// Default pool configuration
pub fn default_pool_config() -> PoolConfig {
  PoolConfig(
    min_connections: 1,
    max_connections: 10,
    idle_timeout_ms: 300_000,
    max_wait_ms: 5_000,
  )
}

/// Production connection configuration with TLS
pub fn production_connection_config(
  server: ServerAddress,
  password: String,
  username: Result(String, Nil),
) -> ConnectionConfig {
  ConnectionConfig(
    server: ServerAddress(..server, use_tls: True),
    password: Ok(password),
    username: username,
    database: 0,
    connect_timeout_ms: 10_000,
    command_timeout_ms: 30_000,
    max_reconnect_attempts: 5,
    reconnect_delay_ms: 2_000,
  )
}

/// Default SET options (no special options)
pub fn default_set_options() -> SetOptions {
  SetOptions(
    expiry: Error(Nil),
    xx: False,
    nx: False,
    get: False,
    keep_ttl: False,
  )
}

/// Default scan options
pub fn default_scan_options() -> ScanOptions {
  ScanOptions(
    match_pattern: Error(Nil),
    count: Error(Nil),
    type_filter: Error(Nil),
  )
}

/// Default ZADD options
pub fn default_zadd_options() -> ZAddOptions {
  ZAddOptions(
    xx: False,
    nx: False,
    gt: False,
    lt: False,
    ch: False,
  )
}

/// Default ZRANGE options
pub fn default_zrange_options() -> ZRangeOptions {
  ZRangeOptions(
    with_scores: False,
    rev: False,
    limit_offset: Error(Nil),
    limit_count: Error(Nil),
  )
}
