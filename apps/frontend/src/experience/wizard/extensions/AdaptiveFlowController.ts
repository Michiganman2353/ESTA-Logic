/**
 * Adaptive Flow Controller - Dynamic flow routing
 * Controls wizard flow based on user profile and decisions
 */

import {
  PersonalizationEngine,
  UserProfile,
  FlowPath,
} from '../../intelligence/PersonalizationEngine';

export interface FlowDecision {
  nextStep: string;
  skipSteps?: string[];
  reason?: string;
}

export class AdaptiveFlowController {
  /**
   * Determine the next step based on user data and current position
   */
  static getNextStep(
    currentStep: string,
    userData: Record<string, unknown>,
    profile?: UserProfile
  ): FlowDecision {
    const userProfile = profile || this.deriveProfile(userData);
    const flowPath = PersonalizationEngine.personalizeFlow(userProfile);

    return this.routeByFlow(currentStep, flowPath, userProfile);
  }

  /**
   * Derive user profile from data
   */
  private static deriveProfile(userData: Record<string, unknown>): UserProfile {
    return PersonalizationEngine.deriveProfile({
      employeeCount: (userData.employeeCount as number) || 1,
      industry: userData.industry as string | undefined,
      hasMultipleLocations: userData.hasMultipleLocations as
        | boolean
        | undefined,
      previousExperience: userData.previousExperience as boolean | undefined,
    });
  }

  /**
   * Route to next step based on flow path
   */
  private static routeByFlow(
    currentStep: string,
    flowPath: FlowPath,
    profile: UserProfile
  ): FlowDecision {
    const flowSteps = this.getFlowSteps(flowPath, profile);
    const currentIndex = flowSteps.indexOf(currentStep);

    if (currentIndex === -1 || currentIndex === flowSteps.length - 1) {
      return { nextStep: 'completion' };
    }

    const nextStep = flowSteps[currentIndex + 1];
    return {
      nextStep: nextStep || 'completion',
      reason: `Following ${flowPath} for ${profile.complexityLevel} organization`,
    };
  }

  /**
   * Get ordered steps for a flow path
   */
  private static getFlowSteps(
    flowPath: FlowPath,
    _profile: UserProfile
  ): string[] {
    switch (flowPath) {
      case 'quickPath':
        return ['intro', 'profile', 'policy', 'completion'];

      case 'standardPath':
        return ['intro', 'profile', 'policy', 'review', 'completion'];

      case 'enterprisePath':
        return [
          'intro',
          'profile',
          'locations',
          'policy',
          'integration',
          'review',
          'completion',
        ];

      case 'guidedPath':
        return [
          'intro',
          'tutorial',
          'profile',
          'policy',
          'review',
          'completion',
        ];

      default:
        return ['intro', 'profile', 'policy', 'review', 'completion'];
    }
  }

  /**
   * Determine if a step should be skipped
   */
  static shouldSkipStep(
    stepId: string,
    userData: Record<string, unknown>,
    profile?: UserProfile
  ): boolean {
    const userProfile = profile || this.deriveProfile(userData);

    // Skip tutorial for advanced users
    if (stepId === 'tutorial' && userProfile.experienceLevel === 'advanced') {
      return true;
    }

    // Skip locations step for single-location businesses
    if (stepId === 'locations' && !userData.hasMultipleLocations) {
      return true;
    }

    // Skip integration step for simple orgs
    if (stepId === 'integration' && userProfile.complexityLevel === 'simple') {
      return true;
    }

    return false;
  }

  /**
   * Get recommended flow path for user
   */
  static getRecommendedFlow(userData: Record<string, unknown>): {
    path: FlowPath;
    steps: string[];
    estimatedTime: number;
  } {
    const profile = this.deriveProfile(userData);
    const path = PersonalizationEngine.personalizeFlow(profile);
    const steps = this.getFlowSteps(path, profile);

    return {
      path,
      steps,
      estimatedTime: this.estimateCompletionTime(steps.length, profile),
    };
  }

  /**
   * Estimate completion time in minutes
   */
  private static estimateCompletionTime(
    stepCount: number,
    profile: UserProfile
  ): number {
    const baseTimePerStep = 3; // minutes
    const experienceMultiplier =
      profile.experienceLevel === 'beginner' ? 1.5 : 1.0;

    return Math.ceil(stepCount * baseTimePerStep * experienceMultiplier);
  }
}
