/**
 * GuidedFlowEngine - Core Journey Orchestration System
 *
 * This is the heart of the ESTA-Logic experience-first architecture.
 * It manages user journeys, determines next steps, provides contextual guidance,
 * and ensures users always feel supported and guided through compliance.
 *
 * Philosophy: "The system should guide the user, not the other way around."
 */

/**
 * Represents a single step in a guided journey
 */
export interface Step {
  id: string;
  title: string;
  description: string;

  /** Component to render for this step */
  component: string; // Component name/path

  /** Validation rules for this step */
  validation: ValidationRule[];

  /** Contextual guidance and help */
  guidance: GuidanceContent;

  /** Determines next step (can be dynamic based on data) */
  nextStep: string | ((data: any) => string);

  /** Can user skip this step? */
  canSkip: boolean;

  /** Estimated time to complete (seconds) */
  estimatedTime: number;
}

/**
 * Validation rule for a step
 */
export interface ValidationRule {
  field: string;
  type: 'required' | 'email' | 'number' | 'custom';
  message: string;
  validator?: (value: any) => boolean;
}

/**
 * Guidance content for a step
 */
export interface GuidanceContent {
  /** Main explanation of what to do */
  message: string;

  /** Optional help text */
  helpText?: string;

  /** Legal/compliance context */
  legalContext?: string;

  /** Examples to show */
  examples?: string[];

  /** Link to learn more */
  learnMoreUrl?: string;
}

/**
 * Complete journey definition
 */
export interface Journey {
  id: string;
  name: string;
  description: string;

  /** All steps in this journey */
  steps: Step[];

  /** Branching logic for conditional paths */
  branchingLogic: BranchingRule[];

  /** Conditions to enter this journey */
  entryConditions: Condition[];

  /** Conditions to complete this journey */
  exitConditions: Condition[];
}

/**
 * Branching rule for conditional journey paths
 */
export interface BranchingRule {
  stepId: string;
  condition: (data: any) => boolean;
  targetStepId: string;
}

/**
 * Condition for journey entry/exit
 */
export interface Condition {
  type: 'user-role' | 'data-present' | 'custom';
  check: (context: any) => boolean;
}

/**
 * Current state of a journey in progress
 */
export interface FlowState {
  /** Which journey is active */
  journeyId: string;

  /** Which user is on this journey */
  userId: string;

  /** Current step ID */
  currentStepId: string;

  /** Steps completed so far */
  completedSteps: string[];

  /** Data collected from each step */
  stepData: Record<string, any>;

  /** When journey started */
  startedAt: Date;

  /** Last update timestamp */
  lastUpdatedAt: Date;

  /** Estimated completion time */
  estimatedCompletion?: Date;

  /** Journey status */
  status: 'in-progress' | 'paused' | 'completed';
}

/**
 * Progress information for UI display
 */
export interface ProgressInfo {
  currentStep: number;
  totalSteps: number;
  percentComplete: number;
  estimatedTimeRemaining: number; // seconds
  completedSteps: string[];
}

/**
 * GuidedFlowEngine - Main orchestration class
 *
 * Manages the lifecycle of guided journeys, determines next steps,
 * validates user input, and provides contextual guidance.
 */
export class GuidedFlowEngine {
  private journeys: Map<string, Journey>;
  private currentState: FlowState | null;

  constructor() {
    this.journeys = new Map();
    this.currentState = null;
  }

  /**
   * Register a journey definition
   */
  registerJourney(journey: Journey): void {
    this.journeys.set(journey.id, journey);
  }

  /**
   * Start a new journey
   */
  async start(journeyId: string, userId: string): Promise<Step> {
    const journey = this.journeys.get(journeyId);
    if (!journey) {
      throw new Error(`Journey not found: ${journeyId}`);
    }

    // Check entry conditions
    const canEnter = journey.entryConditions.every((condition) =>
      condition.check({ userId })
    );

    if (!canEnter) {
      throw new Error(`Entry conditions not met for journey: ${journeyId}`);
    }

    // Initialize state
    this.currentState = {
      journeyId,
      userId,
      currentStepId: journey.steps[0].id,
      completedSteps: [],
      stepData: {},
      startedAt: new Date(),
      lastUpdatedAt: new Date(),
      status: 'in-progress',
    };

    // Save state (would persist to database in real implementation)
    await this.saveProgress();

    return journey.steps[0];
  }

  /**
   * Move to next step with collected data
   */
  async next(stepData: any): Promise<Step> {
    if (!this.currentState) {
      throw new Error('No active journey');
    }

    const journey = this.journeys.get(this.currentState.journeyId);
    if (!journey) {
      throw new Error('Journey not found');
    }

    const currentStep = journey.steps.find(
      (s) => s.id === this.currentState!.currentStepId
    );
    if (!currentStep) {
      throw new Error('Current step not found');
    }

    // Validate step data
    const validationErrors = this.validateStep(currentStep, stepData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Store step data
    this.currentState.stepData[currentStep.id] = stepData;
    this.currentState.completedSteps.push(currentStep.id);

    // Determine next step
    const nextStepId =
      typeof currentStep.nextStep === 'function'
        ? currentStep.nextStep(this.currentState.stepData)
        : currentStep.nextStep;

    const nextStep = journey.steps.find((s) => s.id === nextStepId);
    if (!nextStep) {
      // Journey complete
      this.currentState.status = 'completed';
      await this.saveProgress();
      throw new Error('Journey completed');
    }

    // Update state
    this.currentState.currentStepId = nextStepId;
    this.currentState.lastUpdatedAt = new Date();

    await this.saveProgress();

    return nextStep;
  }

  /**
   * Go back to previous step
   */
  async back(): Promise<Step> {
    if (!this.currentState) {
      throw new Error('No active journey');
    }

    const journey = this.journeys.get(this.currentState.journeyId);
    if (!journey) {
      throw new Error('Journey not found');
    }

    if (this.currentState.completedSteps.length === 0) {
      throw new Error('Already at first step');
    }

    // Get previous step
    const previousStepId =
      this.currentState.completedSteps[
        this.currentState.completedSteps.length - 1
      ];

    const previousStep = journey.steps.find((s) => s.id === previousStepId);
    if (!previousStep) {
      throw new Error('Previous step not found');
    }

    // Update state
    this.currentState.currentStepId = previousStepId;
    this.currentState.completedSteps.pop();
    this.currentState.lastUpdatedAt = new Date();

    await this.saveProgress();

    return previousStep;
  }

  /**
   * Get current progress information
   */
  getProgress(): ProgressInfo {
    if (!this.currentState) {
      throw new Error('No active journey');
    }

    const journey = this.journeys.get(this.currentState.journeyId);
    if (!journey) {
      throw new Error('Journey not found');
    }

    const totalSteps = journey.steps.length;
    const completedCount = this.currentState.completedSteps.length;
    const percentComplete = Math.round((completedCount / totalSteps) * 100);

    // Calculate estimated time remaining
    const remainingSteps = journey.steps.slice(completedCount);
    const estimatedTimeRemaining = remainingSteps.reduce(
      (sum, step) => sum + step.estimatedTime,
      0
    );

    return {
      currentStep: completedCount + 1,
      totalSteps,
      percentComplete,
      estimatedTimeRemaining,
      completedSteps: [...this.currentState.completedSteps],
    };
  }

  /**
   * Get guidance for current step
   */
  getGuidance(): GuidanceContent {
    if (!this.currentState) {
      throw new Error('No active journey');
    }

    const journey = this.journeys.get(this.currentState.journeyId);
    if (!journey) {
      throw new Error('Journey not found');
    }

    const currentStep = journey.steps.find(
      (s) => s.id === this.currentState!.currentStepId
    );
    if (!currentStep) {
      throw new Error('Current step not found');
    }

    return currentStep.guidance;
  }

  /**
   * Save progress to persistence layer
   */
  private async saveProgress(): Promise<void> {
    // In real implementation, would save to Firestore
    // For now, just store in memory
    console.log('Saving progress:', this.currentState);
  }

  /**
   * Load progress from persistence layer
   */
  async loadProgress(userId: string): Promise<FlowState | null> {
    // In real implementation, would load from Firestore
    // For now, return current state if user matches
    if (this.currentState && this.currentState.userId === userId) {
      return this.currentState;
    }
    return null;
  }

  /**
   * Validate step data against rules
   */
  private validateStep(step: Step, data: any): string[] {
    const errors: string[] = [];

    for (const rule of step.validation) {
      const value = data[rule.field];

      switch (rule.type) {
        case 'required':
          if (value === undefined || value === null || value === '') {
            errors.push(rule.message);
          }
          break;

        case 'email':
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push(rule.message);
          }
          break;

        case 'number':
          if (value && isNaN(Number(value))) {
            errors.push(rule.message);
          }
          break;

        case 'custom':
          if (rule.validator && !rule.validator(value)) {
            errors.push(rule.message);
          }
          break;
      }
    }

    return errors;
  }

  /**
   * Reset current journey
   */
  async reset(): Promise<void> {
    this.currentState = null;
  }
}

/**
 * Singleton instance for global access
 */
export const guidedFlowEngine = new GuidedFlowEngine();

/**
 * Example: Employer Onboarding Journey
 * This demonstrates how to define a complete guided journey
 */
export const employerOnboardingJourney: Journey = {
  id: 'employer-onboarding',
  name: 'Employer Setup',
  description: 'Get your company set up for ESTA compliance',

  steps: [
    {
      id: 'welcome',
      title: 'Welcome to ESTA-Logic',
      description: "Let's get you set up for Michigan ESTA compliance",
      component: 'WelcomeStep',
      validation: [],
      guidance: {
        message:
          "You're in the right place. We'll walk you through setup one step at a time.",
      },
      nextStep: 'company-info',
      canSkip: false,
      estimatedTime: 30,
    },
    {
      id: 'company-info',
      title: 'Tell us about your company',
      description: 'Basic information to get started',
      component: 'CompanyInfoStep',
      validation: [
        {
          field: 'companyName',
          type: 'required',
          message: 'Company name is required',
        },
        {
          field: 'industry',
          type: 'required',
          message: 'Please select your industry',
        },
      ],
      guidance: {
        message: 'This helps us customize your compliance requirements.',
        helpText: "We only collect what's needed for compliance.",
      },
      nextStep: 'employee-count',
      canSkip: false,
      estimatedTime: 60,
    },
    {
      id: 'employee-count',
      title: 'How many employees do you have?',
      description: 'This determines your compliance tier',
      component: 'EmployeeCountStep',
      validation: [
        {
          field: 'employeeCount',
          type: 'required',
          message: 'Employee count is required',
        },
        {
          field: 'employeeCount',
          type: 'number',
          message: 'Must be a valid number',
        },
      ],
      guidance: {
        message: 'This determines your ESTA compliance tier.',
        legalContext:
          'Different rules apply for employers with <10 vs ≥10 employees.',
        examples: [
          'Small employer (< 10): 40 hour accrual cap',
          'Large employer (≥ 10): 72 hour accrual cap',
        ],
      },
      nextStep: (data) => {
        return data['employee-count']?.employeeCount < 10
          ? 'small-employer-policy'
          : 'large-employer-policy';
      },
      canSkip: false,
      estimatedTime: 45,
    },
  ],

  branchingLogic: [],
  entryConditions: [],
  exitConditions: [],
};

// Register the example journey
guidedFlowEngine.registerJourney(employerOnboardingJourney);
