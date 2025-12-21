/**
 * Experience Transformer Utilities
 *
 * Helpers to convert raw engine output into UX-friendly experience responses.
 * These transformers implement the UX ↔ Logic Contract Layer.
 *
 * @module experience-transformers
 */

import type {
  AccrualExperienceResponse,
  ComplianceExperienceResponse,
  ConfidenceScore,
  DecisionStatus,
  ExperienceResponse,
  ExperienceRiskLevel,
  LegalReference,
  ReassuranceMessage,
  UserExperienceContext,
  UserGuidanceHint,
} from '../../shared-types/src/ux-experience-contract';

import type {
  AccrualCalculateResult,
  ComplianceCheckResult,
  ComplianceViolation,
  ComplianceWarning,
} from '../../../kernel/abi/messages';

// Simple UUID v4 generator to avoid external dependency
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================================
// Section 1: Accrual Experience Transformer
// ============================================================================

/**
 * Transform raw accrual calculation into experience response
 */
export function transformAccrualToExperience(
  result: AccrualCalculateResult,
  userContext?: UserExperienceContext
): AccrualExperienceResponse {
  const percentOfMax = (result.newBalance / result.maxBalance) * 100;
  const isNearingMax = percentOfMax >= 80;

  // Calculate confidence (accrual calculations are deterministic)
  const confidenceScore: ConfidenceScore = 100;

  // Determine risk level
  const riskLevel: ExperienceRiskLevel = isNearingMax ? 'LOW' : 'NONE';

  // Generate human-friendly explanation
  const explanation = generateAccrualExplanation(result, userContext);
  const humanMeaning = generateAccrualMeaning(result, userContext);

  // Generate reassurance
  const reassuranceMessage = generateAccrualReassurance(
    result,
    isNearingMax,
    userContext
  );

  // Generate next steps
  const nextSteps = generateAccrualNextSteps(result, isNearingMax, userContext);

  // Generate legal references
  const legalReferences = generateAccrualLegalReferences(result);

  return {
    decision: 'APPROVED',
    explanation,
    humanMeaning,
    riskLevel,
    confidenceScore,
    reassuranceMessage,
    nextSteps,
    legalReferences,
    technicalDetails: result,
    timestamp: new Date().toISOString(),
    sourceEngine: 'accrual-engine',
    responseId: generateUUID(),
    accrualSummary: {
      hoursEarned: result.hoursAccrued,
      newBalance: result.newBalance,
      maxBalance: result.maxBalance,
      percentOfMax: Math.round(percentOfMax),
      isNearingMax,
    },
  };
}

function generateAccrualExplanation(
  result: AccrualCalculateResult,
  userContext?: UserExperienceContext
): string {
  const isAdvanced =
    userContext?.experienceLevel === 'advanced' ||
    userContext?.prefersDetailedExplanations;

  if (result.isAtMax) {
    return isAdvanced
      ? `Based on Michigan ESTA regulations, you've reached your maximum sick time accrual of ${result.maxBalance} hours. Additional hours worked won't increase your balance until you use some time.`
      : `You've reached your maximum sick time balance of ${result.maxBalance} hours. Great job saving up!`;
  }

  if (result.hoursAccrued === 0) {
    return `No new sick time accrued this period because you're at your maximum balance of ${result.maxBalance} hours.`;
  }

  return isAdvanced
    ? `You earned ${result.hoursAccrued.toFixed(2)} hours of sick time based on ${result.calculation.hoursWorked} hours worked (1 hour per 30 hours worked, per Michigan ESTA 2025).`
    : `You earned ${result.hoursAccrued.toFixed(2)} hours of sick time this pay period.`;
}

function generateAccrualMeaning(
  result: AccrualCalculateResult,
  userContext?: UserExperienceContext
): string {
  const role = userContext?.role || 'employee';

  if (role === 'employer') {
    return `This employee now has ${result.newBalance.toFixed(2)} hours of sick time available (${result.maxBalance} max).`;
  }

  if (result.isAtMax) {
    return `You have ${result.newBalance.toFixed(2)} hours ready to use whenever you need them.`;
  }

  return `Your sick time balance is now ${result.newBalance.toFixed(2)} hours, giving you peace of mind for when you need it.`;
}

function generateAccrualReassurance(
  result: AccrualCalculateResult,
  isNearingMax: boolean,
  userContext?: UserExperienceContext
): ReassuranceMessage {
  if (result.isAtMax) {
    return {
      message: "You're fully protected with maximum sick time saved.",
      context:
        "You've built up the maximum allowed balance. This is great for your security!",
      tone: 'positive',
      emphasize: true,
    };
  }

  if (isNearingMax) {
    return {
      message: "You're building a healthy sick time balance.",
      context: "You're approaching your maximum - that's excellent planning.",
      tone: 'encouraging',
      emphasize: false,
    };
  }

  const isEmployee = userContext?.role === 'employee';
  if (isEmployee) {
    return {
      message: 'Your sick time is accruing correctly and automatically.',
      context:
        'Every hour you work earns you sick time protection. We handle the math.',
      tone: 'neutral',
      emphasize: false,
    };
  }

  return {
    message: 'Accrual calculation is accurate and compliant.',
    context: 'All calculations follow Michigan ESTA 2025 requirements exactly.',
    tone: 'neutral',
    emphasize: false,
  };
}

function generateAccrualNextSteps(
  result: AccrualCalculateResult,
  isNearingMax: boolean,
  userContext?: UserExperienceContext
): UserGuidanceHint[] {
  const steps: UserGuidanceHint[] = [];
  const isEmployee = userContext?.role === 'employee';

  if (result.isAtMax) {
    if (isEmployee) {
      steps.push({
        category: 'INFORMATION',
        title: "You're at maximum capacity",
        description:
          "Consider using sick time when needed - you won't lose what you've earned, but you can't accrue more until you use some.",
        priority: 'low',
        estimatedMinutes: 2,
      });
    } else {
      steps.push({
        category: 'INFORMATION',
        title: 'Employee at maximum accrual',
        description:
          'Employee cannot accrue additional hours until balance decreases below maximum.',
        priority: 'low',
        estimatedMinutes: 1,
      });
    }
  } else if (isNearingMax) {
    steps.push({
      category: 'INFORMATION',
      title: 'Nearing maximum balance',
      description: `You have ${result.newBalance.toFixed(2)} of ${result.maxBalance} hours. Continue working to reach your maximum.`,
      priority: 'low',
      estimatedMinutes: 1,
    });
  } else {
    if (isEmployee) {
      steps.push({
        category: 'INFORMATION',
        title: 'Keep building your balance',
        description:
          'Continue working as normal. Your sick time automatically accrues at 1 hour per 30 hours worked.',
        priority: 'low',
        estimatedMinutes: 1,
      });
    }
  }

  // Always add a way to view full balance
  steps.push({
    category: 'RECOMMENDATION',
    title: 'Review your full balance',
    description:
      'View your complete sick time history and upcoming accrual estimates.',
    helpLink: '/dashboard/sick-time',
    priority: 'low',
    estimatedMinutes: 3,
  });

  return steps;
}

function generateAccrualLegalReferences(
  result: AccrualCalculateResult
): LegalReference[] {
  return [
    {
      citation: 'Michigan ESTA 2025, Section 3(a)',
      summary:
        'Employees accrue 1 hour of paid sick time for every 30 hours worked',
      relevanceExplanation:
        'This law defines the accrual rate used to calculate your sick time earnings.',
    },
    {
      citation: `Michigan ESTA 2025, Section 3(b)(${result.maxBalance === 40 ? '1' : '2'})`,
      summary: `${result.maxBalance === 40 ? 'Small employers' : 'Large employers'} have a maximum accrual cap of ${result.maxBalance} hours`,
      relevanceExplanation: `Your employer's size determines your maximum sick time balance of ${result.maxBalance} hours.`,
    },
  ];
}

// ============================================================================
// Section 2: Compliance Experience Transformer
// ============================================================================

/**
 * Transform raw compliance check into experience response
 */
export function transformComplianceToExperience(
  result: ComplianceCheckResult,
  userContext?: UserExperienceContext
): ComplianceExperienceResponse {
  const totalRulesChecked = result.violations.length + result.warnings.length;
  const violationCount = result.violations.length;
  const warningCount = result.warnings.length;
  const rulesCompliant =
    totalRulesChecked > 0
      ? totalRulesChecked - violationCount - warningCount
      : 0;

  // Determine overall status
  const overallStatus =
    violationCount > 0
      ? 'NON_COMPLIANT'
      : warningCount > 0
        ? 'NEEDS_ATTENTION'
        : 'COMPLIANT';

  // Calculate confidence score
  const confidenceScore = calculateComplianceConfidence(result);

  // Determine risk level
  const riskLevel = determineComplianceRiskLevel(result);

  // Determine decision
  const decision: 'APPROVED' | 'DENIED' | 'WARNING' =
    violationCount > 0 ? 'DENIED' : warningCount > 0 ? 'WARNING' : 'APPROVED';

  // Generate human-friendly explanation
  const explanation = generateComplianceExplanation(result, userContext);
  const humanMeaning = generateComplianceMeaning(result, userContext);

  // Generate reassurance
  const reassuranceMessage = generateComplianceReassurance(
    result,
    decision,
    userContext
  );

  // Generate next steps
  const nextSteps = generateComplianceNextSteps(result);

  // Generate legal references
  const legalReferences = generateComplianceLegalReferences(result);

  // Transform violations to user-friendly format
  const violations = result.violations.map((v) =>
    transformViolationToUserFriendly(v, userContext)
  );

  // Transform warnings to user-friendly format
  const warnings = result.warnings.map((w) =>
    transformWarningToUserFriendly(w, userContext)
  );

  return {
    decision,
    explanation,
    humanMeaning,
    riskLevel,
    confidenceScore,
    reassuranceMessage,
    nextSteps,
    legalReferences,
    technicalDetails: result,
    timestamp: new Date().toISOString(),
    sourceEngine: 'compliance-engine',
    responseId: generateUUID(),
    complianceSummary: {
      totalRulesChecked,
      rulesCompliant,
      violationCount,
      warningCount,
      overallStatus,
    },
    violations,
    warnings,
  };
}

function calculateComplianceConfidence(
  result: ComplianceCheckResult
): ConfidenceScore {
  // Compliance checks are deterministic rule evaluations
  // Confidence depends on data completeness and rule clarity

  if (result.violations.length === 0 && result.warnings.length === 0) {
    return 100; // Completely compliant = high confidence
  }

  if (result.violations.some((v) => v.severity === 'critical')) {
    return 95; // Critical violations = very confident in non-compliance
  }

  if (result.violations.length > 0) {
    return 90; // Regular violations = confident in non-compliance
  }

  return 85; // Only warnings = moderately confident
}

function determineComplianceRiskLevel(
  result: ComplianceCheckResult
): ExperienceRiskLevel {
  if (result.violations.some((v) => v.severity === 'critical')) {
    return 'CRITICAL';
  }

  if (result.violations.length > 3) {
    return 'HIGH';
  }

  if (result.violations.length > 0) {
    return 'MEDIUM';
  }

  if (result.warnings.length > 2) {
    return 'LOW';
  }

  return 'NONE';
}

function generateComplianceExplanation(
  result: ComplianceCheckResult,
  userContext?: UserExperienceContext
): string {
  const isAdvanced =
    userContext?.experienceLevel === 'advanced' ||
    userContext?.prefersDetailedExplanations;

  if (result.compliant) {
    return isAdvanced
      ? 'All Michigan ESTA 2025 requirements have been met. Your sick time policies and practices are fully compliant.'
      : "Everything looks good! You're following all the required sick time rules.";
  }

  const criticalCount = result.violations.filter(
    (v) => v.severity === 'critical'
  ).length;
  const errorCount = result.violations.filter(
    (v) => v.severity === 'error'
  ).length;

  if (criticalCount > 0) {
    return isAdvanced
      ? `Found ${criticalCount} critical compliance ${criticalCount === 1 ? 'violation' : 'violations'} and ${errorCount} ${errorCount === 1 ? 'error' : 'errors'} that must be addressed immediately to meet Michigan ESTA requirements.`
      : `We found ${criticalCount + errorCount} important ${criticalCount + errorCount === 1 ? 'issue' : 'issues'} that need your attention to stay compliant.`;
  }

  return isAdvanced
    ? `Found ${errorCount} compliance ${errorCount === 1 ? 'violation' : 'violations'} that should be corrected to meet Michigan ESTA requirements.`
    : `We found ${errorCount} ${errorCount === 1 ? 'issue' : 'issues'} that you should fix to stay compliant.`;
}

function generateComplianceMeaning(
  result: ComplianceCheckResult,
  userContext?: UserExperienceContext
): string {
  const role = userContext?.role || 'employer';

  if (result.compliant) {
    if (role === 'employee') {
      return 'Your sick time is being managed correctly. No action needed.';
    }
    return "You're meeting all legal requirements. No changes needed right now.";
  }

  const criticalCount = result.violations.filter(
    (v) => v.severity === 'critical'
  ).length;

  if (criticalCount > 0) {
    if (role === 'employee') {
      return 'There may be issues with how your sick time is being handled. We recommend discussing with your employer.';
    }
    return 'Immediate action required to avoid penalties and ensure employee rights are protected.';
  }

  if (role === 'employee') {
    return 'Some aspects of your sick time tracking need attention.';
  }
  return 'Some adjustments needed to ensure full compliance with state law.';
}

function generateComplianceReassurance(
  result: ComplianceCheckResult,
  decision: 'APPROVED' | 'DENIED' | 'WARNING',
  userContext?: UserExperienceContext
): ReassuranceMessage {
  if (decision === 'APPROVED') {
    return {
      message: "You're doing everything right.",
      context:
        "We've checked all the requirements and you're fully compliant. Keep up the great work!",
      tone: 'positive',
      emphasize: true,
    };
  }

  if (decision === 'WARNING') {
    return {
      message: "You're mostly compliant, with a few items to review.",
      context:
        "The issues we found are minor and easy to address. We'll guide you through them.",
      tone: 'encouraging',
      emphasize: false,
    };
  }

  // DENIED
  const hasCritical = result.violations.some((v) => v.severity === 'critical');
  const role = userContext?.role || 'employer';

  if (hasCritical) {
    if (role === 'employee') {
      return {
        message: 'We found some issues that need attention.',
        context:
          "Don't worry - we're here to help you understand your rights and get this resolved.",
        tone: 'empathetic',
        emphasize: true,
      };
    }
    return {
      message:
        "We've identified critical issues that need immediate attention.",
      context:
        "Don't worry - we'll guide you through exactly what to fix. You can resolve this.",
      tone: 'empathetic',
      emphasize: true,
    };
  }

  return {
    message: 'We found some compliance issues to address.',
    context:
      "The good news is we've identified exactly what needs to change. We'll help you fix it.",
    tone: 'encouraging',
    emphasize: false,
  };
}

function generateComplianceNextSteps(
  result: ComplianceCheckResult
): UserGuidanceHint[] {
  const steps: UserGuidanceHint[] = [];

  // Add steps for critical violations first
  const criticalViolations = result.violations.filter(
    (v) => v.severity === 'critical'
  );
  if (criticalViolations.length > 0) {
    steps.push({
      category: 'ACTION_REQUIRED',
      title: 'Fix critical compliance issues',
      description: `Address ${criticalViolations.length} critical ${criticalViolations.length === 1 ? 'violation' : 'violations'} immediately to avoid penalties.`,
      priority: 'urgent',
      estimatedMinutes: 15 * criticalViolations.length,
      helpLink: '/help/compliance/critical-violations',
    });
  }

  // Add steps for errors
  const errors = result.violations.filter((v) => v.severity === 'error');
  if (errors.length > 0) {
    steps.push({
      category: 'ACTION_REQUIRED',
      title: 'Resolve compliance violations',
      description: `Fix ${errors.length} ${errors.length === 1 ? 'violation' : 'violations'} to meet Michigan ESTA requirements.`,
      priority: 'high',
      estimatedMinutes: 10 * errors.length,
      helpLink: '/help/compliance/violations',
    });
  }

  // Add steps for warnings
  if (result.warnings.length > 0) {
    steps.push({
      category: 'RECOMMENDATION',
      title: 'Review compliance warnings',
      description: `Consider addressing ${result.warnings.length} ${result.warnings.length === 1 ? 'warning' : 'warnings'} to improve compliance posture.`,
      priority: 'medium',
      estimatedMinutes: 5 * result.warnings.length,
      helpLink: '/help/compliance/warnings',
    });
  }

  // Always add option to view full audit trail
  steps.push({
    category: 'INFORMATION',
    title: 'View complete compliance report',
    description:
      'See detailed audit trail and documentation for all compliance checks.',
    priority: 'low',
    estimatedMinutes: 5,
    helpLink: '/compliance/audit-trail',
  });

  return steps;
}

function generateComplianceLegalReferences(
  result: ComplianceCheckResult
): LegalReference[] {
  const references: LegalReference[] = [];

  // Add unique legal references from violations and warnings
  const codes = new Set<string>();

  result.violations.forEach((v) => {
    if (!codes.has(v.code)) {
      codes.add(v.code);
      references.push({
        citation: v.code,
        summary: v.rule,
        relevanceExplanation: `This rule was violated: ${v.message}`,
      });
    }
  });

  result.warnings.forEach((w) => {
    if (!codes.has(w.code)) {
      codes.add(w.code);
      references.push({
        citation: w.code,
        summary: w.rule,
        relevanceExplanation: `This rule triggered a warning: ${w.message}`,
      });
    }
  });

  // Always include the main ESTA reference
  if (!codes.has('ESTA-GENERAL')) {
    references.push({
      citation: 'Michigan ESTA 2025',
      summary: 'Earned Sick Time Act - Full Statute',
      relevanceExplanation:
        'This is the primary law governing paid sick time in Michigan.',
      officialLink: 'https://www.michigan.gov/esta',
    });
  }

  return references;
}

function transformViolationToUserFriendly(
  violation: ComplianceViolation,
  userContext?: UserExperienceContext
): {
  code: string;
  userFriendlyMessage: string;
  whatItMeans: string;
  howToFix: string;
  severity: 'error' | 'critical';
} {
  const isAdvanced =
    userContext?.experienceLevel === 'advanced' ||
    userContext?.prefersDetailedExplanations;

  return {
    code: violation.code,
    userFriendlyMessage: violation.message,
    whatItMeans: isAdvanced
      ? `This violates ${violation.rule}, which is a ${violation.severity === 'critical' ? 'critical' : 'important'} requirement under Michigan law.`
      : `This ${violation.severity === 'critical' ? 'must' : 'should'} be corrected to meet legal requirements.`,
    howToFix: violation.remediation || 'Contact support for guidance.',
    severity: violation.severity,
  };
}

function transformWarningToUserFriendly(
  warning: ComplianceWarning,
  userContext?: UserExperienceContext
): {
  code: string;
  userFriendlyMessage: string;
  whatToConsider: string;
  severity: 'warning';
} {
  const isAdvanced =
    userContext?.experienceLevel === 'advanced' ||
    userContext?.prefersDetailedExplanations;

  return {
    code: warning.code,
    userFriendlyMessage: warning.message,
    whatToConsider: isAdvanced
      ? `While not strictly required, ${warning.rule} is a best practice. ${warning.suggestion || ''}`
      : warning.suggestion || 'Consider reviewing this for best practices.',
    severity: 'warning',
  };
}

// ============================================================================
// Section 3: Generic Experience Response Builder
// ============================================================================

/**
 * Create a simple experience response for operations that don't need
 * specialized transformation
 */
export function createSimpleExperienceResponse<T>(
  decision: DecisionStatus,
  explanation: string,
  humanMeaning: string,
  technicalDetails: T,
  sourceEngine: string
): ExperienceResponse<T> {
  return {
    decision,
    explanation,
    humanMeaning,
    riskLevel: 'NONE',
    confidenceScore: 95,
    reassuranceMessage: {
      message: 'Operation completed successfully.',
      tone: 'neutral',
      emphasize: false,
    },
    nextSteps: [],
    legalReferences: [],
    technicalDetails,
    timestamp: new Date().toISOString(),
    sourceEngine,
    responseId: generateUUID(),
  };
}

// Note: No need to re-export as they're already exported above
