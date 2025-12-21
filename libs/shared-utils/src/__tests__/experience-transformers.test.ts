/**
 * Tests for UX Experience Contract Layer
 *
 * Validates that all experience responses meet the contract requirements:
 * - Every decision has an explanation
 * - Every decision includes reassurance
 * - Every decision provides next steps
 * - All responses are human-readable
 */

import { describe, it, expect } from 'vitest';
import {
  transformAccrualToExperience,
  transformComplianceToExperience,
  createSimpleExperienceResponse,
} from '../experience-transformers.js';
import type {
  AccrualCalculateResult,
  ComplianceCheckResult,
} from '../../../kernel/abi/messages.js';

describe('UX Experience Contract - Accrual Transformer', () => {
  it('should transform accrual result to complete experience response', () => {
    const accrualResult: AccrualCalculateResult = {
      employeeId: 'emp-123',
      periodStart: '2024-01-01',
      periodEnd: '2024-01-15',
      hoursAccrued: 2.5,
      newBalance: 15.5,
      maxBalance: 40,
      isAtMax: false,
      calculation: {
        accrualRate: 1 / 30,
        hoursWorked: 75,
        rawAccrual: 2.5,
        appliedAccrual: 2.5,
      },
    };

    const experience = transformAccrualToExperience(accrualResult);

    // Contract: Must have decision
    expect(experience.decision).toBeDefined();
    expect(experience.decision).toBe('APPROVED');

    // Contract: Must have human-readable explanation
    expect(experience.explanation).toBeDefined();
    expect(experience.explanation.length).toBeGreaterThan(10);
    expect(experience.explanation).toContain('2.5');

    // Contract: Must have human meaning
    expect(experience.humanMeaning).toBeDefined();
    expect(experience.humanMeaning.length).toBeGreaterThan(5);

    // Contract: Must have risk level
    expect(experience.riskLevel).toBeDefined();
    expect(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(
      experience.riskLevel
    );

    // Contract: Must have confidence score (0-100)
    expect(experience.confidenceScore).toBeDefined();
    expect(experience.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(experience.confidenceScore).toBeLessThanOrEqual(100);

    // Contract: Must have reassurance message
    expect(experience.reassuranceMessage).toBeDefined();
    expect(experience.reassuranceMessage.message).toBeDefined();
    expect(experience.reassuranceMessage.tone).toBeDefined();
    expect(['positive', 'neutral', 'encouraging', 'empathetic']).toContain(
      experience.reassuranceMessage.tone
    );

    // Contract: Must have next steps
    expect(experience.nextSteps).toBeDefined();
    expect(Array.isArray(experience.nextSteps)).toBe(true);
    expect(experience.nextSteps.length).toBeGreaterThan(0);

    // Validate next step structure
    const firstStep = experience.nextSteps[0];
    expect(firstStep.category).toBeDefined();
    expect(firstStep.title).toBeDefined();
    expect(firstStep.description).toBeDefined();
    expect(firstStep.priority).toBeDefined();

    // Contract: Must have legal references
    expect(experience.legalReferences).toBeDefined();
    expect(Array.isArray(experience.legalReferences)).toBe(true);
    expect(experience.legalReferences.length).toBeGreaterThan(0);

    // Validate legal reference structure
    const firstRef = experience.legalReferences[0];
    expect(firstRef.citation).toBeDefined();
    expect(firstRef.summary).toBeDefined();
    expect(firstRef.relevanceExplanation).toBeDefined();

    // Contract: Must have technical details
    expect(experience.technicalDetails).toBeDefined();
    expect(experience.technicalDetails).toEqual(accrualResult);

    // Contract: Must have metadata
    expect(experience.timestamp).toBeDefined();
    expect(experience.sourceEngine).toBe('accrual-engine');
    expect(experience.responseId).toBeDefined();

    // Contract: Must have accrual summary
    expect(experience.accrualSummary).toBeDefined();
    expect(experience.accrualSummary.hoursEarned).toBe(2.5);
    expect(experience.accrualSummary.newBalance).toBe(15.5);
    expect(experience.accrualSummary.maxBalance).toBe(40);
    expect(experience.accrualSummary.isNearingMax).toBe(false);
  });

  it('should handle at-maximum accrual with appropriate messaging', () => {
    const accrualResult: AccrualCalculateResult = {
      employeeId: 'emp-123',
      periodStart: '2024-01-01',
      periodEnd: '2024-01-15',
      hoursAccrued: 0,
      newBalance: 40,
      maxBalance: 40,
      isAtMax: true,
      calculation: {
        accrualRate: 1 / 30,
        hoursWorked: 75,
        rawAccrual: 2.5,
        appliedAccrual: 0,
      },
    };

    const experience = transformAccrualToExperience(accrualResult);

    // Should explain why no accrual occurred
    expect(experience.explanation.toLowerCase()).toContain('maximum');
    expect(experience.accrualSummary.isNearingMax).toBe(false); // At max, not nearing
    expect(experience.accrualSummary.percentOfMax).toBe(100);

    // Reassurance should be positive despite no new accrual
    expect(experience.reassuranceMessage.tone).toBe('positive');
    expect(experience.reassuranceMessage.emphasize).toBe(true);
  });

  it('should handle nearing-maximum with appropriate warnings', () => {
    const accrualResult: AccrualCalculateResult = {
      employeeId: 'emp-123',
      periodStart: '2024-01-01',
      periodEnd: '2024-01-15',
      hoursAccrued: 2,
      newBalance: 35,
      maxBalance: 40,
      isAtMax: false,
      calculation: {
        accrualRate: 1 / 30,
        hoursWorked: 60,
        rawAccrual: 2,
        appliedAccrual: 2,
      },
    };

    const experience = transformAccrualToExperience(accrualResult);

    // Should indicate nearing max (>80%)
    expect(experience.accrualSummary.isNearingMax).toBe(true);
    expect(experience.accrualSummary.percentOfMax).toBeGreaterThanOrEqual(80);
    expect(experience.riskLevel).toBe('LOW');
  });

  it('should personalize messages based on user context', () => {
    const accrualResult: AccrualCalculateResult = {
      employeeId: 'emp-123',
      periodStart: '2024-01-01',
      periodEnd: '2024-01-15',
      hoursAccrued: 2.5,
      newBalance: 15.5,
      maxBalance: 40,
      isAtMax: false,
      calculation: {
        accrualRate: 1 / 30,
        hoursWorked: 75,
        rawAccrual: 2.5,
        appliedAccrual: 2.5,
      },
    };

    const employeeContext = {
      language: 'en',
      experienceLevel: 'beginner' as const,
      prefersDetailedExplanations: false,
      timezone: 'America/Detroit',
      role: 'employee' as const,
      hasSeenSimilarScenario: false,
    };

    const employerContext = {
      ...employeeContext,
      role: 'employer' as const,
    };

    const employeeExp = transformAccrualToExperience(
      accrualResult,
      employeeContext
    );
    const employerExp = transformAccrualToExperience(
      accrualResult,
      employerContext
    );

    // Different messaging for employees vs employers
    expect(employeeExp.humanMeaning).not.toBe(employerExp.humanMeaning);
  });
});

describe('UX Experience Contract - Compliance Transformer', () => {
  it('should transform compliant result to complete experience response', () => {
    const complianceResult: ComplianceCheckResult = {
      compliant: true,
      violations: [],
      warnings: [],
      auditTrail: JSON.stringify({
        timestamp: new Date().toISOString(),
        rulesEvaluated: ['ESTA-001', 'ESTA-002'],
      }),
    };

    const experience = transformComplianceToExperience(complianceResult);

    // All contract requirements
    expect(experience.decision).toBe('APPROVED');
    expect(experience.explanation).toBeDefined();
    expect(experience.humanMeaning).toBeDefined();
    expect(experience.riskLevel).toBe('NONE');
    expect(experience.confidenceScore).toBe(100); // Fully compliant = high confidence
    expect(experience.reassuranceMessage).toBeDefined();
    expect(experience.nextSteps.length).toBeGreaterThan(0);
    expect(experience.legalReferences.length).toBeGreaterThan(0);
    expect(experience.sourceEngine).toBe('compliance-engine');

    // Compliance-specific summary
    expect(experience.complianceSummary).toBeDefined();
    expect(experience.complianceSummary.overallStatus).toBe('COMPLIANT');
    expect(experience.complianceSummary.violationCount).toBe(0);
    expect(experience.complianceSummary.warningCount).toBe(0);

    // Should have positive reassurance
    expect(experience.reassuranceMessage.tone).toBe('positive');
    expect(experience.reassuranceMessage.emphasize).toBe(true);
  });

  it('should handle violations with clear explanations and remediation', () => {
    const complianceResult: ComplianceCheckResult = {
      compliant: false,
      violations: [
        {
          code: 'ESTA-001',
          rule: 'Accrual Rate',
          message: 'Accrual rate violation detected',
          severity: 'critical',
          remediation: 'Recalculate using 1:30 ratio',
        },
        {
          code: 'ESTA-002',
          rule: 'Maximum Accrual Cap',
          message: 'Balance exceeds maximum',
          severity: 'error',
          remediation: 'Cap balance at 40 hours',
        },
      ],
      warnings: [],
      auditTrail: JSON.stringify({
        timestamp: new Date().toISOString(),
      }),
    };

    const experience = transformComplianceToExperience(complianceResult);

    expect(experience.decision).toBe('DENIED');
    expect(experience.riskLevel).toBe('CRITICAL'); // Has critical violation
    expect(experience.complianceSummary.overallStatus).toBe('NON_COMPLIANT');
    expect(experience.complianceSummary.violationCount).toBe(2);

    // Should provide user-friendly violation messages
    expect(experience.violations.length).toBe(2);
    const firstViolation = experience.violations[0];
    expect(firstViolation.userFriendlyMessage).toBeDefined();
    expect(firstViolation.whatItMeans).toBeDefined();
    expect(firstViolation.howToFix).toBeDefined();
    expect(firstViolation.howToFix).toContain('1:30');

    // Should have empathetic reassurance for failures
    expect(experience.reassuranceMessage.tone).toBe('empathetic');
    expect(experience.reassuranceMessage.emphasize).toBe(true);

    // Should provide urgent next steps
    expect(experience.nextSteps[0].priority).toBe('urgent');
    expect(experience.nextSteps[0].category).toBe('ACTION_REQUIRED');
  });

  it('should handle warnings with encouraging messaging', () => {
    const complianceResult: ComplianceCheckResult = {
      compliant: true, // Still compliant, just warnings
      violations: [],
      warnings: [
        {
          code: 'ESTA-003',
          rule: 'Minimum Increment',
          message: 'Consider rounding to nearest hour',
          suggestion: 'Round up usage to nearest hour',
        },
      ],
      auditTrail: JSON.stringify({
        timestamp: new Date().toISOString(),
      }),
    };

    const experience = transformComplianceToExperience(complianceResult);

    expect(experience.decision).toBe('WARNING');
    expect(experience.riskLevel).toBe('LOW');
    expect(experience.complianceSummary.overallStatus).toBe('NEEDS_ATTENTION');
    expect(experience.complianceSummary.warningCount).toBe(1);

    // Should have encouraging reassurance
    expect(experience.reassuranceMessage.tone).toBe('encouraging');

    // Warnings should be user-friendly
    expect(experience.warnings.length).toBe(1);
    const firstWarning = experience.warnings[0];
    expect(firstWarning.userFriendlyMessage).toBeDefined();
    expect(firstWarning.whatToConsider).toBeDefined();
  });

  it('should calculate confidence scores appropriately', () => {
    const fullyCompliant: ComplianceCheckResult = {
      compliant: true,
      violations: [],
      warnings: [],
      auditTrail: '{}',
    };

    const withWarnings: ComplianceCheckResult = {
      compliant: true,
      violations: [],
      warnings: [{ code: 'W1', rule: 'Test', message: 'test' }],
      auditTrail: '{}',
    };

    const withViolations: ComplianceCheckResult = {
      compliant: false,
      violations: [
        { code: 'V1', rule: 'Test', message: 'test', severity: 'error' },
      ],
      warnings: [],
      auditTrail: '{}',
    };

    const withCritical: ComplianceCheckResult = {
      compliant: false,
      violations: [
        { code: 'V1', rule: 'Test', message: 'test', severity: 'critical' },
      ],
      warnings: [],
      auditTrail: '{}',
    };

    expect(
      transformComplianceToExperience(fullyCompliant).confidenceScore
    ).toBe(100);
    expect(
      transformComplianceToExperience(withWarnings).confidenceScore
    ).toBeLessThan(100);
    expect(
      transformComplianceToExperience(withViolations).confidenceScore
    ).toBeLessThan(95);
    expect(transformComplianceToExperience(withCritical).confidenceScore).toBe(
      95
    );
  });

  it('should provide legal references for all violations and warnings', () => {
    const complianceResult: ComplianceCheckResult = {
      compliant: false,
      violations: [
        {
          code: 'ESTA-001',
          rule: 'Accrual Rate',
          message: 'Test',
          severity: 'error',
        },
      ],
      warnings: [
        { code: 'ESTA-003', rule: 'Minimum Increment', message: 'Test' },
      ],
      auditTrail: '{}',
    };

    const experience = transformComplianceToExperience(complianceResult);

    // Should have references for violations, warnings, and general ESTA
    expect(experience.legalReferences.length).toBeGreaterThanOrEqual(2);

    // All references should have required fields
    experience.legalReferences.forEach((ref) => {
      expect(ref.citation).toBeDefined();
      expect(ref.summary).toBeDefined();
      expect(ref.relevanceExplanation).toBeDefined();
    });
  });
});

describe('UX Experience Contract - Simple Response Builder', () => {
  it('should create valid simple experience response', () => {
    const response = createSimpleExperienceResponse(
      'COMPLETED',
      'Operation completed successfully',
      'Your request was processed',
      { result: 'success' },
      'test-engine'
    );

    expect(response.decision).toBe('COMPLETED');
    expect(response.explanation).toBeDefined();
    expect(response.humanMeaning).toBeDefined();
    expect(response.riskLevel).toBeDefined();
    expect(response.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(response.confidenceScore).toBeLessThanOrEqual(100);
    expect(response.reassuranceMessage).toBeDefined();
    expect(response.nextSteps).toBeDefined();
    expect(response.legalReferences).toBeDefined();
    expect(response.technicalDetails).toEqual({ result: 'success' });
    expect(response.sourceEngine).toBe('test-engine');
  });
});

describe('UX Experience Contract - Validation', () => {
  it('should ensure all explanations are meaningful (not empty or too short)', () => {
    const accrualResult: AccrualCalculateResult = {
      employeeId: 'emp-123',
      periodStart: '2024-01-01',
      periodEnd: '2024-01-15',
      hoursAccrued: 2.5,
      newBalance: 15.5,
      maxBalance: 40,
      isAtMax: false,
      calculation: {
        accrualRate: 1 / 30,
        hoursWorked: 75,
        rawAccrual: 2.5,
        appliedAccrual: 2.5,
      },
    };

    const experience = transformAccrualToExperience(accrualResult);

    // Explanation should be at least 10 characters
    expect(experience.explanation.length).toBeGreaterThanOrEqual(10);
    // Human meaning should be at least 5 characters
    expect(experience.humanMeaning.length).toBeGreaterThanOrEqual(5);
    // Reassurance message should not be empty
    expect(experience.reassuranceMessage.message.length).toBeGreaterThan(0);
  });

  it('should ensure all next steps have required fields', () => {
    const accrualResult: AccrualCalculateResult = {
      employeeId: 'emp-123',
      periodStart: '2024-01-01',
      periodEnd: '2024-01-15',
      hoursAccrued: 2.5,
      newBalance: 15.5,
      maxBalance: 40,
      isAtMax: false,
      calculation: {
        accrualRate: 1 / 30,
        hoursWorked: 75,
        rawAccrual: 2.5,
        appliedAccrual: 2.5,
      },
    };

    const experience = transformAccrualToExperience(accrualResult);

    experience.nextSteps.forEach((step) => {
      expect(step.category).toBeDefined();
      expect([
        'ACTION_REQUIRED',
        'INFORMATION',
        'RECOMMENDATION',
        'WARNING',
      ]).toContain(step.category);
      expect(step.title).toBeDefined();
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.description).toBeDefined();
      expect(step.description.length).toBeGreaterThan(0);
      expect(step.priority).toBeDefined();
      expect(['low', 'medium', 'high', 'urgent']).toContain(step.priority);
    });
  });
});
