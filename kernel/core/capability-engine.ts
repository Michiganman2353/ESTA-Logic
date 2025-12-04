/**
 * ESTA-Logic Microkernel Capability Engine
 *
 * Implements the capability-based security model for the kernel.
 * All resource access must be mediated through capabilities.
 *
 * @module kernel/core/capability-engine
 */

import type { ProcessId } from './scheduler';

// ============================================================================
// SECTION 1: TYPE DEFINITIONS
// ============================================================================

/** Capability identifier */
export interface CapabilityId {
  readonly high: number;
  readonly low: number;
}

/** Resource identifier */
export interface ResourceId {
  readonly resourceType: ResourceType;
  readonly resourcePath: string;
  readonly tenantId: string;
}

/** Types of resources that capabilities can reference */
export type ResourceType =
  | 'process'
  | 'memory'
  | 'channel'
  | 'device'
  | 'database'
  | 'file'
  | 'network'
  | 'audit_log'
  | 'config';

/** Rights that can be granted by a capability */
export interface CapabilityRights {
  readonly read: boolean;
  readonly write: boolean;
  readonly delete: boolean;
  readonly execute: boolean;
  readonly create: boolean;
  readonly list: boolean;
  readonly delegate: boolean;
  readonly revoke: boolean;
  readonly customRights: readonly string[];
}

/** Capability validity constraints */
export interface CapabilityValidity {
  /** Capability expiration time (timestamp) */
  readonly expiresAt?: number;
  /** Maximum use count (-1 for unlimited) */
  readonly maxUseCount: number;
  /** Current use count */
  readonly useCount: number;
  /** Valid time window start */
  readonly validAfter?: number;
  /** Valid time window end */
  readonly validBefore?: number;
  /** Allowed processes (empty = all) */
  readonly allowedProcesses?: readonly ProcessId[];
  /** Denied processes */
  readonly deniedProcesses: readonly ProcessId[];
}

/** Capability flags */
export interface CapabilityFlags {
  readonly revoked: boolean;
  readonly ephemeral: boolean;
  readonly inheritable: boolean;
  readonly secureOnly: boolean;
  readonly debugOnly: boolean;
  readonly admin: boolean;
}

/** Who issued the capability */
export type CapabilityIssuer =
  | { type: 'kernel' }
  | { type: 'delegated'; parentCapId: CapabilityId; delegator: ProcessId }
  | { type: 'driver'; driverId: string };

/** Attenuation record for delegation chain */
export interface AttenuationRecord {
  readonly attenuator: ProcessId;
  readonly rightsRemoved: Partial<CapabilityRights>;
  readonly constraintsAdded: string;
  readonly attenuatedAt: number;
}

/** Core capability structure */
export interface Capability {
  readonly id: CapabilityId;
  readonly resource: ResourceId;
  readonly rights: CapabilityRights;
  readonly owner: ProcessId;
  readonly tenantId: string;
  readonly issuer: CapabilityIssuer;
  readonly validity: CapabilityValidity;
  readonly attenuationChain: readonly AttenuationRecord[];
  readonly flags: CapabilityFlags;
  readonly createdAt: number;
  readonly version: number;
}

// ============================================================================
// SECTION 2: VALIDATION TYPES
// ============================================================================

/** Validation error types */
export type ValidationError =
  | { type: 'capability_not_found' }
  | { type: 'capability_revoked' }
  | { type: 'capability_expired' }
  | { type: 'usage_limit_exceeded'; used: number; max: number }
  | { type: 'insufficient_rights'; required: string[]; has: string[] }
  | { type: 'wrong_resource_type'; expected: string; actual: string }
  | { type: 'time_restriction_violated'; reason: string }
  | { type: 'process_restriction_violated'; processId: number }
  | { type: 'tenant_mismatch'; expected: string; actual: string }
  | { type: 'delegation_not_allowed' }
  | { type: 'integrity_check_failed' };

/** Validation result */
export type ValidationResult =
  | { valid: true }
  | { valid: false; error: ValidationError };

// ============================================================================
// SECTION 3: ENGINE STATE
// ============================================================================

/** Capability engine configuration */
export interface EngineConfig {
  /** Maximum delegation depth */
  readonly maxDelegationDepth: number;
  /** Default capability TTL (ms) */
  readonly defaultTtlMs: number;
  /** Enable audit logging */
  readonly auditEnabled: boolean;
  /** Maximum capabilities per process */
  readonly maxCapabilitiesPerProcess: number;
}

/** Stored capability with metadata */
export interface StoredCapability {
  readonly capability: Capability;
  readonly lastAccessed: number;
  readonly accessCount: number;
}

/** Capability engine state */
export interface EngineState {
  readonly config: EngineConfig;
  readonly capabilities: ReadonlyMap<string, StoredCapability>;
  readonly byOwner: ReadonlyMap<number, readonly CapabilityId[]>;
  readonly byResource: ReadonlyMap<string, readonly CapabilityId[]>;
  readonly revokedIds: ReadonlySet<string>;
  readonly stats: EngineStats;
}

/** Engine statistics */
export interface EngineStats {
  readonly totalCapabilities: number;
  readonly totalValidations: number;
  readonly validationFailures: number;
  readonly delegationsPerformed: number;
  readonly revocationsPerformed: number;
}

/** Audit event */
export interface CapabilityAuditEvent {
  readonly eventType:
    | 'created'
    | 'validated'
    | 'denied'
    | 'delegated'
    | 'revoked'
    | 'expired';
  readonly capabilityId: CapabilityId;
  readonly processId: ProcessId;
  readonly timestamp: number;
  readonly details: string;
}

// ============================================================================
// SECTION 4: CONFIGURATION
// ============================================================================

/** Default engine configuration */
export function defaultEngineConfig(): EngineConfig {
  return {
    maxDelegationDepth: 5,
    defaultTtlMs: 3600000, // 1 hour
    auditEnabled: true,
    maxCapabilitiesPerProcess: 1000,
  };
}

/** Default capability rights (none) */
export function noRights(): CapabilityRights {
  return {
    read: false,
    write: false,
    delete: false,
    execute: false,
    create: false,
    list: false,
    delegate: false,
    revoke: false,
    customRights: [],
  };
}

/** Full capability rights */
export function fullRights(): CapabilityRights {
  return {
    read: true,
    write: true,
    delete: true,
    execute: true,
    create: true,
    list: true,
    delegate: true,
    revoke: true,
    customRights: [],
  };
}

/** Read-only capability rights */
export function readOnlyRights(): CapabilityRights {
  return {
    ...noRights(),
    read: true,
    list: true,
  };
}

/** Default capability flags */
export function defaultFlags(): CapabilityFlags {
  return {
    revoked: false,
    ephemeral: false,
    inheritable: false,
    secureOnly: false,
    debugOnly: false,
    admin: false,
  };
}

/** Default validity (unlimited) */
export function defaultValidity(): CapabilityValidity {
  return {
    maxUseCount: -1,
    useCount: 0,
    deniedProcesses: [],
  };
}

// ============================================================================
// SECTION 5: ENGINE OPERATIONS
// ============================================================================

/** Create initial engine state */
export function createEngine(
  config: EngineConfig = defaultEngineConfig()
): EngineState {
  return {
    config,
    capabilities: new Map(),
    byOwner: new Map(),
    byResource: new Map(),
    revokedIds: new Set(),
    stats: {
      totalCapabilities: 0,
      totalValidations: 0,
      validationFailures: 0,
      delegationsPerformed: 0,
      revocationsPerformed: 0,
    },
  };
}

/** Generate a new capability ID */
export function generateCapabilityId(counter: number): CapabilityId {
  return {
    high: Date.now(),
    low: counter * 1000 + (Date.now() % 1000),
  };
}

/** Convert capability ID to string */
export function capabilityIdToString(id: CapabilityId): string {
  return `${id.high.toString(16).padStart(16, '0')}${id.low.toString(16).padStart(16, '0')}`;
}

/** Convert resource ID to string */
export function resourceIdToString(id: ResourceId): string {
  return `${id.tenantId}:${id.resourceType}:${id.resourcePath}`;
}

/** Create a new capability (kernel authority) */
export function createCapability(
  state: EngineState,
  resource: ResourceId,
  rights: CapabilityRights,
  owner: ProcessId,
  tenantId: string,
  validity: CapabilityValidity = defaultValidity(),
  flags: CapabilityFlags = defaultFlags()
): [EngineState, Capability] {
  const id = generateCapabilityId(state.stats.totalCapabilities);
  const now = Date.now();

  const capability: Capability = {
    id,
    resource,
    rights,
    owner,
    tenantId,
    issuer: { type: 'kernel' },
    validity: {
      ...validity,
      expiresAt: validity.expiresAt ?? now + state.config.defaultTtlMs,
    },
    attenuationChain: [],
    flags,
    createdAt: now,
    version: 1,
  };

  const stored: StoredCapability = {
    capability,
    lastAccessed: now,
    accessCount: 0,
  };

  // Update state
  const idStr = capabilityIdToString(id);
  const newCapabilities = new Map(state.capabilities);
  newCapabilities.set(idStr, stored);

  const newByOwner = new Map(state.byOwner);
  const ownerCaps = [...(state.byOwner.get(owner.value) ?? []), id];
  newByOwner.set(owner.value, ownerCaps);

  const resourceKey = resourceIdToString(resource);
  const newByResource = new Map(state.byResource);
  const resourceCaps = [...(state.byResource.get(resourceKey) ?? []), id];
  newByResource.set(resourceKey, resourceCaps);

  return [
    {
      ...state,
      capabilities: newCapabilities,
      byOwner: newByOwner,
      byResource: newByResource,
      stats: {
        ...state.stats,
        totalCapabilities: state.stats.totalCapabilities + 1,
      },
    },
    capability,
  ];
}

/** Validate a capability */
export function validateCapability(
  state: EngineState,
  capabilityId: CapabilityId,
  requiredRights: Partial<CapabilityRights>,
  resource: ResourceId,
  requestor: ProcessId,
  tenantId: string,
  now: number
): [EngineState, ValidationResult] {
  const idStr = capabilityIdToString(capabilityId);

  // Check if capability exists
  const stored = state.capabilities.get(idStr);
  if (!stored) {
    return [
      incrementFailures(state),
      { valid: false, error: { type: 'capability_not_found' } },
    ];
  }

  const cap = stored.capability;

  // Check if revoked
  if (cap.flags.revoked || state.revokedIds.has(idStr)) {
    return [
      incrementFailures(state),
      { valid: false, error: { type: 'capability_revoked' } },
    ];
  }

  // Check tenant
  if (cap.tenantId !== tenantId) {
    return [
      incrementFailures(state),
      {
        valid: false,
        error: {
          type: 'tenant_mismatch',
          expected: cap.tenantId,
          actual: tenantId,
        },
      },
    ];
  }

  // Check expiration
  if (cap.validity.expiresAt && now > cap.validity.expiresAt) {
    return [
      incrementFailures(state),
      { valid: false, error: { type: 'capability_expired' } },
    ];
  }

  // Check time window
  if (cap.validity.validAfter && now < cap.validity.validAfter) {
    return [
      incrementFailures(state),
      {
        valid: false,
        error: {
          type: 'time_restriction_violated',
          reason: 'before valid period',
        },
      },
    ];
  }
  if (cap.validity.validBefore && now > cap.validity.validBefore) {
    return [
      incrementFailures(state),
      {
        valid: false,
        error: {
          type: 'time_restriction_violated',
          reason: 'after valid period',
        },
      },
    ];
  }

  // Check use count
  if (
    cap.validity.maxUseCount >= 0 &&
    cap.validity.useCount >= cap.validity.maxUseCount
  ) {
    return [
      incrementFailures(state),
      {
        valid: false,
        error: {
          type: 'usage_limit_exceeded',
          used: cap.validity.useCount,
          max: cap.validity.maxUseCount,
        },
      },
    ];
  }

  // Check process restrictions
  if (cap.validity.deniedProcesses.some((p) => p.value === requestor.value)) {
    return [
      incrementFailures(state),
      {
        valid: false,
        error: {
          type: 'process_restriction_violated',
          processId: requestor.value,
        },
      },
    ];
  }
  if (
    cap.validity.allowedProcesses &&
    cap.validity.allowedProcesses.length > 0 &&
    !cap.validity.allowedProcesses.some((p) => p.value === requestor.value)
  ) {
    return [
      incrementFailures(state),
      {
        valid: false,
        error: {
          type: 'process_restriction_violated',
          processId: requestor.value,
        },
      },
    ];
  }

  // Check resource type
  if (cap.resource.resourceType !== resource.resourceType) {
    return [
      incrementFailures(state),
      {
        valid: false,
        error: {
          type: 'wrong_resource_type',
          expected: resource.resourceType,
          actual: cap.resource.resourceType,
        },
      },
    ];
  }

  // Check rights
  const missingRights = getMissingRights(cap.rights, requiredRights);
  if (missingRights.length > 0) {
    return [
      incrementFailures(state),
      {
        valid: false,
        error: {
          type: 'insufficient_rights',
          required: missingRights,
          has: getRightsList(cap.rights),
        },
      },
    ];
  }

  // Validation passed - update access tracking
  const updatedStored: StoredCapability = {
    ...stored,
    lastAccessed: now,
    accessCount: stored.accessCount + 1,
    capability: {
      ...cap,
      validity: {
        ...cap.validity,
        useCount: cap.validity.useCount + 1,
      },
    },
  };

  const newCapabilities = new Map(state.capabilities);
  newCapabilities.set(idStr, updatedStored);

  return [
    {
      ...state,
      capabilities: newCapabilities,
      stats: {
        ...state.stats,
        totalValidations: state.stats.totalValidations + 1,
      },
    },
    { valid: true },
  ];
}

/** Delegate a capability to another process */
export function delegateCapability(
  state: EngineState,
  capabilityId: CapabilityId,
  toProcess: ProcessId,
  attenuatedRights: Partial<CapabilityRights>,
  delegator: ProcessId,
  now: number
): [EngineState, Capability | null, ValidationError | null] {
  const idStr = capabilityIdToString(capabilityId);
  const stored = state.capabilities.get(idStr);

  if (!stored) {
    return [state, null, { type: 'capability_not_found' }];
  }

  const cap = stored.capability;

  // Check delegation right
  if (!cap.rights.delegate) {
    return [state, null, { type: 'delegation_not_allowed' }];
  }

  // Check delegation depth
  if (cap.attenuationChain.length >= state.config.maxDelegationDepth) {
    return [
      state,
      null,
      { type: 'insufficient_rights', required: ['delegate_depth'], has: [] },
    ];
  }

  // Attenuate rights
  const newRights = attenuateRights(cap.rights, attenuatedRights);

  // Create attenuation record
  const attenuation: AttenuationRecord = {
    attenuator: delegator,
    rightsRemoved: computeRightsRemoved(cap.rights, newRights),
    constraintsAdded: '',
    attenuatedAt: now,
  };

  // Create delegated capability
  const newId = generateCapabilityId(state.stats.totalCapabilities);
  const delegatedCap: Capability = {
    id: newId,
    resource: cap.resource,
    rights: newRights,
    owner: toProcess,
    tenantId: cap.tenantId,
    issuer: { type: 'delegated', parentCapId: capabilityId, delegator },
    validity: cap.validity,
    attenuationChain: [...cap.attenuationChain, attenuation],
    flags: {
      ...cap.flags,
      inheritable: false, // Delegated caps are not inheritable by default
    },
    createdAt: now,
    version: 1,
  };

  const newStored: StoredCapability = {
    capability: delegatedCap,
    lastAccessed: now,
    accessCount: 0,
  };

  const newIdStr = capabilityIdToString(newId);
  const newCapabilities = new Map(state.capabilities);
  newCapabilities.set(newIdStr, newStored);

  const newByOwner = new Map(state.byOwner);
  const ownerCaps = [...(state.byOwner.get(toProcess.value) ?? []), newId];
  newByOwner.set(toProcess.value, ownerCaps);

  return [
    {
      ...state,
      capabilities: newCapabilities,
      byOwner: newByOwner,
      stats: {
        ...state.stats,
        totalCapabilities: state.stats.totalCapabilities + 1,
        delegationsPerformed: state.stats.delegationsPerformed + 1,
      },
    },
    delegatedCap,
    null,
  ];
}

/** Revoke a capability and all its delegations */
export function revokeCapability(
  state: EngineState,
  capabilityId: CapabilityId,
  revoker: ProcessId,
  _reason: string
): [EngineState, number] {
  const idStr = capabilityIdToString(capabilityId);
  const stored = state.capabilities.get(idStr);

  if (!stored) {
    return [state, 0];
  }

  const cap = stored.capability;

  // Check revoke right (owner or has revoke right)
  if (cap.owner.value !== revoker.value && !cap.rights.revoke) {
    return [state, 0];
  }

  // Find all delegated capabilities from this one
  const toRevoke = findDelegatedCapabilities(state, capabilityId);
  toRevoke.push(capabilityId);

  // Revoke all
  const newRevokedIds = new Set(state.revokedIds);
  for (const revokeId of toRevoke) {
    newRevokedIds.add(capabilityIdToString(revokeId));
  }

  // Update capabilities to mark as revoked
  const newCapabilities = new Map(state.capabilities);
  for (const revokeId of toRevoke) {
    const revokeIdStr = capabilityIdToString(revokeId);
    const storedCap = newCapabilities.get(revokeIdStr);
    if (storedCap) {
      newCapabilities.set(revokeIdStr, {
        ...storedCap,
        capability: {
          ...storedCap.capability,
          flags: {
            ...storedCap.capability.flags,
            revoked: true,
          },
        },
      });
    }
  }

  return [
    {
      ...state,
      capabilities: newCapabilities,
      revokedIds: newRevokedIds,
      stats: {
        ...state.stats,
        revocationsPerformed:
          state.stats.revocationsPerformed + toRevoke.length,
      },
    },
    toRevoke.length,
  ];
}

/** List capabilities for a process */
export function listCapabilities(
  state: EngineState,
  owner: ProcessId,
  tenantId: string,
  resourceTypeFilter?: ResourceType
): readonly Capability[] {
  const capIds = state.byOwner.get(owner.value) ?? [];
  const capabilities: Capability[] = [];

  for (const capId of capIds) {
    const stored = state.capabilities.get(capabilityIdToString(capId));
    if (!stored) continue;

    const cap = stored.capability;

    // Filter by tenant
    if (cap.tenantId !== tenantId) continue;

    // Filter by resource type
    if (resourceTypeFilter && cap.resource.resourceType !== resourceTypeFilter)
      continue;

    // Filter out revoked
    if (cap.flags.revoked) continue;

    capabilities.push(cap);
  }

  return capabilities;
}

// ============================================================================
// SECTION 6: HELPER FUNCTIONS
// ============================================================================

/** Increment validation failure count */
function incrementFailures(state: EngineState): EngineState {
  return {
    ...state,
    stats: {
      ...state.stats,
      totalValidations: state.stats.totalValidations + 1,
      validationFailures: state.stats.validationFailures + 1,
    },
  };
}

/** Get list of missing rights */
function getMissingRights(
  has: CapabilityRights,
  required: Partial<CapabilityRights>
): string[] {
  const missing: string[] = [];

  if (required.read && !has.read) missing.push('read');
  if (required.write && !has.write) missing.push('write');
  if (required.delete && !has.delete) missing.push('delete');
  if (required.execute && !has.execute) missing.push('execute');
  if (required.create && !has.create) missing.push('create');
  if (required.list && !has.list) missing.push('list');
  if (required.delegate && !has.delegate) missing.push('delegate');
  if (required.revoke && !has.revoke) missing.push('revoke');

  if (required.customRights) {
    for (const right of required.customRights) {
      if (!has.customRights.includes(right)) {
        missing.push(right);
      }
    }
  }

  return missing;
}

/** Get list of rights as strings */
function getRightsList(rights: CapabilityRights): string[] {
  const list: string[] = [];

  if (rights.read) list.push('read');
  if (rights.write) list.push('write');
  if (rights.delete) list.push('delete');
  if (rights.execute) list.push('execute');
  if (rights.create) list.push('create');
  if (rights.list) list.push('list');
  if (rights.delegate) list.push('delegate');
  if (rights.revoke) list.push('revoke');
  list.push(...rights.customRights);

  return list;
}

/** Attenuate rights (can only reduce, never increase) */
function attenuateRights(
  original: CapabilityRights,
  requested: Partial<CapabilityRights>
): CapabilityRights {
  return {
    read: original.read && (requested.read ?? true),
    write: original.write && (requested.write ?? true),
    delete: original.delete && (requested.delete ?? true),
    execute: original.execute && (requested.execute ?? true),
    create: original.create && (requested.create ?? true),
    list: original.list && (requested.list ?? true),
    delegate: original.delegate && (requested.delegate ?? true),
    revoke: original.revoke && (requested.revoke ?? true),
    customRights: original.customRights.filter(
      (r) => !requested.customRights || requested.customRights.includes(r)
    ),
  };
}

/** Compute which rights were removed in attenuation */
function computeRightsRemoved(
  original: CapabilityRights,
  attenuated: CapabilityRights
): Partial<CapabilityRights> {
  return {
    read: original.read && !attenuated.read ? true : undefined,
    write: original.write && !attenuated.write ? true : undefined,
    delete: original.delete && !attenuated.delete ? true : undefined,
    execute: original.execute && !attenuated.execute ? true : undefined,
    create: original.create && !attenuated.create ? true : undefined,
    list: original.list && !attenuated.list ? true : undefined,
    delegate: original.delegate && !attenuated.delegate ? true : undefined,
    revoke: original.revoke && !attenuated.revoke ? true : undefined,
  };
}

/** Find all capabilities delegated from a parent */
function findDelegatedCapabilities(
  state: EngineState,
  parentId: CapabilityId
): CapabilityId[] {
  const parentIdStr = capabilityIdToString(parentId);
  const delegated: CapabilityId[] = [];

  for (const [_, stored] of state.capabilities) {
    if (
      stored.capability.issuer.type === 'delegated' &&
      capabilityIdToString(stored.capability.issuer.parentCapId) === parentIdStr
    ) {
      delegated.push(stored.capability.id);
      // Recursively find delegations of delegations
      delegated.push(...findDelegatedCapabilities(state, stored.capability.id));
    }
  }

  return delegated;
}

/** Cleanup expired capabilities */
export function cleanupExpired(state: EngineState, now: number): EngineState {
  const newCapabilities = new Map<string, StoredCapability>();
  const expiredIds: string[] = [];

  for (const [idStr, stored] of state.capabilities) {
    if (
      stored.capability.validity.expiresAt &&
      now > stored.capability.validity.expiresAt
    ) {
      expiredIds.push(idStr);
    } else if (!stored.capability.flags.revoked) {
      newCapabilities.set(idStr, stored);
    }
  }

  // Rebuild byOwner and byResource indices
  const newByOwner = new Map<number, CapabilityId[]>();
  const newByResource = new Map<string, CapabilityId[]>();

  for (const stored of newCapabilities.values()) {
    const cap = stored.capability;
    const ownerCaps = newByOwner.get(cap.owner.value) ?? [];
    ownerCaps.push(cap.id);
    newByOwner.set(cap.owner.value, ownerCaps);

    const resourceKey = resourceIdToString(cap.resource);
    const resourceCaps = newByResource.get(resourceKey) ?? [];
    resourceCaps.push(cap.id);
    newByResource.set(resourceKey, resourceCaps);
  }

  return {
    ...state,
    capabilities: newCapabilities,
    byOwner: newByOwner,
    byResource: newByResource,
    stats: {
      ...state.stats,
      totalCapabilities: newCapabilities.size,
    },
  };
}
