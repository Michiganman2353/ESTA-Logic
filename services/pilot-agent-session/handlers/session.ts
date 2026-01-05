/**
 * ESTA-Logic Pilot Agent Session - Message Handlers
 *
 * Orchestrates end-to-end compliance workflows by coordinating between
 * multiple ESTA logic services through kernel IPC messaging.
 *
 * Session Workflow:
 * 1. Initialize session with employee and employer data
 * 2. Calculate sick time accrual via accrual-engine
 * 3. Validate compliance via compliance-engine
 * 4. Generate comprehensive audit trail
 * 5. Return unified session result
 *
 * All state is passed via IPC messages - no shared state or direct imports.
 *
 * @module services/pilot-agent-session/handlers
 */

import type { IPCMessage } from '../../../kernel/abi/messages';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Session initialization request
 */
export interface SessionStartRequest {
  sessionId: string;
  employeeId: string;
  employerId: string;
  employerSize: 'small' | 'large';
  periodStart: string; // ISO 8601 date
  periodEnd: string; // ISO 8601 date
  hoursWorked: number;
  existingBalance: number;
  carryoverFromPreviousYear: number;
  requestedUsageHours?: number;
  usageNoticeProvided?: boolean;
  usageIsForeseeable?: boolean;
}

/**
 * Session execution result
 */
export interface SessionResult {
  sessionId: string;
  employeeId: string;
  status: 'success' | 'partial' | 'failed';
  steps: SessionStep[];
  accrualResult?: {
    hoursAccrued: number;
    newBalance: number;
    maxBalance: number;
    isAtMax: boolean;
  };
  complianceResult?: {
    compliant: boolean;
    violations: ReadonlyArray<{
      code: string;
      rule: string;
      message: string;
    }>;
    warnings: ReadonlyArray<{
      code: string;
      rule: string;
      message: string;
    }>;
  };
  summary: string;
  timestamp: string;
  durationMs: number;
}

/**
 * Individual session step tracking
 */
export interface SessionStep {
  stepNumber: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  durationMs?: number;
  error?: string;
  result?: unknown;
}

/**
 * Session state for orchestration
 */
export interface SessionState {
  sessionId: string;
  request: SessionStartRequest;
  steps: SessionStep[];
  startTime: number;
  currentStep: number;
}

// ============================================================================
// SESSION ORCHESTRATION LOGIC
// ============================================================================

/**
 * Start a new pilot agent session
 *
 * Initializes the session and returns the session state for orchestration.
 * This is a pure function - creates initial state from the request.
 */
export function startSession(request: SessionStartRequest): SessionState {
  const now = Date.now();

  const steps: SessionStep[] = [
    {
      stepNumber: 1,
      name: 'Initialize Session',
      status: 'completed',
      startTime: new Date(now).toISOString(),
      endTime: new Date(now).toISOString(),
      durationMs: 0,
    },
    {
      stepNumber: 2,
      name: 'Calculate Accrual',
      status: 'pending',
    },
    {
      stepNumber: 3,
      name: 'Validate Compliance',
      status: 'pending',
    },
    {
      stepNumber: 4,
      name: 'Generate Audit Trail',
      status: 'pending',
    },
  ];

  return {
    sessionId: request.sessionId,
    request,
    steps,
    startTime: now,
    currentStep: 1,
  };
}

/**
 * Process accrual calculation step
 *
 * Creates an IPC message request for the accrual engine.
 * Returns both the message to send and the updated session state.
 */
export function prepareAccrualCalculation(
  state: SessionState
): {
  message: AccrualCalculateMessage;
  updatedState: SessionState;
} {
  const stepIndex = state.steps.findIndex((s) => s.name === 'Calculate Accrual');
  const updatedSteps = [...state.steps];
  
  if (stepIndex !== -1) {
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex]!,
      status: 'running',
      startTime: new Date().toISOString(),
    };
  }

  const message: AccrualCalculateMessage = {
    opcode: 'accrual.calculate',
    payload: {
      employeeId: state.request.employeeId,
      periodStart: state.request.periodStart,
      periodEnd: state.request.periodEnd,
      hoursWorked: state.request.hoursWorked,
      employerSize: state.request.employerSize,
      existingBalance: state.request.existingBalance,
      carryoverFromPreviousYear: state.request.carryoverFromPreviousYear,
    },
  };

  return {
    message,
    updatedState: {
      ...state,
      steps: updatedSteps,
      currentStep: 2,
    },
  };
}

/**
 * Process accrual calculation response
 *
 * Updates session state with accrual results.
 */
export function processAccrualResult(
  state: SessionState,
  result: AccrualCalculateResult
): SessionState {
  const stepIndex = state.steps.findIndex((s) => s.name === 'Calculate Accrual');
  const updatedSteps = [...state.steps];
  
  if (stepIndex !== -1 && updatedSteps[stepIndex]) {
    const startTime = updatedSteps[stepIndex]!.startTime;
    const endTime = new Date().toISOString();
    const durationMs = startTime 
      ? new Date(endTime).getTime() - new Date(startTime).getTime()
      : 0;

    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex]!,
      status: 'completed',
      endTime,
      durationMs,
      result,
    };
  }

  return {
    ...state,
    steps: updatedSteps,
    currentStep: 3,
  };
}

/**
 * Prepare compliance validation step
 *
 * Creates an IPC message request for the compliance engine.
 */
export function prepareComplianceCheck(
  state: SessionState,
  accrualResult: AccrualCalculateResult
): {
  message: ComplianceCheckMessage;
  updatedState: SessionState;
} {
  const stepIndex = state.steps.findIndex((s) => s.name === 'Validate Compliance');
  const updatedSteps = [...state.steps];
  
  if (stepIndex !== -1) {
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex]!,
      status: 'running',
      startTime: new Date().toISOString(),
    };
  }

  // Build compliance check request
  const message: ComplianceCheckMessage = {
    opcode: 'compliance.check',
    payload: {
      tenantId: state.request.employerId,
      employeeId: state.request.employeeId,
      action: 'accrual',
      data: {
        hoursAccrued: accrualResult.hoursAccrued,
        newBalance: accrualResult.newBalance,
        maxBalance: accrualResult.maxBalance,
        isAtMax: accrualResult.isAtMax,
        employerSize: state.request.employerSize,
      },
    },
  };

  return {
    message,
    updatedState: {
      ...state,
      steps: updatedSteps,
    },
  };
}

/**
 * Process compliance check response
 */
export function processComplianceResult(
  state: SessionState,
  result: any // Accept any compliance result to avoid type conflicts
): SessionState {
  const stepIndex = state.steps.findIndex((s) => s.name === 'Validate Compliance');
  const updatedSteps = [...state.steps];
  
  if (stepIndex !== -1 && updatedSteps[stepIndex]) {
    const startTime = updatedSteps[stepIndex]!.startTime;
    const endTime = new Date().toISOString();
    const durationMs = startTime
      ? new Date(endTime).getTime() - new Date(startTime).getTime()
      : 0;

    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex]!,
      status: 'completed',
      endTime,
      durationMs,
      result,
    };
  }

  return {
    ...state,
    steps: updatedSteps,
    currentStep: 4,
  };
}

/**
 * Generate final session result
 *
 * Creates a comprehensive result from the completed session state.
 */
export function finalizeSession(state: SessionState): SessionResult {
  const now = Date.now();
  const durationMs = now - state.startTime;

  // Extract results from steps
  const accrualStep = state.steps.find((s) => s.name === 'Calculate Accrual');
  const complianceStep = state.steps.find((s) => s.name === 'Validate Compliance');

  const accrualResult = accrualStep?.result as AccrualCalculateResult | undefined;
  const complianceResult = complianceStep?.result as ComplianceCheckResult | undefined;

  // Determine overall status
  const allCompleted = state.steps.every((s) => s.status === 'completed');
  const anyFailed = state.steps.some((s) => s.status === 'failed');
  const status = anyFailed ? 'failed' : allCompleted ? 'success' : 'partial';

  // Generate summary
  let summary = '';
  if (status === 'success' && accrualResult && complianceResult) {
    if (complianceResult.compliant) {
      summary = `Successfully processed employee ${state.request.employeeId}. ` +
        `Accrued ${accrualResult.hoursAccrued.toFixed(2)} hours, ` +
        `new balance: ${accrualResult.newBalance.toFixed(2)} hours. ` +
        `All compliance checks passed.`;
    } else {
      summary = `Processed employee ${state.request.employeeId} with compliance violations. ` +
        `${complianceResult.violations.length} violation(s) found.`;
    }
  } else if (status === 'failed') {
    const failedStep = state.steps.find((s) => s.status === 'failed');
    summary = `Session failed at step: ${failedStep?.name ?? 'unknown'}`;
  } else {
    summary = `Session partially completed`;
  }

  return {
    sessionId: state.sessionId,
    employeeId: state.request.employeeId,
    status,
    steps: state.steps,
    accrualResult: accrualResult ? {
      hoursAccrued: accrualResult.hoursAccrued,
      newBalance: accrualResult.newBalance,
      maxBalance: accrualResult.maxBalance,
      isAtMax: accrualResult.isAtMax,
    } : undefined,
    complianceResult: complianceResult ? {
      compliant: complianceResult.compliant,
      violations: complianceResult.violations,
      warnings: complianceResult.warnings,
    } : undefined,
    summary,
    timestamp: new Date(now).toISOString(),
    durationMs,
  };
}

// ============================================================================
// MESSAGE ROUTER
// ============================================================================

/**
 * Main message handler for the pilot agent session service.
 *
 * Routes incoming IPC messages to the appropriate handler.
 * Supports session lifecycle operations: start, execute, finalize.
 */
export function handleMessage(message: IPCMessage): IPCMessage {
  const { opcode, payload, metadata } = message;

  let result: unknown;
  let error: string | null = null;

  try {
    switch (opcode) {
      case 'session.start':
        // Initialize a new session
        result = startSession(payload as SessionStartRequest);
        break;

      case 'session.prepare_accrual':
        // Prepare accrual calculation step
        result = prepareAccrualCalculation(payload as SessionState);
        break;

      case 'session.process_accrual':
        // Process accrual results
        const accrualPayload = payload as {
          state: SessionState;
          result: AccrualCalculateResult;
        };
        result = processAccrualResult(accrualPayload.state, accrualPayload.result);
        break;

      case 'session.prepare_compliance':
        // Prepare compliance check step
        const compliancePayload = payload as {
          state: SessionState;
          accrualResult: AccrualCalculateResult;
        };
        result = prepareComplianceCheck(
          compliancePayload.state,
          compliancePayload.accrualResult
        );
        break;

      case 'session.process_compliance':
        // Process compliance results
        const processPayload = payload as {
          state: SessionState;
          result: ComplianceCheckResult;
        };
        result = processComplianceResult(
          processPayload.state,
          processPayload.result
        );
        break;

      case 'session.finalize':
        // Generate final session result
        result = finalizeSession(payload as SessionState);
        break;

      default:
        error = `Unknown opcode: ${opcode}`;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  // Create response message
  return {
    type: 'Response',
    source: 'pilot-agent-session',
    target: message.source,
    opcode: `${opcode}.response`,
    payload: error ? { error } : result,
    metadata: {
      messageId: `${metadata.messageId}-response`,
      correlationId: metadata.messageId,
      timestamp: new Date().toISOString(),
      priority: 'high',
      schemaVersion: 1,
    },
  };
}

// ============================================================================
// TYPE ALIASES FOR INTERNAL USE
// ============================================================================

interface AccrualCalculateMessage {
  opcode: 'accrual.calculate';
  payload: {
    employeeId: string;
    periodStart: string;
    periodEnd: string;
    hoursWorked: number;
    employerSize: 'small' | 'large';
    existingBalance: number;
    carryoverFromPreviousYear: number;
  };
}

interface AccrualCalculateResult {
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  hoursAccrued: number;
  newBalance: number;
  maxBalance: number;
  isAtMax: boolean;
}

interface ComplianceCheckMessage {
  opcode: 'compliance.check';
  payload: {
    tenantId: string;
    employeeId: string;
    action: 'accrual' | 'usage' | 'carryover' | 'balance_inquiry';
    data: Record<string, unknown>;
  };
}

interface ComplianceCheckResult {
  compliant: boolean;
  violations: ReadonlyArray<{
    code: string;
    rule: string;
    message: string;
  }>;
  warnings: ReadonlyArray<{
    code: string;
    rule: string;
    message: string;
  }>;
}

// ============================================================================
// EXPORTS
// ============================================================================
// Functions are already exported above, no need to re-export

