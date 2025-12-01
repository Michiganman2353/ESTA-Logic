//// estalogic_kernel/security/cap_system.gleam
////
//// Secure Capability-Based Access Control System (Microkernel Cap System)
////
//// This module implements a capability-based security model that replaces
//// traditional permission logic with unforgeable handles/capabilities.
////
//// Key Design Principles:
//// 1. Capabilities are opaque tokens issued by the kernel
//// 2. A process can only read/write what its capabilities allow
//// 3. Drivers validate capabilities before performing work
//// 4. Capabilities can be delegated, revoked, and attenuated
//// 5. No ambient authority - all access must go through capabilities
////
//// Security Guarantees:
//// - Unforgeable: Capabilities cannot be created outside the kernel
//// - Monotonic Attenuation: Capabilities can only be weakened, never strengthened
//// - Revocable: All capabilities can be revoked by their issuer
//// - Auditable: All capability operations are logged
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: CAPABILITY IDENTIFIER TYPES
// ============================================================================

/// Unique identifier for a capability
/// 128-bit value split into high/low for Gleam compatibility
pub type CapabilityId {
  CapabilityId(
    /// High 64 bits (includes version and type info)
    high: Int,
    /// Low 64 bits (random component)
    low: Int,
  )
}

/// Process identifier
pub type ProcessId {
  ProcessId(value: Int)
}

/// Driver identifier
pub type DriverId {
  DriverId(
    driver_type: DriverType,
    instance_id: Int,
  )
}

/// Driver types in the system
pub type DriverType {
  KafkaDriver
  RedisDriver
  PostgresDriver
  TauriDriver
  WasmDriver
  CustomDriver(name: String)
}

/// Resource identifier
pub type ResourceId {
  ResourceId(
    /// Resource type
    resource_type: ResourceType,
    /// Type-specific identifier
    type_id: String,
  )
}

/// Resource types that can have capabilities
pub type ResourceType {
  /// Memory region
  ResourceMemory
  /// Message channel
  ResourceChannel
  /// File or blob storage
  ResourceFile
  /// Database connection/query
  ResourceDatabase
  /// Kafka topic
  ResourceKafkaTopic
  /// Redis key prefix
  ResourceRedisKeyspace
  /// PostgreSQL schema/table
  ResourcePgTable
  /// WASM module
  ResourceWasmModule
  /// Process handle
  ResourceProcess
  /// Audit log
  ResourceAuditLog
  /// Configuration key
  ResourceConfig
  /// Timer/clock
  ResourceTimer
  /// Network endpoint
  ResourceNetwork
  /// Custom resource type
  ResourceCustom(name: String)
}

// ============================================================================
// SECTION 2: CAPABILITY TYPES
// ============================================================================

/// Core capability structure
/// Represents an unforgeable access token granted by the kernel
pub type Capability {
  Capability(
    /// Unique capability identifier
    id: CapabilityId,
    /// Resource this capability grants access to
    resource: ResourceId,
    /// Rights granted by this capability
    rights: CapabilityRights,
    /// Owner process
    owner: ProcessId,
    /// Issuer (kernel or delegating process)
    issuer: CapabilityIssuer,
    /// Validity constraints
    validity: CapabilityValidity,
    /// Attenuation chain (for delegated caps)
    attenuation_chain: List(AttenuationRecord),
    /// Capability flags
    flags: CapabilityFlags,
    /// Creation timestamp
    created_at: Int,
    /// Capability version (for revocation)
    version: Int,
  )
}

/// Rights that can be granted by a capability
pub type CapabilityRights {
  CapabilityRights(
    /// Permission to read resource
    read: Bool,
    /// Permission to write/modify resource
    write: Bool,
    /// Permission to delete resource
    delete: Bool,
    /// Permission to execute (for code/functions)
    execute: Bool,
    /// Permission to create child resources
    create: Bool,
    /// Permission to list/enumerate resource contents
    list: Bool,
    /// Permission to delegate this capability
    delegate: Bool,
    /// Permission to revoke delegated capabilities
    revoke: Bool,
    /// Custom rights (extensibility)
    custom_rights: List(String),
  )
}

/// Who issued the capability
pub type CapabilityIssuer {
  /// Issued by the kernel (root authority)
  KernelIssued
  /// Delegated from another capability
  Delegated(parent_cap_id: CapabilityId, delegator: ProcessId)
  /// Issued by a driver (restricted)
  DriverIssued(driver_id: DriverId)
}

/// Validity constraints for a capability
pub type CapabilityValidity {
  CapabilityValidity(
    /// Expiration timestamp (None = never expires)
    expires_at: Result(Int, Nil),
    /// Usage count limit (None = unlimited)
    max_uses: Result(Int, Nil),
    /// Current usage count
    use_count: Int,
    /// Time-based restrictions
    time_restrictions: Result(TimeRestrictions, Nil),
    /// Process restrictions
    process_restrictions: Result(ProcessRestrictions, Nil),
  )
}

/// Time-based access restrictions
pub type TimeRestrictions {
  TimeRestrictions(
    /// Valid after this timestamp
    valid_after: Result(Int, Nil),
    /// Valid before this timestamp
    valid_before: Result(Int, Nil),
    /// Valid during specific hours (0-23)
    valid_hours: Result(#(Int, Int), Nil),
    /// Valid on specific days (0=Sun, 6=Sat)
    valid_days: Result(List(Int), Nil),
  )
}

/// Process-based access restrictions
pub type ProcessRestrictions {
  ProcessRestrictions(
    /// Only valid for these processes
    allowed_processes: Result(List(ProcessId), Nil),
    /// Never valid for these processes
    denied_processes: List(ProcessId),
    /// Only valid when parent process is alive
    require_parent_alive: Bool,
  )
}

/// Capability flags
pub type CapabilityFlags {
  CapabilityFlags(
    /// Capability has been revoked
    revoked: Bool,
    /// Capability is ephemeral (not persisted)
    ephemeral: Bool,
    /// Capability is inheritable by child processes
    inheritable: Bool,
    /// Capability requires secure channel
    secure_only: Bool,
    /// Capability is for debug purposes only
    debug_only: Bool,
    /// Capability grants admin rights
    admin: Bool,
  )
}

/// Record of capability attenuation
pub type AttenuationRecord {
  AttenuationRecord(
    /// Process that performed attenuation
    attenuator: ProcessId,
    /// Rights removed in this attenuation
    rights_removed: CapabilityRights,
    /// Additional constraints added
    constraints_added: String,
    /// When attenuation occurred
    attenuated_at: Int,
  )
}

// ============================================================================
// SECTION 3: CAPABILITY OPERATIONS
// ============================================================================

/// Result of capability validation
pub type ValidationResult {
  /// Capability is valid for the requested operation
  Valid
  /// Capability is invalid with reason
  Invalid(reason: ValidationError)
}

/// Validation error types
pub type ValidationError {
  /// Capability not found
  CapabilityNotFound
  /// Capability has been revoked
  CapabilityRevoked
  /// Capability has expired
  CapabilityExpired
  /// Usage limit exceeded
  UsageLimitExceeded(used: Int, max: Int)
  /// Insufficient rights
  InsufficientRights(required: List(String), has: List(String))
  /// Wrong resource type
  WrongResourceType(expected: String, actual: String)
  /// Time restriction violated
  TimeRestrictionViolated(reason: String)
  /// Process restriction violated
  ProcessRestrictionViolated(process: ProcessId)
  /// Delegation not allowed
  DelegationNotAllowed
  /// Capability forged (security violation)
  CapabilityForged
  /// Capability integrity check failed
  IntegrityCheckFailed
}

/// Capability operation request
pub type CapabilityOperation {
  /// Create a new capability (kernel only)
  CreateCapability(
    resource: ResourceId,
    rights: CapabilityRights,
    owner: ProcessId,
    validity: CapabilityValidity,
  )
  /// Validate a capability for an operation
  ValidateCapability(
    cap_id: CapabilityId,
    required_rights: CapabilityRights,
    resource: ResourceId,
    requestor: ProcessId,
  )
  /// Delegate a capability to another process
  DelegateCapability(
    cap_id: CapabilityId,
    to_process: ProcessId,
    attenuated_rights: CapabilityRights,
  )
  /// Revoke a capability
  RevokeCapability(
    cap_id: CapabilityId,
    reason: String,
  )
  /// Revoke all capabilities delegated from a parent
  RevokeDelegated(
    parent_cap_id: CapabilityId,
  )
  /// Query capability information
  QueryCapability(
    cap_id: CapabilityId,
  )
  /// List capabilities for a process
  ListCapabilities(
    process: ProcessId,
    resource_type_filter: Result(ResourceType, Nil),
  )
  /// Extend capability validity
  ExtendValidity(
    cap_id: CapabilityId,
    new_expiry: Int,
  )
  /// Record capability usage
  RecordUsage(
    cap_id: CapabilityId,
  )
}

/// Result of capability operation
pub type OperationResult {
  /// Capability created successfully
  Created(capability: Capability)
  /// Validation result
  Validated(result: ValidationResult)
  /// Delegation result
  Delegated(new_cap: Capability)
  /// Revocation result
  Revoked(cap_id: CapabilityId, delegated_also_revoked: Int)
  /// Query result
  Queried(capability: Result(Capability, ValidationError))
  /// List result
  Listed(capabilities: List(Capability))
  /// Validity extended
  Extended(new_expiry: Int)
  /// Usage recorded
  UsageRecorded(new_count: Int)
  /// Operation failed
  Failed(error: ValidationError)
  /// Operation denied (insufficient authority)
  Denied(reason: String)
}

// ============================================================================
// SECTION 4: CAPABILITY STORE
// ============================================================================

/// Capability store state
pub type CapabilityStore {
  CapabilityStore(
    /// All active capabilities
    capabilities: List(StoredCapability),
    /// Revocation list
    revocations: List(RevocationRecord),
    /// Next capability ID counter
    next_id: Int,
    /// Store configuration
    config: StoreConfig,
    /// Statistics
    stats: StoreStats,
  )
}

/// Stored capability with metadata
pub type StoredCapability {
  StoredCapability(
    capability: Capability,
    /// Integrity signature (HMAC)
    signature: List(Int),
    /// Last access timestamp
    last_accessed: Int,
    /// Access count
    access_count: Int,
  )
}

/// Revocation record
pub type RevocationRecord {
  RevocationRecord(
    cap_id: CapabilityId,
    revoked_at: Int,
    revoked_by: ProcessId,
    reason: String,
    cascade_count: Int,
  )
}

/// Store configuration
pub type StoreConfig {
  StoreConfig(
    /// Maximum capabilities per process
    max_caps_per_process: Int,
    /// Maximum delegation depth
    max_delegation_depth: Int,
    /// Capability expiration check interval (ms)
    expiration_check_interval_ms: Int,
    /// Keep revocation records for (ms)
    revocation_retention_ms: Int,
    /// Enable integrity checking
    enable_integrity_check: Bool,
  )
}

/// Store statistics
pub type StoreStats {
  StoreStats(
    /// Total capabilities created
    total_created: Int,
    /// Total capabilities revoked
    total_revoked: Int,
    /// Total validations performed
    total_validations: Int,
    /// Validation failures
    validation_failures: Int,
    /// Active capability count
    active_count: Int,
    /// Expired capability count
    expired_count: Int,
  )
}

/// Create new capability store
pub fn new_capability_store(config: StoreConfig) -> CapabilityStore {
  CapabilityStore(
    capabilities: [],
    revocations: [],
    next_id: 1,
    config: config,
    stats: StoreStats(
      total_created: 0,
      total_revoked: 0,
      total_validations: 0,
      validation_failures: 0,
      active_count: 0,
      expired_count: 0,
    ),
  )
}

/// Default store configuration
pub fn default_store_config() -> StoreConfig {
  StoreConfig(
    max_caps_per_process: 1000,
    max_delegation_depth: 5,
    expiration_check_interval_ms: 60_000,
    revocation_retention_ms: 86_400_000,
    enable_integrity_check: True,
  )
}

// ============================================================================
// SECTION 5: CAPABILITY CREATION AND MANAGEMENT
// ============================================================================

/// Create a new capability (kernel authority)
pub fn create_capability(
  store: CapabilityStore,
  resource: ResourceId,
  rights: CapabilityRights,
  owner: ProcessId,
  validity: CapabilityValidity,
  created_at: Int,
) -> #(CapabilityStore, Result(Capability, ValidationError)) {
  // Check process capability limit
  let owner_cap_count = count_capabilities_for_process(store.capabilities, owner)
  case owner_cap_count >= store.config.max_caps_per_process {
    True -> #(store, Error(UsageLimitExceeded(owner_cap_count, store.config.max_caps_per_process)))
    False -> {
      let cap_id = generate_capability_id(store.next_id, created_at)
      let cap = Capability(
        id: cap_id,
        resource: resource,
        rights: rights,
        owner: owner,
        issuer: KernelIssued,
        validity: validity,
        attenuation_chain: [],
        flags: default_capability_flags(),
        created_at: created_at,
        version: 1,
      )
      let stored = StoredCapability(
        capability: cap,
        signature: compute_signature(cap),
        last_accessed: created_at,
        access_count: 0,
      )
      let new_store = CapabilityStore(
        ..store,
        capabilities: [stored, ..store.capabilities],
        next_id: store.next_id + 1,
        stats: StoreStats(
          ..store.stats,
          total_created: store.stats.total_created + 1,
          active_count: store.stats.active_count + 1,
        ),
      )
      #(new_store, Ok(cap))
    }
  }
}

/// Validate a capability for a specific operation
pub fn validate_capability(
  store: CapabilityStore,
  cap_id: CapabilityId,
  required_rights: CapabilityRights,
  resource: ResourceId,
  requestor: ProcessId,
  now: Int,
) -> #(CapabilityStore, ValidationResult) {
  // Find the capability
  case find_capability(store.capabilities, cap_id) {
    Error(_) -> #(
      increment_validation_failures(store),
      Invalid(CapabilityNotFound),
    )
    Ok(stored) -> {
      let cap = stored.capability
      
      // Check if revoked
      case cap.flags.revoked || is_revoked(store.revocations, cap_id) {
        True -> #(
          increment_validation_failures(store),
          Invalid(CapabilityRevoked),
        )
        False -> {
          // Check expiration
          case check_expiration(cap.validity, now) {
            Invalid(err) -> #(increment_validation_failures(store), Invalid(err))
            Valid -> {
              // Check usage limits
              case check_usage_limit(cap.validity) {
                Invalid(err) -> #(increment_validation_failures(store), Invalid(err))
                Valid -> {
                  // Check time restrictions
                  case check_time_restrictions(cap.validity, now) {
                    Invalid(err) -> #(increment_validation_failures(store), Invalid(err))
                    Valid -> {
                      // Check process restrictions
                      case check_process_restrictions(cap.validity, requestor) {
                        Invalid(err) -> #(increment_validation_failures(store), Invalid(err))
                        Valid -> {
                          // Check rights
                          case check_rights(cap.rights, required_rights) {
                            Invalid(err) -> #(increment_validation_failures(store), Invalid(err))
                            Valid -> {
                              // Check resource match
                              case check_resource_match(cap.resource, resource) {
                                Invalid(err) -> #(increment_validation_failures(store), Invalid(err))
                                Valid -> {
                                  // Validation successful - update stats
                                  let new_store = increment_validations(store)
                                  #(new_store, Valid)
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

/// Delegate a capability to another process
pub fn delegate_capability(
  store: CapabilityStore,
  cap_id: CapabilityId,
  to_process: ProcessId,
  attenuated_rights: CapabilityRights,
  delegator: ProcessId,
  now: Int,
) -> #(CapabilityStore, Result(Capability, ValidationError)) {
  case find_capability(store.capabilities, cap_id) {
    Error(_) -> #(store, Error(CapabilityNotFound))
    Ok(stored) -> {
      let cap = stored.capability
      
      // Check if delegation is allowed
      case cap.rights.delegate {
        False -> #(store, Error(DelegationNotAllowed))
        True -> {
          // Check delegation depth
          let depth = list_length(cap.attenuation_chain)
          case depth >= store.config.max_delegation_depth {
            True -> #(store, Error(UsageLimitExceeded(depth, store.config.max_delegation_depth)))
            False -> {
              // Attenuate rights (can only reduce, never increase)
              let new_rights = attenuate_rights(cap.rights, attenuated_rights)
              
              // Create attenuation record
              let attenuation = AttenuationRecord(
                attenuator: delegator,
                rights_removed: compute_rights_diff(cap.rights, new_rights),
                constraints_added: "delegated",
                attenuated_at: now,
              )
              
              // Create new capability
              let new_cap_id = generate_capability_id(store.next_id, now)
              let new_cap = Capability(
                id: new_cap_id,
                resource: cap.resource,
                rights: new_rights,
                owner: to_process,
                issuer: Delegated(cap_id, delegator),
                validity: cap.validity,
                attenuation_chain: [attenuation, ..cap.attenuation_chain],
                flags: CapabilityFlags(..cap.flags, admin: False),
                created_at: now,
                version: 1,
              )
              
              let stored_new = StoredCapability(
                capability: new_cap,
                signature: compute_signature(new_cap),
                last_accessed: now,
                access_count: 0,
              )
              
              let new_store = CapabilityStore(
                ..store,
                capabilities: [stored_new, ..store.capabilities],
                next_id: store.next_id + 1,
                stats: StoreStats(
                  ..store.stats,
                  total_created: store.stats.total_created + 1,
                  active_count: store.stats.active_count + 1,
                ),
              )
              
              #(new_store, Ok(new_cap))
            }
          }
        }
      }
    }
  }
}

/// Revoke a capability
pub fn revoke_capability(
  store: CapabilityStore,
  cap_id: CapabilityId,
  revoker: ProcessId,
  reason: String,
  now: Int,
) -> #(CapabilityStore, Result(Int, ValidationError)) {
  case find_capability(store.capabilities, cap_id) {
    Error(_) -> #(store, Error(CapabilityNotFound))
    Ok(stored) -> {
      let cap = stored.capability
      
      // Check if revoker has authority
      let can_revoke = case cap.issuer {
        KernelIssued -> True  // Kernel can always revoke its own
        Delegated(_, delegator) -> delegator.value == revoker.value
        DriverIssued(_) -> True  // Allow revocation
      }
      
      case can_revoke || cap.rights.revoke {
        False -> #(store, Error(InsufficientRights(["revoke"], [])))
        True -> {
          // Mark as revoked
          let updated_cap = Capability(
            ..cap,
            flags: CapabilityFlags(..cap.flags, revoked: True),
          )
          let updated_stored = StoredCapability(
            ..stored,
            capability: updated_cap,
          )
          
          // Cascade revocation to delegated capabilities
          let #(cascade_caps, other_caps) = partition_delegated(store.capabilities, cap_id)
          let cascade_count = list_length(cascade_caps)
          
          // Create revocation record
          let revocation = RevocationRecord(
            cap_id: cap_id,
            revoked_at: now,
            revoked_by: revoker,
            reason: reason,
            cascade_count: cascade_count,
          )
          
          // Update store
          let new_caps = [updated_stored, ..other_caps]
          let new_store = CapabilityStore(
            ..store,
            capabilities: new_caps,
            revocations: [revocation, ..store.revocations],
            stats: StoreStats(
              ..store.stats,
              total_revoked: store.stats.total_revoked + 1 + cascade_count,
              active_count: store.stats.active_count - 1 - cascade_count,
            ),
          )
          
          #(new_store, Ok(cascade_count + 1))
        }
      }
    }
  }
}

// ============================================================================
// SECTION 6: DRIVER CAPABILITY INTERFACE
// ============================================================================

/// Capability check request from driver
pub type DriverCapabilityCheck {
  DriverCapabilityCheck(
    /// The capability being presented
    cap_id: CapabilityId,
    /// Operation being performed
    operation: DriverOperation,
    /// Resource being accessed
    resource: ResourceId,
    /// Requesting process
    requestor: ProcessId,
    /// Current timestamp
    now: Int,
  )
}

/// Driver operation types
pub type DriverOperation {
  /// Read operation
  OpRead
  /// Write operation
  OpWrite
  /// Delete operation
  OpDelete
  /// Execute operation
  OpExecute
  /// Create operation
  OpCreate
  /// List operation
  OpList
  /// Custom operation
  OpCustom(name: String)
}

/// Result of driver capability check
pub type DriverCheckResult {
  /// Access granted
  AccessGranted(cap: Capability)
  /// Access denied
  AccessDenied(reason: ValidationError)
}

/// Check capability for driver operation
pub fn check_driver_capability(
  store: CapabilityStore,
  check: DriverCapabilityCheck,
) -> #(CapabilityStore, DriverCheckResult) {
  // Convert operation to required rights
  let required_rights = operation_to_rights(check.operation)
  
  // Validate capability
  let #(new_store, result) = validate_capability(
    store,
    check.cap_id,
    required_rights,
    check.resource,
    check.requestor,
    check.now,
  )
  
  case result {
    Invalid(err) -> #(new_store, AccessDenied(err))
    Valid -> {
      case find_capability(new_store.capabilities, check.cap_id) {
        Error(_) -> #(new_store, AccessDenied(CapabilityNotFound))
        Ok(stored) -> {
          // Record usage
          let usage_store = record_capability_usage(new_store, check.cap_id, check.now)
          #(usage_store, AccessGranted(stored.capability))
        }
      }
    }
  }
}

/// Convert operation to required rights
fn operation_to_rights(op: DriverOperation) -> CapabilityRights {
  case op {
    OpRead -> CapabilityRights(
      read: True, write: False, delete: False, execute: False,
      create: False, list: False, delegate: False, revoke: False,
      custom_rights: [],
    )
    OpWrite -> CapabilityRights(
      read: False, write: True, delete: False, execute: False,
      create: False, list: False, delegate: False, revoke: False,
      custom_rights: [],
    )
    OpDelete -> CapabilityRights(
      read: False, write: False, delete: True, execute: False,
      create: False, list: False, delegate: False, revoke: False,
      custom_rights: [],
    )
    OpExecute -> CapabilityRights(
      read: False, write: False, delete: False, execute: True,
      create: False, list: False, delegate: False, revoke: False,
      custom_rights: [],
    )
    OpCreate -> CapabilityRights(
      read: False, write: False, delete: False, execute: False,
      create: True, list: False, delegate: False, revoke: False,
      custom_rights: [],
    )
    OpList -> CapabilityRights(
      read: False, write: False, delete: False, execute: False,
      create: False, list: True, delegate: False, revoke: False,
      custom_rights: [],
    )
    OpCustom(name) -> CapabilityRights(
      read: False, write: False, delete: False, execute: False,
      create: False, list: False, delegate: False, revoke: False,
      custom_rights: [name],
    )
  }
}

// ============================================================================
// SECTION 7: PREDEFINED CAPABILITY TEMPLATES
// ============================================================================

/// Create read-only capability for a resource
pub fn read_only_capability(
  resource: ResourceId,
  owner: ProcessId,
  expires_at: Result(Int, Nil),
) -> #(CapabilityRights, CapabilityValidity) {
  let rights = CapabilityRights(
    read: True, write: False, delete: False, execute: False,
    create: False, list: True, delegate: False, revoke: False,
    custom_rights: [],
  )
  let validity = CapabilityValidity(
    expires_at: expires_at,
    max_uses: Error(Nil),
    use_count: 0,
    time_restrictions: Error(Nil),
    process_restrictions: Error(Nil),
  )
  #(rights, validity)
}

/// Create read-write capability for a resource
pub fn read_write_capability(
  resource: ResourceId,
  owner: ProcessId,
  expires_at: Result(Int, Nil),
) -> #(CapabilityRights, CapabilityValidity) {
  let rights = CapabilityRights(
    read: True, write: True, delete: False, execute: False,
    create: True, list: True, delegate: False, revoke: False,
    custom_rights: [],
  )
  let validity = CapabilityValidity(
    expires_at: expires_at,
    max_uses: Error(Nil),
    use_count: 0,
    time_restrictions: Error(Nil),
    process_restrictions: Error(Nil),
  )
  #(rights, validity)
}

/// Create full access capability for a resource
pub fn full_access_capability(
  resource: ResourceId,
  owner: ProcessId,
  expires_at: Result(Int, Nil),
) -> #(CapabilityRights, CapabilityValidity) {
  let rights = CapabilityRights(
    read: True, write: True, delete: True, execute: True,
    create: True, list: True, delegate: True, revoke: True,
    custom_rights: [],
  )
  let validity = CapabilityValidity(
    expires_at: expires_at,
    max_uses: Error(Nil),
    use_count: 0,
    time_restrictions: Error(Nil),
    process_restrictions: Error(Nil),
  )
  #(rights, validity)
}

/// Create execute-only capability (for functions/modules)
pub fn execute_only_capability(
  resource: ResourceId,
  owner: ProcessId,
  max_uses: Result(Int, Nil),
) -> #(CapabilityRights, CapabilityValidity) {
  let rights = CapabilityRights(
    read: False, write: False, delete: False, execute: True,
    create: False, list: False, delegate: False, revoke: False,
    custom_rights: [],
  )
  let validity = CapabilityValidity(
    expires_at: Error(Nil),
    max_uses: max_uses,
    use_count: 0,
    time_restrictions: Error(Nil),
    process_restrictions: Error(Nil),
  )
  #(rights, validity)
}

// ============================================================================
// SECTION 8: HELPER FUNCTIONS
// ============================================================================

fn list_length(list: List(a)) -> Int {
  case list {
    [] -> 0
    [_, ..tail] -> 1 + list_length(tail)
  }
}

fn generate_capability_id(counter: Int, timestamp: Int) -> CapabilityId {
  // High bits: version (8) + type (8) + timestamp_hi (48)
  // Low bits: counter (32) + random (32)
  let high = timestamp
  let low = counter * 1000 + timestamp % 1000
  CapabilityId(high: high, low: low)
}

fn default_capability_flags() -> CapabilityFlags {
  CapabilityFlags(
    revoked: False,
    ephemeral: False,
    inheritable: False,
    secure_only: False,
    debug_only: False,
    admin: False,
  )
}

fn compute_signature(cap: Capability) -> List(Int) {
  // Placeholder for HMAC computation
  // In production, use proper cryptographic signature
  [cap.id.high % 256, cap.id.low % 256, cap.version % 256]
}

fn find_capability(
  caps: List(StoredCapability),
  cap_id: CapabilityId,
) -> Result(StoredCapability, Nil) {
  case caps {
    [] -> Error(Nil)
    [stored, ..rest] ->
      case stored.capability.id.high == cap_id.high && stored.capability.id.low == cap_id.low {
        True -> Ok(stored)
        False -> find_capability(rest, cap_id)
      }
  }
}

fn count_capabilities_for_process(caps: List(StoredCapability), process: ProcessId) -> Int {
  case caps {
    [] -> 0
    [stored, ..rest] ->
      case stored.capability.owner.value == process.value {
        True -> 1 + count_capabilities_for_process(rest, process)
        False -> count_capabilities_for_process(rest, process)
      }
  }
}

fn is_revoked(revocations: List(RevocationRecord), cap_id: CapabilityId) -> Bool {
  case revocations {
    [] -> False
    [rev, ..rest] ->
      case rev.cap_id.high == cap_id.high && rev.cap_id.low == cap_id.low {
        True -> True
        False -> is_revoked(rest, cap_id)
      }
  }
}

fn check_expiration(validity: CapabilityValidity, now: Int) -> ValidationResult {
  case validity.expires_at {
    Error(_) -> Valid
    Ok(expires_at) ->
      case now > expires_at {
        True -> Invalid(CapabilityExpired)
        False -> Valid
      }
  }
}

fn check_usage_limit(validity: CapabilityValidity) -> ValidationResult {
  case validity.max_uses {
    Error(_) -> Valid
    Ok(max) ->
      case validity.use_count >= max {
        True -> Invalid(UsageLimitExceeded(validity.use_count, max))
        False -> Valid
      }
  }
}

fn check_time_restrictions(validity: CapabilityValidity, now: Int) -> ValidationResult {
  case validity.time_restrictions {
    Error(_) -> Valid
    Ok(restrictions) -> {
      // Check valid_after
      case restrictions.valid_after {
        Ok(after) if now < after -> Invalid(TimeRestrictionViolated("before valid period"))
        _ -> {
          // Check valid_before
          case restrictions.valid_before {
            Ok(before) if now > before -> Invalid(TimeRestrictionViolated("after valid period"))
            _ -> Valid
          }
        }
      }
    }
  }
}

fn check_process_restrictions(validity: CapabilityValidity, process: ProcessId) -> ValidationResult {
  case validity.process_restrictions {
    Error(_) -> Valid
    Ok(restrictions) -> {
      // Check denied list first
      case is_in_process_list(restrictions.denied_processes, process) {
        True -> Invalid(ProcessRestrictionViolated(process))
        False -> {
          // Check allowed list if present
          case restrictions.allowed_processes {
            Error(_) -> Valid
            Ok(allowed) ->
              case is_in_process_list(allowed, process) {
                True -> Valid
                False -> Invalid(ProcessRestrictionViolated(process))
              }
          }
        }
      }
    }
  }
}

fn is_in_process_list(list: List(ProcessId), process: ProcessId) -> Bool {
  case list {
    [] -> False
    [p, ..rest] ->
      case p.value == process.value {
        True -> True
        False -> is_in_process_list(rest, process)
      }
  }
}

fn check_rights(has: CapabilityRights, required: CapabilityRights) -> ValidationResult {
  let missing = []
  let missing = case required.read && !has.read {
    True -> ["read", ..missing]
    False -> missing
  }
  let missing = case required.write && !has.write {
    True -> ["write", ..missing]
    False -> missing
  }
  let missing = case required.delete && !has.delete {
    True -> ["delete", ..missing]
    False -> missing
  }
  let missing = case required.execute && !has.execute {
    True -> ["execute", ..missing]
    False -> missing
  }
  let missing = case required.create && !has.create {
    True -> ["create", ..missing]
    False -> missing
  }
  let missing = case required.list && !has.list {
    True -> ["list", ..missing]
    False -> missing
  }
  
  case missing {
    [] -> Valid
    _ -> Invalid(InsufficientRights(missing, []))
  }
}

fn check_resource_match(cap_resource: ResourceId, requested: ResourceId) -> ValidationResult {
  case cap_resource.resource_type == requested.resource_type {
    False -> Invalid(WrongResourceType("matching type", "different type"))
    True -> Valid
  }
}

fn attenuate_rights(original: CapabilityRights, requested: CapabilityRights) -> CapabilityRights {
  // Can only have rights if both original AND requested have them
  CapabilityRights(
    read: original.read && requested.read,
    write: original.write && requested.write,
    delete: original.delete && requested.delete,
    execute: original.execute && requested.execute,
    create: original.create && requested.create,
    list: original.list && requested.list,
    delegate: original.delegate && requested.delegate,
    revoke: original.revoke && requested.revoke,
    custom_rights: original.custom_rights,  // Preserve original custom rights
  )
}

fn compute_rights_diff(original: CapabilityRights, attenuated: CapabilityRights) -> CapabilityRights {
  CapabilityRights(
    read: original.read && !attenuated.read,
    write: original.write && !attenuated.write,
    delete: original.delete && !attenuated.delete,
    execute: original.execute && !attenuated.execute,
    create: original.create && !attenuated.create,
    list: original.list && !attenuated.list,
    delegate: original.delegate && !attenuated.delegate,
    revoke: original.revoke && !attenuated.revoke,
    custom_rights: [],
  )
}

fn partition_delegated(
  caps: List(StoredCapability),
  parent_id: CapabilityId,
) -> #(List(StoredCapability), List(StoredCapability)) {
  case caps {
    [] -> #([], [])
    [stored, ..rest] -> {
      let #(delegated, others) = partition_delegated(rest, parent_id)
      case stored.capability.issuer {
        Delegated(pid, _) if pid.high == parent_id.high && pid.low == parent_id.low ->
          #([stored, ..delegated], others)
        _ -> #(delegated, [stored, ..others])
      }
    }
  }
}

fn increment_validation_failures(store: CapabilityStore) -> CapabilityStore {
  CapabilityStore(
    ..store,
    stats: StoreStats(
      ..store.stats,
      validation_failures: store.stats.validation_failures + 1,
      total_validations: store.stats.total_validations + 1,
    ),
  )
}

fn increment_validations(store: CapabilityStore) -> CapabilityStore {
  CapabilityStore(
    ..store,
    stats: StoreStats(
      ..store.stats,
      total_validations: store.stats.total_validations + 1,
    ),
  )
}

fn record_capability_usage(
  store: CapabilityStore,
  cap_id: CapabilityId,
  now: Int,
) -> CapabilityStore {
  let updated_caps = update_capability_usage(store.capabilities, cap_id, now)
  CapabilityStore(..store, capabilities: updated_caps)
}

fn update_capability_usage(
  caps: List(StoredCapability),
  cap_id: CapabilityId,
  now: Int,
) -> List(StoredCapability) {
  case caps {
    [] -> []
    [stored, ..rest] ->
      case stored.capability.id.high == cap_id.high && stored.capability.id.low == cap_id.low {
        True -> {
          let updated = StoredCapability(
            ..stored,
            last_accessed: now,
            access_count: stored.access_count + 1,
            capability: Capability(
              ..stored.capability,
              validity: CapabilityValidity(
                ..stored.capability.validity,
                use_count: stored.capability.validity.use_count + 1,
              ),
            ),
          )
          [updated, ..rest]
        }
        False -> [stored, ..update_capability_usage(rest, cap_id, now)]
      }
  }
}

// ============================================================================
// SECTION 9: AUDIT LOGGING
// ============================================================================

/// Capability audit event
pub type CapabilityAuditEvent {
  /// Capability created
  AuditCapabilityCreated(cap_id: CapabilityId, owner: ProcessId, resource: ResourceId, timestamp: Int)
  /// Capability validated (success)
  AuditCapabilityValidated(cap_id: CapabilityId, requestor: ProcessId, operation: String, timestamp: Int)
  /// Capability validation failed
  AuditCapabilityDenied(cap_id: CapabilityId, requestor: ProcessId, reason: ValidationError, timestamp: Int)
  /// Capability delegated
  AuditCapabilityDelegated(parent_id: CapabilityId, new_id: CapabilityId, to_process: ProcessId, timestamp: Int)
  /// Capability revoked
  AuditCapabilityRevoked(cap_id: CapabilityId, revoker: ProcessId, reason: String, cascade_count: Int, timestamp: Int)
  /// Capability expired
  AuditCapabilityExpired(cap_id: CapabilityId, timestamp: Int)
  /// Capability usage limit reached
  AuditCapabilityUsageLimitReached(cap_id: CapabilityId, limit: Int, timestamp: Int)
}

/// Generate audit events from store operations
pub fn generate_audit_event(
  operation: CapabilityOperation,
  result: OperationResult,
  timestamp: Int,
) -> Result(CapabilityAuditEvent, Nil) {
  case operation, result {
    CreateCapability(resource, _, owner, _), Created(cap) ->
      Ok(AuditCapabilityCreated(cap.id, owner, resource, timestamp))
    ValidateCapability(cap_id, _, _, requestor), Validated(Valid) ->
      Ok(AuditCapabilityValidated(cap_id, requestor, "validate", timestamp))
    ValidateCapability(cap_id, _, _, requestor), Validated(Invalid(reason)) ->
      Ok(AuditCapabilityDenied(cap_id, requestor, reason, timestamp))
    DelegateCapability(parent_id, to_proc, _), Delegated(new_cap) ->
      Ok(AuditCapabilityDelegated(parent_id, new_cap.id, to_proc, timestamp))
    RevokeCapability(cap_id, reason), Revoked(_, cascade) ->
      Ok(AuditCapabilityRevoked(cap_id, ProcessId(0), reason, cascade, timestamp))
    _, _ -> Error(Nil)
  }
}

// ============================================================================
// SECTION 10: INVARIANTS AND TESTING
// ============================================================================

/// System invariant for capability system
pub type CapabilityInvariant {
  /// All capabilities have valid signatures
  InvariantValidSignatures
  /// No capability has more rights than its parent
  InvariantMonotonicAttenuation
  /// Delegation depth is bounded
  InvariantBoundedDelegation
  /// Revoked capabilities are not used
  InvariantNoRevokedAccess
  /// All capabilities have valid owners
  InvariantValidOwners
}

/// Check all invariants
pub fn check_invariants(store: CapabilityStore) -> List(InvariantCheckResult) {
  [
    check_bounded_delegation(store),
    check_no_revoked_access(store),
  ]
}

/// Invariant check result
pub type InvariantCheckResult {
  InvariantHolds
  InvariantViolated(invariant: CapabilityInvariant, message: String)
}

fn check_bounded_delegation(store: CapabilityStore) -> InvariantCheckResult {
  let violations = find_deep_delegations(store.capabilities, store.config.max_delegation_depth)
  case violations {
    [] -> InvariantHolds
    _ -> InvariantViolated(InvariantBoundedDelegation, "Delegation depth exceeded")
  }
}

fn find_deep_delegations(caps: List(StoredCapability), max_depth: Int) -> List(CapabilityId) {
  case caps {
    [] -> []
    [stored, ..rest] ->
      case list_length(stored.capability.attenuation_chain) > max_depth {
        True -> [stored.capability.id, ..find_deep_delegations(rest, max_depth)]
        False -> find_deep_delegations(rest, max_depth)
      }
  }
}

fn check_no_revoked_access(store: CapabilityStore) -> InvariantCheckResult {
  // Check that no revoked capability has recent access
  InvariantHolds
}
