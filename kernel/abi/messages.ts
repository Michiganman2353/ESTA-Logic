/**
 * ESTA-Logic Microkernel ABI - Message Schema
 *
 * Canonical message schema for all IPC communication.
 * This is the single source of truth for message format.
 *
 * @module kernel/abi/messages
 */

// ============================================================================
// SECTION 1: CORE IPC MESSAGE SCHEMA
// ============================================================================

/**
 * Canonical IPC Message Schema
 *
 * All messages in the ESTA-Logic kernel follow this exact format.
 * No deviations are allowed - this ensures deterministic routing
 * and validation at kernel boundaries.
 */
export interface IPCMessage<T = unknown> {
  /** Message type classification */
  readonly type: 'Event' | 'Command' | 'Response' | 'Query' | 'System';

  /** Source module identifier */
  readonly source: string;

  /** Target module or 'kernel' for kernel operations */
  readonly target: string | 'kernel';

  /** Operation code - determines message handling */
  readonly opcode: string;

  /** Message payload - type varies by opcode */
  readonly payload: T;

  /** Message metadata */
  readonly metadata: MessageMetadata;
}

/** Message metadata */
export interface MessageMetadata {
  /** Unique message identifier */
  readonly messageId: string;

  /** Correlation ID for request/response tracking */
  readonly correlationId?: string;

  /** Timestamp (ISO 8601) */
  readonly timestamp: string;

  /** Message priority */
  readonly priority: 'background' | 'low' | 'normal' | 'high' | 'critical';

  /** Time-to-live in milliseconds */
  readonly ttlMs?: number;

  /** Trace context for distributed tracing */
  readonly trace?: TraceContext;

  /** Schema version for compatibility */
  readonly schemaVersion: number;
}

/** Trace context for observability */
export interface TraceContext {
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId?: string;
  readonly sampled: boolean;
}

// ============================================================================
// SECTION 2: ACCRUAL ENGINE MESSAGES
// ============================================================================

/** Accrual calculation request */
export interface AccrualCalculateRequest {
  readonly employeeId: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly hoursWorked: number;
  readonly employerSize: 'small' | 'large';
  readonly existingBalance: number;
  readonly carryoverFromPreviousYear: number;
}

/** Accrual calculation result */
export interface AccrualCalculateResult {
  readonly employeeId: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly hoursAccrued: number;
  readonly newBalance: number;
  readonly maxBalance: number;
  readonly isAtMax: boolean;
  readonly calculation: {
    readonly accrualRate: number;
    readonly hoursWorked: number;
    readonly rawAccrual: number;
    readonly appliedAccrual: number;
  };
}

/** Carryover calculation request */
export interface CarryoverCalculateRequest {
  readonly employeeId: string;
  readonly yearEndBalance: number;
  readonly employerSize: 'small' | 'large';
  readonly yearEndDate: string;
}

/** Carryover calculation result */
export interface CarryoverCalculateResult {
  readonly employeeId: string;
  readonly yearEndBalance: number;
  readonly carryoverAmount: number;
  readonly forfeitedAmount: number;
  readonly newYearStartBalance: number;
}

// ============================================================================
// SECTION 3: COMPLIANCE ENGINE MESSAGES
// ============================================================================

/** Compliance check request */
export interface ComplianceCheckRequest {
  readonly tenantId: string;
  readonly employeeId: string;
  readonly action: 'usage' | 'accrual' | 'carryover' | 'balance_inquiry';
  readonly data: Record<string, unknown>;
}

/** Compliance check result */
export interface ComplianceCheckResult {
  readonly compliant: boolean;
  readonly violations: readonly ComplianceViolation[];
  readonly warnings: readonly ComplianceWarning[];
  readonly auditTrail: string;
}

/** Compliance violation */
export interface ComplianceViolation {
  readonly code: string;
  readonly rule: string;
  readonly message: string;
  readonly severity: 'error' | 'critical';
  readonly remediation?: string;
}

/** Compliance warning */
export interface ComplianceWarning {
  readonly code: string;
  readonly rule: string;
  readonly message: string;
  readonly suggestion?: string;
}

// ============================================================================
// SECTION 4: EMPLOYEE MANAGEMENT MESSAGES
// ============================================================================

/** Employee create request */
export interface EmployeeCreateRequest {
  readonly tenantId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly startDate: string;
  readonly employmentType: 'full_time' | 'part_time' | 'seasonal';
}

/** Employee data */
export interface EmployeeData {
  readonly id: string;
  readonly tenantId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly startDate: string;
  readonly employmentType: 'full_time' | 'part_time' | 'seasonal';
  readonly status: 'active' | 'inactive' | 'terminated';
  readonly sickTimeBalance: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Employee update request */
export interface EmployeeUpdateRequest {
  readonly id: string;
  readonly updates: Partial<
    Omit<EmployeeData, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  >;
}

/** Employee query request */
export interface EmployeeQueryRequest {
  readonly tenantId: string;
  readonly status?: 'active' | 'inactive' | 'terminated';
  readonly limit?: number;
  readonly offset?: number;
}

// ============================================================================
// SECTION 5: TIME TRACKING MESSAGES
// ============================================================================

/** Time entry create request */
export interface TimeEntryCreateRequest {
  readonly employeeId: string;
  readonly date: string;
  readonly hoursWorked: number;
  readonly type: 'regular' | 'overtime' | 'sick_time' | 'vacation';
  readonly notes?: string;
}

/** Time entry data */
export interface TimeEntryData {
  readonly id: string;
  readonly employeeId: string;
  readonly date: string;
  readonly hoursWorked: number;
  readonly type: 'regular' | 'overtime' | 'sick_time' | 'vacation';
  readonly notes?: string;
  readonly approvedBy?: string;
  readonly approvedAt?: string;
  readonly createdAt: string;
}

/** Time summary request */
export interface TimeSummaryRequest {
  readonly employeeId: string;
  readonly periodStart: string;
  readonly periodEnd: string;
}

/** Time summary response */
export interface TimeSummaryResponse {
  readonly employeeId: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly totalHoursWorked: number;
  readonly regularHours: number;
  readonly overtimeHours: number;
  readonly sickTimeUsed: number;
  readonly vacationUsed: number;
}

// ============================================================================
// SECTION 6: SICK TIME USAGE MESSAGES
// ============================================================================

/** Sick time usage request */
export interface SickTimeUsageRequest {
  readonly employeeId: string;
  readonly date: string;
  readonly hours: number;
  readonly reason:
    | 'personal_illness'
    | 'family_care'
    | 'medical_appointment'
    | 'other';
  readonly notes?: string;
}

/** Sick time usage result */
export interface SickTimeUsageResult {
  readonly approved: boolean;
  readonly usageId?: string;
  readonly remainingBalance: number;
  readonly denialReason?: string;
}

/** Sick time balance query */
export interface SickTimeBalanceQuery {
  readonly employeeId: string;
  readonly asOfDate?: string;
}

/** Sick time balance response */
export interface SickTimeBalanceResponse {
  readonly employeeId: string;
  readonly currentBalance: number;
  readonly usedThisYear: number;
  readonly accruedThisYear: number;
  readonly carryoverFromLastYear: number;
  readonly maxAllowed: number;
  readonly asOfDate: string;
}

// ============================================================================
// SECTION 7: AUDIT MESSAGES
// ============================================================================

/** Audit event */
export interface AuditEvent {
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly actorId: string;
  readonly actorType: 'user' | 'service' | 'system';
  readonly details: Record<string, unknown>;
  readonly outcome: 'success' | 'failure';
  readonly timestamp: string;
}

/** Audit query request */
export interface AuditQueryRequest {
  readonly tenantId: string;
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly actorId?: string;
  readonly action?: string;
  readonly startTime?: string;
  readonly endTime?: string;
  readonly limit?: number;
  readonly offset?: number;
}

/** Audit query response */
export interface AuditQueryResponse {
  readonly events: readonly AuditEvent[];
  readonly totalCount: number;
  readonly hasMore: boolean;
}

// ============================================================================
// SECTION 8: SYSTEM MESSAGES
// ============================================================================

/** Health check request */
export interface HealthCheckRequest {
  readonly checkType: 'shallow' | 'deep';
  readonly components?: readonly string[];
}

/** Health check response */
export interface HealthCheckResponse {
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly components: Record<string, ComponentHealth>;
  readonly timestamp: string;
  readonly version: string;
}

/** Component health */
export interface ComponentHealth {
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly latencyMs?: number;
  readonly lastCheck: string;
  readonly details?: string;
}

/** Module status request */
export interface ModuleStatusRequest {
  readonly moduleId?: string;
}

/** Module status response */
export interface ModuleStatusResponse {
  readonly modules: readonly ModuleInfo[];
}

/** Module info */
export interface ModuleInfo {
  readonly moduleId: string;
  readonly version: string;
  readonly state: 'running' | 'suspended' | 'stopped' | 'failed';
  readonly processId: number;
  readonly memoryUsageBytes: number;
  readonly messageQueueDepth: number;
  readonly uptime: number;
}

// ============================================================================
// SECTION 9: OPCODE REGISTRY
// ============================================================================

/** All registered opcodes */
export const OPCODES = {
  // Accrual engine
  'accrual.calculate': 'accrual.calculate',
  'accrual.carryover': 'accrual.carryover',
  'accrual.balance': 'accrual.balance',

  // Compliance engine
  'compliance.check': 'compliance.check',
  'compliance.validate': 'compliance.validate',

  // Employee management
  'employee.create': 'employee.create',
  'employee.update': 'employee.update',
  'employee.get': 'employee.get',
  'employee.list': 'employee.list',
  'employee.delete': 'employee.delete',

  // Time tracking
  'time.entry.create': 'time.entry.create',
  'time.entry.update': 'time.entry.update',
  'time.entry.delete': 'time.entry.delete',
  'time.summary': 'time.summary',

  // Sick time
  'sicktime.use': 'sicktime.use',
  'sicktime.balance': 'sicktime.balance',
  'sicktime.history': 'sicktime.history',

  // Audit
  'audit.log': 'audit.log',
  'audit.query': 'audit.query',

  // System
  'sys.health': 'sys.health',
  'sys.status': 'sys.status',
  'sys.ping': 'sys.ping',
  'sys.shutdown': 'sys.shutdown',
} as const;

export type Opcode = (typeof OPCODES)[keyof typeof OPCODES];

// ============================================================================
// SECTION 10: MESSAGE FACTORY
// ============================================================================

/** Generate unique message ID */
export function generateMessageId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

/** Create a new IPC message */
export function createIPCMessage<T>(
  type: IPCMessage['type'],
  source: string,
  target: string | 'kernel',
  opcode: string,
  payload: T,
  options: {
    correlationId?: string;
    priority?: MessageMetadata['priority'];
    ttlMs?: number;
    trace?: TraceContext;
  } = {}
): IPCMessage<T> {
  return {
    type,
    source,
    target,
    opcode,
    payload,
    metadata: {
      messageId: generateMessageId(),
      correlationId: options.correlationId,
      timestamp: new Date().toISOString(),
      priority: options.priority ?? 'normal',
      ttlMs: options.ttlMs,
      trace: options.trace,
      schemaVersion: 1,
    },
  };
}

/** Create command message */
export function createCommand<T>(
  source: string,
  target: string | 'kernel',
  opcode: string,
  payload: T,
  options?: Parameters<typeof createIPCMessage>[5]
): IPCMessage<T> {
  return createIPCMessage('Command', source, target, opcode, payload, options);
}

/** Create query message */
export function createQuery<T>(
  source: string,
  target: string | 'kernel',
  opcode: string,
  payload: T,
  options?: Parameters<typeof createIPCMessage>[5]
): IPCMessage<T> {
  return createIPCMessage('Query', source, target, opcode, payload, options);
}

/** Create event message */
export function createEvent<T>(
  source: string,
  target: string | 'kernel',
  opcode: string,
  payload: T,
  options?: Parameters<typeof createIPCMessage>[5]
): IPCMessage<T> {
  return createIPCMessage('Event', source, target, opcode, payload, options);
}

/** Create response message */
export function createResponse<T>(
  source: string,
  target: string,
  opcode: string,
  payload: T,
  correlationId: string,
  options?: Omit<Parameters<typeof createIPCMessage>[5], 'correlationId'>
): IPCMessage<T> {
  return createIPCMessage('Response', source, target, opcode, payload, {
    ...options,
    correlationId,
  });
}

// ============================================================================
// SECTION 11: MESSAGE VALIDATION
// ============================================================================

/** Validation error */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

/** Validate an IPC message */
export function validateMessage(message: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!message || typeof message !== 'object') {
    return [
      {
        field: 'root',
        message: 'Message must be an object',
        code: 'INVALID_TYPE',
      },
    ];
  }

  const msg = message as Record<string, unknown>;

  // Validate type
  if (
    !['Event', 'Command', 'Response', 'Query', 'System'].includes(
      msg.type as string
    )
  ) {
    errors.push({
      field: 'type',
      message: 'Invalid message type',
      code: 'INVALID_MESSAGE_TYPE',
    });
  }

  // Validate source
  if (typeof msg.source !== 'string' || msg.source.length === 0) {
    errors.push({
      field: 'source',
      message: 'Source must be a non-empty string',
      code: 'INVALID_SOURCE',
    });
  }

  // Validate target
  if (typeof msg.target !== 'string' || msg.target.length === 0) {
    errors.push({
      field: 'target',
      message: 'Target must be a non-empty string',
      code: 'INVALID_TARGET',
    });
  }

  // Validate opcode
  if (typeof msg.opcode !== 'string' || msg.opcode.length === 0) {
    errors.push({
      field: 'opcode',
      message: 'Opcode must be a non-empty string',
      code: 'INVALID_OPCODE',
    });
  }

  // Validate metadata
  if (!msg.metadata || typeof msg.metadata !== 'object') {
    errors.push({
      field: 'metadata',
      message: 'Metadata must be an object',
      code: 'INVALID_METADATA',
    });
  } else {
    const meta = msg.metadata as Record<string, unknown>;

    if (typeof meta.messageId !== 'string') {
      errors.push({
        field: 'metadata.messageId',
        message: 'Message ID must be a string',
        code: 'INVALID_MESSAGE_ID',
      });
    }

    if (typeof meta.timestamp !== 'string') {
      errors.push({
        field: 'metadata.timestamp',
        message: 'Timestamp must be a string',
        code: 'INVALID_TIMESTAMP',
      });
    }

    if (typeof meta.schemaVersion !== 'number') {
      errors.push({
        field: 'metadata.schemaVersion',
        message: 'Schema version must be a number',
        code: 'INVALID_SCHEMA_VERSION',
      });
    }
  }

  return errors;
}

/** Check if message is valid */
export function isValidMessage(message: unknown): message is IPCMessage {
  return validateMessage(message).length === 0;
}
