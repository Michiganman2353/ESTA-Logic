/**
 * Personalization Engine - Adaptive experience customization
 * Derives user profiles and personalizes flows based on business context
 */

export interface BusinessData {
  employeeCount: number;
  industry?: string;
  location?: string;
  hasMultipleLocations?: boolean;
  previousExperience?: boolean;
}

export interface UserProfile {
  size: number;
  industry?: string;
  complexityLevel: 'simple' | 'standard' | 'enterprise';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  needsGuidance: boolean;
}

export type FlowPath = 'quickPath' | 'standardPath' | 'enterprisePath' | 'guidedPath';

export class PersonalizationEngine {
  /**
   * Derive user profile from business data
   */
  static deriveProfile(data: BusinessData): UserProfile {
    const complexityLevel = this.determineComplexity(data);
    const experienceLevel = this.determineExperience(data);
    
    return {
      size: data.employeeCount,
      industry: data.industry,
      complexityLevel,
      experienceLevel,
      needsGuidance: experienceLevel === 'beginner' || complexityLevel === 'enterprise',
    };
  }

  /**
   * Determine complexity level based on business data
   */
  private static determineComplexity(data: BusinessData): UserProfile['complexityLevel'] {
    if (data.employeeCount > 50 || data.hasMultipleLocations) {
      return 'enterprise';
    } else if (data.employeeCount > 10) {
      return 'standard';
    }
    return 'simple';
  }

  /**
   * Determine experience level
   */
  private static determineExperience(data: BusinessData): UserProfile['experienceLevel'] {
    if (data.previousExperience) {
      return 'advanced';
    }
    if (data.employeeCount > 20) {
      return 'intermediate';
    }
    return 'beginner';
  }

  /**
   * Personalize flow path based on profile
   */
  static personalizeFlow(profile: UserProfile): FlowPath {
    if (profile.complexityLevel === 'enterprise') {
      return 'enterprisePath';
    }
    if (profile.needsGuidance || profile.experienceLevel === 'beginner') {
      return 'guidedPath';
    }
    if (profile.complexityLevel === 'simple' && profile.experienceLevel === 'advanced') {
      return 'quickPath';
    }
    return 'standardPath';
  }

  /**
   * Get recommended wizard steps based on profile
   */
  static getRecommendedSteps(profile: UserProfile): string[] {
    const baseSteps = ['intro', 'profile', 'policy', 'review', 'completion'];
    
    if (profile.complexityLevel === 'enterprise') {
      return ['intro', 'profile', 'locations', 'policy', 'integration', 'review', 'completion'];
    }
    
    if (profile.needsGuidance) {
      return ['intro', 'tutorial', ...baseSteps];
    }
    
    if (profile.complexityLevel === 'simple') {
      return ['intro', 'profile', 'policy', 'completion'];
    }
    
    return baseSteps;
  }

  /**
   * Customize messaging based on industry
   */
  static getIndustryCustomization(industry?: string): { language: string; examples: string[] } {
    switch (industry?.toLowerCase()) {
      case 'healthcare':
        return {
          language: 'healthcare-specific',
          examples: ['nurses', 'medical staff', 'shift workers'],
        };
      case 'restaurant':
      case 'hospitality':
        return {
          language: 'hospitality-specific',
          examples: ['servers', 'kitchen staff', 'hosts'],
        };
      case 'retail':
        return {
          language: 'retail-specific',
          examples: ['sales associates', 'cashiers', 'stock workers'],
        };
      default:
        return {
          language: 'general',
          examples: ['employees', 'team members', 'staff'],
        };
    }
  }
}
