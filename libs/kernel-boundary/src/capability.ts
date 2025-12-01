/**
 * Capability Enforcement Layer
 *
 * TypeScript port of the Gleam capability system (estalogic_kernel/security/cap_system.gleam)
 *
 * Key Design Principles:
 * 1. Capabilities are opaque tokens issued by the kernel
 * 2. A process can only read/write what its capabilities allow
 * 3. Drivers validate capabilities before performing work
 * 4. Capabilities can be delegated, revoked, and attenuated
 * 5. No ambient authority - all access must go through capabilities
 *
 * Security Guarantees:
 * - Unforgeable: Capabilities cannot be created outside the kernel
 * - Monotonic Attenuation: Capabilities can only be weakened, never strengthened
 * - Revocable: All capabilities can be revoked by their issuer
 * - Auditable: All capability operations are logged
 *
 * @module capability
 */

import { z } from 'zod';

// ============================================================================
// SECTION 1: CAPABILITY IDENTIFIER TYPES
// ============================================================================

/**
 * Unique identifier for a capability
 * 128-bit value split into high/low for consistency with Gleam implementation
 */
export interface CapabilityId {
  /** High 64 bits (includes version and type info) */
  readonly high: number;
  /** Low 64 bits (random component) */
  readonly low: number;
}

/** Zod schema for CapabilityId validation */
export const CapabilityIdSchema = z.object({
  high: z.number().int(),
  low: z.number().int(),
});

/**
 * Process identifier
 */
export interface ProcessId {
  readonly value: number;
}

/** Zod schema for ProcessId */
export const ProcessIdSchema = z.object({
  value: z.number().int().nonnegative(),
});

/**
 * Tenant identifier for multi-tenancy isolation
 */
export interface TenantId {
  readonly value: string;
}

/** Zod schema for TenantId */
export const TenantIdSchema = z.object({
  value: z.string().min(1),
});

/**
 * Resource types that can have capabilities
 */
export type ResourceType =
  | 'memory'
  | 'channel'
  | 'file'
  | 'database'
  | 'kafka_topic'
  | 'redis_keyspace'
  | 'pg_table'
  | 'wasm_module'
  | 'process'
  | 'audit_log'
  | 'config'
  | 'timer'
  | 'network'
  | { custom: string };

/** Zod schema for ResourceType */
export const ResourceTypeSchema = z.union([
  z.literal('memory'),
  z.literal('channel'),
  z.literal('file'),
  z.literal('database'),
  z.literal('kafka_topic'),
  z.literal('redis_keyspace'),
  z.literal('pg_table'),
  z.literal('wasm_module'),
  z.literal('process'),
  z.literal('audit_log'),
  z.literal('config'),
  z.literal('timer'),
  z.literal('network'),
  z.object({ custom: z.string() }),
]);

/**
 * Resource identifier
 */
export interface ResourceId {
  /** Resource type */
  readonly resourceType: ResourceType;
  /** Type-specific identifier */
  readonly typeId: string;
}

/** Zod schema for ResourceId */
export const ResourceIdSchema = z.object({
  resourceType: ResourceTypeSchema,
  typeId: z.string(),
});

// ============================================================================
// SECTION 2: CAPABILITY RIGHTS TYPES
// ============================================================================

/**
 * Rights that can be granted by a capability
 */
export interface CapabilityRights {
  /** Permission to read resource */
  readonly read: boolean;
  /** Permission to write/modify resource */
  readonly write: boolean;
  /** Permission to delete resource */
  readonly delete: boolean;
  /** Permission to execute (for code/functions) */
  readonly execute: boolean;
  /** Permission to create child resources */
  readonly create: boolean;
  /** Permission to list/enumerate resource contents */
  readonly list: boolean;
  /** Permission to delegate this capability */
  readonly delegate: boolean;
  /** Permission to revoke delegated capabilities */
  readonly revoke: boolean;
  /** Custom rights (extensibility) */
  readonly customRights: readonly string[];
}

/** Zod schema for CapabilityRights */
export const CapabilityRightsSchema = z.object({
  read: z.boolean(),
  write: z.boolean(),
  delete: z.boolean(),
  execute: z.boolean(),
  create: z.boolean(),
  list: z.boolean(),
  delegate: z.boolean(),
  revoke: z.boolean(),
  customRights: z.array(z.string()),
});

/**
 * Create a read-only rights object
 */
export function readOnlyRights(): CapabilityRights {
  return {
    read: true,
    write: false,
    delete: false,
    execute: false,
    create: false,
    list: true,
    delegate: false,
    revoke: false,
    customRights: [],
  };
}

/**
 * Create a read-write rights object
 */
export function readWriteRights(): CapabilityRights {
  return {
    read: true,
    write: true,
    delete: false,
    execute: false,
    create: true,
    list: true,
    delegate: false,
    revoke: false,
    customRights: [],
  };
}

/**
 * Create full access rights object
 */
export function fullAccessRights(): CapabilityRights {
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

/**
 * Create execute-only rights object
 */
export function executeOnlyRights(): CapabilityRights {
  return {
    read: false,
    write: false,
    delete: false,
    execute: true,
    create: false,
    list: false,
    delegate: false,
    revoke: false,
    customRights: [],
  };
}

// ============================================================================
// SECTION 3: CAPABILITY VALIDITY TYPES
// ============================================================================

/**
 * Time-based access restrictions
 */
export interface TimeRestrictions {
  /** Valid after this timestamp (ms since epoch) */
  readonly validAfter?: number;
  /** Valid before this timestamp (ms since epoch) */
  readonly validBefore?: number;
  /** Valid during specific hours (0-23) */
  readonly validHours?: readonly [number, number];
  /** Valid on specific days (0=Sun, 6=Sat) */
  readonly validDays?: readonly number[];
}

/** Zod schema for TimeRestrictions */
export const TimeRestrictionsSchema = z.object({
  validAfter: z.number().optional(),
  validBefore: z.number().optional(),
  validHours: z
    .tuple([z.number().min(0).max(23), z.number().min(0).max(23)])
    .optional(),
  validDays: z.array(z.number().min(0).max(6)).optional(),
});

/**
 * Process-based access restrictions
 */
export interface ProcessRestrictions {
  /** Only valid for these processes */
  readonly allowedProcesses?: readonly ProcessId[];
  /** Never valid for these processes */
  readonly deniedProcesses: readonly ProcessId[];
  /** Only valid when parent process is alive */
  readonly requireParentAlive: boolean;
}

/**
 * Validity constraints for a capability
 */
export interface CapabilityValidity {
  /** Expiration timestamp (undefined = never expires) */
  readonly expiresAt?: number;
  /** Usage count limit (undefined = unlimited) */
  readonly maxUses?: number;
  /** Current usage count */
  readonly useCount: number;
  /** Time-based restrictions */
  readonly timeRestrictions?: TimeRestrictions;
  /** Process restrictions */
  readonly processRestrictions?: ProcessRestrictions;
}

/** Zod schema for CapabilityValidity */
export const CapabilityValiditySchema = z.object({
  expiresAt: z.number().optional(),
  maxUses: z.number().int().positive().optional(),
  useCount: z.number().int().nonnegative(),
  timeRestrictions: TimeRestrictionsSchema.optional(),
  processRestrictions: z
    .object({
      allowedProcesses: z.array(ProcessIdSchema).optional(),
      deniedProcesses: z.array(ProcessIdSchema),
      requireParentAlive: z.boolean(),
    })
    .optional(),
});

/**
 * Capability flags
 */
export interface CapabilityFlags {
  /** Capability has been revoked */
  readonly revoked: boolean;
  /** Capability is ephemeral (not persisted) */
  readonly ephemeral: boolean;
  /** Capability is inheritable by child processes */
  readonly inheritable: boolean;
  /** Capability requires secure channel */
  readonly secureOnly: boolean;
  /** Capability is for debug purposes only */
  readonly debugOnly: boolean;
  /** Capability grants admin rights */
  readonly admin: boolean;
}

/** Zod schema for CapabilityFlags */
export const CapabilityFlagsSchema = z.object({
  revoked: z.boolean(),
  ephemeral: z.boolean(),
  inheritable: z.boolean(),
  secureOnly: z.boolean(),
  debugOnly: z.boolean(),
  admin: z.boolean(),
});

/**
 * Default capability flags
 */
export function defaultCapabilityFlags(): CapabilityFlags {
  return {
    revoked: false,
    ephemeral: false,
    inheritable: false,
    secureOnly: false,
    debugOnly: false,
    admin: false,
  };
}

// ============================================================================
// SECTION 4: CAPABILITY ISSUER TYPES
// ============================================================================

/**
 * Who issued the capability
 */
export type CapabilityIssuer =
  | { type: 'kernel' }
  | { type: 'delegated'; parentCapId: CapabilityId; delegator: ProcessId }
  | { type: 'driver'; driverId: string };

/** Zod schema for CapabilityIssuer */
export const CapabilityIssuerSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('kernel') }),
  z.object({
    type: z.literal('delegated'),
    parentCapId: CapabilityIdSchema,
    delegator: ProcessIdSchema,
  }),
  z.object({ type: z.literal('driver'), driverId: z.string() }),
]);

/**
 * Record of capability attenuation
 */
export interface AttenuationRecord {
  /** Process that performed attenuation */
  readonly attenuator: ProcessId;
  /** Rights removed in this attenuation */
  readonly rightsRemoved: CapabilityRights;
  /** Additional constraints added */
  readonly constraintsAdded: string;
  /** When attenuation occurred */
  readonly attenuatedAt: number;
}

// ============================================================================
// SECTION 5: CORE CAPABILITY TYPE
// ============================================================================

/**
 * Core capability structure
 * Represents an unforgeable access token granted by the kernel
 */
export interface Capability {
  /** Unique capability identifier */
  readonly id: CapabilityId;
  /** Resource this capability grants access to */
  readonly resource: ResourceId;
  /** Rights granted by this capability */
  readonly rights: CapabilityRights;
  /** Owner process */
  readonly owner: ProcessId;
  /** Tenant ID for multi-tenant isolation */
  readonly tenantId: TenantId;
  /** Issuer (kernel or delegating process) */
  readonly issuer: CapabilityIssuer;
  /** Validity constraints */
  readonly validity: CapabilityValidity;
  /** Attenuation chain (for delegated caps) */
  readonly attenuationChain: readonly AttenuationRecord[];
  /** Capability flags */
  readonly flags: CapabilityFlags;
  /** Creation timestamp */
  readonly createdAt: number;
  /** Capability version (for revocation) */
  readonly version: number;
}

// ============================================================================
// SECTION 6: VALIDATION TYPES
// ============================================================================

/**
 * Validation error types
 */
export type ValidationError =
  | { type: 'capability_not_found' }
  | { type: 'capability_revoked' }
  | { type: 'capability_expired' }
  | { type: 'usage_limit_exceeded'; used: number; max: number }
  | { type: 'insufficient_rights'; required: string[]; has: string[] }
  | { type: 'wrong_resource_type'; expected: string; actual: string }
  | { type: 'time_restriction_violated'; reason: string }
  | { type: 'process_restriction_violated'; process: ProcessId }
  | { type: 'tenant_mismatch'; expected: string; actual: string }
  | { type: 'delegation_not_allowed' }
  | { type: 'capability_forged' }
  | { type: 'integrity_check_failed' };

/**
 * Result of capability validation
 */
export type ValidationResult =
  | { valid: true }
  | { valid: false; error: ValidationError };

// ============================================================================
// SECTION 7: CAPABILITY VALIDATOR INTERFACE
// ============================================================================

/**
 * Interface for capability validation
 * This is the boundary between business logic and the capability system
 */
export interface CapabilityValidator {
  /**
   * Validate that a capability grants the required rights for a resource
   */
  validate(
    capabilityId: CapabilityId,
    requiredRights: CapabilityRights,
    resource: ResourceId,
    requestor: ProcessId,
    tenantId: TenantId,
    now: number
  ): Promise<ValidationResult>;

  /**
   * Check if a capability exists and is valid (without checking specific rights)
   */
  exists(capabilityId: CapabilityId): Promise<boolean>;

  /**
   * Get capability details (if requestor has permission to view)
   */
  get(
    capabilityId: CapabilityId,
    requestor: ProcessId,
    tenantId: TenantId
  ): Promise<Capability | null>;
}

/**
 * Interface for capability issuer (kernel-level operations)
 */
export interface CapabilityIssuerService {
  /**
   * Create a new capability (kernel authority only)
   */
  create(
    resource: ResourceId,
    rights: CapabilityRights,
    owner: ProcessId,
    tenantId: TenantId,
    validity: CapabilityValidity,
    flags?: Partial<CapabilityFlags>
  ): Promise<Capability>;

  /**
   * Delegate a capability to another process
   */
  delegate(
    capabilityId: CapabilityId,
    toProcess: ProcessId,
    attenuatedRights: CapabilityRights,
    delegator: ProcessId
  ): Promise<Capability>;

  /**
   * Revoke a capability
   */
  revoke(
    capabilityId: CapabilityId,
    revoker: ProcessId,
    reason: string
  ): Promise<{ revokedCount: number }>;

  /**
   * List capabilities for a process
   */
  list(
    owner: ProcessId,
    tenantId: TenantId,
    resourceTypeFilter?: ResourceType
  ): Promise<readonly Capability[]>;
}

// ============================================================================
// SECTION 8: HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a capability ID
 */
export function generateCapabilityId(
  counter: number,
  timestamp: number
): CapabilityId {
  return {
    high: timestamp,
    low: counter * 1000 + (timestamp % 1000),
  };
}

/**
 * Compare two capability IDs for equality
 */
export function capabilityIdEquals(a: CapabilityId, b: CapabilityId): boolean {
  return a.high === b.high && a.low === b.low;
}

/**
 * Convert capability ID to string
 */
export function capabilityIdToString(id: CapabilityId): string {
  return `${id.high.toString(16).padStart(16, '0')}${id.low.toString(16).padStart(16, '0')}`;
}

/**
 * Parse capability ID from string
 */
export function parseCapabilityId(str: string): CapabilityId | null {
  if (str.length !== 32) return null;
  const high = parseInt(str.slice(0, 16), 16);
  const low = parseInt(str.slice(16, 32), 16);
  if (isNaN(high) || isNaN(low)) return null;
  return { high, low };
}

/**
 * Attenuate rights (can only reduce, never increase)
 */
export function attenuateRights(
  original: CapabilityRights,
  requested: CapabilityRights
): CapabilityRights {
  return {
    read: original.read && requested.read,
    write: original.write && requested.write,
    delete: original.delete && requested.delete,
    execute: original.execute && requested.execute,
    create: original.create && requested.create,
    list: original.list && requested.list,
    delegate: original.delegate && requested.delegate,
    revoke: original.revoke && requested.revoke,
    customRights: original.customRights.filter((r) =>
      requested.customRights.includes(r)
    ),
  };
}

/**
 * Check if capability has all required rights
 */
export function hasRequiredRights(
  capability: CapabilityRights,
  required: CapabilityRights
): boolean {
  if (required.read && !capability.read) return false;
  if (required.write && !capability.write) return false;
  if (required.delete && !capability.delete) return false;
  if (required.execute && !capability.execute) return false;
  if (required.create && !capability.create) return false;
  if (required.list && !capability.list) return false;
  if (required.delegate && !capability.delegate) return false;
  if (required.revoke && !capability.revoke) return false;
  for (const customRight of required.customRights) {
    if (!capability.customRights.includes(customRight)) return false;
  }
  return true;
}

/**
 * Get list of missing rights
 */
export function getMissingRights(
  capability: CapabilityRights,
  required: CapabilityRights
): string[] {
  const missing: string[] = [];
  if (required.read && !capability.read) missing.push('read');
  if (required.write && !capability.write) missing.push('write');
  if (required.delete && !capability.delete) missing.push('delete');
  if (required.execute && !capability.execute) missing.push('execute');
  if (required.create && !capability.create) missing.push('create');
  if (required.list && !capability.list) missing.push('list');
  if (required.delegate && !capability.delegate) missing.push('delegate');
  if (required.revoke && !capability.revoke) missing.push('revoke');
  for (const customRight of required.customRights) {
    if (!capability.customRights.includes(customRight)) {
      missing.push(customRight);
    }
  }
  return missing;
}
