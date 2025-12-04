/**
 * ESTA-Logic Microkernel Syscall Interface
 *
 * Standardized system call interface for all host interactions.
 * Modules NEVER talk directly to the host - only through these syscalls.
 *
 * @module kernel/syscalls
 */

import type { ProcessId } from '../core/scheduler';
import type { CapabilityId, ResourceType } from '../core/capability-engine';
import type { TraceContext, AuthContext } from '../core/ipc-router';

// ============================================================================
// SECTION 1: SYSCALL TYPES
// ============================================================================

/** Syscall result - either success or error */
export type SyscallResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: SyscallError };

/** Syscall error types */
export type SyscallError =
  | { type: 'permission_denied'; required: string }
  | { type: 'invalid_argument'; argument: string; reason: string }
  | { type: 'not_found'; resource: string }
  | { type: 'already_exists'; resource: string }
  | { type: 'quota_exceeded'; resource: string; limit: number }
  | { type: 'timeout'; operation: string }
  | { type: 'io_error'; message: string }
  | { type: 'not_supported'; operation: string }
  | { type: 'internal_error'; message: string };

/** Syscall request metadata */
export interface SyscallContext {
  readonly caller: ProcessId;
  readonly capabilityId: CapabilityId;
  readonly traceContext: TraceContext;
  readonly authContext: AuthContext;
  readonly timestamp: number;
}

// ============================================================================
// SECTION 2: FILE SYSTEM SYSCALLS (sys.fs.*)
// ============================================================================

/** File system read request */
export interface FsReadRequest {
  readonly syscall: 'sys.fs.read';
  readonly path: string;
  readonly offset?: number;
  readonly length?: number;
}

/** File system write request */
export interface FsWriteRequest {
  readonly syscall: 'sys.fs.write';
  readonly path: string;
  readonly data: Uint8Array;
  readonly offset?: number;
  readonly append?: boolean;
}

/** File system delete request */
export interface FsDeleteRequest {
  readonly syscall: 'sys.fs.delete';
  readonly path: string;
  readonly recursive?: boolean;
}

/** File system list request */
export interface FsListRequest {
  readonly syscall: 'sys.fs.list';
  readonly path: string;
  readonly recursive?: boolean;
}

/** File system stat request */
export interface FsStatRequest {
  readonly syscall: 'sys.fs.stat';
  readonly path: string;
}

/** File metadata */
export interface FileStat {
  readonly path: string;
  readonly size: number;
  readonly isDirectory: boolean;
  readonly createdAt: number;
  readonly modifiedAt: number;
  readonly permissions: FilePermissions;
}

/** File permissions */
export interface FilePermissions {
  readonly readable: boolean;
  readonly writable: boolean;
  readonly executable: boolean;
}

/** Directory entry */
export interface DirectoryEntry {
  readonly name: string;
  readonly path: string;
  readonly isDirectory: boolean;
  readonly size: number;
}

// ============================================================================
// SECTION 3: NETWORK SYSCALLS (sys.net.*)
// ============================================================================

/** Network fetch request */
export interface NetFetchRequest {
  readonly syscall: 'sys.net.fetch';
  readonly url: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly headers?: Record<string, string>;
  readonly body?: Uint8Array;
  readonly timeoutMs?: number;
}

/** Network response */
export interface NetResponse {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  readonly body: Uint8Array;
}

/** Network socket open request */
export interface NetSocketOpenRequest {
  readonly syscall: 'sys.net.socket.open';
  readonly host: string;
  readonly port: number;
  readonly protocol: 'tcp' | 'udp';
}

/** Socket handle */
export interface SocketHandle {
  readonly socketId: number;
  readonly host: string;
  readonly port: number;
  readonly protocol: 'tcp' | 'udp';
}

/** Network socket send request */
export interface NetSocketSendRequest {
  readonly syscall: 'sys.net.socket.send';
  readonly socketId: number;
  readonly data: Uint8Array;
}

/** Network socket receive request */
export interface NetSocketReceiveRequest {
  readonly syscall: 'sys.net.socket.receive';
  readonly socketId: number;
  readonly maxBytes: number;
  readonly timeoutMs?: number;
}

/** Network socket close request */
export interface NetSocketCloseRequest {
  readonly syscall: 'sys.net.socket.close';
  readonly socketId: number;
}

// ============================================================================
// SECTION 4: TIME SYSCALLS (sys.time.*)
// ============================================================================

/** Get current time request */
export interface TimeNowRequest {
  readonly syscall: 'sys.time.now';
}

/** Time result */
export interface TimeResult {
  readonly timestampMs: number;
  readonly timestampNanos: number;
  readonly timezone: string;
}

/** Sleep request */
export interface TimeSleepRequest {
  readonly syscall: 'sys.time.sleep';
  readonly durationMs: number;
}

/** Timer create request */
export interface TimerCreateRequest {
  readonly syscall: 'sys.time.timer.create';
  readonly durationMs: number;
  readonly repeat: boolean;
}

/** Timer handle */
export interface TimerHandle {
  readonly timerId: number;
  readonly durationMs: number;
  readonly repeat: boolean;
  readonly createdAt: number;
}

/** Timer cancel request */
export interface TimerCancelRequest {
  readonly syscall: 'sys.time.timer.cancel';
  readonly timerId: number;
}

// ============================================================================
// SECTION 5: DATABASE SYSCALLS (sys.db.*)
// ============================================================================

/** Database read request */
export interface DbReadRequest {
  readonly syscall: 'sys.db.read';
  readonly collection: string;
  readonly documentId: string;
}

/** Database write request */
export interface DbWriteRequest {
  readonly syscall: 'sys.db.write';
  readonly collection: string;
  readonly documentId: string;
  readonly data: Record<string, unknown>;
  readonly merge?: boolean;
}

/** Database delete request */
export interface DbDeleteRequest {
  readonly syscall: 'sys.db.delete';
  readonly collection: string;
  readonly documentId: string;
}

/** Database query request */
export interface DbQueryRequest {
  readonly syscall: 'sys.db.query';
  readonly collection: string;
  readonly filters: readonly DbFilter[];
  readonly orderBy?: DbOrderBy;
  readonly limit?: number;
  readonly offset?: number;
}

/** Database filter */
export interface DbFilter {
  readonly field: string;
  readonly operator:
    | 'eq'
    | 'neq'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'in'
    | 'not_in'
    | 'contains';
  readonly value: unknown;
}

/** Database ordering */
export interface DbOrderBy {
  readonly field: string;
  readonly direction: 'asc' | 'desc';
}

/** Database query result */
export interface DbQueryResult {
  readonly documents: readonly DbDocument[];
  readonly totalCount: number;
  readonly hasMore: boolean;
}

/** Database document */
export interface DbDocument {
  readonly id: string;
  readonly data: Record<string, unknown>;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly version: number;
}

/** Database transaction request */
export interface DbTransactRequest {
  readonly syscall: 'sys.db.transact';
  readonly operations: readonly DbOperation[];
}

/** Database operation in transaction */
export type DbOperation =
  | { type: 'read'; collection: string; documentId: string }
  | {
      type: 'write';
      collection: string;
      documentId: string;
      data: Record<string, unknown>;
    }
  | { type: 'delete'; collection: string; documentId: string };

/** Transaction result */
export interface DbTransactResult {
  readonly success: boolean;
  readonly results: readonly (DbDocument | null)[];
}

// ============================================================================
// SECTION 6: CRYPTO SYSCALLS (sys.crypto.*)
// ============================================================================

/** Random bytes request */
export interface CryptoRandomRequest {
  readonly syscall: 'sys.crypto.random';
  readonly length: number;
}

/** Hash request */
export interface CryptoHashRequest {
  readonly syscall: 'sys.crypto.hash';
  readonly algorithm: 'sha256' | 'sha384' | 'sha512';
  readonly data: Uint8Array;
}

/** Sign request */
export interface CryptoSignRequest {
  readonly syscall: 'sys.crypto.sign';
  readonly algorithm: 'hmac-sha256' | 'rsa-pss' | 'ecdsa';
  readonly data: Uint8Array;
  readonly keyId: string;
}

/** Verify request */
export interface CryptoVerifyRequest {
  readonly syscall: 'sys.crypto.verify';
  readonly algorithm: 'hmac-sha256' | 'rsa-pss' | 'ecdsa';
  readonly data: Uint8Array;
  readonly signature: Uint8Array;
  readonly keyId: string;
}

/** Encrypt request */
export interface CryptoEncryptRequest {
  readonly syscall: 'sys.crypto.encrypt';
  readonly algorithm: 'aes-gcm' | 'chacha20-poly1305';
  readonly data: Uint8Array;
  readonly keyId: string;
}

/** Decrypt request */
export interface CryptoDecryptRequest {
  readonly syscall: 'sys.crypto.decrypt';
  readonly algorithm: 'aes-gcm' | 'chacha20-poly1305';
  readonly ciphertext: Uint8Array;
  readonly keyId: string;
}

// ============================================================================
// SECTION 7: AUDIT SYSCALLS (sys.audit.*)
// ============================================================================

/** Audit log request */
export interface AuditLogRequest {
  readonly syscall: 'sys.audit.log';
  readonly action: string;
  readonly resourceType: ResourceType;
  readonly resourceId: string;
  readonly details: Record<string, unknown>;
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
}

/** Audit query request */
export interface AuditQueryRequest {
  readonly syscall: 'sys.audit.query';
  readonly filters: {
    readonly action?: string;
    readonly resourceType?: ResourceType;
    readonly resourceId?: string;
    readonly startTime?: number;
    readonly endTime?: number;
    readonly severity?: 'info' | 'warning' | 'error' | 'critical';
  };
  readonly limit?: number;
  readonly offset?: number;
}

/** Audit entry */
export interface AuditEntry {
  readonly id: string;
  readonly action: string;
  readonly resourceType: ResourceType;
  readonly resourceId: string;
  readonly callerId: ProcessId;
  readonly tenantId: string;
  readonly timestamp: number;
  readonly details: Record<string, unknown>;
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  readonly traceId: string;
}

// ============================================================================
// SECTION 8: PROCESS SYSCALLS (sys.proc.*)
// ============================================================================

/** Spawn process request */
export interface ProcSpawnRequest {
  readonly syscall: 'sys.proc.spawn';
  readonly moduleId: string;
  readonly args: readonly string[];
  readonly priority?: 'idle' | 'low' | 'normal' | 'high';
}

/** Exit process request */
export interface ProcExitRequest {
  readonly syscall: 'sys.proc.exit';
  readonly code: number;
  readonly reason?: string;
}

/** Get process info request */
export interface ProcInfoRequest {
  readonly syscall: 'sys.proc.info';
  readonly pid?: ProcessId;
}

/** Process info */
export interface ProcessInfo {
  readonly pid: ProcessId;
  readonly moduleId: string;
  readonly state: 'running' | 'blocked' | 'suspended';
  readonly priority: string;
  readonly cpuTimeMs: number;
  readonly memoryBytes: number;
  readonly messageQueueDepth: number;
  readonly startedAt: number;
}

/** Kill process request */
export interface ProcKillRequest {
  readonly syscall: 'sys.proc.kill';
  readonly pid: ProcessId;
  readonly signal: 'term' | 'kill';
}

// ============================================================================
// SECTION 9: NOTIFICATION SYSCALLS (sys.notify.*)
// ============================================================================

/** Send notification request */
export interface NotifySendRequest {
  readonly syscall: 'sys.notify.send';
  readonly type: 'push' | 'email' | 'sms';
  readonly recipient: string;
  readonly title: string;
  readonly body: string;
  readonly data?: Record<string, unknown>;
}

/** Notification result */
export interface NotifyResult {
  readonly id: string;
  readonly sent: boolean;
  readonly timestamp: number;
}

// ============================================================================
// SECTION 10: UNIFIED SYSCALL TYPE
// ============================================================================

/** All syscall request types */
export type SyscallRequest =
  // File system
  | FsReadRequest
  | FsWriteRequest
  | FsDeleteRequest
  | FsListRequest
  | FsStatRequest
  // Network
  | NetFetchRequest
  | NetSocketOpenRequest
  | NetSocketSendRequest
  | NetSocketReceiveRequest
  | NetSocketCloseRequest
  // Time
  | TimeNowRequest
  | TimeSleepRequest
  | TimerCreateRequest
  | TimerCancelRequest
  // Database
  | DbReadRequest
  | DbWriteRequest
  | DbDeleteRequest
  | DbQueryRequest
  | DbTransactRequest
  // Crypto
  | CryptoRandomRequest
  | CryptoHashRequest
  | CryptoSignRequest
  | CryptoVerifyRequest
  | CryptoEncryptRequest
  | CryptoDecryptRequest
  // Audit
  | AuditLogRequest
  | AuditQueryRequest
  // Process
  | ProcSpawnRequest
  | ProcExitRequest
  | ProcInfoRequest
  | ProcKillRequest
  // Notification
  | NotifySendRequest;

/** Get syscall name from request */
export function getSyscallName(request: SyscallRequest): string {
  return request.syscall;
}

/** Get required capability type for syscall */
export function getRequiredCapability(request: SyscallRequest): {
  resourceType: ResourceType;
  rights: { read?: boolean; write?: boolean; execute?: boolean };
} {
  const syscall = request.syscall;

  if (syscall.startsWith('sys.fs.')) {
    return {
      resourceType: 'file',
      rights: {
        read:
          syscall === 'sys.fs.read' ||
          syscall === 'sys.fs.list' ||
          syscall === 'sys.fs.stat',
        write: syscall === 'sys.fs.write',
        execute: syscall === 'sys.fs.delete',
      },
    };
  }

  if (syscall.startsWith('sys.net.')) {
    return {
      resourceType: 'network',
      rights: {
        read: syscall.includes('receive') || syscall === 'sys.net.fetch',
        write: syscall.includes('send') || syscall === 'sys.net.fetch',
        execute: syscall.includes('open') || syscall.includes('close'),
      },
    };
  }

  if (syscall.startsWith('sys.db.')) {
    return {
      resourceType: 'database',
      rights: {
        read: syscall === 'sys.db.read' || syscall === 'sys.db.query',
        write: syscall === 'sys.db.write' || syscall === 'sys.db.transact',
        execute: syscall === 'sys.db.delete',
      },
    };
  }

  if (syscall.startsWith('sys.audit.')) {
    return {
      resourceType: 'audit_log',
      rights: {
        read: syscall === 'sys.audit.query',
        write: syscall === 'sys.audit.log',
      },
    };
  }

  if (syscall.startsWith('sys.proc.')) {
    return {
      resourceType: 'process',
      rights: {
        read: syscall === 'sys.proc.info',
        execute: syscall === 'sys.proc.spawn' || syscall === 'sys.proc.kill',
      },
    };
  }

  // Default
  return {
    resourceType: 'device',
    rights: { read: true },
  };
}

// ============================================================================
// SECTION 11: HELPER FUNCTIONS
// ============================================================================

/** Create success result */
export function ok<T>(value: T): SyscallResult<T> {
  return { ok: true, value };
}

/** Create error result */
export function err<T>(error: SyscallError): SyscallResult<T> {
  return { ok: false, error };
}

/** Create permission denied error */
export function permissionDenied(required: string): SyscallError {
  return { type: 'permission_denied', required };
}

/** Create invalid argument error */
export function invalidArgument(
  argument: string,
  reason: string
): SyscallError {
  return { type: 'invalid_argument', argument, reason };
}

/** Create not found error */
export function notFound(resource: string): SyscallError {
  return { type: 'not_found', resource };
}

/** Create timeout error */
export function timeout(operation: string): SyscallError {
  return { type: 'timeout', operation };
}

/** Create IO error */
export function ioError(message: string): SyscallError {
  return { type: 'io_error', message };
}
