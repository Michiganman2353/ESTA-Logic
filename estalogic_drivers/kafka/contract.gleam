//// estalogic_drivers/kafka/contract.gleam
////
//// Kafka Driver Verification Contract
////
//// This module defines the formal protocol specification for Kafka driver
//// operations in the ESTA Logic system. Key guarantees:
////
//// 1. Formal Protocol Spec: All message types and state transitions are explicit
//// 2. Bounded Message Sequences: Valid and invalid message sequences are modeled
//// 3. Request-Response Invariants: Property-based test contracts
//// 4. Timeout Categories: Soft, Firm, Hard timeouts with explicit semantics
////
//// Driver Properties:
//// - Deterministic: Same inputs produce same outputs
//// - Non-blocking: All operations are async with bounded latency
//// - Zero-copy: Message buffers are passed by reference where possible
//// - Independently Restartable: Driver can be restarted without system restart
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: KAFKA CONNECTION TYPES
// ============================================================================

/// Kafka broker address
pub type BrokerAddress {
  BrokerAddress(
    /// Hostname or IP address
    host: String,
    /// Port number (typically 9092)
    port: Int,
    /// Use TLS encryption
    use_tls: Bool,
  )
}

/// Kafka cluster configuration
pub type ClusterConfig {
  ClusterConfig(
    /// List of bootstrap brokers
    brokers: List(BrokerAddress),
    /// Client identifier
    client_id: String,
    /// SASL authentication (if enabled)
    auth: Result(SaslAuth, Nil),
    /// Maximum request size in bytes
    max_request_size: Int,
    /// Request timeout in milliseconds
    request_timeout_ms: Int,
    /// Metadata refresh interval in milliseconds
    metadata_refresh_ms: Int,
  )
}

/// SASL authentication configuration
pub type SaslAuth {
  SaslAuth(
    /// SASL mechanism (PLAIN, SCRAM-SHA-256, SCRAM-SHA-512)
    mechanism: SaslMechanism,
    /// Username
    username: String,
    /// Password (should be opaque in production)
    password: String,
  )
}

/// Supported SASL mechanisms
pub type SaslMechanism {
  SaslPlain
  SaslScramSha256
  SaslScramSha512
}

/// Connection state machine
pub type ConnectionState {
  /// Initial state, not yet connected
  Disconnected
  /// Connecting to broker
  Connecting(attempt: Int, started_at: Int)
  /// Connected and ready
  Connected(connected_at: Int)
  /// Authentication in progress
  Authenticating
  /// Disconnecting gracefully
  Disconnecting
  /// Connection failed
  Failed(reason: ConnectionError, failed_at: Int)
}

/// Connection errors
pub type ConnectionError {
  ConnectionRefused(broker: BrokerAddress)
  AuthenticationFailed(reason: String)
  TimeoutExpired
  BrokerUnreachable(broker: BrokerAddress)
  TlsHandshakeFailed(reason: String)
  ProtocolError(message: String)
}

// ============================================================================
// SECTION 2: KAFKA MESSAGE TYPES (FORMAL PROTOCOL SPEC)
// ============================================================================

/// Kafka topic identifier
pub type TopicName {
  TopicName(value: String)
}

/// Partition identifier
pub type PartitionId {
  PartitionId(value: Int)
}

/// Message offset within a partition
pub type Offset {
  /// Specific offset value
  OffsetValue(value: Int)
  /// Start from beginning
  OffsetBeginning
  /// Start from end (latest)
  OffsetEnd
  /// Start from a specific timestamp
  OffsetTimestamp(timestamp_ms: Int)
}

/// Kafka record key (optional)
pub type RecordKey {
  /// Binary key
  KeyBytes(data: List(Int))
  /// String key
  KeyString(value: String)
  /// No key (round-robin partitioning)
  NoKey
}

/// Kafka record value
pub type RecordValue {
  /// Binary value
  ValueBytes(data: List(Int))
  /// String value
  ValueString(value: String)
  /// Null tombstone
  ValueNull
}

/// Kafka record header
pub type RecordHeader {
  RecordHeader(
    key: String,
    value: List(Int),
  )
}

/// Kafka producer record
pub type ProducerRecord {
  ProducerRecord(
    /// Target topic
    topic: TopicName,
    /// Optional partition (if None, use partitioner)
    partition: Result(PartitionId, Nil),
    /// Record key
    key: RecordKey,
    /// Record value
    value: RecordValue,
    /// Record headers
    headers: List(RecordHeader),
    /// Timestamp (None = broker assigns)
    timestamp: Result(Int, Nil),
  )
}

/// Kafka consumer record
pub type ConsumerRecord {
  ConsumerRecord(
    /// Source topic
    topic: TopicName,
    /// Partition
    partition: PartitionId,
    /// Offset within partition
    offset: Int,
    /// Record key
    key: RecordKey,
    /// Record value
    value: RecordValue,
    /// Record headers
    headers: List(RecordHeader),
    /// Timestamp
    timestamp: Int,
    /// Timestamp type
    timestamp_type: TimestampType,
  )
}

/// Timestamp type
pub type TimestampType {
  CreateTime
  LogAppendTime
}

// ============================================================================
// SECTION 3: KAFKA OPERATIONS (REQUEST-RESPONSE CONTRACT)
// ============================================================================

/// Kafka request envelope
pub type KafkaRequest {
  /// Produce messages to topic
  ProduceRequest(records: List(ProducerRecord), acks: Acks, timeout_ms: Int)
  /// Fetch messages from partition
  FetchRequest(topic: TopicName, partition: PartitionId, offset: Offset, max_bytes: Int)
  /// Commit consumer offsets
  CommitOffsetsRequest(group_id: String, offsets: List(PartitionOffset))
  /// Fetch committed offsets
  FetchOffsetsRequest(group_id: String, partitions: List(TopicPartition))
  /// List consumer group offsets
  ListOffsetsRequest(topic: TopicName, partition: PartitionId, timestamp: Int)
  /// Get topic metadata
  MetadataRequest(topics: List(TopicName))
  /// Create topics
  CreateTopicsRequest(topics: List(NewTopic))
  /// Delete topics
  DeleteTopicsRequest(topics: List(TopicName))
  /// Join consumer group
  JoinGroupRequest(group_id: String, member_id: String, protocol_type: String)
  /// Leave consumer group
  LeaveGroupRequest(group_id: String, member_id: String)
  /// Heartbeat to consumer group coordinator
  HeartbeatRequest(group_id: String, member_id: String, generation_id: Int)
  /// API versions query
  ApiVersionsRequest
}

/// Kafka response envelope
pub type KafkaResponse {
  /// Produce response with partition offsets
  ProduceResponse(results: List(ProduceResult))
  /// Fetch response with records
  FetchResponse(records: List(ConsumerRecord), high_watermark: Int)
  /// Commit offsets response
  CommitOffsetsResponse(errors: List(PartitionError))
  /// Fetch offsets response
  FetchOffsetsResponse(offsets: List(PartitionOffset))
  /// List offsets response
  ListOffsetsResponse(offsets: List(PartitionOffset))
  /// Metadata response
  MetadataResponse(brokers: List(BrokerInfo), topics: List(TopicInfo))
  /// Create topics response
  CreateTopicsResponse(results: List(TopicResult))
  /// Delete topics response
  DeleteTopicsResponse(results: List(TopicResult))
  /// Join group response
  JoinGroupResponse(member_id: String, generation_id: Int, leader_id: String)
  /// Leave group response
  LeaveGroupResponse(error: Result(Nil, KafkaError))
  /// Heartbeat response
  HeartbeatResponse(error: Result(Nil, KafkaError))
  /// API versions response
  ApiVersionsResponse(versions: List(ApiVersion))
  /// Error response
  ErrorResponse(error: KafkaError)
}

/// Acknowledgment modes
pub type Acks {
  /// No acknowledgment (fire and forget)
  AcksNone
  /// Leader acknowledgment
  AcksLeader
  /// All in-sync replicas acknowledgment
  AcksAll
}

/// Topic partition identifier
pub type TopicPartition {
  TopicPartition(topic: TopicName, partition: PartitionId)
}

/// Partition offset
pub type PartitionOffset {
  PartitionOffset(
    topic: TopicName,
    partition: PartitionId,
    offset: Int,
    metadata: Result(String, Nil),
  )
}

/// Produce result per partition
pub type ProduceResult {
  ProduceSuccess(topic: TopicName, partition: PartitionId, offset: Int, timestamp: Int)
  ProduceFailure(topic: TopicName, partition: PartitionId, error: KafkaError)
}

/// Partition error
pub type PartitionError {
  PartitionError(topic: TopicName, partition: PartitionId, error: KafkaError)
}

/// Broker information
pub type BrokerInfo {
  BrokerInfo(node_id: Int, host: String, port: Int, rack: Result(String, Nil))
}

/// Topic information
pub type TopicInfo {
  TopicInfo(
    name: TopicName,
    partitions: List(PartitionInfo),
    is_internal: Bool,
  )
}

/// Partition information
pub type PartitionInfo {
  PartitionInfo(
    partition: PartitionId,
    leader: Int,
    replicas: List(Int),
    isr: List(Int),
  )
}

/// New topic definition
pub type NewTopic {
  NewTopic(
    name: TopicName,
    num_partitions: Int,
    replication_factor: Int,
    config: List(TopicConfig),
  )
}

/// Topic configuration entry
pub type TopicConfig {
  TopicConfig(key: String, value: String)
}

/// Topic operation result
pub type TopicResult {
  TopicResult(name: TopicName, error: Result(Nil, KafkaError))
}

/// API version info
pub type ApiVersion {
  ApiVersion(api_key: Int, min_version: Int, max_version: Int)
}

// ============================================================================
// SECTION 4: KAFKA ERROR TYPES
// ============================================================================

/// Kafka error codes (matching Kafka protocol)
pub type KafkaError {
  /// Unknown server error
  UnknownError(code: Int)
  /// Message CRC check failed
  CorruptMessage
  /// Unknown topic or partition
  UnknownTopicOrPartition
  /// Invalid message size
  InvalidMessageSize
  /// Leader not available for partition
  LeaderNotAvailable
  /// Not leader for partition
  NotLeaderForPartition
  /// Request timed out
  RequestTimedOut
  /// Broker not available
  BrokerNotAvailable
  /// Replica not available
  ReplicaNotAvailable
  /// Message too large
  MessageTooLarge
  /// Offset out of range
  OffsetOutOfRange
  /// Consumer group coordinator not available
  GroupCoordinatorNotAvailable
  /// Not coordinator for consumer group
  NotCoordinatorForGroup
  /// Invalid topic name
  InvalidTopic
  /// Record batch too large
  RecordListTooLarge
  /// Not enough replicas
  NotEnoughReplicas
  /// Not enough in-sync replicas
  NotEnoughReplicasAfterAppend
  /// Invalid required acks
  InvalidRequiredAcks
  /// Illegal generation ID
  IllegalGeneration
  /// Inconsistent group protocol
  InconsistentGroupProtocol
  /// Invalid session timeout
  InvalidSessionTimeout
  /// Rebalance in progress
  RebalanceInProgress
  /// Invalid commit offset size
  InvalidCommitOffsetSize
  /// Topic authorization failed
  TopicAuthorizationFailed
  /// Group authorization failed
  GroupAuthorizationFailed
  /// Cluster authorization failed
  ClusterAuthorizationFailed
  /// Invalid timestamp
  InvalidTimestamp
  /// Unsupported SASL mechanism
  UnsupportedSaslMechanism
  /// Illegal SASL state
  IllegalSaslState
  /// Unsupported version
  UnsupportedVersion
}

/// Convert error code to KafkaError
pub fn error_from_code(code: Int) -> KafkaError {
  case code {
    0 -> UnknownError(0)
    2 -> CorruptMessage
    3 -> UnknownTopicOrPartition
    4 -> InvalidMessageSize
    5 -> LeaderNotAvailable
    6 -> NotLeaderForPartition
    7 -> RequestTimedOut
    8 -> BrokerNotAvailable
    9 -> ReplicaNotAvailable
    10 -> MessageTooLarge
    1 -> OffsetOutOfRange
    15 -> GroupCoordinatorNotAvailable
    16 -> NotCoordinatorForGroup
    17 -> InvalidTopic
    18 -> RecordListTooLarge
    19 -> NotEnoughReplicas
    20 -> NotEnoughReplicasAfterAppend
    21 -> InvalidRequiredAcks
    22 -> IllegalGeneration
    23 -> InconsistentGroupProtocol
    26 -> InvalidSessionTimeout
    27 -> RebalanceInProgress
    28 -> InvalidCommitOffsetSize
    29 -> TopicAuthorizationFailed
    30 -> GroupAuthorizationFailed
    31 -> ClusterAuthorizationFailed
    32 -> InvalidTimestamp
    33 -> UnsupportedSaslMechanism
    34 -> IllegalSaslState
    35 -> UnsupportedVersion
    _ -> UnknownError(code)
  }
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
  /// Complete in-flight requests then stop
  DrainAndStop
  /// Commit partial results then stop
  CommitPartialAndStop
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

/// Default timeouts for Kafka operations
pub fn default_produce_timeout() -> TimeoutCategory {
  SoftTimeout(
    duration_ms: 30_000,
    on_expire: RetryWithBackoff(1000, 3),
  )
}

pub fn default_fetch_timeout() -> TimeoutCategory {
  FirmTimeout(
    duration_ms: 10_000,
    on_expire: ReturnTimeout,
  )
}

pub fn default_connect_timeout() -> TimeoutCategory {
  FirmTimeout(
    duration_ms: 5_000,
    on_expire: DrainAndStop,
  )
}

pub fn default_heartbeat_timeout() -> TimeoutCategory {
  HardTimeout(
    duration_ms: 30_000,
    on_expire: TerminateConnection,
  )
}

// ============================================================================
// SECTION 6: MESSAGE SEQUENCE VALIDATION (BOUNDED MODEL)
// ============================================================================

/// Valid message sequence states
pub type SequenceState {
  /// Initial state
  SequenceIdle
  /// Request sent, awaiting response
  SequenceRequestSent(request_id: Int, sent_at: Int)
  /// Response received
  SequenceResponseReceived(request_id: Int, received_at: Int)
  /// Sequence completed
  SequenceCompleted
  /// Sequence failed
  SequenceFailed(reason: SequenceError)
}

/// Sequence validation errors
pub type SequenceError {
  /// Out of order response
  OutOfOrderResponse(expected: Int, received: Int)
  /// Duplicate request ID
  DuplicateRequestId(id: Int)
  /// Missing response
  MissingResponse(request_id: Int, timeout_ms: Int)
  /// Unexpected message type
  UnexpectedMessageType(expected: String, received: String)
  /// Protocol violation
  ProtocolViolation(message: String)
}

/// Sequence validator state
pub type SequenceValidator {
  SequenceValidator(
    /// Next expected request ID
    next_request_id: Int,
    /// Pending requests awaiting responses
    pending_requests: List(PendingRequest),
    /// Maximum pending requests
    max_pending: Int,
    /// Completed sequence count
    completed_count: Int,
    /// Failed sequence count
    failed_count: Int,
  )
}

/// Pending request entry
pub type PendingRequest {
  PendingRequest(
    request_id: Int,
    request_type: String,
    sent_at: Int,
    timeout: TimeoutCategory,
  )
}

/// Create new sequence validator
pub fn new_sequence_validator(max_pending: Int) -> SequenceValidator {
  SequenceValidator(
    next_request_id: 1,
    pending_requests: [],
    max_pending: max_pending,
    completed_count: 0,
    failed_count: 0,
  )
}

/// Validate request can be sent
pub fn validate_request(
  validator: SequenceValidator,
) -> Result(Int, SequenceError) {
  case list_length(validator.pending_requests) >= validator.max_pending {
    True -> Error(ProtocolViolation("Too many pending requests"))
    False -> Ok(validator.next_request_id)
  }
}

/// Record request sent
pub fn record_request_sent(
  validator: SequenceValidator,
  request_type: String,
  sent_at: Int,
  timeout: TimeoutCategory,
) -> SequenceValidator {
  let pending = PendingRequest(
    request_id: validator.next_request_id,
    request_type: request_type,
    sent_at: sent_at,
    timeout: timeout,
  )
  SequenceValidator(
    ..validator,
    next_request_id: validator.next_request_id + 1,
    pending_requests: [pending, ..validator.pending_requests],
  )
}

/// Record response received
pub fn record_response_received(
  validator: SequenceValidator,
  request_id: Int,
) -> Result(SequenceValidator, SequenceError) {
  case find_pending_request(validator.pending_requests, request_id) {
    Error(_) -> Error(OutOfOrderResponse(0, request_id))
    Ok(_) -> Ok(SequenceValidator(
      ..validator,
      pending_requests: remove_pending_request(validator.pending_requests, request_id),
      completed_count: validator.completed_count + 1,
    ))
  }
}

/// Check for timed out requests
pub fn check_timeouts(
  validator: SequenceValidator,
  now: Int,
) -> #(SequenceValidator, List(SequenceError)) {
  let #(valid, expired) = partition_by_timeout(validator.pending_requests, now)
  let errors = list_map(expired, fn(p) {
    MissingResponse(p.request_id, get_timeout_duration(p.timeout))
  })
  #(
    SequenceValidator(
      ..validator,
      pending_requests: valid,
      failed_count: validator.failed_count + list_length(expired),
    ),
    errors,
  )
}

// ============================================================================
// SECTION 7: DRIVER INVARIANTS (PROPERTY-BASED TEST CONTRACTS)
// ============================================================================

/// Driver invariant that must always hold
pub type DriverInvariant {
  /// All responses must match a pending request
  InvariantResponseMatchesRequest
  /// Request IDs must be unique
  InvariantUniqueRequestIds
  /// No request can exceed max pending limit
  InvariantBoundedPending
  /// All timeouts must be respected
  InvariantTimeoutsRespected
  /// Driver state must be consistent
  InvariantStateConsistent
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
    check_unique_request_ids(validator),
  ]
}

/// Check bounded pending invariant
fn check_bounded_pending(validator: SequenceValidator) -> InvariantCheckResult {
  case list_length(validator.pending_requests) <= validator.max_pending {
    True -> InvariantHolds
    False -> InvariantViolated(
      InvariantBoundedPending,
      "Pending requests exceed maximum",
    )
  }
}

/// Check unique request IDs invariant
fn check_unique_request_ids(validator: SequenceValidator) -> InvariantCheckResult {
  case has_duplicate_ids(validator.pending_requests) {
    False -> InvariantHolds
    True -> InvariantViolated(
      InvariantUniqueRequestIds,
      "Duplicate request IDs found",
    )
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
    config: ClusterConfig,
    /// Current broker
    current_broker: Result(BrokerAddress, Nil),
    /// Restart count
    restart_count: Int,
    /// Last activity timestamp
    last_activity: Int,
  )
}

/// Driver lifecycle events
pub type DriverEvent {
  /// Driver started
  DriverStarted(timestamp: Int)
  /// Driver connected to broker
  DriverConnected(broker: BrokerAddress, timestamp: Int)
  /// Driver disconnected
  DriverDisconnected(reason: ConnectionError, timestamp: Int)
  /// Driver restarted
  DriverRestarted(attempt: Int, timestamp: Int)
  /// Driver stopped
  DriverStopped(reason: String, timestamp: Int)
}

/// Create new driver state
pub fn new_driver_state(config: ClusterConfig) -> DriverState {
  DriverState(
    connection: Disconnected,
    validator: new_sequence_validator(100),
    config: config,
    current_broker: Error(Nil),
    restart_count: 0,
    last_activity: 0,
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
// SECTION 9: HELPER FUNCTIONS
// ============================================================================

fn list_length(list: List(a)) -> Int {
  case list {
    [] -> 0
    [_, ..tail] -> 1 + list_length(tail)
  }
}

fn list_map(list: List(a), f: fn(a) -> b) -> List(b) {
  case list {
    [] -> []
    [head, ..tail] -> [f(head), ..list_map(tail, f)]
  }
}

fn find_pending_request(
  pending: List(PendingRequest),
  request_id: Int,
) -> Result(PendingRequest, Nil) {
  case pending {
    [] -> Error(Nil)
    [p, ..rest] ->
      case p.request_id == request_id {
        True -> Ok(p)
        False -> find_pending_request(rest, request_id)
      }
  }
}

fn remove_pending_request(
  pending: List(PendingRequest),
  request_id: Int,
) -> List(PendingRequest) {
  case pending {
    [] -> []
    [p, ..rest] ->
      case p.request_id == request_id {
        True -> rest
        False -> [p, ..remove_pending_request(rest, request_id)]
      }
  }
}

fn partition_by_timeout(
  pending: List(PendingRequest),
  now: Int,
) -> #(List(PendingRequest), List(PendingRequest)) {
  case pending {
    [] -> #([], [])
    [p, ..rest] -> {
      let #(valid, expired) = partition_by_timeout(rest, now)
      let timeout_ms = get_timeout_duration(p.timeout)
      case now - p.sent_at > timeout_ms {
        True -> #(valid, [p, ..expired])
        False -> #([p, ..valid], expired)
      }
    }
  }
}

fn get_timeout_duration(timeout: TimeoutCategory) -> Int {
  case timeout {
    SoftTimeout(ms, _) -> ms
    FirmTimeout(ms, _) -> ms
    HardTimeout(ms, _) -> ms
  }
}

fn has_duplicate_ids(pending: List(PendingRequest)) -> Bool {
  case pending {
    [] -> False
    [p, ..rest] ->
      case id_exists(rest, p.request_id) {
        True -> True
        False -> has_duplicate_ids(rest)
      }
  }
}

fn id_exists(pending: List(PendingRequest), id: Int) -> Bool {
  case pending {
    [] -> False
    [p, ..rest] ->
      case p.request_id == id {
        True -> True
        False -> id_exists(rest, id)
      }
  }
}

fn format_connection_error(error: ConnectionError) -> String {
  case error {
    ConnectionRefused(_) -> "Connection refused"
    AuthenticationFailed(r) -> "Authentication failed: " <> r
    TimeoutExpired -> "Connection timeout"
    BrokerUnreachable(_) -> "Broker unreachable"
    TlsHandshakeFailed(r) -> "TLS handshake failed: " <> r
    ProtocolError(m) -> "Protocol error: " <> m
  }
}

// ============================================================================
// SECTION 10: DEFAULT CONFIGURATIONS
// ============================================================================

/// Default cluster configuration
pub fn default_cluster_config() -> ClusterConfig {
  ClusterConfig(
    brokers: [BrokerAddress(host: "localhost", port: 9092, use_tls: False)],
    client_id: "estalogic-driver",
    auth: Error(Nil),
    max_request_size: 1_048_576,
    request_timeout_ms: 30_000,
    metadata_refresh_ms: 300_000,
  )
}

/// Production cluster configuration with TLS
pub fn production_cluster_config(brokers: List(BrokerAddress), auth: SaslAuth) -> ClusterConfig {
  ClusterConfig(
    brokers: brokers,
    client_id: "estalogic-driver-prod",
    auth: Ok(auth),
    max_request_size: 10_485_760,
    request_timeout_ms: 60_000,
    metadata_refresh_ms: 60_000,
  )
}
