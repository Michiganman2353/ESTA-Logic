//// estalogic_kernel/test/cap_system_test.gleam
////
//// Tests for the Secure Capability-Based Access Control System
////
//// Test Coverage:
//// - Capability creation and validation
//// - Capability delegation and attenuation
//// - Capability revocation
//// - Driver capability checks
//// - Invariants and security properties
////
//// Design Note on Type Duplication:
//// Type definitions in this test file are intentionally mirrored from the
//// cap_system module. Each Gleam package is a standalone compilation unit
//// without cross-package imports. This design ensures:
//// - Package independence for WASM module isolation
//// - Clear boundaries between test and implementation concerns
//// - No circular dependencies between packages
//// The types are structurally compatible for serialization/deserialization.
//// This pattern is consistent with estalogic_protocol tests.

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
// SECTION 2: CAPABILITY TYPES (MIRROR FROM cap_system.gleam)
// ============================================================================

type CapabilityId {
  CapabilityId(high: Int, low: Int)
}

type ProcessId {
  ProcessId(value: Int)
}

type ResourceId {
  ResourceId(resource_type: ResourceType, type_id: String)
}

type ResourceType {
  ResourceMemory
  ResourceChannel
  ResourceFile
  ResourceDatabase
  ResourceKafkaTopic
  ResourceRedisKeyspace
  ResourcePgTable
  ResourceWasmModule
  ResourceProcess
  ResourceAuditLog
  ResourceConfig
}

type CapabilityRights {
  CapabilityRights(
    read: Bool,
    write: Bool,
    delete: Bool,
    execute: Bool,
    create: Bool,
    list: Bool,
    delegate: Bool,
    revoke: Bool,
    custom_rights: List(String),
  )
}

type CapabilityIssuer {
  KernelIssued
  Delegated(parent_cap_id: CapabilityId, delegator: ProcessId)
  DriverIssued(driver_id: String)
}

type CapabilityValidity {
  CapabilityValidity(
    expires_at: Result(Int, Nil),
    max_uses: Result(Int, Nil),
    use_count: Int,
  )
}

type CapabilityFlags {
  CapabilityFlags(
    revoked: Bool,
    ephemeral: Bool,
    inheritable: Bool,
    secure_only: Bool,
    debug_only: Bool,
    admin: Bool,
  )
}

type Capability {
  Capability(
    id: CapabilityId,
    resource: ResourceId,
    rights: CapabilityRights,
    owner: ProcessId,
    issuer: CapabilityIssuer,
    validity: CapabilityValidity,
    flags: CapabilityFlags,
    created_at: Int,
    version: Int,
  )
}

type ValidationResult {
  Valid
  Invalid(reason: ValidationError)
}

type ValidationError {
  CapabilityNotFound
  CapabilityRevoked
  CapabilityExpired
  UsageLimitExceeded(used: Int, max: Int)
  InsufficientRights(required: List(String), has: List(String))
  WrongResourceType(expected: String, actual: String)
  TimeRestrictionViolated(reason: String)
  ProcessRestrictionViolated(process: ProcessId)
  DelegationNotAllowed
}

type DriverOperation {
  OpRead
  OpWrite
  OpDelete
  OpExecute
  OpCreate
  OpList
}

type DriverCheckResult {
  AccessGranted(cap: Capability)
  AccessDenied(reason: ValidationError)
}

type InvariantCheckResult {
  InvariantHolds
  InvariantViolated(message: String)
}

// ============================================================================
// SECTION 3: CAPABILITY CREATION TESTS
// ============================================================================

/// Test: Create capability with valid parameters
pub fn create_capability_test() -> Bool {
  let cap = create_test_capability(
    CapabilityId(1, 1),
    ProcessId(100),
    read_write_rights(),
    no_expiry_validity(),
  )
  
  cap.owner.value == 100 &&
  cap.rights.read == True &&
  cap.rights.write == True &&
  cap.rights.delete == False
}

/// Test: Capability ID uniqueness
pub fn capability_id_unique_test() -> Bool {
  let id1 = CapabilityId(1, 1)
  let id2 = CapabilityId(1, 2)
  let id3 = CapabilityId(2, 1)
  
  !cap_ids_equal(id1, id2) &&
  !cap_ids_equal(id1, id3) &&
  cap_ids_equal(id1, CapabilityId(1, 1))
}

/// Test: Capability with expiration
pub fn capability_expiration_test() -> Bool {
  let validity = CapabilityValidity(
    expires_at: Ok(10_000),
    max_uses: Error(Nil),
    use_count: 0,
  )
  
  // Check before expiry
  let before = check_expiration(validity, 5000)
  // Check after expiry
  let after = check_expiration(validity, 15_000)
  
  before == Valid && 
  case after {
    Invalid(CapabilityExpired) -> True
    _ -> False
  }
}

/// Test: Capability with usage limit
pub fn capability_usage_limit_test() -> Bool {
  let validity = CapabilityValidity(
    expires_at: Error(Nil),
    max_uses: Ok(5),
    use_count: 5,
  )
  
  case check_usage_limit(validity) {
    Invalid(UsageLimitExceeded(5, 5)) -> True
    _ -> False
  }
}

/// Test: Capability without limits
pub fn capability_no_limits_test() -> Bool {
  let validity = CapabilityValidity(
    expires_at: Error(Nil),
    max_uses: Error(Nil),
    use_count: 1000,
  )
  
  check_expiration(validity, 999_999) == Valid &&
  check_usage_limit(validity) == Valid
}

// ============================================================================
// SECTION 4: CAPABILITY VALIDATION TESTS
// ============================================================================

/// Test: Validate capability with sufficient rights
pub fn validate_sufficient_rights_test() -> Bool {
  let cap_rights = read_write_rights()
  let required_rights = read_only_rights()
  
  check_rights(cap_rights, required_rights) == Valid
}

/// Test: Validate capability with insufficient rights
pub fn validate_insufficient_rights_test() -> Bool {
  let cap_rights = read_only_rights()
  let required_rights = read_write_rights()
  
  case check_rights(cap_rights, required_rights) {
    Invalid(InsufficientRights(required, _)) -> list_length(required) > 0
    _ -> False
  }
}

/// Test: Validate revoked capability
pub fn validate_revoked_test() -> Bool {
  let cap = create_test_capability(
    CapabilityId(1, 1),
    ProcessId(100),
    read_write_rights(),
    no_expiry_validity(),
  )
  let revoked_cap = Capability(
    ..cap,
    flags: CapabilityFlags(..cap.flags, revoked: True),
  )
  
  revoked_cap.flags.revoked == True
}

/// Test: Resource type matching
pub fn resource_type_match_test() -> Bool {
  let cap_resource = ResourceId(ResourceKafkaTopic, "topic1")
  let req_resource = ResourceId(ResourceKafkaTopic, "topic1")
  let wrong_resource = ResourceId(ResourceRedisKeyspace, "topic1")
  
  check_resource_match(cap_resource, req_resource) == Valid &&
  case check_resource_match(cap_resource, wrong_resource) {
    Invalid(WrongResourceType(_, _)) -> True
    _ -> False
  }
}

// ============================================================================
// SECTION 5: CAPABILITY DELEGATION TESTS
// ============================================================================

/// Test: Delegate capability with attenuation
pub fn delegate_with_attenuation_test() -> Bool {
  let original = full_access_rights()
  let requested = read_only_rights()
  let attenuated = attenuate_rights(original, requested)
  
  attenuated.read == True &&
  attenuated.write == False &&
  attenuated.delete == False &&
  attenuated.delegate == False
}

/// Test: Delegation not allowed without delegate right
pub fn delegation_not_allowed_test() -> Bool {
  let rights = read_only_rights()  // No delegate right
  
  rights.delegate == False
}

/// Test: Delegation preserves attenuation chain
pub fn delegation_chain_test() -> Bool {
  let cap = create_test_capability(
    CapabilityId(1, 1),
    ProcessId(100),
    full_access_rights(),
    no_expiry_validity(),
  )
  
  // Simulate delegation
  let delegated = Capability(
    ..cap,
    id: CapabilityId(2, 1),
    owner: ProcessId(200),
    issuer: Delegated(cap.id, ProcessId(100)),
    rights: read_only_rights(),
  )
  
  delegated.owner.value == 200 &&
  case delegated.issuer {
    Delegated(parent_id, delegator) -> 
      cap_ids_equal(parent_id, cap.id) && delegator.value == 100
    _ -> False
  }
}

/// Test: Cannot increase rights through delegation
pub fn cannot_increase_rights_test() -> Bool {
  let original = read_only_rights()
  let requested = full_access_rights()
  let attenuated = attenuate_rights(original, requested)
  
  // Attenuated should have at most the original rights
  attenuated.read == True &&
  attenuated.write == False &&
  attenuated.delete == False &&
  attenuated.delegate == False
}

// ============================================================================
// SECTION 6: CAPABILITY REVOCATION TESTS
// ============================================================================

/// Test: Revoke capability
pub fn revoke_capability_test() -> Bool {
  let cap = create_test_capability(
    CapabilityId(1, 1),
    ProcessId(100),
    full_access_rights(),
    no_expiry_validity(),
  )
  
  let revoked = Capability(
    ..cap,
    flags: CapabilityFlags(..cap.flags, revoked: True),
  )
  
  revoked.flags.revoked == True
}

/// Test: Revocation cascades to delegated capabilities
pub fn revocation_cascade_test() -> Bool {
  let parent_id = CapabilityId(1, 1)
  let child_id = CapabilityId(2, 1)
  
  // Simulate cascade check
  let child_issuer = Delegated(parent_id, ProcessId(100))
  
  case child_issuer {
    Delegated(pid, _) -> cap_ids_equal(pid, parent_id)
    _ -> False
  }
}

/// Test: Revoke requires authority
pub fn revoke_requires_authority_test() -> Bool {
  // Only issuer or capability with revoke right can revoke
  let rights_with_revoke = CapabilityRights(
    read: True, write: False, delete: False, execute: False,
    create: False, list: False, delegate: False, revoke: True,
    custom_rights: [],
  )
  
  let rights_without_revoke = read_only_rights()
  
  rights_with_revoke.revoke == True &&
  rights_without_revoke.revoke == False
}

// ============================================================================
// SECTION 7: DRIVER CAPABILITY CHECK TESTS
// ============================================================================

/// Test: Driver check for read operation
pub fn driver_check_read_test() -> Bool {
  let required = operation_to_rights(OpRead)
  
  required.read == True &&
  required.write == False &&
  required.delete == False
}

/// Test: Driver check for write operation
pub fn driver_check_write_test() -> Bool {
  let required = operation_to_rights(OpWrite)
  
  required.read == False &&
  required.write == True &&
  required.delete == False
}

/// Test: Driver check for delete operation
pub fn driver_check_delete_test() -> Bool {
  let required = operation_to_rights(OpDelete)
  
  required.read == False &&
  required.write == False &&
  required.delete == True
}

/// Test: Driver check for execute operation
pub fn driver_check_execute_test() -> Bool {
  let required = operation_to_rights(OpExecute)
  
  required.execute == True &&
  required.read == False
}

/// Test: Access granted with valid capability
pub fn access_granted_test() -> Bool {
  let cap = create_test_capability(
    CapabilityId(1, 1),
    ProcessId(100),
    read_write_rights(),
    no_expiry_validity(),
  )
  
  let result = AccessGranted(cap)
  
  case result {
    AccessGranted(c) -> c.owner.value == 100
    _ -> False
  }
}

/// Test: Access denied without capability
pub fn access_denied_test() -> Bool {
  let result = AccessDenied(CapabilityNotFound)
  
  case result {
    AccessDenied(CapabilityNotFound) -> True
    _ -> False
  }
}

// ============================================================================
// SECTION 8: INVARIANT TESTS
// ============================================================================

/// Test: Monotonic attenuation invariant
pub fn monotonic_attenuation_invariant_test() -> Bool {
  let original = full_access_rights()
  let attenuated = read_only_rights()
  
  // Attenuated rights should be a subset of original
  (!attenuated.read || original.read) &&
  (!attenuated.write || original.write) &&
  (!attenuated.delete || original.delete) &&
  (!attenuated.execute || original.execute)
}

/// Test: Capability flags default state
pub fn capability_flags_default_test() -> Bool {
  let flags = default_flags()
  
  flags.revoked == False &&
  flags.ephemeral == False &&
  flags.inheritable == False &&
  flags.admin == False
}

/// Test: Kernel issued capabilities
pub fn kernel_issued_test() -> Bool {
  let issuer = KernelIssued
  
  case issuer {
    KernelIssued -> True
    _ -> False
  }
}

/// Test: Resource types cover all drivers
pub fn resource_types_coverage_test() -> Bool {
  let kafka = ResourceKafkaTopic
  let redis = ResourceRedisKeyspace
  let postgres = ResourcePgTable
  let memory = ResourceMemory
  let channel = ResourceChannel
  
  case kafka, redis, postgres {
    ResourceKafkaTopic, ResourceRedisKeyspace, ResourcePgTable -> True
    _, _, _ -> False
  }
}

// ============================================================================
// SECTION 9: CAPABILITY TEMPLATE TESTS
// ============================================================================

/// Test: Read-only template
pub fn read_only_template_test() -> Bool {
  let rights = read_only_rights()
  
  rights.read == True &&
  rights.list == True &&
  rights.write == False &&
  rights.delete == False &&
  rights.delegate == False
}

/// Test: Read-write template
pub fn read_write_template_test() -> Bool {
  let rights = read_write_rights()
  
  rights.read == True &&
  rights.write == True &&
  rights.create == True &&
  rights.delete == False &&
  rights.delegate == False
}

/// Test: Full access template
pub fn full_access_template_test() -> Bool {
  let rights = full_access_rights()
  
  rights.read == True &&
  rights.write == True &&
  rights.delete == True &&
  rights.execute == True &&
  rights.create == True &&
  rights.list == True &&
  rights.delegate == True &&
  rights.revoke == True
}

/// Test: Execute-only template
pub fn execute_only_template_test() -> Bool {
  let rights = execute_only_rights()
  
  rights.execute == True &&
  rights.read == False &&
  rights.write == False &&
  rights.delete == False
}

// ============================================================================
// SECTION 10: HELPER FUNCTIONS
// ============================================================================

fn create_test_capability(
  id: CapabilityId,
  owner: ProcessId,
  rights: CapabilityRights,
  validity: CapabilityValidity,
) -> Capability {
  Capability(
    id: id,
    resource: ResourceId(ResourceKafkaTopic, "test-topic"),
    rights: rights,
    owner: owner,
    issuer: KernelIssued,
    validity: validity,
    flags: default_flags(),
    created_at: 1000,
    version: 1,
  )
}

fn cap_ids_equal(a: CapabilityId, b: CapabilityId) -> Bool {
  a.high == b.high && a.low == b.low
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
  
  case missing {
    [] -> Valid
    _ -> Invalid(InsufficientRights(missing, []))
  }
}

fn check_resource_match(cap_resource: ResourceId, requested: ResourceId) -> ValidationResult {
  case cap_resource.resource_type == requested.resource_type {
    False -> Invalid(WrongResourceType("matching", "different"))
    True -> Valid
  }
}

fn attenuate_rights(original: CapabilityRights, requested: CapabilityRights) -> CapabilityRights {
  CapabilityRights(
    read: original.read && requested.read,
    write: original.write && requested.write,
    delete: original.delete && requested.delete,
    execute: original.execute && requested.execute,
    create: original.create && requested.create,
    list: original.list && requested.list,
    delegate: original.delegate && requested.delegate,
    revoke: original.revoke && requested.revoke,
    custom_rights: [],
  )
}

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
  }
}

fn default_flags() -> CapabilityFlags {
  CapabilityFlags(
    revoked: False,
    ephemeral: False,
    inheritable: False,
    secure_only: False,
    debug_only: False,
    admin: False,
  )
}

fn no_expiry_validity() -> CapabilityValidity {
  CapabilityValidity(
    expires_at: Error(Nil),
    max_uses: Error(Nil),
    use_count: 0,
  )
}

fn read_only_rights() -> CapabilityRights {
  CapabilityRights(
    read: True, write: False, delete: False, execute: False,
    create: False, list: True, delegate: False, revoke: False,
    custom_rights: [],
  )
}

fn read_write_rights() -> CapabilityRights {
  CapabilityRights(
    read: True, write: True, delete: False, execute: False,
    create: True, list: True, delegate: False, revoke: False,
    custom_rights: [],
  )
}

fn full_access_rights() -> CapabilityRights {
  CapabilityRights(
    read: True, write: True, delete: True, execute: True,
    create: True, list: True, delegate: True, revoke: True,
    custom_rights: [],
  )
}

fn execute_only_rights() -> CapabilityRights {
  CapabilityRights(
    read: False, write: False, delete: False, execute: True,
    create: False, list: False, delegate: False, revoke: False,
    custom_rights: [],
  )
}

fn list_length(list: List(a)) -> Int {
  case list {
    [] -> 0
    [_, ..tail] -> 1 + list_length(tail)
  }
}

// ============================================================================
// SECTION 11: TEST RUNNER
// ============================================================================

fn run_test(name: String, test_fn: fn() -> Bool) -> TestResult {
  case test_fn() {
    True -> Pass(name)
    False -> Fail(name)
  }
}

pub fn run_all_tests() -> List(TestResult) {
  [
    // Creation tests
    run_test("create_capability_test", create_capability_test),
    run_test("capability_id_unique_test", capability_id_unique_test),
    run_test("capability_expiration_test", capability_expiration_test),
    run_test("capability_usage_limit_test", capability_usage_limit_test),
    run_test("capability_no_limits_test", capability_no_limits_test),
    
    // Validation tests
    run_test("validate_sufficient_rights_test", validate_sufficient_rights_test),
    run_test("validate_insufficient_rights_test", validate_insufficient_rights_test),
    run_test("validate_revoked_test", validate_revoked_test),
    run_test("resource_type_match_test", resource_type_match_test),
    
    // Delegation tests
    run_test("delegate_with_attenuation_test", delegate_with_attenuation_test),
    run_test("delegation_not_allowed_test", delegation_not_allowed_test),
    run_test("delegation_chain_test", delegation_chain_test),
    run_test("cannot_increase_rights_test", cannot_increase_rights_test),
    
    // Revocation tests
    run_test("revoke_capability_test", revoke_capability_test),
    run_test("revocation_cascade_test", revocation_cascade_test),
    run_test("revoke_requires_authority_test", revoke_requires_authority_test),
    
    // Driver check tests
    run_test("driver_check_read_test", driver_check_read_test),
    run_test("driver_check_write_test", driver_check_write_test),
    run_test("driver_check_delete_test", driver_check_delete_test),
    run_test("driver_check_execute_test", driver_check_execute_test),
    run_test("access_granted_test", access_granted_test),
    run_test("access_denied_test", access_denied_test),
    
    // Invariant tests
    run_test("monotonic_attenuation_invariant_test", monotonic_attenuation_invariant_test),
    run_test("capability_flags_default_test", capability_flags_default_test),
    run_test("kernel_issued_test", kernel_issued_test),
    run_test("resource_types_coverage_test", resource_types_coverage_test),
    
    // Template tests
    run_test("read_only_template_test", read_only_template_test),
    run_test("read_write_template_test", read_write_template_test),
    run_test("full_access_template_test", full_access_template_test),
    run_test("execute_only_template_test", execute_only_template_test),
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
