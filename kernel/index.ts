/**
 * ESTA-Logic Microkernel
 *
 * WASM-native application OS with deterministic process scheduling,
 * capability-based security, and message-passing IPC.
 *
 * The kernel is the conductor - all modules are instruments that play under its direction.
 *
 * ## Architecture
 *
 * - **core**: Scheduler, IPC Router, Capability Engine
 * - **abi**: WASM ABI definitions and message schemas
 * - **loader**: Module loading and lifecycle management
 * - **syscalls**: Standardized system call interface
 * - **utils**: Common utility functions
 *
 * ## Key Principles
 *
 * 1. All inter-process communication goes through the kernel IPC router
 * 2. All resource access requires capability validation
 * 3. All host interactions go through syscalls
 * 4. Modules are isolated and hot-swappable
 * 5. Everything is deterministic and auditable
 *
 * @module kernel
 */

// Core kernel components
export * from './core';

// ABI types (with explicit exports to avoid conflicts)
export type {
  IPCMessage,
  MessageMetadata,
  TraceContext as AbiTraceContext,
  AccrualCalculateRequest,
  AccrualCalculateResult,
  CarryoverCalculateRequest,
  CarryoverCalculateResult,
  ComplianceCheckRequest,
  ComplianceCheckResult,
  ComplianceViolation,
  ComplianceWarning,
  EmployeeData,
  SickTimeBalanceQuery,
  SickTimeBalanceResponse,
  AuditEvent,
  HealthCheckRequest,
  HealthCheckResponse,
  Opcode,
} from './abi';
export {
  OPCODES,
  generateMessageId as generateAbiMessageId,
  createIPCMessage,
  validateMessage,
  isValidMessage,
} from './abi';

// Loader
export * from './loader';

// Syscalls (with explicit exports to avoid conflicts)
export type {
  SyscallResult,
  SyscallError,
  SyscallContext,
  SyscallRequest,
} from './syscalls';
export {
  getSyscallName,
  getRequiredCapability,
  ok as syscallOk,
  err as syscallErr,
  permissionDenied,
  invalidArgument,
  notFound,
  timeout,
  ioError,
} from './syscalls';

// Utils (with explicit exports to avoid conflicts)
export type { Result, Option, RetryConfig } from './utils';
export {
  ok as resultOk,
  err as resultErr,
  mapResult,
  flatMapResult,
  unwrap,
  unwrapOr,
  some,
  none,
  mapOption,
  unwrapOption,
  unwrapOptionOr,
  generateId,
  generateUUID,
  generateShortId,
  nowMs,
  nowNanos,
  formatDuration,
  parseISODate,
  formatISODate,
  isNonEmptyString,
  isPositiveInteger,
  isNonNegativeInteger,
  isValidEmail,
  isValidSemver,
  groupBy,
  partition,
  uniqueBy,
  sortBy,
  compareByNumber,
  compareByString,
  defaultRetryConfig,
  calculateRetryDelay,
  sleep,
  retry,
  deepClone,
  deepMerge,
  assert,
  assertDefined,
  assertString,
  assertNumber,
  KernelError,
  PermissionDeniedError,
  NotFoundError,
  ValidationError as UtilsValidationError,
  TimeoutError,
} from './utils';

// Re-export key types for convenience
export type {
  ProcessId,
  Priority,
  ProcessState,
  SchedulerState,
  SchedulingDecision,
} from './core/scheduler';

export type {
  Message,
  MessageId,
  MessageType,
  MessagePriority,
  RouterState,
  RouteResult,
} from './core/ipc-router';

export type {
  Capability,
  CapabilityId,
  CapabilityRights,
  ResourceId,
  ResourceType,
  ValidationResult,
  EngineState,
} from './core/capability-engine';

export type {
  ModuleManifest,
  LoadedModule,
  LoaderState,
  LoadResult,
} from './loader/module-loader';
