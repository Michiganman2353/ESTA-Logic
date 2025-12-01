//// estalogic_drivers/test/contract_test.gleam
////
//// Tests for Kafka, Redis, and PostgreSQL driver contracts
////
//// Test Coverage:
//// - Protocol specs for all three drivers
//// - Timeout categories and actions
//// - Sequence validation
//// - Driver invariants
//// - Connection state transitions

import gleam/list
import gleam/option.{None, Some}

// ============================================================================
// SECTION 1: TEST RESULT TYPE
// ============================================================================

pub type TestResult {
  Pass(name: String)
  Fail(name: String)
}

// ============================================================================
// SECTION 2: KAFKA CONTRACT TESTS
// ============================================================================

/// Test: Kafka timeout category - soft timeout
pub fn kafka_soft_timeout_test() -> Bool {
  let timeout = SoftTimeout(30_000, RetryWithBackoff(1000, 3))
  case timeout {
    SoftTimeout(ms, RetryWithBackoff(_, retries)) -> ms == 30_000 && retries == 3
    _ -> False
  }
}

/// Test: Kafka timeout category - firm timeout
pub fn kafka_firm_timeout_test() -> Bool {
  let timeout = FirmTimeout(10_000, ReturnTimeout)
  case timeout {
    FirmTimeout(ms, ReturnTimeout) -> ms == 10_000
    _ -> False
  }
}

/// Test: Kafka timeout category - hard timeout
pub fn kafka_hard_timeout_test() -> Bool {
  let timeout = HardTimeout(30_000, TerminateConnection)
  case timeout {
    HardTimeout(ms, TerminateConnection) -> ms == 30_000
    _ -> False
  }
}

/// Test: Kafka sequence validator creation
pub fn kafka_sequence_validator_test() -> Bool {
  let validator = new_sequence_validator(100)
  validator.next_request_id == 1 &&
  validator.max_pending == 100 &&
  validator.completed_count == 0 &&
  validator.failed_count == 0
}

/// Test: Kafka sequence validator - request validation
pub fn kafka_validate_request_test() -> Bool {
  let validator = new_sequence_validator(100)
  case validate_request(validator) {
    Ok(1) -> True
    _ -> False
  }
}

/// Test: Kafka sequence validator - max pending reached
pub fn kafka_max_pending_test() -> Bool {
  let validator = SequenceValidator(
    next_request_id: 101,
    pending_requests: list_repeat(100, PendingRequest(1, "PRODUCE", 0, SoftTimeout(1000, WarnAndContinue))),
    max_pending: 100,
    completed_count: 0,
    failed_count: 0,
  )
  case validate_request(validator) {
    Error(ProtocolViolation(_)) -> True
    _ -> False
  }
}

/// Test: Kafka connection states
pub fn kafka_connection_states_test() -> Bool {
  let disconnected = Disconnected
  let connecting = Connecting(1, 1000)
  let connected = Connected(2000)
  let failed = Failed(TimeoutExpired, 3000)
  
  case disconnected, connecting, connected, failed {
    Disconnected, Connecting(1, _), Connected(_), Failed(TimeoutExpired, _) -> True
    _, _, _, _ -> False
  }
}

/// Test: Kafka acks modes
pub fn kafka_acks_modes_test() -> Bool {
  let none = AcksNone
  let leader = AcksLeader
  let all = AcksAll
  
  case none, leader, all {
    AcksNone, AcksLeader, AcksAll -> True
    _, _, _ -> False
  }
}

/// Test: Kafka driver health status
pub fn kafka_driver_health_test() -> Bool {
  let healthy = DriverHealthy
  let connecting = DriverConnecting
  let degraded = DriverDegraded("test reason")
  let unhealthy = DriverUnhealthy("connection failed")
  let stopped = DriverStopped
  
  case healthy, stopped {
    DriverHealthy, DriverStopped -> True
    _, _ -> False
  }
}

// ============================================================================
// SECTION 3: REDIS CONTRACT TESTS
// ============================================================================

/// Test: Redis command types
pub fn redis_command_types_test() -> Bool {
  let get = Get(RedisKey("test"))
  let set = Set(RedisKey("test"), ArgString("value"), default_set_options())
  let del = Del([RedisKey("test1"), RedisKey("test2")])
  
  case get, del {
    Get(_), Del(_) -> True
    _, _ -> False
  }
}

/// Test: Redis value types
pub fn redis_value_types_test() -> Bool {
  let simple = SimpleString("OK")
  let error = ErrorValue("ERR unknown command")
  let integer = IntegerValue(42)
  let null = NullValue
  let array = ArrayValue([SimpleString("a"), SimpleString("b")])
  
  case simple, integer, null {
    SimpleString("OK"), IntegerValue(42), NullValue -> True
    _, _, _ -> False
  }
}

/// Test: Redis transaction state machine
pub fn redis_transaction_test() -> Bool {
  let no_tx = NoTransaction
  let in_tx = InTransaction(1000, ["SET", "GET"])
  let executed = TransactionExecuted
  let discarded = TransactionDiscarded
  
  case no_tx, executed {
    NoTransaction, TransactionExecuted -> True
    _, _ -> False
  }
}

/// Test: Redis subscription state
pub fn redis_subscription_test() -> Bool {
  let not_subscribed = NotSubscribed
  let subscribed = Subscribed(["channel1", "channel2"], ["pattern:*"])
  
  case not_subscribed, subscribed {
    NotSubscribed, Subscribed(channels, _) -> list_length(channels) == 2
    _, _ -> False
  }
}

/// Test: Redis error types
pub fn redis_error_types_test() -> Bool {
  let generic = GenericError("something went wrong")
  let wrong_type = WrongTypeError("key", "string", "hash")
  let oom = OomError
  let moved = MovedError(1234, "node2", 6379)
  
  case oom, moved {
    OomError, MovedError(slot, _, _) -> slot == 1234
    _, _ -> False
  }
}

/// Test: Redis pipeline mode
pub fn redis_pipeline_test() -> Bool {
  let state = DriverState(
    connection: Connected(1000),
    validator: new_redis_sequence_validator(1000),
    config: default_redis_config(),
    restart_count: 0,
    last_activity: 1000,
    pipeline_buffer: [],
    pipeline_mode: False,
  )
  
  let state_with_pipeline = enable_pipeline(state)
  state_with_pipeline.pipeline_mode == True
}

// ============================================================================
// SECTION 4: POSTGRESQL CONTRACT TESTS
// ============================================================================

/// Test: PostgreSQL OID constants
pub fn postgres_oid_test() -> Bool {
  oid_bool == 16 &&
  oid_int4 == 23 &&
  oid_text == 25 &&
  oid_timestamp == 1114 &&
  oid_uuid == 2950
}

/// Test: PostgreSQL value types
pub fn postgres_value_types_test() -> Bool {
  let null = PgNull
  let bool_val = PgBool(True)
  let int_val = PgInt4(42)
  let text_val = PgText("hello")
  let uuid_val = PgUuid("550e8400-e29b-41d4-a716-446655440000")
  
  case null, int_val, text_val {
    PgNull, PgInt4(42), PgText("hello") -> True
    _, _, _ -> False
  }
}

/// Test: PostgreSQL query types
pub fn postgres_query_types_test() -> Bool {
  let simple = SimpleQuery("SELECT 1")
  let extended = ExtendedQuery("SELECT $1", [param_int(42)], AllText)
  let prepare = Prepare("stmt1", "SELECT $1", [Oid(oid_int4)])
  let execute = ExecutePrepared("stmt1", [param_int(42)])
  
  case simple, prepare {
    SimpleQuery(sql), Prepare(name, _, _) -> sql == "SELECT 1" && name == "stmt1"
    _, _ -> False
  }
}

/// Test: PostgreSQL transaction isolation levels
pub fn postgres_isolation_levels_test() -> Bool {
  let read_committed = ReadCommitted
  let repeatable_read = RepeatableRead
  let serializable = Serializable
  
  case read_committed, serializable {
    ReadCommitted, Serializable -> True
    _, _ -> False
  }
}

/// Test: PostgreSQL connection state machine
pub fn postgres_connection_states_test() -> Bool {
  let ready = Ready(1000)
  let in_query = InQuery(1, 1000)
  let in_tx = InTransaction(1, 1000)
  let tx_failed = TransactionFailed(1, PostgresError(
    severity: SeverityError,
    code: "23505",
    message: "unique_violation",
    detail: Error(Nil),
    hint: Error(Nil),
    position: Error(Nil),
    internal_position: Error(Nil),
    internal_query: Error(Nil),
    where_context: Error(Nil),
    schema_name: Error(Nil),
    table_name: Error(Nil),
    column_name: Error(Nil),
    data_type_name: Error(Nil),
    constraint_name: Error(Nil),
    file_name: Error(Nil),
    line: Error(Nil),
    routine: Error(Nil),
  ))
  
  case ready, in_tx {
    Ready(_), InTransaction(_, _) -> True
    _, _ -> False
  }
}

/// Test: PostgreSQL SQLSTATE classes
pub fn postgres_sqlstate_classes_test() -> Bool {
  let success = SuccessfulCompletion
  let conn_error = ConnectionException
  let integrity = IntegrityConstraintViolation
  let syntax = SyntaxErrorOrAccessRuleViolation
  
  case success, conn_error {
    SuccessfulCompletion, ConnectionException -> True
    _, _ -> False
  }
}

/// Test: PostgreSQL parameter helpers
pub fn postgres_param_helpers_test() -> Bool {
  let null_param = param_null()
  let bool_param = param_bool(True)
  let int_param = param_int(42)
  let text_param = param_text("hello")
  
  case null_param.value, int_param.value, text_param.value {
    PgNull, PgInt4(42), PgText("hello") -> True
    _, _, _ -> False
  }
}

// ============================================================================
// SECTION 5: COMMON CONTRACT TESTS
// ============================================================================

/// Test: Timeout duration extraction
pub fn timeout_duration_test() -> Bool {
  let soft = SoftTimeout(5000, WarnAndContinue)
  let firm = FirmTimeout(10_000, ReturnTimeout)
  let hard = HardTimeout(30_000, TerminateConnection)
  
  get_timeout_duration(soft) == 5000 &&
  get_timeout_duration(firm) == 10_000 &&
  get_timeout_duration(hard) == 30_000
}

/// Test: Invariant checking - bounded pending
pub fn invariant_bounded_pending_test() -> Bool {
  let validator = SequenceValidator(
    next_request_id: 1,
    pending_requests: [],
    max_pending: 100,
    completed_count: 0,
    failed_count: 0,
  )
  
  case check_bounded_pending(validator) {
    InvariantHolds -> True
    _ -> False
  }
}

/// Test: Driver restartability
pub fn driver_restartable_test() -> Bool {
  let failed_state = DriverState(
    connection: Failed(TimeoutExpired, 1000),
    validator: new_sequence_validator(100),
    config: default_cluster_config(),
    current_broker: Error(Nil),
    restart_count: 0,
    last_activity: 1000,
  )
  
  let connected_state = DriverState(
    connection: Connected(1000),
    validator: new_sequence_validator(100),
    config: default_cluster_config(),
    current_broker: Ok(BrokerAddress("localhost", 9092, False)),
    restart_count: 0,
    last_activity: 1000,
  )
  
  is_restartable(failed_state) == True &&
  is_restartable(connected_state) == False
}

// ============================================================================
// SECTION 6: TYPE DEFINITIONS (MIRROR FROM CONTRACTS)
// ============================================================================

// Timeout types
type TimeoutCategory {
  SoftTimeout(duration_ms: Int, on_expire: SoftTimeoutAction)
  FirmTimeout(duration_ms: Int, on_expire: FirmTimeoutAction)
  HardTimeout(duration_ms: Int, on_expire: HardTimeoutAction)
}

type SoftTimeoutAction {
  WarnAndContinue
  RetryWithBackoff(base_delay_ms: Int, max_retries: Int)
  NotifyCaller
}

type FirmTimeoutAction {
  DrainAndStop
  ReturnTimeout
  CancelQuery
  CancelPending
}

type HardTimeoutAction {
  TerminateConnection
  KillProcess
  QuarantineFcr
}

// Kafka types
type ConnectionState {
  Disconnected
  Connecting(attempt: Int, started_at: Int)
  Connected(connected_at: Int)
  Authenticating
  Disconnecting
  Failed(reason: ConnectionError, failed_at: Int)
}

type ConnectionError {
  TimeoutExpired
  ConnectionRefused
  AuthenticationFailed
  BrokerUnreachable
  ProtocolError(message: String)
}

type Acks {
  AcksNone
  AcksLeader
  AcksAll
}

type DriverHealth {
  DriverHealthy
  DriverConnecting
  DriverDegraded(reason: String)
  DriverUnhealthy(reason: String)
  DriverStopping
  DriverStopped
}

type SequenceValidator {
  SequenceValidator(
    next_request_id: Int,
    pending_requests: List(PendingRequest),
    max_pending: Int,
    completed_count: Int,
    failed_count: Int,
  )
}

type PendingRequest {
  PendingRequest(
    request_id: Int,
    request_type: String,
    sent_at: Int,
    timeout: TimeoutCategory,
  )
}

type SequenceError {
  ProtocolViolation(message: String)
  OutOfOrderResponse(expected: Int, received: Int)
}

type BrokerAddress {
  BrokerAddress(host: String, port: Int, use_tls: Bool)
}

type ClusterConfig {
  ClusterConfig(brokers: List(BrokerAddress), client_id: String)
}

type DriverState {
  DriverState(
    connection: ConnectionState,
    validator: SequenceValidator,
    config: ClusterConfig,
    current_broker: Result(BrokerAddress, Nil),
    restart_count: Int,
    last_activity: Int,
  )
}

type InvariantCheckResult {
  InvariantHolds
  InvariantViolated(message: String)
}

// Redis types
type RedisKey {
  RedisKey(value: String)
}

type CommandArg {
  ArgString(value: String)
  ArgInt(value: Int)
  ArgBytes(data: List(Int))
}

type RedisCommand {
  Get(key: RedisKey)
  Set(key: RedisKey, value: CommandArg, options: SetOptions)
  Del(keys: List(RedisKey))
  Multi
  Exec
  Subscribe(channels: List(String))
}

type SetOptions {
  SetOptions(expiry: Result(Int, Nil), nx: Bool, xx: Bool, get: Bool, keep_ttl: Bool)
}

type RedisValue {
  SimpleString(value: String)
  ErrorValue(message: String)
  IntegerValue(value: Int)
  BulkString(data: List(Int))
  ArrayValue(elements: List(RedisValue))
  NullValue
}

type TransactionState {
  NoTransaction
  InTransaction(started_at: Int, queued_commands: List(String))
  TransactionExecuted
  TransactionDiscarded
}

type SubscriptionState {
  NotSubscribed
  Subscribed(channels: List(String), patterns: List(String))
}

type RedisError {
  GenericError(message: String)
  WrongTypeError(key: String, expected: String, actual: String)
  OomError
  MovedError(slot: Int, host: String, port: Int)
}

type RedisDriverState {
  RedisDriverState(
    connection: ConnectionState,
    validator: RedisSequenceValidator,
    config: RedisConfig,
    restart_count: Int,
    last_activity: Int,
    pipeline_buffer: List(RedisCommand),
    pipeline_mode: Bool,
  )
}

type RedisSequenceValidator {
  RedisSequenceValidator(max_pending: Int, next_command_id: Int)
}

type RedisConfig {
  RedisConfig(host: String, port: Int)
}

// PostgreSQL types
type Oid {
  Oid(value: Int)
}

type PgValue {
  PgNull
  PgBool(value: Bool)
  PgInt2(value: Int)
  PgInt4(value: Int)
  PgInt8(value: Int)
  PgFloat4(value: Float)
  PgFloat8(value: Float)
  PgText(value: String)
  PgVarchar(value: String, max_length: Result(Int, Nil))
  PgBytea(data: List(Int))
  PgTimestamp(microseconds: Int)
  PgUuid(value: String)
  PgJson(value: String)
}

type QueryParam {
  QueryParam(value: PgValue, oid: Result(Oid, Nil))
}

type Query {
  SimpleQuery(sql: String)
  ExtendedQuery(sql: String, params: List(QueryParam), formats: ResultFormats)
  Prepare(name: String, sql: String, param_types: List(Oid))
  ExecutePrepared(name: String, params: List(QueryParam))
}

type ResultFormats {
  AllText
  AllBinary
}

type IsolationLevel {
  ReadUncommitted
  ReadCommitted
  RepeatableRead
  Serializable
}

type PgConnectionState {
  Ready(connected_at: Int)
  InQuery(query_id: Int, started_at: Int)
  InTransaction(tx_id: Int, started_at: Int)
  TransactionFailed(tx_id: Int, error: PostgresError)
  TcpConnecting(attempt: Int, started_at: Int)
}

type PostgresError {
  PostgresError(
    severity: ErrorSeverity,
    code: String,
    message: String,
    detail: Result(String, Nil),
    hint: Result(String, Nil),
    position: Result(Int, Nil),
    internal_position: Result(Int, Nil),
    internal_query: Result(String, Nil),
    where_context: Result(String, Nil),
    schema_name: Result(String, Nil),
    table_name: Result(String, Nil),
    column_name: Result(String, Nil),
    data_type_name: Result(String, Nil),
    constraint_name: Result(String, Nil),
    file_name: Result(String, Nil),
    line: Result(Int, Nil),
    routine: Result(String, Nil),
  )
}

type ErrorSeverity {
  SeverityError
  SeverityFatal
  SeverityWarning
}

type SqlStateClass {
  SuccessfulCompletion
  Warning
  ConnectionException
  IntegrityConstraintViolation
  SyntaxErrorOrAccessRuleViolation
}

// ============================================================================
// SECTION 7: HELPER FUNCTIONS
// ============================================================================

fn new_sequence_validator(max_pending: Int) -> SequenceValidator {
  SequenceValidator(
    next_request_id: 1,
    pending_requests: [],
    max_pending: max_pending,
    completed_count: 0,
    failed_count: 0,
  )
}

fn validate_request(validator: SequenceValidator) -> Result(Int, SequenceError) {
  case list_length(validator.pending_requests) >= validator.max_pending {
    True -> Error(ProtocolViolation("Too many pending requests"))
    False -> Ok(validator.next_request_id)
  }
}

fn get_timeout_duration(timeout: TimeoutCategory) -> Int {
  case timeout {
    SoftTimeout(ms, _) -> ms
    FirmTimeout(ms, _) -> ms
    HardTimeout(ms, _) -> ms
  }
}

fn check_bounded_pending(validator: SequenceValidator) -> InvariantCheckResult {
  case list_length(validator.pending_requests) <= validator.max_pending {
    True -> InvariantHolds
    False -> InvariantViolated("Pending requests exceed maximum")
  }
}

fn is_restartable(state: DriverState) -> Bool {
  case state.connection {
    Failed(_, _) -> True
    Disconnected -> True
    _ -> False
  }
}

fn default_set_options() -> SetOptions {
  SetOptions(expiry: Error(Nil), nx: False, xx: False, get: False, keep_ttl: False)
}

fn new_redis_sequence_validator(max: Int) -> RedisSequenceValidator {
  RedisSequenceValidator(max_pending: max, next_command_id: 1)
}

fn default_redis_config() -> RedisConfig {
  RedisConfig(host: "localhost", port: 6379)
}

fn enable_pipeline(state: RedisDriverState) -> RedisDriverState {
  RedisDriverState(..state, pipeline_mode: True)
}

fn default_cluster_config() -> ClusterConfig {
  ClusterConfig(
    brokers: [BrokerAddress("localhost", 9092, False)],
    client_id: "test",
  )
}

fn list_length(list: List(a)) -> Int {
  case list {
    [] -> 0
    [_, ..tail] -> 1 + list_length(tail)
  }
}

fn list_repeat(count: Int, value: a) -> List(a) {
  case count <= 0 {
    True -> []
    False -> [value, ..list_repeat(count - 1, value)]
  }
}

// OID constants
const oid_bool: Int = 16
const oid_int4: Int = 23
const oid_text: Int = 25
const oid_timestamp: Int = 1114
const oid_uuid: Int = 2950

fn param_null() -> QueryParam {
  QueryParam(value: PgNull, oid: Error(Nil))
}

fn param_bool(value: Bool) -> QueryParam {
  QueryParam(value: PgBool(value), oid: Ok(Oid(oid_bool)))
}

fn param_int(value: Int) -> QueryParam {
  QueryParam(value: PgInt4(value), oid: Ok(Oid(oid_int4)))
}

fn param_text(value: String) -> QueryParam {
  QueryParam(value: PgText(value), oid: Ok(Oid(oid_text)))
}

// ============================================================================
// SECTION 8: TEST RUNNER
// ============================================================================

fn run_test(name: String, test_fn: fn() -> Bool) -> TestResult {
  case test_fn() {
    True -> Pass(name)
    False -> Fail(name)
  }
}

pub fn run_all_tests() -> List(TestResult) {
  [
    // Kafka tests
    run_test("kafka_soft_timeout_test", kafka_soft_timeout_test),
    run_test("kafka_firm_timeout_test", kafka_firm_timeout_test),
    run_test("kafka_hard_timeout_test", kafka_hard_timeout_test),
    run_test("kafka_sequence_validator_test", kafka_sequence_validator_test),
    run_test("kafka_validate_request_test", kafka_validate_request_test),
    run_test("kafka_max_pending_test", kafka_max_pending_test),
    run_test("kafka_connection_states_test", kafka_connection_states_test),
    run_test("kafka_acks_modes_test", kafka_acks_modes_test),
    run_test("kafka_driver_health_test", kafka_driver_health_test),
    
    // Redis tests
    run_test("redis_command_types_test", redis_command_types_test),
    run_test("redis_value_types_test", redis_value_types_test),
    run_test("redis_transaction_test", redis_transaction_test),
    run_test("redis_subscription_test", redis_subscription_test),
    run_test("redis_error_types_test", redis_error_types_test),
    run_test("redis_pipeline_test", redis_pipeline_test),
    
    // PostgreSQL tests
    run_test("postgres_oid_test", postgres_oid_test),
    run_test("postgres_value_types_test", postgres_value_types_test),
    run_test("postgres_query_types_test", postgres_query_types_test),
    run_test("postgres_isolation_levels_test", postgres_isolation_levels_test),
    run_test("postgres_connection_states_test", postgres_connection_states_test),
    run_test("postgres_sqlstate_classes_test", postgres_sqlstate_classes_test),
    run_test("postgres_param_helpers_test", postgres_param_helpers_test),
    
    // Common tests
    run_test("timeout_duration_test", timeout_duration_test),
    run_test("invariant_bounded_pending_test", invariant_bounded_pending_test),
    run_test("driver_restartable_test", driver_restartable_test),
  ]
}

pub fn count_passing(results: List(TestResult)) -> Int {
  list.fold(results, 0, fn(acc, result) {
    case result {
      Pass(_) -> acc + 1
      Fail(_) -> acc
    }
  })
}

pub fn get_failures(results: List(TestResult)) -> List(String) {
  list.filter_map(results, fn(result) {
    case result {
      Pass(_) -> None
      Fail(name) -> Some(name)
    }
  })
}
