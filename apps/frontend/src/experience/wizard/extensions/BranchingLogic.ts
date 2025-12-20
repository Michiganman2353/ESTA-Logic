/**
 * Branching Logic - Conditional flow routing
 * Handles complex decision trees and conditional navigation
 */

export type BranchCondition = (data: Record<string, unknown>) => boolean;

export interface BranchRule {
  id: string;
  condition: BranchCondition;
  trueStep: string;
  falseStep: string;
  description?: string;
}

export interface Branch {
  fromStep: string;
  rules: BranchRule[];
  defaultStep: string;
}

export class BranchingLogic {
  private static branches: Map<string, Branch> = new Map();

  /**
   * Register a branching point
   */
  static registerBranch(branch: Branch): void {
    this.branches.set(branch.fromStep, branch);
  }

  /**
   * Evaluate branching logic for a step
   */
  static evaluateBranch(
    currentStep: string,
    userData: Record<string, unknown>
  ): string | null {
    const branch = this.branches.get(currentStep);
    
    if (!branch) {
      return null; // No branching for this step
    }

    // Evaluate rules in order
    for (const rule of branch.rules) {
      if (rule.condition(userData)) {
        return rule.trueStep;
      }
    }

    // No rules matched, use default
    return branch.defaultStep;
  }

  /**
   * Check if step has branching logic
   */
  static hasBranching(stepId: string): boolean {
    return this.branches.has(stepId);
  }

  /**
   * Get all registered branches
   */
  static getAllBranches(): Map<string, Branch> {
    return new Map(this.branches);
  }

  /**
   * Clear all branching rules (useful for testing)
   */
  static clearBranches(): void {
    this.branches.clear();
  }

  /**
   * Pre-configured branching rules for common scenarios
   */
  static setupDefaultBranches(): void {
    // Branch based on employee count
    this.registerBranch({
      fromStep: 'profile',
      rules: [
        {
          id: 'large-employer',
          condition: (data) => (data.employeeCount as number) > 50,
          trueStep: 'enterprise-setup',
          falseStep: 'standard-setup',
          description: 'Route to enterprise setup for large employers',
        },
      ],
      defaultStep: 'standard-setup',
    });

    // Branch based on existing policy
    this.registerBranch({
      fromStep: 'policy-check',
      rules: [
        {
          id: 'has-existing-policy',
          condition: (data) => data.hasExistingPolicy === true,
          trueStep: 'policy-update',
          falseStep: 'policy-create',
          description: 'Route to update or create policy',
        },
      ],
      defaultStep: 'policy-create',
    });

    // Branch based on integration needs
    this.registerBranch({
      fromStep: 'integration-question',
      rules: [
        {
          id: 'needs-payroll-integration',
          condition: (data) => data.needsPayrollIntegration === true,
          trueStep: 'integration-setup',
          falseStep: 'manual-setup',
          description: 'Route to integration or manual setup',
        },
      ],
      defaultStep: 'manual-setup',
    });

    // Branch based on multi-location
    this.registerBranch({
      fromStep: 'location-question',
      rules: [
        {
          id: 'multi-location',
          condition: (data) => data.hasMultipleLocations === true,
          trueStep: 'locations-setup',
          falseStep: 'single-location-setup',
          description: 'Route to multi-location or single-location setup',
        },
      ],
      defaultStep: 'single-location-setup',
    });
  }
}

// Common condition helpers
export const BranchConditions = {
  /**
   * Check if employee count exceeds threshold
   */
  employeeCountGreaterThan: (threshold: number): BranchCondition => {
    return (data) => (data.employeeCount as number) > threshold;
  },

  /**
   * Check if industry matches
   */
  industryEquals: (industry: string): BranchCondition => {
    return (data) => data.industry === industry;
  },

  /**
   * Check if field has specific value
   */
  fieldEquals: (field: string, value: unknown): BranchCondition => {
    return (data) => data[field] === value;
  },

  /**
   * Check if field exists and is truthy
   */
  fieldExists: (field: string): BranchCondition => {
    return (data) => !!data[field];
  },

  /**
   * Combine multiple conditions with AND
   */
  and: (...conditions: BranchCondition[]): BranchCondition => {
    return (data) => conditions.every((condition) => condition(data));
  },

  /**
   * Combine multiple conditions with OR
   */
  or: (...conditions: BranchCondition[]): BranchCondition => {
    return (data) => conditions.some((condition) => condition(data));
  },

  /**
   * Negate a condition
   */
  not: (condition: BranchCondition): BranchCondition => {
    return (data) => !condition(data);
  },
};
