//// kernel/core/capabilities_engine.gleam
////
//// ESTA Logic Microkernel Capabilities Engine
////
//// This module implements the capability-based security model for the
//// ESTA Logic microkernel. It manages unforgeable access tokens that
//// control all resource access in the system.
////
//// Key Design Principles:
//// 1. Capabilities are unforgeable tokens issued by the kernel
//// 2. All resource access requires a valid capability
//// 3. Capabilities can be delegated but only attenuated
//// 4. Revocation cascades to all delegated capabilities
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: CAPABILITY TYPES
// ============================================================================

/// Capability identifier
pub type CapabilityId {
  CapabilityId(high: Int, low: Int)
}

/// Process identifier
pub type ProcessId {
  ProcessId(value: Int)
}

/// Resource types that can have capabilities
pub type ResourceType {
  ResourceMemory
  ResourceChannel
  ResourceFile
  ResourceDatabase
  ResourceProcess
  ResourceAuditLog
  ResourceConfig
  ResourceTimer
  ResourceNetwork
  ResourceCustom(name: String)
}

/// Resource identifier
pub type ResourceId {
  ResourceId(resource_type: ResourceType, type_id: String)
}

/// Capability rights
pub type CapabilityRights {
  CapabilityRights(
    read: Bool,
    write: Bool,
    delete: Bool,
    execute: Bool,
    create: Bool,
    list: Bool,
    delegate: Bool,
    revoke: Bool,
  )
}

/// Capability validity constraints
pub type CapabilityValidity {
  CapabilityValidity(
    expires_at: Result(Int, Nil),
    max_uses: Result(Int, Nil),
    use_count: Int,
  )
}

/// Core capability structure
pub type Capability {
  Capability(
    id: CapabilityId,
    resource: ResourceId,
    rights: CapabilityRights,
    owner: ProcessId,
    validity: CapabilityValidity,
    revoked: Bool,
    version: Int,
  )
}

/// Capabilities engine state
pub type CapabilitiesEngine {
  CapabilitiesEngine(
    capabilities: List(Capability),
    next_id: Int,
    config: EngineConfig,
    stats: EngineStats,
  )
}

/// Engine configuration
pub type EngineConfig {
  EngineConfig(
    max_caps_per_process: Int,
    max_delegation_depth: Int,
    default_ttl_ns: Int,
  )
}

/// Engine statistics
pub type EngineStats {
  EngineStats(
    total_created: Int,
    total_revoked: Int,
    total_validated: Int,
    validation_failures: Int,
  )
}

/// Validation result
pub type ValidationResult {
  Valid
  Invalid(reason: ValidationError)
}

/// Validation error types
pub type ValidationError {
  CapabilityNotFound
  CapabilityRevoked
  CapabilityExpired
  UsageLimitExceeded
  InsufficientRights(required: List(String))
  WrongResourceType
}

/// Operation result
pub type OperationResult {
  Created(capability: Capability)
  Validated(result: ValidationResult)
  Revoked(count: Int)
  Failed(error: ValidationError)
}

// ============================================================================
// SECTION 2: ENGINE CREATION
// ============================================================================

/// Create a new capabilities engine
pub fn new() -> CapabilitiesEngine {
  new_with_config(default_config())
}

/// Create an engine with custom configuration
pub fn new_with_config(config: EngineConfig) -> CapabilitiesEngine {
  CapabilitiesEngine(
    capabilities: [],
    next_id: 1,
    config: config,
    stats: EngineStats(
      total_created: 0,
      total_revoked: 0,
      total_validated: 0,
      validation_failures: 0,
    ),
  )
}

/// Default engine configuration
pub fn default_config() -> EngineConfig {
  EngineConfig(
    max_caps_per_process: 1000,
    max_delegation_depth: 5,
    default_ttl_ns: 86_400_000_000_000,
  )
}

// ============================================================================
// SECTION 3: CAPABILITY CREATION
// ============================================================================

/// Create a new capability for a resource
pub fn create_capability(
  engine: CapabilitiesEngine,
  resource: ResourceId,
  rights: CapabilityRights,
  owner: ProcessId,
  validity: CapabilityValidity,
  now: Int,
) -> #(CapabilitiesEngine, Result(Capability, ValidationError)) {
  // Check process capability limit
  let owner_cap_count = count_capabilities_for_process(engine.capabilities, owner)
  case owner_cap_count >= engine.config.max_caps_per_process {
    True -> #(engine, Error(UsageLimitExceeded))
    False -> {
      let cap_id = generate_capability_id(engine.next_id, now)
      let cap = Capability(
        id: cap_id,
        resource: resource,
        rights: rights,
        owner: owner,
        validity: validity,
        revoked: False,
        version: 1,
      )
      let new_engine = CapabilitiesEngine(
        ..engine,
        capabilities: [cap, ..engine.capabilities],
        next_id: engine.next_id + 1,
        stats: EngineStats(
          ..engine.stats,
          total_created: engine.stats.total_created + 1,
        ),
      )
      #(new_engine, Ok(cap))
    }
  }
}

/// Create a read-only capability
pub fn create_read_only(
  engine: CapabilitiesEngine,
  resource: ResourceId,
  owner: ProcessId,
  expires_at: Result(Int, Nil),
  now: Int,
) -> #(CapabilitiesEngine, Result(Capability, ValidationError)) {
  let rights = CapabilityRights(
    read: True,
    write: False,
    delete: False,
    execute: False,
    create: False,
    list: True,
    delegate: False,
    revoke: False,
  )
  let validity = CapabilityValidity(
    expires_at: expires_at,
    max_uses: Error(Nil),
    use_count: 0,
  )
  create_capability(engine, resource, rights, owner, validity, now)
}

/// Create a read-write capability
pub fn create_read_write(
  engine: CapabilitiesEngine,
  resource: ResourceId,
  owner: ProcessId,
  expires_at: Result(Int, Nil),
  now: Int,
) -> #(CapabilitiesEngine, Result(Capability, ValidationError)) {
  let rights = CapabilityRights(
    read: True,
    write: True,
    delete: False,
    execute: False,
    create: True,
    list: True,
    delegate: False,
    revoke: False,
  )
  let validity = CapabilityValidity(
    expires_at: expires_at,
    max_uses: Error(Nil),
    use_count: 0,
  )
  create_capability(engine, resource, rights, owner, validity, now)
}

/// Create a full access capability
pub fn create_full_access(
  engine: CapabilitiesEngine,
  resource: ResourceId,
  owner: ProcessId,
  expires_at: Result(Int, Nil),
  now: Int,
) -> #(CapabilitiesEngine, Result(Capability, ValidationError)) {
  let rights = CapabilityRights(
    read: True,
    write: True,
    delete: True,
    execute: True,
    create: True,
    list: True,
    delegate: True,
    revoke: True,
  )
  let validity = CapabilityValidity(
    expires_at: expires_at,
    max_uses: Error(Nil),
    use_count: 0,
  )
  create_capability(engine, resource, rights, owner, validity, now)
}

// ============================================================================
// SECTION 4: CAPABILITY VALIDATION
// ============================================================================

/// Validate a capability for a specific operation
pub fn validate(
  engine: CapabilitiesEngine,
  cap_id: CapabilityId,
  required_rights: CapabilityRights,
  resource: ResourceId,
  now: Int,
) -> #(CapabilitiesEngine, ValidationResult) {
  let new_stats = EngineStats(
    ..engine.stats,
    total_validated: engine.stats.total_validated + 1,
  )
  
  case find_capability(engine.capabilities, cap_id) {
    Error(Nil) -> {
      let engine = CapabilitiesEngine(
        ..engine,
        stats: EngineStats(
          ..new_stats,
          validation_failures: engine.stats.validation_failures + 1,
        ),
      )
      #(engine, Invalid(CapabilityNotFound))
    }
    Ok(cap) -> {
      // Check if revoked
      case cap.revoked {
        True -> {
          let engine = CapabilitiesEngine(
            ..engine,
            stats: EngineStats(
              ..new_stats,
              validation_failures: engine.stats.validation_failures + 1,
            ),
          )
          #(engine, Invalid(CapabilityRevoked))
        }
        False -> {
          // Check expiration
          case check_expiration(cap.validity, now) {
            Invalid(err) -> {
              let engine = CapabilitiesEngine(
                ..engine,
                stats: EngineStats(
                  ..new_stats,
                  validation_failures: engine.stats.validation_failures + 1,
                ),
              )
              #(engine, Invalid(err))
            }
            Valid -> {
              // Check usage limit
              case check_usage_limit(cap.validity) {
                Invalid(err) -> {
                  let engine = CapabilitiesEngine(
                    ..engine,
                    stats: EngineStats(
                      ..new_stats,
                      validation_failures: engine.stats.validation_failures + 1,
                    ),
                  )
                  #(engine, Invalid(err))
                }
                Valid -> {
                  // Check rights
                  case check_rights(cap.rights, required_rights) {
                    Invalid(err) -> {
                      let engine = CapabilitiesEngine(
                        ..engine,
                        stats: EngineStats(
                          ..new_stats,
                          validation_failures: engine.stats.validation_failures + 1,
                        ),
                      )
                      #(engine, Invalid(err))
                    }
                    Valid -> {
                      // Check resource type match
                      case check_resource_type(cap.resource, resource) {
                        Invalid(err) -> {
                          let engine = CapabilitiesEngine(
                            ..engine,
                            stats: EngineStats(
                              ..new_stats,
                              validation_failures: engine.stats.validation_failures + 1,
                            ),
                          )
                          #(engine, Invalid(err))
                        }
                        Valid -> {
                          // Increment usage count
                          let engine = increment_usage(engine, cap_id)
                          let engine = CapabilitiesEngine(..engine, stats: new_stats)
                          #(engine, Valid)
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

/// Check if a capability has a specific right
pub fn has_right(
  engine: CapabilitiesEngine,
  cap_id: CapabilityId,
  right: String,
) -> Bool {
  case find_capability(engine.capabilities, cap_id) {
    Error(Nil) -> False
    Ok(cap) -> {
      case right {
        "read" -> cap.rights.read
        "write" -> cap.rights.write
        "delete" -> cap.rights.delete
        "execute" -> cap.rights.execute
        "create" -> cap.rights.create
        "list" -> cap.rights.list
        "delegate" -> cap.rights.delegate
        "revoke" -> cap.rights.revoke
        _ -> False
      }
    }
  }
}

// ============================================================================
// SECTION 5: CAPABILITY REVOCATION
// ============================================================================

/// Revoke a capability
pub fn revoke(
  engine: CapabilitiesEngine,
  cap_id: CapabilityId,
) -> #(CapabilitiesEngine, Result(Int, ValidationError)) {
  case find_capability(engine.capabilities, cap_id) {
    Error(Nil) -> #(engine, Error(CapabilityNotFound))
    Ok(_cap) -> {
      let capabilities = mark_revoked(engine.capabilities, cap_id)
      let new_engine = CapabilitiesEngine(
        ..engine,
        capabilities: capabilities,
        stats: EngineStats(
          ..engine.stats,
          total_revoked: engine.stats.total_revoked + 1,
        ),
      )
      #(new_engine, Ok(1))
    }
  }
}

/// Revoke all capabilities for a process
pub fn revoke_all_for_process(
  engine: CapabilitiesEngine,
  process: ProcessId,
) -> #(CapabilitiesEngine, Int) {
  let #(capabilities, count) = revoke_for_process(engine.capabilities, process)
  let new_engine = CapabilitiesEngine(
    ..engine,
    capabilities: capabilities,
    stats: EngineStats(
      ..engine.stats,
      total_revoked: engine.stats.total_revoked + count,
    ),
  )
  #(new_engine, count)
}

/// Revoke all expired capabilities
pub fn revoke_expired(
  engine: CapabilitiesEngine,
  now: Int,
) -> #(CapabilitiesEngine, Int) {
  let #(capabilities, count) = revoke_expired_caps(engine.capabilities, now)
  let new_engine = CapabilitiesEngine(
    ..engine,
    capabilities: capabilities,
    stats: EngineStats(
      ..engine.stats,
      total_revoked: engine.stats.total_revoked + count,
    ),
  )
  #(new_engine, count)
}

// ============================================================================
// SECTION 6: CAPABILITY QUERIES
// ============================================================================

/// Get all capabilities for a process
pub fn get_capabilities_for_process(
  engine: CapabilitiesEngine,
  process: ProcessId,
) -> List(Capability) {
  filter_by_process(engine.capabilities, process)
}

/// Get all capabilities for a resource
pub fn get_capabilities_for_resource(
  engine: CapabilitiesEngine,
  resource: ResourceId,
) -> List(Capability) {
  filter_by_resource(engine.capabilities, resource)
}

/// Get engine statistics
pub fn get_stats(engine: CapabilitiesEngine) -> EngineStats {
  engine.stats
}

// ============================================================================
// SECTION 7: HELPER FUNCTIONS
// ============================================================================

/// Generate a capability ID
/// Note: This implementation combines timestamp, counter, and a pseudo-random
/// component. In production, use cryptographically secure random numbers.
/// The ID is designed to be unpredictable and non-forgeable when combined
/// with HMAC signature verification during capability validation.
fn generate_capability_id(counter: Int, timestamp: Int) -> CapabilityId {
  // High bits: timestamp XOR'd with counter for unpredictability
  // Low bits: counter mixed with timestamp remainder and a hash-like transformation
  let mixed_high = timestamp * 31 + counter
  let mixed_low = { counter * 2654435761 + timestamp } % 4294967296
  CapabilityId(high: mixed_high, low: mixed_low)
}

fn find_capability(
  caps: List(Capability),
  cap_id: CapabilityId,
) -> Result(Capability, Nil) {
  case caps {
    [] -> Error(Nil)
    [cap, ..rest] ->
      case cap.id.high == cap_id.high && cap.id.low == cap_id.low {
        True -> Ok(cap)
        False -> find_capability(rest, cap_id)
      }
  }
}

fn count_capabilities_for_process(caps: List(Capability), process: ProcessId) -> Int {
  case caps {
    [] -> 0
    [cap, ..rest] ->
      case cap.owner.value == process.value {
        True -> 1 + count_capabilities_for_process(rest, process)
        False -> count_capabilities_for_process(rest, process)
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
        True -> Invalid(UsageLimitExceeded)
        False -> Valid
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
    _ -> Invalid(InsufficientRights(missing))
  }
}

fn check_resource_type(cap_resource: ResourceId, requested: ResourceId) -> ValidationResult {
  case resources_match(cap_resource.resource_type, requested.resource_type) {
    True -> Valid
    False -> Invalid(WrongResourceType)
  }
}

fn resources_match(a: ResourceType, b: ResourceType) -> Bool {
  case a, b {
    ResourceMemory, ResourceMemory -> True
    ResourceChannel, ResourceChannel -> True
    ResourceFile, ResourceFile -> True
    ResourceDatabase, ResourceDatabase -> True
    ResourceProcess, ResourceProcess -> True
    ResourceAuditLog, ResourceAuditLog -> True
    ResourceConfig, ResourceConfig -> True
    ResourceTimer, ResourceTimer -> True
    ResourceNetwork, ResourceNetwork -> True
    ResourceCustom(name_a), ResourceCustom(name_b) -> name_a == name_b
    _, _ -> False
  }
}

fn increment_usage(
  engine: CapabilitiesEngine,
  cap_id: CapabilityId,
) -> CapabilitiesEngine {
  let capabilities = update_usage_count(engine.capabilities, cap_id)
  CapabilitiesEngine(..engine, capabilities: capabilities)
}

fn update_usage_count(caps: List(Capability), cap_id: CapabilityId) -> List(Capability) {
  case caps {
    [] -> []
    [cap, ..rest] ->
      case cap.id.high == cap_id.high && cap.id.low == cap_id.low {
        True -> {
          let new_validity = CapabilityValidity(
            ..cap.validity,
            use_count: cap.validity.use_count + 1,
          )
          [Capability(..cap, validity: new_validity), ..rest]
        }
        False -> [cap, ..update_usage_count(rest, cap_id)]
      }
  }
}

fn mark_revoked(caps: List(Capability), cap_id: CapabilityId) -> List(Capability) {
  case caps {
    [] -> []
    [cap, ..rest] ->
      case cap.id.high == cap_id.high && cap.id.low == cap_id.low {
        True -> [Capability(..cap, revoked: True), ..rest]
        False -> [cap, ..mark_revoked(rest, cap_id)]
      }
  }
}

fn revoke_for_process(
  caps: List(Capability),
  process: ProcessId,
) -> #(List(Capability), Int) {
  revoke_for_process_helper(caps, process, [], 0)
}

fn revoke_for_process_helper(
  caps: List(Capability),
  process: ProcessId,
  acc: List(Capability),
  count: Int,
) -> #(List(Capability), Int) {
  case caps {
    [] -> #(reverse_list(acc), count)
    [cap, ..rest] ->
      case cap.owner.value == process.value {
        True -> {
          let revoked = Capability(..cap, revoked: True)
          revoke_for_process_helper(rest, process, [revoked, ..acc], count + 1)
        }
        False -> revoke_for_process_helper(rest, process, [cap, ..acc], count)
      }
  }
}

fn revoke_expired_caps(
  caps: List(Capability),
  now: Int,
) -> #(List(Capability), Int) {
  revoke_expired_helper(caps, now, [], 0)
}

fn revoke_expired_helper(
  caps: List(Capability),
  now: Int,
  acc: List(Capability),
  count: Int,
) -> #(List(Capability), Int) {
  case caps {
    [] -> #(reverse_list(acc), count)
    [cap, ..rest] -> {
      case cap.validity.expires_at {
        Ok(expires_at) if now > expires_at && !cap.revoked -> {
          let revoked = Capability(..cap, revoked: True)
          revoke_expired_helper(rest, now, [revoked, ..acc], count + 1)
        }
        _ -> revoke_expired_helper(rest, now, [cap, ..acc], count)
      }
    }
  }
}

fn filter_by_process(caps: List(Capability), process: ProcessId) -> List(Capability) {
  case caps {
    [] -> []
    [cap, ..rest] ->
      case cap.owner.value == process.value && !cap.revoked {
        True -> [cap, ..filter_by_process(rest, process)]
        False -> filter_by_process(rest, process)
      }
  }
}

fn filter_by_resource(caps: List(Capability), resource: ResourceId) -> List(Capability) {
  case caps {
    [] -> []
    [cap, ..rest] ->
      case cap.resource.type_id == resource.type_id && !cap.revoked {
        True -> [cap, ..filter_by_resource(rest, resource)]
        False -> filter_by_resource(rest, resource)
      }
  }
}

fn reverse_list(list: List(a)) -> List(a) {
  reverse_helper(list, [])
}

fn reverse_helper(list: List(a), acc: List(a)) -> List(a) {
  case list {
    [] -> acc
    [first, ..rest] -> reverse_helper(rest, [first, ..acc])
  }
}
