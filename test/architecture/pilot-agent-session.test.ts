/**
 * Pilot Agent Session Service Tests
 *
 * Tests for the pilot agent session orchestration logic.
 * Verifies session lifecycle, multi-service coordination, and deterministic behavior.
 *
 * @module test/architecture/pilot-agent-session.test
 */

import { describe, it, expect } from 'vitest';
import {
  startSession,
  prepareAccrualCalculation,
  processAccrualResult,
  prepareComplianceCheck,
  processComplianceResult,
  finalizeSession,
  handleMessage,
} from '../../services/pilot-agent-session/handlers/session';

import type {
  SessionStartRequest,
  SessionState,
  SessionResult,
} from '../../services/pilot-agent-session/handlers/session';

import {
  handleAccrualCalculate,
} from '../../services/accrual-engine/handlers/accrual';

import {
  checkCompliance,
} from '../../services/compliance-engine/handlers/compliance';

import type { IPCMessage } from '../../kernel/abi/messages';

// ============================================================================
// TEST DATA
// ============================================================================

const createTestSessionRequest = (overrides?: Partial<SessionStartRequest>): SessionStartRequest => ({
  sessionId: 'test-session-001',
  employeeId: 'EMP-TEST-001',
  employerId: 'EMPLOYER-TEST',
  employerSize: 'large',
  periodStart: '2025-01-01',
  periodEnd: '2025-01-15',
  hoursWorked: 80,
  existingBalance: 10,
  carryoverFromPreviousYear: 5,
  ...overrides,
});

// ============================================================================
// SESSION INITIALIZATION TESTS
// ============================================================================

describe('Pilot Agent Session - Initialization', () => {
  it('should initialize a new session with correct structure', () => {
    const request = createTestSessionRequest();
    const state = startSession(request);

    expect(state.sessionId).toBe(request.sessionId);
    expect(state.request).toEqual(request);
    expect(state.steps).toHaveLength(4);
    expect(state.currentStep).toBe(1);
    expect(state.startTime).toBeGreaterThan(0);
  });

  it('should create session steps in correct order', () => {
    const request = createTestSessionRequest();
    const state = startSession(request);

    expect(state.steps[0]?.name).toBe('Initialize Session');
    expect(state.steps[1]?.name).toBe('Calculate Accrual');
    expect(state.steps[2]?.name).toBe('Validate Compliance');
    expect(state.steps[3]?.name).toBe('Generate Audit Trail');
  });

  it('should mark initialization step as completed', () => {
    const request = createTestSessionRequest();
    const state = startSession(request);

    const initStep = state.steps.find(s => s.name === 'Initialize Session');
    expect(initStep?.status).toBe('completed');
    expect(initStep?.startTime).toBeDefined();
    expect(initStep?.endTime).toBeDefined();
  });

  it('should mark other steps as pending initially', () => {
    const request = createTestSessionRequest();
    const state = startSession(request);

    const pendingSteps = state.steps.filter(s => s.status === 'pending');
    expect(pendingSteps).toHaveLength(3);
  });
});

// ============================================================================
// ACCRUAL CALCULATION STEP TESTS
// ============================================================================

describe('Pilot Agent Session - Accrual Calculation', () => {
  it('should prepare accrual calculation message correctly', () => {
    const request = createTestSessionRequest();
    const state = startSession(request);
    
    const { message, updatedState } = prepareAccrualCalculation(state);

    expect(message.opcode).toBe('accrual.calculate');
    expect(message.payload.employeeId).toBe(request.employeeId);
    expect(message.payload.hoursWorked).toBe(request.hoursWorked);
    expect(message.payload.employerSize).toBe(request.employerSize);
    
    // Should update step status to running
    const accrualStep = updatedState.steps.find(s => s.name === 'Calculate Accrual');
    expect(accrualStep?.status).toBe('running');
    expect(accrualStep?.startTime).toBeDefined();
  });

  it('should process accrual result correctly', () => {
    const request = createTestSessionRequest();
    let state = startSession(request);
    
    const { updatedState } = prepareAccrualCalculation(state);
    state = updatedState;

    // Simulate accrual calculation
    const accrualResult = handleAccrualCalculate({
      employeeId: request.employeeId,
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
      hoursWorked: request.hoursWorked,
      employerSize: request.employerSize,
      existingBalance: request.existingBalance,
      carryoverFromPreviousYear: request.carryoverFromPreviousYear,
    });

    const processedState = processAccrualResult(state, accrualResult);

    const accrualStep = processedState.steps.find(s => s.name === 'Calculate Accrual');
    expect(accrualStep?.status).toBe('completed');
    expect(accrualStep?.endTime).toBeDefined();
    expect(accrualStep?.durationMs).toBeGreaterThanOrEqual(0);
    expect(accrualStep?.result).toEqual(accrualResult);
  });

  it('should advance to next step after accrual completion', () => {
    const request = createTestSessionRequest();
    let state = startSession(request);
    
    const { updatedState } = prepareAccrualCalculation(state);
    state = updatedState;

    const accrualResult = handleAccrualCalculate({
      employeeId: request.employeeId,
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
      hoursWorked: request.hoursWorked,
      employerSize: request.employerSize,
      existingBalance: request.existingBalance,
      carryoverFromPreviousYear: request.carryoverFromPreviousYear,
    });

    const processedState = processAccrualResult(state, accrualResult);

    expect(processedState.currentStep).toBe(3);
  });
});

// ============================================================================
// COMPLIANCE VALIDATION STEP TESTS
// ============================================================================

describe('Pilot Agent Session - Compliance Validation', () => {
  it('should prepare compliance check message correctly', () => {
    const request = createTestSessionRequest();
    let state = startSession(request);
    
    const { updatedState } = prepareAccrualCalculation(state);
    state = updatedState;

    const accrualResult = handleAccrualCalculate({
      employeeId: request.employeeId,
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
      hoursWorked: request.hoursWorked,
      employerSize: request.employerSize,
      existingBalance: request.existingBalance,
      carryoverFromPreviousYear: request.carryoverFromPreviousYear,
    });

    state = processAccrualResult(state, accrualResult);

    const { message, updatedState: finalState } = prepareComplianceCheck(state, accrualResult);

    expect(message.opcode).toBe('compliance.check');
    expect(message.payload.employeeId).toBe(request.employeeId);
    expect(message.payload.tenantId).toBe(request.employerId);
    expect(message.payload.action).toBe('accrual');
    
    const complianceStep = finalState.steps.find(s => s.name === 'Validate Compliance');
    expect(complianceStep?.status).toBe('running');
  });

  it('should process compliance result correctly', () => {
    const request = createTestSessionRequest();
    let state = startSession(request);
    
    // Run through accrual step
    const { updatedState: stateAfterPrep } = prepareAccrualCalculation(state);
    state = stateAfterPrep;

    const accrualResult = handleAccrualCalculate({
      employeeId: request.employeeId,
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
      hoursWorked: request.hoursWorked,
      employerSize: request.employerSize,
      existingBalance: request.existingBalance,
      carryoverFromPreviousYear: request.carryoverFromPreviousYear,
    });

    state = processAccrualResult(state, accrualResult);

    // Run through compliance step
    const { message, updatedState: stateWithCompliance } = prepareComplianceCheck(state, accrualResult);
    state = stateWithCompliance;

    const complianceResult = checkCompliance(message.payload);
    const processedState = processComplianceResult(state, complianceResult);

    const complianceStep = processedState.steps.find(s => s.name === 'Validate Compliance');
    expect(complianceStep?.status).toBe('completed');
    expect(complianceStep?.endTime).toBeDefined();
    expect(complianceStep?.result).toEqual(complianceResult);
  });
});

// ============================================================================
// SESSION FINALIZATION TESTS
// ============================================================================

describe('Pilot Agent Session - Finalization', () => {
  it('should generate complete session result', () => {
    const request = createTestSessionRequest();
    let state = startSession(request);
    
    // Run through accrual
    const { updatedState: stateAfterPrep } = prepareAccrualCalculation(state);
    state = stateAfterPrep;

    const accrualResult = handleAccrualCalculate({
      employeeId: request.employeeId,
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
      hoursWorked: request.hoursWorked,
      employerSize: request.employerSize,
      existingBalance: request.existingBalance,
      carryoverFromPreviousYear: request.carryoverFromPreviousYear,
    });

    state = processAccrualResult(state, accrualResult);

    // Run through compliance
    const { message, updatedState: stateWithCompliance } = prepareComplianceCheck(state, accrualResult);
    state = stateWithCompliance;

    const complianceResult = checkCompliance(message.payload);
    state = processComplianceResult(state, complianceResult);

    // Finalize
    const result = finalizeSession(state);

    expect(result.sessionId).toBe(request.sessionId);
    expect(result.employeeId).toBe(request.employeeId);
    expect(result.status).toBe('success');
    expect(result.steps).toHaveLength(4);
    expect(result.accrualResult).toBeDefined();
    expect(result.complianceResult).toBeDefined();
    expect(result.summary).toBeTruthy();
    expect(result.timestamp).toBeTruthy();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should include accrual results in final output', () => {
    const request = createTestSessionRequest({ hoursWorked: 90 });
    let state = startSession(request);
    
    const { updatedState } = prepareAccrualCalculation(state);
    state = updatedState;

    const accrualResult = handleAccrualCalculate({
      employeeId: request.employeeId,
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
      hoursWorked: request.hoursWorked,
      employerSize: request.employerSize,
      existingBalance: request.existingBalance,
      carryoverFromPreviousYear: request.carryoverFromPreviousYear,
    });

    state = processAccrualResult(state, accrualResult);

    const { message, updatedState: stateWithCompliance } = prepareComplianceCheck(state, accrualResult);
    state = stateWithCompliance;

    const complianceResult = checkCompliance(message.payload);
    state = processComplianceResult(state, complianceResult);

    const result = finalizeSession(state);

    expect(result.accrualResult?.hoursAccrued).toBeCloseTo(90 / 30, 2);
    expect(result.accrualResult?.newBalance).toBeGreaterThan(request.existingBalance);
  });

  it('should generate appropriate summary for successful session', () => {
    const request = createTestSessionRequest();
    let state = startSession(request);
    
    // Complete workflow
    const { updatedState: s1 } = prepareAccrualCalculation(state);
    state = s1;

    const accrualResult = handleAccrualCalculate({
      employeeId: request.employeeId,
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
      hoursWorked: request.hoursWorked,
      employerSize: request.employerSize,
      existingBalance: request.existingBalance,
      carryoverFromPreviousYear: request.carryoverFromPreviousYear,
    });

    state = processAccrualResult(state, accrualResult);

    const { message, updatedState: s2 } = prepareComplianceCheck(state, accrualResult);
    state = s2;

    const complianceResult = checkCompliance(message.payload);
    state = processComplianceResult(state, complianceResult);

    const result = finalizeSession(state);

    expect(result.summary).toContain('Successfully processed');
    expect(result.summary).toContain(request.employeeId);
    expect(result.summary).toContain('compliance checks passed');
  });
});

// ============================================================================
// MESSAGE HANDLER TESTS
// ============================================================================

describe('Pilot Agent Session - Message Handler', () => {
  it('should handle session.start opcode', () => {
    const request = createTestSessionRequest();
    
    const message: IPCMessage = {
      type: 'Command',
      source: 'test-client',
      target: 'pilot-agent-session',
      opcode: 'session.start',
      payload: request,
      metadata: {
        messageId: 'msg-001',
        timestamp: new Date().toISOString(),
        priority: 'high',
        schemaVersion: 1,
      },
    };

    const response = handleMessage(message);

    expect(response.type).toBe('Response');
    expect(response.source).toBe('pilot-agent-session');
    expect(response.target).toBe('test-client');
    expect(response.opcode).toBe('session.start.response');
    expect(response.payload).toHaveProperty('sessionId');
  });

  it('should handle unknown opcode with error', () => {
    const message: IPCMessage = {
      type: 'Command',
      source: 'test-client',
      target: 'pilot-agent-session',
      opcode: 'session.unknown' as any,
      payload: {},
      metadata: {
        messageId: 'msg-002',
        timestamp: new Date().toISOString(),
        priority: 'high',
        schemaVersion: 1,
      },
    };

    const response = handleMessage(message);

    expect(response.payload).toHaveProperty('error');
    const payload = response.payload as { error: string };
    expect(payload.error).toContain('Unknown opcode');
  });

  it('should preserve correlation ID in response', () => {
    const request = createTestSessionRequest();
    
    const message: IPCMessage = {
      type: 'Command',
      source: 'test-client',
      target: 'pilot-agent-session',
      opcode: 'session.start',
      payload: request,
      metadata: {
        messageId: 'msg-003',
        timestamp: new Date().toISOString(),
        priority: 'high',
        schemaVersion: 1,
      },
    };

    const response = handleMessage(message);

    expect(response.metadata.correlationId).toBe(message.metadata.messageId);
  });
});

// ============================================================================
// DETERMINISM TESTS
// ============================================================================

describe('Pilot Agent Session - Determinism', () => {
  it('should produce identical results for identical inputs', () => {
    const request = createTestSessionRequest();
    
    // Run first session
    let state1 = startSession(request);
    const { updatedState: s1_1 } = prepareAccrualCalculation(state1);
    state1 = s1_1;

    const accrualResult1 = handleAccrualCalculate({
      employeeId: request.employeeId,
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
      hoursWorked: request.hoursWorked,
      employerSize: request.employerSize,
      existingBalance: request.existingBalance,
      carryoverFromPreviousYear: request.carryoverFromPreviousYear,
    });

    state1 = processAccrualResult(state1, accrualResult1);

    const { message: m1, updatedState: s1_2 } = prepareComplianceCheck(state1, accrualResult1);
    state1 = s1_2;

    const complianceResult1 = checkCompliance(m1.payload);
    state1 = processComplianceResult(state1, complianceResult1);

    const result1 = finalizeSession(state1);

    // Run second session with same inputs
    let state2 = startSession(request);
    const { updatedState: s2_1 } = prepareAccrualCalculation(state2);
    state2 = s2_1;

    const accrualResult2 = handleAccrualCalculate({
      employeeId: request.employeeId,
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
      hoursWorked: request.hoursWorked,
      employerSize: request.employerSize,
      existingBalance: request.existingBalance,
      carryoverFromPreviousYear: request.carryoverFromPreviousYear,
    });

    state2 = processAccrualResult(state2, accrualResult2);

    const { message: m2, updatedState: s2_2 } = prepareComplianceCheck(state2, accrualResult2);
    state2 = s2_2;

    const complianceResult2 = checkCompliance(m2.payload);
    state2 = processComplianceResult(state2, complianceResult2);

    const result2 = finalizeSession(state2);

    // Compare results (excluding timestamps and durations)
    expect(result1.sessionId).toBe(result2.sessionId);
    expect(result1.employeeId).toBe(result2.employeeId);
    expect(result1.status).toBe(result2.status);
    expect(result1.accrualResult).toEqual(result2.accrualResult);
    expect(result1.complianceResult).toEqual(result2.complianceResult);
  });

  it('should calculate same accrual for same hours worked', () => {
    const request1 = createTestSessionRequest({ hoursWorked: 75 });
    const request2 = createTestSessionRequest({ hoursWorked: 75, sessionId: 'different-id' });

    const state1 = startSession(request1);
    const { message: msg1 } = prepareAccrualCalculation(state1);
    const accrual1 = handleAccrualCalculate(msg1.payload);

    const state2 = startSession(request2);
    const { message: msg2 } = prepareAccrualCalculation(state2);
    const accrual2 = handleAccrualCalculate(msg2.payload);

    expect(accrual1.hoursAccrued).toBe(accrual2.hoursAccrued);
    expect(accrual1.newBalance).toBe(accrual2.newBalance);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Pilot Agent Session - Full Workflow Integration', () => {
  it('should complete full workflow successfully for large employer', () => {
    const request = createTestSessionRequest({
      employerSize: 'large',
      hoursWorked: 120,
      existingBalance: 20,
    });

    let state = startSession(request);
    
    // Accrual step
    const { updatedState: s1 } = prepareAccrualCalculation(state);
    state = s1;

    const accrualResult = handleAccrualCalculate({
      employeeId: request.employeeId,
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
      hoursWorked: request.hoursWorked,
      employerSize: request.employerSize,
      existingBalance: request.existingBalance,
      carryoverFromPreviousYear: request.carryoverFromPreviousYear,
    });

    state = processAccrualResult(state, accrualResult);

    // Compliance step
    const { message, updatedState: s2 } = prepareComplianceCheck(state, accrualResult);
    state = s2;

    const complianceResult = checkCompliance(message.payload);
    state = processComplianceResult(state, complianceResult);

    // Finalize
    const result = finalizeSession(state);

    expect(result.status).toBe('success');
    expect(result.accrualResult?.hoursAccrued).toBeCloseTo(120 / 30, 2);
    expect(result.complianceResult?.compliant).toBe(true);
  });

  it('should complete full workflow successfully for small employer', () => {
    const request = createTestSessionRequest({
      employerSize: 'small',
      hoursWorked: 60,
      existingBalance: 15,
    });

    let state = startSession(request);
    
    const { updatedState: s1 } = prepareAccrualCalculation(state);
    state = s1;

    const accrualResult = handleAccrualCalculate({
      employeeId: request.employeeId,
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
      hoursWorked: request.hoursWorked,
      employerSize: request.employerSize,
      existingBalance: request.existingBalance,
      carryoverFromPreviousYear: request.carryoverFromPreviousYear,
    });

    state = processAccrualResult(state, accrualResult);

    const { message, updatedState: s2 } = prepareComplianceCheck(state, accrualResult);
    state = s2;

    const complianceResult = checkCompliance(message.payload);
    state = processComplianceResult(state, complianceResult);

    const result = finalizeSession(state);

    expect(result.status).toBe('success');
    expect(result.accrualResult?.maxBalance).toBe(40); // Small employer cap
  });
});
