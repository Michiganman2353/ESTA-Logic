# Guided Flow Engine — Architecture Concept

## Overview

The **Guided Flow Engine** is the central orchestration system that transforms ESTA-Logic from a traditional application into a TurboTax-style guided compliance experience. It coordinates user journeys, manages state transitions, provides contextual guidance, and ensures users always know what to do next.

---

## Design Philosophy

> "The system should guide the user, not the other way around."

Traditional applications expose functionality through menus, forms, and features. Users must figure out what to do and in what order. The Guided Flow Engine inverts this relationship — it leads users through a predetermined, optimized path based on their specific situation.

---

## Core Responsibilities

### 1. Journey Orchestration

**What it does:**
- Maintains the canonical path for each user persona
- Determines which step comes next based on current state
- Handles branching logic based on user responses
- Manages progress through multi-step workflows

**Example:**
```typescript
// Pseudo-code concept
guidedFlow.start('employer-onboarding')
  → Step 1: Company information
  → Step 2: Employee count (determines compliance tier)
  → Step 3a: Small employer setup (< 10 employees)
  → Step 3b: Large employer setup (≥ 10 employees)
  → Step 4: Policy configuration
  → Step 5: First employee addition
  → Complete: Dashboard access
```

### 2. State Management

**What it does:**
- Tracks where user is in their journey
- Persists progress automatically
- Allows users to resume from any point
- Maintains history of completed steps

**Key Features:**
- Auto-save on every interaction
- Resume capability after logout
- Undo/redo for recent steps
- Progress visualization

### 3. Contextual Guidance

**What it does:**
- Provides just-in-time explanations
- Offers help text specific to current step
- Explains "why" for each requirement
- Surfaces relevant compliance information

**Example:**
```typescript
// At employee count step
context.guidance = {
  title: "How many employees do you have?",
  explanation: "This determines your compliance requirements under Michigan ESTA.",
  helpText: "Count all employees, including part-time and seasonal workers.",
  legalReason: "Employers with 10+ employees have different accrual caps."
}
```

### 4. Validation & Guard Rails

**What it does:**
- Validates input before proceeding
- Prevents impossible states
- Enforces legal requirements
- Provides friendly error messages

**Example:**
```typescript
// Validation at policy configuration
if (accrualRate > legalMaximum) {
  return {
    valid: false,
    message: "This accrual rate exceeds Michigan ESTA requirements.",
    suggestion: "Maximum allowed is 1 hour per 30 hours worked.",
    action: "Adjust to recommended rate"
  }
}
```

### 5. Progress Indication

**What it does:**
- Shows current position in journey
- Estimates time to completion
- Celebrates milestones
- Maintains motivation

**UI Elements:**
- Step counter (e.g., "Step 3 of 7")
- Progress bar showing percentage
- Checkmarks for completed steps
- Clear "What's Next" messaging

---

## Architecture Components

### Journey Definitions

```typescript
interface Journey {
  id: string;
  name: string;
  description: string;
  steps: Step[];
  branchingLogic: BranchingRule[];
  entryConditions: Condition[];
  exitConditions: Condition[];
}

interface Step {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType;
  validation: ValidationRule[];
  guidance: GuidanceContent;
  nextStep: string | ((data: any) => string);
  canSkip: boolean;
  estimatedTime: number; // seconds
}
```

### State Machine

```typescript
interface FlowState {
  journeyId: string;
  currentStepId: string;
  completedSteps: string[];
  stepData: Record<string, any>;
  startedAt: Date;
  lastUpdated: Date;
  status: 'in-progress' | 'completed' | 'paused';
}
```

### Navigation Controller

```typescript
class GuidedFlowController {
  // Core navigation
  async start(journeyId: string): Promise<Step>;
  async next(stepData: any): Promise<Step>;
  async back(): Promise<Step>;
  async jumpTo(stepId: string): Promise<Step>;
  
  // State management
  async saveProgress(): Promise<void>;
  async loadProgress(): Promise<FlowState>;
  async reset(): Promise<void>;
  
  // Guidance
  getGuidance(stepId: string): GuidanceContent;
  getHelp(topic: string): HelpContent;
  
  // Progress tracking
  getProgress(): ProgressInfo;
  getEstimatedTimeRemaining(): number;
}
```

---

## User Experience Flow

### Starting a Journey

1. User arrives at application
2. System detects user type (employer vs employee)
3. Checks for existing in-progress journey
4. If exists: "Pick up where you left off?"
5. If new: "Let's get you set up"
6. Begins first step with clear expectations

### During Journey

1. User sees current step clearly highlighted
2. Form/interface for current step only (no distractions)
3. Guidance panel explains what/why
4. Validation happens inline as they type
5. "Next" button becomes active when step is valid
6. Progress bar updates on each step completion
7. Breadcrumbs show where they've been

### Completing Journey

1. Final step confirmation screen
2. Summary of all configured settings
3. Celebration/success message
4. Clear next actions
5. Transition to main application

---

## Implementation Strategy

### Phase 1: Foundation
- Build core GuidedFlowEngine class
- Create journey definition schema
- Implement basic state persistence
- Build simple step navigation

### Phase 2: Intelligence
- Add branching logic support
- Implement validation framework
- Create guidance content system
- Add progress tracking

### Phase 3: Polish
- Build smooth transitions
- Add animations and micro-interactions
- Implement auto-save
- Create help system overlay

### Phase 4: Scale
- Support multiple simultaneous journeys
- Add journey templates
- Enable admin journey editing
- Implement A/B testing for journeys

---

## Integration Points

### With Compliance Engine
- Guided Flow determines what compliance rules apply
- Compliance Engine validates configurations
- Flow surfaces compliance explanations

### With UI Components
- Flow Engine provides data for progress bars
- Flow manages which component renders
- Components report validation state back

### With Firebase/Backend
- Auto-save progress to Firestore
- Load user's last position on return
- Audit trail of journey completion

---

## Example: Employer Onboarding Journey

```typescript
const employerOnboardingJourney: Journey = {
  id: 'employer-onboarding',
  name: 'Employer Setup',
  description: 'Get your company set up for ESTA compliance',
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to ESTA-Logic',
      component: WelcomeStep,
      guidance: {
        message: "We'll walk you through setup one step at a time.",
        tone: 'reassuring'
      },
      canSkip: false
    },
    {
      id: 'company-info',
      title: 'Tell us about your company',
      component: CompanyInfoStep,
      validation: [
        required('companyName'),
        required('industry'),
        optional('website')
      ],
      guidance: {
        message: "This helps us customize your compliance requirements.",
        helpText: "We only collect what's needed for compliance."
      }
    },
    {
      id: 'employee-count',
      title: 'How many employees do you have?',
      component: EmployeeCountStep,
      validation: [
        required('employeeCount'),
        minimum('employeeCount', 1)
      ],
      guidance: {
        message: "This determines your ESTA compliance tier.",
        legalContext: "Different rules apply for employers with <10 vs ≥10 employees."
      },
      nextStep: (data) => {
        return data.employeeCount < 10 
          ? 'small-employer-policy' 
          : 'large-employer-policy';
      }
    },
    // ... more steps
  ]
};
```

---

## Benefits

### For Users
✅ Never confused about what to do next  
✅ Confidence that they're doing it right  
✅ Can't skip required steps  
✅ Clear progress indicators  
✅ Can pause and resume anytime

### For Development
✅ Centralized journey logic  
✅ Easy to modify flows without code changes  
✅ Consistent UX patterns  
✅ Testable journey definitions  
✅ Analytics on drop-off points

### For Business
✅ Higher completion rates  
✅ Fewer support requests  
✅ Better onboarding metrics  
✅ Data-driven journey optimization  
✅ Scalable to multiple journeys

---

## Future Enhancements

1. **Adaptive Journeys**: AI-powered path optimization based on user behavior
2. **Multi-Language**: Journey definitions support internationalization
3. **Voice Guidance**: Audio step-by-step instructions
4. **Smart Resume**: Detect incomplete journeys and proactively prompt
5. **Journey Analytics**: Heatmaps showing where users spend time
6. **Conditional Steps**: Show/hide steps based on real-time conditions
7. **Journey Sharing**: Employers can share setup journeys with colleagues

---

## Conclusion

The Guided Flow Engine is the architectural foundation that enables ESTA-Logic to deliver a TurboTax-quality guided experience. By centralizing journey orchestration, state management, and contextual guidance, we ensure every user feels supported, confident, and never overwhelmed.

**The result:** Users don't operate software — they complete journeys with a trusted guide.

---

**Related Documentation:**
- [UX Blueprint](./UX-Blueprint.md) — User experience principles
- [Strategic Roadmap](./ROADMAP.md) — Implementation phases
- [Experience Vision](./Experience-Vision.md) — Product direction
