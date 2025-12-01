/**
 * @esta/kernel-boundary
 *
 * Kernel Boundary Contract (KBC) - Formal interfaces between kernel and userland
 *
 * This package establishes the true microkernel foundation for ESTA-Logic.
 * It provides hard, enforceable boundaries between core logic, persistence,
 * and external interfaces.
 *
 * ## Key Components
 *
 * ### Capability Enforcement Layer
 * - Tenant-scoped, role-scoped callable capabilities
 * - No ambient authority - all access must go through capabilities
 * - Unforgeable, revocable, and auditable access tokens
 *
 * ### IPC Messaging Layer
 * - Internal message bus for worker threads/Tauri-boundary processes
 * - Deterministic request/response semantics
 * - W3C Trace Context compatible for distributed tracing
 *
 * ### Adapter Isolation
 * - All persistence behind formal adapter interface
 * - No business logic may import Firebase SDK or raw types
 * - Tenant-scoped repositories for multi-tenancy isolation
 *
 * ## Architecture Overview
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                         User Land                               │
 * │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
 * │  │  Frontend   │   │   Backend   │   │   Workers   │           │
 * │  │   (React)   │   │  (Express)  │   │   (WASM)    │           │
 * │  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘           │
 * │         │                 │                 │                   │
 * ├─────────┴─────────────────┴─────────────────┴───────────────────┤
 * │                    Kernel Boundary                              │
 * │  ┌─────────────────────────────────────────────────────────┐   │
 * │  │               Capability Enforcement                     │   │
 * │  │    validate()  │  create()  │  delegate()  │  revoke()  │   │
 * │  └─────────────────────────────────────────────────────────┘   │
 * │  ┌─────────────────────────────────────────────────────────┐   │
 * │  │                  IPC Message Bus                         │   │
 * │  │    publish()  │  subscribe()  │  request()  │  reply()  │   │
 * │  └─────────────────────────────────────────────────────────┘   │
 * │  ┌─────────────────────────────────────────────────────────┐   │
 * │  │                  Adapter Layer                           │   │
 * │  │    Repository  │  Transaction  │  AuditLog  │  Health   │   │
 * │  └─────────────────────────────────────────────────────────┘   │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                         Kernel                                  │
 * │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
 * │  │   Gleam     │   │   Drivers   │   │   Observe   │           │
 * │  │   Kernel    │   │ (Firebase)  │   │  (Logging)  │           │
 * │  └─────────────┘   └─────────────┘   └─────────────┘           │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Design Principles
 *
 * 1. **Explicitness**: Every protocol behavior is explicitly defined in type signatures
 * 2. **Determinism**: Identical inputs produce identical outputs across executions
 * 3. **Isolation**: Modules operate in isolated spaces with controlled communication
 * 4. **Fault Tolerance**: All failures are recoverable; no silent corruption
 * 5. **Auditability**: All state transitions are traceable and verifiable
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   // Capability types and helpers
 *   Capability,
 *   CapabilityValidator,
 *   readOnlyRights,
 *   readWriteRights,
 *
 *   // IPC types and helpers
 *   Message,
 *   MessageBus,
 *   createLocalMessageBus,
 *
 *   // Adapter types
 *   Repository,
 *   AdapterFactory,
 * } from '@esta/kernel-boundary';
 * ```
 *
 * @module @esta/kernel-boundary
 */

// ============================================================================
// CAPABILITY EXPORTS
// ============================================================================

export type {
  // Identifier types
  CapabilityId,
  ProcessId,
  TenantId,
  ResourceType,
  ResourceId,

  // Rights and validity
  CapabilityRights,
  TimeRestrictions,
  ProcessRestrictions,
  CapabilityValidity,
  CapabilityFlags,

  // Capability core
  CapabilityIssuer,
  AttenuationRecord,
  Capability,

  // Validation
  ValidationError,
  ValidationResult,

  // Interfaces
  CapabilityValidator,
  CapabilityIssuerService,
} from './capability.js';

export {
  // Zod schemas
  CapabilityIdSchema,
  ProcessIdSchema,
  TenantIdSchema,
  ResourceTypeSchema,
  ResourceIdSchema,
  CapabilityRightsSchema,
  TimeRestrictionsSchema,
  CapabilityValiditySchema,
  CapabilityFlagsSchema,
  CapabilityIssuerSchema,

  // Factory functions
  readOnlyRights,
  readWriteRights,
  fullAccessRights,
  executeOnlyRights,
  defaultCapabilityFlags,

  // Helper functions
  generateCapabilityId,
  capabilityIdEquals,
  capabilityIdToString,
  parseCapabilityId,
  attenuateRights,
  hasRequiredRights,
  getMissingRights,
} from './capability.js';

// ============================================================================
// IPC EXPORTS
// ============================================================================

export type {
  // Message identifiers
  MessageId,
  SequenceNumber,
  IdempotencyToken,

  // Timestamps
  Timestamp,
  Duration,

  // Trace context
  TraceId,
  SpanId,
  TraceFlags,
  TraceStateEntry,
  TraceContext,

  // Auth context
  Principal,
  AuthMethod,
  Action,
  IpcResourceType,
  Claim,
  AuthContext,

  // Payload and message types
  Payload,
  ResponseStatus,
  SystemMessageKind,
  MessageType,
  Transport,
  ChannelAddress,
  MessagePriority,
  Header,
  Message,

  // Message bus
  MessageHandler,
  MessageBus,
} from './ipc.js';

export {
  // Zod schemas
  MessageIdSchema,
  TimestampSchema,
  PrincipalSchema,

  // Trace context helpers
  emptyTraceContext,
  isValidTraceContext,

  // Auth context helpers
  anonymousAuthContext,
  systemAuthContext,

  // Message construction
  createMessage,
  createCommand,
  createQuery,
  createEvent,
  createOkResponse,
  createErrorResponse,

  // Message modifiers
  withCorrelationId,
  withReplyTo,
  withIdempotencyToken,
  withTTL,
  withPriority,
  withHeader,

  // Message ID helpers
  generateMessageId,
  messageIdEquals,
  messageIdToString,

  // Message bus
  createLocalMessageBus,

  // Timestamp helpers
  nowTimestamp,
  compareTimestamps,
  priorityToNumber,
} from './ipc.js';

// ============================================================================
// ADAPTER EXPORTS
// ============================================================================

export type {
  // Error types
  AdapterError,
  AdapterResult,

  // Query types
  FilterOperator,
  FilterCondition,
  SortDirection,
  SortSpec,
  QuerySpec,
  PaginatedResult,

  // Entity types
  EntityMetadata,

  // Repository interfaces
  Repository,
  RepositoryContext,
  TenantScopedRepository,

  // Specific repositories
  Employee,
  EmployeeCreateInput,
  EmployeeUpdateInput,
  EmployeeRepository,
  AccrualRecord,
  AccrualRecordCreateInput,
  AccrualRecordUpdateInput,
  AccrualRepository,
  AuditLogEntry,
  AuditLogCreateInput,
  AuditLogRepository,

  // Factory interfaces
  AdapterFactory,

  // Transaction types
  IsolationLevel,
  TransactionOptions,
  Transaction,
  TransactionalAdapterFactory,

  // Health check types
  HealthStatus,
  HealthCheckResult,
  HealthCheckable,

  // Testing types
  InMemoryStorage,
} from './adapter.js';

export {
  // Result helpers
  ok,
  err,
  mapResult,
  flatMapResult,

  // Entity helpers
  withMetadata,

  // Testing helpers
  createInMemoryRepository,
} from './adapter.js';
