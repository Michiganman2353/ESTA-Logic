/**
 * Decision Engine - Intelligent decision explanation
 * Explains recommendations and provides confidence levels
 */

export interface DecisionExplanation {
  recommendation: string;
  why: string;
  confidence: 'High' | 'Medium' | 'Low';
  factors?: string[];
  alternativeOptions?: string[];
}

export type DecisionReason =
  | 'organizationSize'
  | 'legalRequirement'
  | 'bestPractice'
  | 'riskMitigation'
  | 'efficiency'
  | 'userPreference';

export class DecisionEngine {
  /**
   * Explain a decision with reasoning
   */
  static explain(
    reason: string,
    context?: Record<string, unknown>
  ): DecisionExplanation {
    return {
      recommendation: this.getRecommendation(reason, context),
      why: reason,
      confidence: this.assessConfidence(reason, context),
      factors: this.getDecisionFactors(reason, context),
    };
  }

  /**
   * Get recommendation text based on reason
   */
  private static getRecommendation(
    reason: string,
    context?: Record<string, unknown>
  ): string {
    const employeeCount = context?.employeeCount as number | undefined;

    if (reason.includes('size') && employeeCount) {
      if (employeeCount > 50) {
        return 'Based on your organization size and legal requirements, we recommend the comprehensive tracking system.';
      } else {
        return 'Based on your organization size, we recommend the standard tracking system.';
      }
    }

    return 'Based on your organization size and legal requirements, we recommend this approach for optimal compliance.';
  }

  /**
   * Assess confidence level
   */
  private static assessConfidence(
    reason: string,
    context?: Record<string, unknown>
  ): 'High' | 'Medium' | 'Low' {
    if (reason.includes('legal') || reason.includes('requirement')) {
      return 'High';
    }
    if (context && Object.keys(context).length > 2) {
      return 'High';
    }
    return 'Medium';
  }

  /**
   * Get factors that influenced the decision
   */
  private static getDecisionFactors(
    reason: string,
    context?: Record<string, unknown>
  ): string[] {
    const factors: string[] = [];

    if (context?.employeeCount) {
      factors.push(`Organization size: ${context.employeeCount} employees`);
    }

    if (context?.industry) {
      factors.push(`Industry: ${context.industry}`);
    }

    if (reason.includes('legal')) {
      factors.push('Michigan ESTA legal requirements');
    }

    if (reason.includes('best')) {
      factors.push('Industry best practices');
    }

    return factors;
  }

  /**
   * Explain policy recommendation
   */
  static explainPolicyRecommendation(
    employeeCount: number,
    hasExistingPolicy: boolean
  ): DecisionExplanation {
    const threshold = 50;
    const isLargeEmployer = employeeCount > threshold;

    return {
      recommendation: isLargeEmployer
        ? 'We recommend implementing the comprehensive sick time policy with advanced tracking.'
        : 'We recommend the standard sick time policy, which meets all Michigan ESTA requirements.',
      why: isLargeEmployer
        ? `With ${employeeCount} employees, your organization falls under enhanced compliance requirements.`
        : `With ${employeeCount} employees, the standard policy provides full compliance.`,
      confidence: 'High',
      factors: [
        `Employee count: ${employeeCount}`,
        `Michigan ESTA threshold: ${threshold} employees`,
        hasExistingPolicy ? 'Existing policy detected' : 'No existing policy',
      ],
      alternativeOptions: hasExistingPolicy
        ? ['Update existing policy', 'Create new policy']
        : undefined,
    };
  }

  /**
   * Explain accrual rate recommendation
   */
  static explainAccrualRate(employeeCount: number): DecisionExplanation {
    const rate =
      employeeCount > 50
        ? '1 hour per 30 hours worked'
        : '1 hour per 35 hours worked';

    return {
      recommendation: `Recommended accrual rate: ${rate}`,
      why: 'This rate ensures compliance with Michigan ESTA requirements based on your organization size.',
      confidence: 'High',
      factors: [
        `Employee count: ${employeeCount}`,
        'Michigan ESTA legal requirements',
        'Industry standard practices',
      ],
    };
  }
}
