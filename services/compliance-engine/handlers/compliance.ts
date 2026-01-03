/**
 * ESTA-Logic Compliance Engine - Message Handlers
 *
 * Pure function handlers for compliance checking.
 * Rules are loaded as data and evaluated deterministically.
 *
 * Enhanced with UX Experience Contract Layer to provide:
 * - Human-readable explanations of violations
 * - Emotional reassurance and trust messaging
 * - Clear remediation guidance
 * - Risk transparency
 *
 * @module services/compliance-engine/handlers
 */

import type {
  IPCMessage,
  ComplianceCheckRequest,
  ComplianceCheckResult,
  ComplianceViolation,
  ComplianceWarning,
} from '../../../kernel/abi/messages';

import type { ComplianceExperienceResponse } from '../../../libs/shared-types/src/ux-experience-contract.js';

import { transformComplianceToExperience } from '../../../libs/shared-utils/src/experience-transformers.js';

// ============================================================================
// ESTA 2025 COMPLIANCE RULES
// ============================================================================

/** Rule definition */
interface ComplianceRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category:
    | 'accrual'
    | 'usage'
    | 'carryover'
    | 'notice'
    | 'documentation';
  readonly severity: 'warning' | 'error' | 'critical';
  readonly evaluate: (data: Record<string, unknown>) => RuleResult;
}

/** Rule evaluation result */
interface RuleResult {
  readonly passed: boolean;
  readonly message?: string;
  readonly remediation?: string;
}

// ESTA 2025 Core Rules
const ESTA_RULES: readonly ComplianceRule[] = [
  {
    id: 'ESTA-001',
    name: 'Accrual Rate',
    description:
      'Employees must accrue 1 hour of sick time per 30 hours worked',
    category: 'accrual',
    severity: 'critical',
    evaluate: (data) => {
      const hoursWorked = data.hoursWorked as number | undefined;
      const hoursAccrued = data.hoursAccrued as number | undefined;

      if (hoursWorked === undefined || hoursAccrued === undefined) {
        return { passed: true }; // Can't evaluate without data
      }

      const expectedAccrual = hoursWorked / 30;
      const tolerance = 0.01; // Allow small floating point differences

      if (Math.abs(hoursAccrued - expectedAccrual) > tolerance) {
        return {
          passed: false,
          message: `Accrual rate violation: expected ${expectedAccrual.toFixed(2)} hours, got ${hoursAccrued.toFixed(2)}`,
          remediation: 'Recalculate accrual using 1:30 ratio',
        };
      }

      return { passed: true };
    },
  },
  {
    id: 'ESTA-002',
    name: 'Maximum Accrual Cap',
    description: 'Small employers cap at 40 hours, large employers at 72 hours',
    category: 'accrual',
    severity: 'error',
    evaluate: (data) => {
      const balance = data.balance as number | undefined;
      const employerSize = data.employerSize as 'small' | 'large' | undefined;

      if (balance === undefined || employerSize === undefined) {
        return { passed: true };
      }

      const maxBalance = employerSize === 'small' ? 40 : 72;

      if (balance > maxBalance) {
        return {
          passed: false,
          message: `Balance exceeds maximum: ${balance} hours (max: ${maxBalance})`,
          remediation: `Cap balance at ${maxBalance} hours`,
        };
      }

      return { passed: true };
    },
  },
  {
    id: 'ESTA-003',
    name: 'Minimum Increment',
    description: 'Sick time may be used in minimum increments of 1 hour',
    category: 'usage',
    severity: 'warning',
    evaluate: (data) => {
      const hoursUsed = data.hoursUsed as number | undefined;

      if (hoursUsed === undefined) {
        return { passed: true };
      }

      // Check if hours used is in whole hour increments
      if (hoursUsed % 1 !== 0 && hoursUsed < 1) {
        return {
          passed: false,
          message: `Usage below minimum increment: ${hoursUsed} hours (min: 1 hour)`,
          remediation: 'Round up usage to nearest hour',
        };
      }

      return { passed: true };
    },
  },
  {
    id: 'ESTA-004',
    name: 'Carryover Limits',
    description: 'Unused sick time carries over within annual limits',
    category: 'carryover',
    severity: 'error',
    evaluate: (data) => {
      const carryover = data.carryoverAmount as number | undefined;
      const employerSize = data.employerSize as 'small' | 'large' | undefined;

      if (carryover === undefined || employerSize === undefined) {
        return { passed: true };
      }

      const maxCarryover = employerSize === 'small' ? 40 : 72;

      if (carryover > maxCarryover) {
        return {
          passed: false,
          message: `Carryover exceeds maximum: ${carryover} hours (max: ${maxCarryover})`,
          remediation: `Limit carryover to ${maxCarryover} hours`,
        };
      }

      return { passed: true };
    },
  },
  {
    id: 'ESTA-005',
    name: 'Notice Requirements',
    description: 'Employees must provide reasonable notice when foreseeable',
    category: 'notice',
    severity: 'warning',
    evaluate: (data) => {
      const foreseeable = data.foreseeable as boolean | undefined;
      const noticeDays = data.noticeDays as number | undefined;

      if (foreseeable === undefined || noticeDays === undefined) {
        return { passed: true };
      }

      if (foreseeable && noticeDays < 1) {
        return {
          passed: false,
          message: 'Foreseeable absence requires advance notice',
          remediation: 'Request employee provide notice as soon as practicable',
        };
      }

      return { passed: true };
    },
  },
  {
    id: 'ESTA-006',
    name: 'Documentation Threshold',
    description:
      'Documentation may be required for absences over 3 consecutive days',
    category: 'documentation',
    severity: 'warning',
    evaluate: (data) => {
      const consecutiveDays = data.consecutiveDays as number | undefined;
      const hasDocumentation = data.hasDocumentation as boolean | undefined;

      if (consecutiveDays === undefined) {
        return { passed: true };
      }

      if (consecutiveDays > 3 && hasDocumentation === false) {
        return {
          passed: false,
          message:
            'Documentation may be required for absence over 3 consecutive days',
          remediation: 'Request documentation if employer policy requires it',
        };
      }

      return { passed: true };
    },
  },
  {
    id: 'ESTA-007',
    name: 'Waiting Period',
    description: 'New employees may use sick time after 90 days of employment',
    category: 'usage',
    severity: 'error',
    evaluate: (data) => {
      const daysEmployed = data.daysEmployed as number | undefined;
      const isFirstUsage = data.isFirstUsage as boolean | undefined;

      if (daysEmployed === undefined || isFirstUsage === undefined) {
        return { passed: true };
      }

      if (isFirstUsage && daysEmployed < 90) {
        return {
          passed: false,
          message: `Employee not yet eligible for sick time usage (${daysEmployed} days employed, 90 required)`,
          remediation: 'Sick time may be used after 90 days of employment',
        };
      }

      return { passed: true };
    },
  },
  {
    id: 'ESTA-008',
    name: 'Retaliation Prohibition',
    description:
      'Employer may not retaliate against employee for using sick time',
    category: 'usage',
    severity: 'critical',
    evaluate: (data) => {
      const adverseActionDays = data.daysAfterUsageToAdverseAction as
        | number
        | undefined;
      const hasAdverseAction = data.hasAdverseAction as boolean | undefined;

      if (adverseActionDays === undefined || hasAdverseAction === undefined) {
        return { passed: true };
      }

      if (hasAdverseAction && adverseActionDays <= 90) {
        return {
          passed: false,
          message:
            'Potential retaliation: adverse action within 90 days of sick time usage',
          remediation:
            'Document legitimate business reasons for any adverse action',
        };
      }

      return { passed: true };
    },
  },
];

// ============================================================================
// COMPLIANCE CHECKER
// ============================================================================

/**
 * Check compliance against all ESTA 2025 rules.
 */
export function checkCompliance(
  request: ComplianceCheckRequest
): ComplianceCheckResult {
  const { tenantId, employeeId, action, data } = request;

  const violations: ComplianceViolation[] = [];
  const warnings: ComplianceWarning[] = [];

  // Filter rules by action category
  const applicableRules = ESTA_RULES.filter((rule) => {
    switch (action) {
      case 'accrual':
        return rule.category === 'accrual';
      case 'usage':
        return ['usage', 'notice', 'documentation'].includes(rule.category);
      case 'carryover':
        return rule.category === 'carryover';
      case 'balance_inquiry':
        return rule.category === 'accrual'; // Check balance caps
      default:
        return true; // Check all rules
    }
  });

  // Evaluate each rule
  for (const rule of applicableRules) {
    const result = rule.evaluate(data);

    if (!result.passed) {
      if (rule.severity === 'warning') {
        warnings.push({
          code: rule.id,
          rule: rule.name,
          message: result.message ?? rule.description,
          suggestion: result.remediation,
        });
      } else {
        violations.push({
          code: rule.id,
          rule: rule.name,
          message: result.message ?? rule.description,
          severity: rule.severity,
          remediation: result.remediation,
        });
      }
    }
  }

  // Generate audit trail
  const auditTrail = JSON.stringify({
    timestamp: new Date().toISOString(),
    tenantId,
    employeeId,
    action,
    rulesEvaluated: applicableRules.map((r) => r.id),
    violations: violations.map((v) => v.code),
    warnings: warnings.map((w) => w.code),
  });

  return {
    compliant: violations.length === 0,
    violations,
    warnings,
    auditTrail,
  };
}

/**
 * Check compliance with UX-enhanced experience response
 */
export function checkComplianceWithExperience(
  request: ComplianceCheckRequest
): ComplianceExperienceResponse {
  const result = checkCompliance(request);
  return transformComplianceToExperience(result);
}

// ============================================================================
// MESSAGE ROUTER
// ============================================================================

/**
 * Main message handler for the compliance engine.
 * Supports both raw compliance checks and UX-enhanced experience responses.
 */
export function handleMessage(message: IPCMessage): IPCMessage {
  const { opcode, payload, metadata } = message;

  let result: unknown;
  let error: string | null = null;

  try {
    switch (opcode) {
      case 'compliance.check':
        result = checkCompliance(payload as ComplianceCheckRequest);
        break;

      case 'compliance.check.experience':
        // UX-enhanced response with human-readable explanations and trust messaging
        result = checkComplianceWithExperience(
          payload as ComplianceCheckRequest
        );
        break;

      case 'compliance.validate':
        // Validate specific data against rules
        result = checkCompliance({
          tenantId: (payload as Record<string, unknown>).tenantId as string,
          employeeId: (payload as Record<string, unknown>).employeeId as string,
          action: 'usage',
          data: payload as Record<string, unknown>,
        });
        break;

      default:
        error = `Unknown opcode: ${opcode}`;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return {
    type: 'Response',
    source: 'compliance-engine',
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
// EXPORTS
// ============================================================================

export { ESTA_RULES };
