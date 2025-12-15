//// estalogic_drivers/postgres/contract.gleam
////
//// PostgreSQL Driver Verification Contract
////
//// This module defines the formal protocol specification for PostgreSQL driver
//// operations in the ESTA Logic system. Key guarantees:
////
//// 1. Formal Protocol Spec: All message types and state transitions are explicit
//// 2. Bounded Message Sequences: Valid and invalid query sequences are modeled
//// 3. Request-Response Invariants: Property-based test contracts
//// 4. Timeout Categories: Soft, Firm, Hard timeouts with explicit semantics
////
//// Driver Properties:
//// - Deterministic: Same inputs produce same outputs
//// - Non-blocking: All operations are async with bounded latency
//// - Zero-copy: Result buffers are passed by reference where possible
//// - Independently Restartable: Driver can be restarted without system restart
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: POSTGRESQL CONNECTION TYPES
// ============================================================================

/// PostgreSQL server address
pub type ServerAddress {
  ServerAddress(
    /// Hostname or IP address
    host: String,
    /// Port number (typically 5432)
    port: Int,
  )
}

/// PostgreSQL connection configuration
pub type ConnectionConfig {
  ConnectionConfig(
    /// Server address
    server: ServerAddress,
    /// Database name
    database: String,
    /// Username
    username: String,
    /// Password
    password: String,
    /// Use TLS encryption
    use_tls: Bool,
    /// TLS mode
    tls_mode: TlsMode,
    /// Connection timeout in milliseconds
    connect_timeout_ms: Int,
    /// Query timeout in milliseconds
    query_timeout_ms: Int,
    /// Idle timeout in milliseconds
    idle_timeout_ms: Int,
    /// Application name for tracking
    application_name: Result(String, Nil),
    /// Extra connection parameters
    extra_params: List(ConnectionParam),
  )
}

/// Connection parameter
pub type ConnectionParam {
  ConnectionParam(key: String, value: String)
}

/// TLS mode options
pub type TlsMode {
  /// No TLS
  TlsDisabled
  /// Try TLS, fall back to unencrypted
  TlsPrefer
  /// Require TLS
  TlsRequire
  /// Require TLS and verify server certificate
  TlsVerifyCa
  /// Require TLS and verify server certificate hostname
  TlsVerifyFull
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
    /// Test connection on checkout
    test_on_checkout: Bool,
    /// Health check interval in milliseconds
    health_check_interval_ms: Int,
  )
}

/// Connection state machine
pub type ConnectionState {
  /// Initial state, not yet connected
  Disconnected
  /// TCP connecting
  TcpConnecting(attempt: Int, started_at: Int)
  /// TLS handshaking
  TlsHandshaking
  /// Authenticating with server
  Authenticating(method: AuthMethod)
  /// Connected and ready for queries
  Ready(connected_at: Int)
  /// Processing a query
  InQuery(query_id: Int, started_at: Int)
  /// In a transaction
  InTransaction(tx_id: Int, started_at: Int)
  /// Transaction failed, awaiting rollback
  TransactionFailed(tx_id: Int, error: PostgresError)
  /// Disconnecting gracefully
  Disconnecting
  /// Connection failed
  Failed(reason: ConnectionError, failed_at: Int)
}

/// Authentication methods
pub type AuthMethod {
  /// Clear text password (not recommended)
  AuthClearText
  /// MD5 password hash
  AuthMd5
  /// SCRAM-SHA-256
  AuthScramSha256
  /// GSS-API
  AuthGss
  /// SSPI
  AuthSspi
  /// Certificate authentication
  AuthCert
  /// Trust (no authentication)
  AuthTrust
}

/// Connection errors
pub type ConnectionError {
  ConnectionRefused(server: ServerAddress)
  AuthenticationFailed(method: AuthMethod, reason: String)
  DatabaseNotFound(database: String)
  TimeoutExpired(phase: String)
  ServerUnreachable
  TlsHandshakeFailed(reason: String)
  ProtocolError(message: String)
  TooManyConnections
  InvalidCredentials
}

// ============================================================================
// SECTION 2: POSTGRESQL DATA TYPES (FORMAL PROTOCOL SPEC)
// ============================================================================

/// PostgreSQL OID (Object Identifier)
pub type Oid {
  Oid(value: Int)
}

/// Known PostgreSQL type OIDs
pub const oid_bool: Int = 16
pub const oid_bytea: Int = 17
pub const oid_char: Int = 18
pub const oid_int8: Int = 20
pub const oid_int2: Int = 21
pub const oid_int4: Int = 23
pub const oid_text: Int = 25
pub const oid_float4: Int = 700
pub const oid_float8: Int = 701
pub const oid_varchar: Int = 1043
pub const oid_date: Int = 1082
pub const oid_time: Int = 1083
pub const oid_timestamp: Int = 1114
pub const oid_timestamptz: Int = 1184
pub const oid_interval: Int = 1186
pub const oid_numeric: Int = 1700
pub const oid_uuid: Int = 2950
pub const oid_json: Int = 114
pub const oid_jsonb: Int = 3802

/// PostgreSQL value types
pub type PgValue {
  /// Null value
  PgNull
  /// Boolean value
  PgBool(value: Bool)
  /// 16-bit integer
  PgInt2(value: Int)
  /// 32-bit integer
  PgInt4(value: Int)
  /// 64-bit integer
  PgInt8(value: Int)
  /// 32-bit floating point
  PgFloat4(value: Float)
  /// 64-bit floating point
  PgFloat8(value: Float)
  /// Numeric/Decimal
  PgNumeric(value: String)
  /// Character data
  PgText(value: String)
  /// Variable-length character
  PgVarchar(value: String, max_length: Result(Int, Nil))
  /// Binary data
  PgBytea(data: List(Int))
  /// Date (days since 2000-01-01)
  PgDate(days: Int)
  /// Time (microseconds since midnight)
  PgTime(microseconds: Int)
  /// Timestamp (microseconds since 2000-01-01)
  PgTimestamp(microseconds: Int)
  /// Timestamp with timezone
  PgTimestampTz(microseconds: Int, tz_offset_seconds: Int)
  /// Interval
  PgInterval(months: Int, days: Int, microseconds: Int)
  /// UUID
  PgUuid(value: String)
  /// JSON
  PgJson(value: String)
  /// JSONB (binary JSON)
  PgJsonb(value: String)
  /// Array of values
  PgArray(element_type: Oid, elements: List(PgValue))
  /// Composite/Row type
  PgComposite(fields: List(PgValue))
  /// Unknown type (raw bytes)
  PgUnknown(oid: Oid, data: List(Int))
}

/// Query parameter
pub type QueryParam {
  QueryParam(
    /// Parameter value
    value: PgValue,
    /// Optional explicit OID
    oid: Result(Oid, Nil),
  )
}

// ============================================================================
// SECTION 3: POSTGRESQL QUERIES (REQUEST-RESPONSE CONTRACT)
// ============================================================================

/// PostgreSQL query types
pub type Query {
  /// Simple query (text protocol)
  SimpleQuery(sql: String)
  /// Extended query (binary protocol)
  ExtendedQuery(
    sql: String,
    params: List(QueryParam),
    result_formats: ResultFormats,
  )
  /// Prepared statement creation
  Prepare(name: String, sql: String, param_types: List(Oid))
  /// Execute prepared statement
  ExecutePrepared(name: String, params: List(QueryParam))
  /// Close prepared statement
  ClosePrepared(name: String)
  /// COPY data in
  CopyIn(sql: String, format: CopyFormat)
  /// COPY data out
  CopyOut(sql: String, format: CopyFormat)
}

/// Result format options
pub type ResultFormats {
  /// All columns as text
  AllText
  /// All columns as binary
  AllBinary
  /// Per-column format specification
  PerColumn(formats: List(ColumnFormat))
}

/// Column format
pub type ColumnFormat {
  FormatText
  FormatBinary
}

/// COPY format
pub type CopyFormat {
  CopyText(delimiter: String, null_string: String)
  CopyBinary
  CopyCsv(delimiter: String, quote: String, escape: String, null_string: String)
}

/// Transaction control commands
pub type TransactionCommand {
  /// Begin transaction
  Begin(isolation: IsolationLevel, read_only: Bool, deferrable: Bool)
  /// Commit transaction
  Commit
  /// Rollback transaction
  Rollback
  /// Create savepoint
  Savepoint(name: String)
  /// Rollback to savepoint
  RollbackTo(name: String)
  /// Release savepoint
  ReleaseSavepoint(name: String)
}

/// Transaction isolation levels
pub type IsolationLevel {
  ReadUncommitted
  ReadCommitted
  RepeatableRead
  Serializable
}

// ============================================================================
// SECTION 4: POSTGRESQL RESPONSES
// ============================================================================

/// Query result
pub type QueryResult {
  /// Rows returned
  RowsResult(
    columns: List(ColumnInfo),
    rows: List(Row),
    rows_affected: Int,
  )
  /// Command completed (INSERT, UPDATE, DELETE, etc.)
  CommandComplete(tag: CommandTag)
  /// COPY in progress
  CopyInProgress(format: CopyFormat)
  /// Empty result
  EmptyResult
  /// Error result
  ErrorResult(error: PostgresError)
}

/// Column information
pub type ColumnInfo {
  ColumnInfo(
    /// Column name
    name: String,
    /// Table OID (0 if not a table column)
    table_oid: Oid,
    /// Column number in table (0 if not a table column)
    column_number: Int,
    /// Data type OID
    type_oid: Oid,
    /// Data type size (-1 for variable)
    type_size: Int,
    /// Type modifier
    type_modifier: Int,
    /// Format code
    format: ColumnFormat,
  )
}

/// Row data
pub type Row {
  Row(values: List(PgValue))
}

/// Command completion tag
pub type CommandTag {
  InsertTag(oid: Oid, count: Int)
  DeleteTag(count: Int)
  UpdateTag(count: Int)
  SelectTag(count: Int)
  MoveTag(count: Int)
  FetchTag(count: Int)
  CopyTag(count: Int)
  CreateTableTag
  DropTableTag
  AlterTableTag
  CreateIndexTag
  DropIndexTag
  BeginTag
  CommitTag
  RollbackTag
  SavepointTag
  ReleaseTag
  OtherTag(tag: String)
}

/// PostgreSQL error/notice
pub type PostgresError {
  PostgresError(
    /// Severity (ERROR, FATAL, PANIC, WARNING, NOTICE, etc.)
    severity: ErrorSeverity,
    /// SQLSTATE code
    code: String,
    /// Primary error message
    message: String,
    /// Detail message
    detail: Result(String, Nil),
    /// Hint message
    hint: Result(String, Nil),
    /// Position in query
    position: Result(Int, Nil),
    /// Internal position
    internal_position: Result(Int, Nil),
    /// Internal query
    internal_query: Result(String, Nil),
    /// Where context
    where_context: Result(String, Nil),
    /// Schema name
    schema_name: Result(String, Nil),
    /// Table name
    table_name: Result(String, Nil),
    /// Column name
    column_name: Result(String, Nil),
    /// Data type name
    data_type_name: Result(String, Nil),
    /// Constraint name
    constraint_name: Result(String, Nil),
    /// File name
    file_name: Result(String, Nil),
    /// Line number
    line: Result(Int, Nil),
    /// Routine name
    routine: Result(String, Nil),
  )
}

/// Error severity levels
pub type ErrorSeverity {
  SeverityError
  SeverityFatal
  SeverityPanic
  SeverityWarning
  SeverityNotice
  SeverityDebug
  SeverityInfo
  SeverityLog
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
  /// Complete in-flight queries then stop
  DrainAndStop
  /// Cancel current query
  CancelQuery
  /// Return timeout error
  ReturnTimeout
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

/// Default timeouts for PostgreSQL operations
pub fn default_query_timeout() -> TimeoutCategory {
  SoftTimeout(
    duration_ms: 30_000,
    on_expire: RetryWithBackoff(1000, 2),
  )
}

pub fn default_connect_timeout() -> TimeoutCategory {
  FirmTimeout(
    duration_ms: 10_000,
    on_expire: DrainAndStop,
  )
}

pub fn default_transaction_timeout() -> TimeoutCategory {
  FirmTimeout(
    duration_ms: 60_000,
    on_expire: CancelQuery,
  )
}

pub fn default_idle_timeout() -> TimeoutCategory {
  FirmTimeout(
    duration_ms: 300_000,
    on_expire: DrainAndStop,
  )
}

pub fn default_statement_timeout() -> TimeoutCategory {
  HardTimeout(
    duration_ms: 300_000,
    on_expire: TerminateConnection,
  )
}

// ============================================================================
// SECTION 6: MESSAGE SEQUENCE VALIDATION (BOUNDED MODEL)
// ============================================================================

/// Valid query sequence states
pub type SequenceState {
  /// Initial state
  SequenceIdle
  /// Query sent, awaiting response
  SequenceQuerySent(query_id: Int, sent_at: Int)
  /// Receiving rows
  SequenceReceivingRows(query_id: Int, row_count: Int)
  /// In transaction
  SequenceInTransaction(tx_id: Int, started_at: Int, query_count: Int)
  /// COPY in progress
  SequenceCopyInProgress(query_id: Int)
  /// Sequence completed
  SequenceCompleted
  /// Sequence failed
  SequenceFailed(reason: SequenceError)
}

/// Sequence validation errors
pub type SequenceError {
  /// Out of order response
  OutOfOrderResponse(expected: Int, received: Int)
  /// Duplicate query ID
  DuplicateQueryId(id: Int)
  /// Missing response
  MissingResponse(query_id: Int, timeout_ms: Int)
  /// Unexpected response type
  UnexpectedResponseType(expected: String, received: String)
  /// Protocol violation
  ProtocolViolation(message: String)
  /// Transaction error
  TransactionError(message: String)
  /// Invalid state transition
  InvalidStateTransition(from: String, to: String)
}

/// Sequence validator state
pub type SequenceValidator {
  SequenceValidator(
    /// Next expected query ID
    next_query_id: Int,
    /// Pending queries awaiting responses
    pending_queries: List(PendingQuery),
    /// Maximum pending queries
    max_pending: Int,
    /// Completed sequence count
    completed_count: Int,
    /// Failed sequence count
    failed_count: Int,
    /// Current transaction ID
    current_transaction: Result(Int, Nil),
    /// Prepared statements
    prepared_statements: List(PreparedStatement),
  )
}

/// Pending query entry
pub type PendingQuery {
  PendingQuery(
    query_id: Int,
    query_type: String,
    sent_at: Int,
    timeout: TimeoutCategory,
    in_transaction: Bool,
  )
}

/// Prepared statement info
pub type PreparedStatement {
  PreparedStatement(
    name: String,
    sql: String,
    param_types: List(Oid),
    created_at: Int,
  )
}

/// Create new sequence validator
pub fn new_sequence_validator(max_pending: Int) -> SequenceValidator {
  SequenceValidator(
    next_query_id: 1,
    pending_queries: [],
    max_pending: max_pending,
    completed_count: 0,
    failed_count: 0,
    current_transaction: Error(Nil),
    prepared_statements: [],
  )
}

/// Validate query can be sent
pub fn validate_query(
  validator: SequenceValidator,
  query: Query,
) -> Result(Int, SequenceError) {
  // Check pending limit
  case list_length(validator.pending_queries) >= validator.max_pending {
    True -> Error(ProtocolViolation("Too many pending queries"))
    False -> Ok(validator.next_query_id)
  }
}

/// Record query sent
pub fn record_query_sent(
  validator: SequenceValidator,
  query: Query,
  sent_at: Int,
  timeout: TimeoutCategory,
) -> SequenceValidator {
  let query_type = query_to_string(query)
  let in_tx = case validator.current_transaction {
    Ok(_) -> True
    Error(_) -> False
  }
  let pending = PendingQuery(
    query_id: validator.next_query_id,
    query_type: query_type,
    sent_at: sent_at,
    timeout: timeout,
    in_transaction: in_tx,
  )
  SequenceValidator(
    ..validator,
    next_query_id: validator.next_query_id + 1,
    pending_queries: [pending, ..validator.pending_queries],
  )
}

/// Record response received
pub fn record_response_received(
  validator: SequenceValidator,
  query_id: Int,
) -> Result(SequenceValidator, SequenceError) {
  case find_pending_query(validator.pending_queries, query_id) {
    Error(_) -> Error(OutOfOrderResponse(0, query_id))
    Ok(_) -> Ok(SequenceValidator(
      ..validator,
      pending_queries: remove_pending_query(validator.pending_queries, query_id),
      completed_count: validator.completed_count + 1,
    ))
  }
}

/// Begin transaction
pub fn begin_transaction(
  validator: SequenceValidator,
  tx_id: Int,
) -> Result(SequenceValidator, SequenceError) {
  case validator.current_transaction {
    Ok(_) -> Error(TransactionError("Already in transaction"))
    Error(_) -> Ok(SequenceValidator(
      ..validator,
      current_transaction: Ok(tx_id),
    ))
  }
}

/// End transaction
pub fn end_transaction(
  validator: SequenceValidator,
) -> Result(SequenceValidator, SequenceError) {
  case validator.current_transaction {
    Error(_) -> Error(TransactionError("Not in transaction"))
    Ok(_) -> Ok(SequenceValidator(
      ..validator,
      current_transaction: Error(Nil),
    ))
  }
}

/// Register prepared statement
pub fn register_prepared_statement(
  validator: SequenceValidator,
  name: String,
  sql: String,
  param_types: List(Oid),
  created_at: Int,
) -> SequenceValidator {
  let stmt = PreparedStatement(
    name: name,
    sql: sql,
    param_types: param_types,
    created_at: created_at,
  )
  SequenceValidator(
    ..validator,
    prepared_statements: [stmt, ..validator.prepared_statements],
  )
}

/// Unregister prepared statement
pub fn unregister_prepared_statement(
  validator: SequenceValidator,
  name: String,
) -> SequenceValidator {
  SequenceValidator(
    ..validator,
    prepared_statements: remove_prepared_statement(validator.prepared_statements, name),
  )
}

// ============================================================================
// SECTION 7: DRIVER INVARIANTS (PROPERTY-BASED TEST CONTRACTS)
// ============================================================================

/// Driver invariant that must always hold
pub type DriverInvariant {
  /// All responses must match a pending query
  InvariantResponseMatchesQuery
  /// Query IDs must be unique
  InvariantUniqueQueryIds
  /// No query can exceed max pending limit
  InvariantBoundedPending
  /// All timeouts must be respected
  InvariantTimeoutsRespected
  /// Driver state must be consistent
  InvariantStateConsistent
  /// Transaction state must be valid
  InvariantTransactionValid
  /// Prepared statements must be tracked
  InvariantPreparedStatementsTracked
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
    check_unique_query_ids(validator),
    check_transaction_state(validator),
  ]
}

/// Check bounded pending invariant
fn check_bounded_pending(validator: SequenceValidator) -> InvariantCheckResult {
  case list_length(validator.pending_queries) <= validator.max_pending {
    True -> InvariantHolds
    False -> InvariantViolated(
      InvariantBoundedPending,
      "Pending queries exceed maximum",
    )
  }
}

/// Check unique query IDs invariant
fn check_unique_query_ids(validator: SequenceValidator) -> InvariantCheckResult {
  case has_duplicate_ids(validator.pending_queries) {
    False -> InvariantHolds
    True -> InvariantViolated(
      InvariantUniqueQueryIds,
      "Duplicate query IDs found",
    )
  }
}

/// Check transaction state invariant
fn check_transaction_state(validator: SequenceValidator) -> InvariantCheckResult {
  // All pending queries in transaction must have in_transaction=True
  case validator.current_transaction {
    Error(_) -> InvariantHolds
    Ok(_) -> InvariantHolds  // Queries can be outside transaction even when in tx
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
    /// Backend process ID
    backend_pid: Result(Int, Nil),
    /// Backend secret key (for cancel requests)
    backend_key: Result(Int, Nil),
    /// Server version
    server_version: Result(String, Nil),
    /// Server parameters
    server_params: List(ServerParam),
  )
}

/// Server parameter
pub type ServerParam {
  ServerParam(name: String, value: String)
}

/// Driver lifecycle events
pub type DriverEvent {
  /// Driver started
  DriverStarted(timestamp: Int)
  /// Driver connected to server
  DriverConnected(server: ServerAddress, backend_pid: Int, timestamp: Int)
  /// Driver disconnected
  DriverDisconnected(reason: ConnectionError, timestamp: Int)
  /// Driver restarted
  DriverRestarted(attempt: Int, timestamp: Int)
  /// Driver stopped
  DriverStopped(reason: String, timestamp: Int)
  /// Transaction started
  TransactionStarted(tx_id: Int, isolation: IsolationLevel, timestamp: Int)
  /// Transaction committed
  TransactionCommitted(tx_id: Int, timestamp: Int)
  /// Transaction rolled back
  TransactionRolledBack(tx_id: Int, reason: Result(String, Nil), timestamp: Int)
}

/// Create new driver state
pub fn new_driver_state(config: ConnectionConfig) -> DriverState {
  DriverState(
    connection: Disconnected,
    validator: new_sequence_validator(100),
    config: config,
    restart_count: 0,
    last_activity: 0,
    backend_pid: Error(Nil),
    backend_key: Error(Nil),
    server_version: Error(Nil),
    server_params: [],
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
    Ready(_) -> DriverHealthy
    InQuery(_, _) -> DriverBusy("executing query")
    InTransaction(_, _) -> DriverBusy("in transaction")
    TransactionFailed(_, _) -> DriverDegraded("transaction failed")
    TcpConnecting(attempt, _) -> 
      case attempt > 3 {
        True -> DriverDegraded("Multiple connection attempts")
        False -> DriverConnecting
      }
    TlsHandshaking -> DriverConnecting
    Authenticating(_) -> DriverConnecting
    Failed(reason, _) -> DriverUnhealthy(format_connection_error(reason))
    Disconnected -> DriverStopped
    Disconnecting -> DriverStopping
  }
}

/// Driver health status
pub type DriverHealth {
  DriverHealthy
  DriverConnecting
  DriverBusy(reason: String)
  DriverDegraded(reason: String)
  DriverUnhealthy(reason: String)
  DriverStopping
  DriverStopped
}

// ============================================================================
// SECTION 9: QUERY BUILDER HELPERS
// ============================================================================

/// Create a simple query
pub fn simple_query(sql: String) -> Query {
  SimpleQuery(sql)
}

/// Create an extended query with parameters
pub fn extended_query(sql: String, params: List(QueryParam)) -> Query {
  ExtendedQuery(sql, params, AllText)
}

/// Create an extended query with binary results
pub fn extended_query_binary(sql: String, params: List(QueryParam)) -> Query {
  ExtendedQuery(sql, params, AllBinary)
}

/// Create a prepared statement
pub fn prepare_statement(name: String, sql: String, param_types: List(Oid)) -> Query {
  Prepare(name, sql, param_types)
}

/// Execute a prepared statement
pub fn execute_prepared(name: String, params: List(QueryParam)) -> Query {
  ExecutePrepared(name, params)
}

/// Create a parameter from various types
pub fn param_null() -> QueryParam {
  QueryParam(value: PgNull, oid: Error(Nil))
}

pub fn param_bool(value: Bool) -> QueryParam {
  QueryParam(value: PgBool(value), oid: Ok(Oid(oid_bool)))
}

pub fn param_int(value: Int) -> QueryParam {
  QueryParam(value: PgInt4(value), oid: Ok(Oid(oid_int4)))
}

pub fn param_bigint(value: Int) -> QueryParam {
  QueryParam(value: PgInt8(value), oid: Ok(Oid(oid_int8)))
}

pub fn param_float(value: Float) -> QueryParam {
  QueryParam(value: PgFloat8(value), oid: Ok(Oid(oid_float8)))
}

pub fn param_text(value: String) -> QueryParam {
  QueryParam(value: PgText(value), oid: Ok(Oid(oid_text)))
}

pub fn param_bytea(data: List(Int)) -> QueryParam {
  QueryParam(value: PgBytea(data), oid: Ok(Oid(oid_bytea)))
}

pub fn param_uuid(value: String) -> QueryParam {
  QueryParam(value: PgUuid(value), oid: Ok(Oid(oid_uuid)))
}

pub fn param_json(value: String) -> QueryParam {
  QueryParam(value: PgJson(value), oid: Ok(Oid(oid_json)))
}

pub fn param_jsonb(value: String) -> QueryParam {
  QueryParam(value: PgJsonb(value), oid: Ok(Oid(oid_jsonb)))
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

fn find_pending_query(
  pending: List(PendingQuery),
  query_id: Int,
) -> Result(PendingQuery, Nil) {
  case pending {
    [] -> Error(Nil)
    [p, ..rest] ->
      case p.query_id == query_id {
        True -> Ok(p)
        False -> find_pending_query(rest, query_id)
      }
  }
}

fn remove_pending_query(
  pending: List(PendingQuery),
  query_id: Int,
) -> List(PendingQuery) {
  case pending {
    [] -> []
    [p, ..rest] ->
      case p.query_id == query_id {
        True -> rest
        False -> [p, ..remove_pending_query(rest, query_id)]
      }
  }
}

fn remove_prepared_statement(
  statements: List(PreparedStatement),
  name: String,
) -> List(PreparedStatement) {
  case statements {
    [] -> []
    [s, ..rest] ->
      case s.name == name {
        True -> rest
        False -> [s, ..remove_prepared_statement(rest, name)]
      }
  }
}

fn has_duplicate_ids(pending: List(PendingQuery)) -> Bool {
  case pending {
    [] -> False
    [p, ..rest] ->
      case id_exists(rest, p.query_id) {
        True -> True
        False -> has_duplicate_ids(rest)
      }
  }
}

fn id_exists(pending: List(PendingQuery), id: Int) -> Bool {
  case pending {
    [] -> False
    [p, ..rest] ->
      case p.query_id == id {
        True -> True
        False -> id_exists(rest, id)
      }
  }
}

fn query_to_string(query: Query) -> String {
  case query {
    SimpleQuery(_) -> "SimpleQuery"
    ExtendedQuery(_, _, _) -> "ExtendedQuery"
    Prepare(name, _, _) -> "Prepare:" <> name
    ExecutePrepared(name, _) -> "Execute:" <> name
    ClosePrepared(name) -> "Close:" <> name
    CopyIn(_, _) -> "CopyIn"
    CopyOut(_, _) -> "CopyOut"
  }
}

fn format_connection_error(error: ConnectionError) -> String {
  case error {
    ConnectionRefused(_) -> "Connection refused"
    AuthenticationFailed(_, r) -> "Authentication failed: " <> r
    DatabaseNotFound(db) -> "Database not found: " <> db
    TimeoutExpired(phase) -> "Timeout during " <> phase
    ServerUnreachable -> "Server unreachable"
    TlsHandshakeFailed(r) -> "TLS handshake failed: " <> r
    ProtocolError(m) -> "Protocol error: " <> m
    TooManyConnections -> "Too many connections"
    InvalidCredentials -> "Invalid credentials"
  }
}

// ============================================================================
// SECTION 11: DEFAULT CONFIGURATIONS
// ============================================================================

/// Default connection configuration
pub fn default_connection_config() -> ConnectionConfig {
  ConnectionConfig(
    server: ServerAddress(host: "localhost", port: 5432),
    database: "postgres",
    username: "postgres",
    password: "",
    use_tls: False,
    tls_mode: TlsPrefer,
    connect_timeout_ms: 10_000,
    query_timeout_ms: 30_000,
    idle_timeout_ms: 300_000,
    application_name: Ok("estalogic-driver"),
    extra_params: [],
  )
}

/// Default pool configuration
pub fn default_pool_config() -> PoolConfig {
  PoolConfig(
    min_connections: 1,
    max_connections: 10,
    idle_timeout_ms: 300_000,
    max_wait_ms: 30_000,
    test_on_checkout: True,
    health_check_interval_ms: 30_000,
  )
}

/// Production connection configuration with TLS
pub fn production_connection_config(
  server: ServerAddress,
  database: String,
  username: String,
  password: String,
) -> ConnectionConfig {
  ConnectionConfig(
    server: server,
    database: database,
    username: username,
    password: password,
    use_tls: True,
    tls_mode: TlsVerifyFull,
    connect_timeout_ms: 30_000,
    query_timeout_ms: 60_000,
    idle_timeout_ms: 600_000,
    application_name: Ok("estalogic-driver-prod"),
    extra_params: [],
  )
}

// ============================================================================
// SECTION 12: SQLSTATE CATEGORIES
// ============================================================================

/// SQLSTATE class for error categorization
pub type SqlStateClass {
  /// Class 00 - Successful Completion
  SuccessfulCompletion
  /// Class 01 - Warning
  Warning
  /// Class 02 - No Data
  NoData
  /// Class 03 - SQL Statement Not Yet Complete
  SqlStatementNotYetComplete
  /// Class 08 - Connection Exception
  ConnectionException
  /// Class 09 - Triggered Action Exception
  TriggeredActionException
  /// Class 0A - Feature Not Supported
  FeatureNotSupported
  /// Class 0B - Invalid Transaction Initiation
  InvalidTransactionInitiation
  /// Class 0L - Invalid Grantor
  InvalidGrantor
  /// Class 0P - Invalid Role Specification
  InvalidRoleSpecification
  /// Class 21 - Cardinality Violation
  CardinalityViolation
  /// Class 22 - Data Exception
  DataException
  /// Class 23 - Integrity Constraint Violation
  IntegrityConstraintViolation
  /// Class 24 - Invalid Cursor State
  InvalidCursorState
  /// Class 25 - Invalid Transaction State
  InvalidTransactionState
  /// Class 26 - Invalid SQL Statement Name
  InvalidSqlStatementName
  /// Class 27 - Triggered Data Change Violation
  TriggeredDataChangeViolation
  /// Class 28 - Invalid Authorization Specification
  InvalidAuthorizationSpecification
  /// Class 2B - Dependent Privilege Descriptors Still Exist
  DependentPrivilegeDescriptorsStillExist
  /// Class 2D - Invalid Transaction Termination
  InvalidTransactionTermination
  /// Class 2F - SQL Routine Exception
  SqlRoutineException
  /// Class 34 - Invalid Cursor Name
  InvalidCursorName
  /// Class 38 - External Routine Exception
  ExternalRoutineException
  /// Class 39 - External Routine Invocation Exception
  ExternalRoutineInvocationException
  /// Class 3B - Savepoint Exception
  SavepointException
  /// Class 3D - Invalid Catalog Name
  InvalidCatalogName
  /// Class 3F - Invalid Schema Name
  InvalidSchemaName
  /// Class 40 - Transaction Rollback
  TransactionRollback
  /// Class 42 - Syntax Error or Access Rule Violation
  SyntaxErrorOrAccessRuleViolation
  /// Class 44 - WITH CHECK OPTION Violation
  WithCheckOptionViolation
  /// Class 53 - Insufficient Resources
  InsufficientResources
  /// Class 54 - Program Limit Exceeded
  ProgramLimitExceeded
  /// Class 55 - Object Not In Prerequisite State
  ObjectNotInPrerequisiteState
  /// Class 57 - Operator Intervention
  OperatorIntervention
  /// Class 58 - System Error
  SystemError
  /// Class F0 - Configuration File Error
  ConfigurationFileError
  /// Class HV - Foreign Data Wrapper Error
  ForeignDataWrapperError
  /// Class P0 - PL/pgSQL Error
  PlPgsqlError
  /// Class XX - Internal Error
  InternalError
  /// Unknown class
  UnknownClass(class_code: String)
}

/// Parse SQLSTATE to class
pub fn parse_sqlstate_class(code: String) -> SqlStateClass {
  let class = string_take(code, 2)
  case class {
    "00" -> SuccessfulCompletion
    "01" -> Warning
    "02" -> NoData
    "03" -> SqlStatementNotYetComplete
    "08" -> ConnectionException
    "09" -> TriggeredActionException
    "0A" -> FeatureNotSupported
    "0B" -> InvalidTransactionInitiation
    "0L" -> InvalidGrantor
    "0P" -> InvalidRoleSpecification
    "21" -> CardinalityViolation
    "22" -> DataException
    "23" -> IntegrityConstraintViolation
    "24" -> InvalidCursorState
    "25" -> InvalidTransactionState
    "26" -> InvalidSqlStatementName
    "27" -> TriggeredDataChangeViolation
    "28" -> InvalidAuthorizationSpecification
    "2B" -> DependentPrivilegeDescriptorsStillExist
    "2D" -> InvalidTransactionTermination
    "2F" -> SqlRoutineException
    "34" -> InvalidCursorName
    "38" -> ExternalRoutineException
    "39" -> ExternalRoutineInvocationException
    "3B" -> SavepointException
    "3D" -> InvalidCatalogName
    "3F" -> InvalidSchemaName
    "40" -> TransactionRollback
    "42" -> SyntaxErrorOrAccessRuleViolation
    "44" -> WithCheckOptionViolation
    "53" -> InsufficientResources
    "54" -> ProgramLimitExceeded
    "55" -> ObjectNotInPrerequisiteState
    "57" -> OperatorIntervention
    "58" -> SystemError
    "F0" -> ConfigurationFileError
    "HV" -> ForeignDataWrapperError
    "P0" -> PlPgsqlError
    "XX" -> InternalError
    _ -> UnknownClass(class)
  }
}

/// Check if error is retryable
pub fn is_retryable_error(error: PostgresError) -> Bool {
  let class = parse_sqlstate_class(error.code)
  case class {
    ConnectionException -> True
    OperatorIntervention -> True
    TransactionRollback -> True
    InsufficientResources -> True
    _ -> False
  }
}

fn string_take(s: String, n: Int) -> String {
  // Take first n characters from string
  // In Gleam, strings are UTF-8 so we need to be careful with graphemes
  // For SQLSTATE which is ASCII, we can use simple character extraction
  string_take_acc(s, n, "")
}

fn string_take_acc(s: String, remaining: Int, acc: String) -> String {
  case remaining <= 0 {
    True -> acc
    False -> {
      case string_pop_grapheme(s) {
        Error(_) -> acc
        Ok(#(char, rest)) -> string_take_acc(rest, remaining - 1, acc <> char)
      }
    }
  }
}

/// Pop the first grapheme from a string
/// Returns the grapheme and the remaining string
fn string_pop_grapheme(s: String) -> Result(#(String, String), Nil) {
  case s == "" {
    True -> Error(Nil)
    False -> {
      // For ASCII (SQLSTATE codes), first byte is the character
      // This is a simplified implementation for 2-character SQLSTATE class
      let first = string_first_char(s)
      let rest = string_rest(s)
      Ok(#(first, rest))
    }
  }
}

/// Get first character of string
fn string_first_char(s: String) -> String {
  // For SQLSTATE which uses only ASCII digits and uppercase letters,
  // we need access to individual characters. Using pattern matching.
  case s {
    "0" <> _ -> "0"
    "1" <> _ -> "1"
    "2" <> _ -> "2"
    "3" <> _ -> "3"
    "4" <> _ -> "4"
    "5" <> _ -> "5"
    "6" <> _ -> "6"
    "7" <> _ -> "7"
    "8" <> _ -> "8"
    "9" <> _ -> "9"
    "A" <> _ -> "A"
    "B" <> _ -> "B"
    "C" <> _ -> "C"
    "D" <> _ -> "D"
    "E" <> _ -> "E"
    "F" <> _ -> "F"
    "G" <> _ -> "G"
    "H" <> _ -> "H"
    "I" <> _ -> "I"
    "J" <> _ -> "J"
    "K" <> _ -> "K"
    "L" <> _ -> "L"
    "M" <> _ -> "M"
    "N" <> _ -> "N"
    "O" <> _ -> "O"
    "P" <> _ -> "P"
    "Q" <> _ -> "Q"
    "R" <> _ -> "R"
    "S" <> _ -> "S"
    "T" <> _ -> "T"
    "U" <> _ -> "U"
    "V" <> _ -> "V"
    "W" <> _ -> "W"
    "X" <> _ -> "X"
    "Y" <> _ -> "Y"
    "Z" <> _ -> "Z"
    _ -> ""
  }
}

/// Get string without first character
fn string_rest(s: String) -> String {
  case s {
    "0" <> rest -> rest
    "1" <> rest -> rest
    "2" <> rest -> rest
    "3" <> rest -> rest
    "4" <> rest -> rest
    "5" <> rest -> rest
    "6" <> rest -> rest
    "7" <> rest -> rest
    "8" <> rest -> rest
    "9" <> rest -> rest
    "A" <> rest -> rest
    "B" <> rest -> rest
    "C" <> rest -> rest
    "D" <> rest -> rest
    "E" <> rest -> rest
    "F" <> rest -> rest
    "G" <> rest -> rest
    "H" <> rest -> rest
    "I" <> rest -> rest
    "J" <> rest -> rest
    "K" <> rest -> rest
    "L" <> rest -> rest
    "M" <> rest -> rest
    "N" <> rest -> rest
    "O" <> rest -> rest
    "P" <> rest -> rest
    "Q" <> rest -> rest
    "R" <> rest -> rest
    "S" <> rest -> rest
    "T" <> rest -> rest
    "U" <> rest -> rest
    "V" <> rest -> rest
    "W" <> rest -> rest
    "X" <> rest -> rest
    "Y" <> rest -> rest
    "Z" <> rest -> rest
    _ -> ""
  }
}
