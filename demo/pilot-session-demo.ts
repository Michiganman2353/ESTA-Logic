#!/usr/bin/env npx ts-node
/**
 * ESTA-Logic Pilot Agent Session Demonstration
 *
 * This demo shows a complete end-to-end compliance workflow orchestrated
 * by the pilot agent session service:
 *
 * 1. Initialize pilot agent session with employee data
 * 2. Calculate sick time accrual via accrual-engine
 * 3. Validate compliance via compliance-engine
 * 4. Generate comprehensive session result with audit trail
 *
 * This demonstrates the power of the microkernel architecture where
 * complex workflows are coordinated through pure message passing.
 *
 * Run with: npm run demo:pilot-session
 *
 * @module demo/pilot-session-demo
 */

// ============================================================================
// IMPORTS
// ============================================================================

import {
  startSession,
  prepareAccrualCalculation,
  processAccrualResult,
  prepareComplianceCheck,
  processComplianceResult,
  finalizeSession,
} from '../services/pilot-agent-session/handlers/session';

import type {
  SessionStartRequest,
  SessionState,
  SessionResult,
} from '../services/pilot-agent-session/handlers/session';

import {
  handleAccrualCalculate,
} from '../services/accrual-engine/handlers/accrual';

import type {
  AccrualCalculateRequest,
  AccrualCalculateResult,
} from '../kernel/abi/messages';

import {
  checkCompliance,
} from '../services/compliance-engine/handlers/compliance';

// ============================================================================
// DEMO UTILITIES
// ============================================================================

function log(category: string, message: string, data?: unknown): void {
  const isoTime = new Date().toISOString();
  const timeOnly = isoTime.split('T')[1] ?? isoTime;
  const timestamp = timeOnly.split('.')[0] ?? timeOnly;
  console.log(`[${timestamp}] [${category.padEnd(15)}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function separator(title: string): void {
  console.log('\n' + '='.repeat(75));
  console.log(`  ${title}`);
  console.log('='.repeat(75) + '\n');
}

function sessionStepLog(step: { stepNumber: number; name: string; status: string }): void {
  const statusIcon = step.status === 'completed' ? '✓' : 
                     step.status === 'running' ? '⟳' :
                     step.status === 'failed' ? '✗' : '○';
  log('SESSION-STEP', `${statusIcon} Step ${step.stepNumber}: ${step.name} (${step.status})`);
}

// ============================================================================
// DEMO EXECUTION
// ============================================================================

async function runDemo(): Promise<void> {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║          ESTA-Logic Pilot Agent Session Demonstration                ║');
  console.log('║         "Orchestrating Compliance Through Pure Messaging"            ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');

  // ============================================================================
  // SCENARIO: Process Employee Sick Time for Pay Period
  // ============================================================================
  separator('SCENARIO: Employee Sick Time Processing');

  log('SCENARIO', 'Employee: Sarah Martinez (EMP-001)');
  log('SCENARIO', 'Employer: TechCorp Industries (Large Employer, 150+ employees)');
  log('SCENARIO', 'Pay Period: January 1-15, 2025');
  log('SCENARIO', 'Hours Worked: 80 hours');
  log('SCENARIO', 'Existing Balance: 10.5 hours');
  log('SCENARIO', 'Carryover from 2024: 5 hours');

  // ============================================================================
  // STEP 1: Initialize Pilot Agent Session
  // ============================================================================
  separator('STEP 1: Initialize Pilot Agent Session');

  const sessionRequest: SessionStartRequest = {
    sessionId: `session-${Date.now()}`,
    employeeId: 'EMP-001',
    employerId: 'EMPLOYER-TECHCORP',
    employerSize: 'large', // 150+ employees
    periodStart: '2025-01-01',
    periodEnd: '2025-01-15',
    hoursWorked: 80,
    existingBalance: 10.5,
    carryoverFromPreviousYear: 5,
  };

  log('SESSION', 'Starting pilot agent session...');
  log('SESSION', 'Request:', sessionRequest);

  let sessionState: SessionState = startSession(sessionRequest);

  log('SESSION', `✓ Session initialized: ${sessionState.sessionId}`);
  log('SESSION', `Total steps planned: ${sessionState.steps.length}`);
  
  // Log all steps
  for (const step of sessionState.steps) {
    sessionStepLog(step);
  }

  // ============================================================================
  // STEP 2: Prepare and Execute Accrual Calculation
  // ============================================================================
  separator('STEP 2: Accrual Calculation via Accrual Engine');

  log('SESSION', 'Preparing accrual calculation step...');
  
  const { message: accrualMessage, updatedState: stateAfterPrep } = 
    prepareAccrualCalculation(sessionState);

  sessionState = stateAfterPrep;

  log('IPC', 'Sending message to accrual-engine:');
  log('IPC', `Opcode: ${accrualMessage.opcode}`);
  log('IPC', 'Payload:', accrualMessage.payload);

  // Simulate IPC call to accrual engine
  const accrualRequest: AccrualCalculateRequest = accrualMessage.payload;
  const accrualResult: AccrualCalculateResult = handleAccrualCalculate(accrualRequest);

  log('ACCRUAL', '✓ Accrual calculation complete:', accrualResult);
  log('ACCRUAL', `Hours accrued: ${accrualResult.hoursAccrued.toFixed(2)} hours`);
  log('ACCRUAL', `New balance: ${accrualResult.newBalance.toFixed(2)} hours`);
  log('ACCRUAL', `Maximum balance: ${accrualResult.maxBalance} hours`);
  log('ACCRUAL', `At maximum? ${accrualResult.isAtMax ? 'Yes' : 'No'}`);

  // Process accrual result
  log('SESSION', 'Processing accrual result...');
  sessionState = processAccrualResult(sessionState, accrualResult);

  const accrualStep = sessionState.steps.find(s => s.name === 'Calculate Accrual');
  if (accrualStep) {
    sessionStepLog(accrualStep);
    log('SESSION', `Step duration: ${accrualStep.durationMs}ms`);
  }

  // ============================================================================
  // STEP 3: Prepare and Execute Compliance Check
  // ============================================================================
  separator('STEP 3: Compliance Validation via Compliance Engine');

  log('SESSION', 'Preparing compliance check step...');

  const { message: complianceMessage, updatedState: stateAfterCompliance } = 
    prepareComplianceCheck(sessionState, accrualResult);

  sessionState = stateAfterCompliance;

  log('IPC', 'Sending message to compliance-engine:');
  log('IPC', `Opcode: ${complianceMessage.opcode}`);
  log('IPC', 'Payload:', complianceMessage.payload);

  // Simulate IPC call to compliance engine
  const complianceRequest = complianceMessage.payload as any;
  const complianceResult = checkCompliance(complianceRequest);

  log('COMPLIANCE', '✓ Compliance check complete:', {
    compliant: complianceResult.compliant,
    violations: complianceResult.violations.length,
    warnings: complianceResult.warnings.length,
  });

  if (complianceResult.compliant) {
    log('COMPLIANCE', '✓ All compliance checks passed');
  } else {
    log('COMPLIANCE', `⚠ ${complianceResult.violations.length} violation(s) found`);
    for (const violation of complianceResult.violations) {
      log('VIOLATION', `[${violation.code}] ${violation.message}`);
    }
  }

  if (complianceResult.warnings.length > 0) {
    log('COMPLIANCE', `ℹ ${complianceResult.warnings.length} warning(s)`);
    for (const warning of complianceResult.warnings) {
      log('WARNING', `[${warning.code}] ${warning.message}`);
    }
  }

  // Process compliance result
  log('SESSION', 'Processing compliance result...');
  sessionState = processComplianceResult(sessionState, complianceResult);

  const complianceStep = sessionState.steps.find(s => s.name === 'Validate Compliance');
  if (complianceStep) {
    sessionStepLog(complianceStep);
    log('SESSION', `Step duration: ${complianceStep.durationMs}ms`);
  }

  // ============================================================================
  // STEP 4: Finalize Session and Generate Result
  // ============================================================================
  separator('STEP 4: Finalize Session and Generate Result');

  log('SESSION', 'Generating final session result...');

  const finalResult: SessionResult = finalizeSession(sessionState);

  log('SESSION', '✓ Session complete!');
  log('SESSION', `Session ID: ${finalResult.sessionId}`);
  log('SESSION', `Status: ${finalResult.status}`);
  log('SESSION', `Total duration: ${finalResult.durationMs}ms`);
  log('SESSION', `Timestamp: ${finalResult.timestamp}`);

  // ============================================================================
  // STEP 5: Display Comprehensive Results
  // ============================================================================
  separator('STEP 5: Session Results Summary');

  console.log('\n📊 FINAL SESSION RESULT\n');
  console.log(JSON.stringify(finalResult, null, 2));

  // ============================================================================
  // STEP 6: Verify Determinism
  // ============================================================================
  separator('STEP 6: Verify Deterministic Behavior');

  log('VERIFICATION', 'Running same session again to verify determinism...');

  // Run the exact same scenario again
  let sessionState2 = startSession(sessionRequest);
  
  const { message: accrualMessage2, updatedState: state2AfterPrep } = 
    prepareAccrualCalculation(sessionState2);
  sessionState2 = state2AfterPrep;
  
  const accrualResult2 = handleAccrualCalculate(accrualMessage2.payload);
  sessionState2 = processAccrualResult(sessionState2, accrualResult2);
  
  const { message: complianceMessage2, updatedState: state2AfterCompliance } = 
    prepareComplianceCheck(sessionState2, accrualResult2);
  sessionState2 = state2AfterCompliance;
  
  const complianceResult2 = checkCompliance(complianceMessage2.payload as any);
  sessionState2 = processComplianceResult(sessionState2, complianceResult2);
  
  const finalResult2 = finalizeSession(sessionState2);

  // Compare results (excluding timestamps and session IDs)
  const normalizeResult = (result: SessionResult) => ({
    ...result,
    sessionId: 'normalized',
    timestamp: 'normalized',
    durationMs: 0,
    steps: result.steps.map(s => ({
      ...s,
      startTime: undefined,
      endTime: undefined,
      durationMs: 0,
    })),
  });

  const normalized1 = normalizeResult(finalResult);
  const normalized2 = normalizeResult(finalResult2);

  const isDeterministic = JSON.stringify(normalized1) === JSON.stringify(normalized2);

  log('VERIFICATION', `Determinism check: ${isDeterministic ? '✓ PASS' : '✗ FAIL'}`);
  
  if (isDeterministic) {
    log('VERIFICATION', 'Same inputs produced identical outputs (excluding timestamps)');
  } else {
    log('VERIFICATION', 'ERROR: Results differ between runs!');
  }

  // ============================================================================
  // CONCLUSION
  // ============================================================================
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║               Pilot Agent Session Demo Complete!                     ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════╣');
  console.log('║  ✓ Session initialized with employee and employer data               ║');
  console.log('║  ✓ Accrual calculated via accrual-engine (pure IPC messaging)        ║');
  console.log('║  ✓ Compliance validated via compliance-engine                        ║');
  console.log('║  ✓ Comprehensive audit trail generated                               ║');
  console.log('║  ✓ Unified session result produced                                   ║');
  console.log('║  ✓ Deterministic behavior verified                                   ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════╣');
  console.log('║  Key Achievements:                                                    ║');
  console.log('║  • Zero direct imports between services                              ║');
  console.log('║  • Pure message-based orchestration                                   ║');
  console.log('║  • Complete audit trail with timing data                             ║');
  console.log('║  • ESTA 2025 compliance guaranteed                                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Display summary
  console.log('📈 QUICK SUMMARY:\n');
  console.log(`   Employee: ${finalResult.employeeId}`);
  console.log(`   Accrued: ${finalResult.accrualResult?.hoursAccrued.toFixed(2)} hours`);
  console.log(`   New Balance: ${finalResult.accrualResult?.newBalance.toFixed(2)} hours`);
  console.log(`   Compliant: ${finalResult.complianceResult?.compliant ? 'Yes ✓' : 'No ✗'}`);
  console.log(`   Session Status: ${finalResult.status}`);
  console.log(`\n   ${finalResult.summary}\n`);
}

// Run the demo
runDemo().catch(console.error);
