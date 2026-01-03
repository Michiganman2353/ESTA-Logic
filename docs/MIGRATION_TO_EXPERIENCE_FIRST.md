# Migration Guide: Technology-First to Experience-First

This guide helps developers migrate from the old technology-first structure (`apps/frontend/`, `apps/backend/`) to the new experience-first guided compliance architecture (`app/`).

## Overview

ESTA-Logic has undergone a strategic reset from a technology-first platform to an experience-first guided compliance system. This migration guide helps transition existing features into the new TurboTax-inspired architecture.

## Philosophy Shift

### Before (Technology-First)

```
User → Menu → Feature → Technical Complexity
```

- Users navigate menus to find features
- All functionality exposed equally
- Technical details visible
- User figures out their own path

### After (Experience-First)

```
User → Guided Journey → Step → Confidence
```

- System guides users through journeys
- Features accessed through guided context
- Technical details hidden
- System determines optimal path

## Directory Structure Mapping

| Old Location                    | New Location           | Purpose                           |
| ------------------------------- | ---------------------- | --------------------------------- |
| `apps/frontend/src/components/` | `app/ui/components/`   | UI components (redesigned)        |
| `apps/frontend/src/pages/`      | `app/pages/`           | Page templates (journey-based)    |
| `apps/frontend/src/hooks/`      | `app/state/`           | State management (with auto-save) |
| `apps/backend/src/routes/`      | `app/core/navigation/` | Journey orchestration             |
| `apps/backend/src/services/`    | `app/core/compliance/` | Business logic                    |
| `libs/accrual-engine/`          | `app/core/compliance/` | Compliance calculations           |

## Migration Phases

### Phase 1: Documentation ✅ (Complete)

Strategic direction documents created, old tech docs archived.

### Phase 2: Core Architecture ✅ (Complete)

New `app/` structure with core modules implemented.

### Phase 3: UI Components (Current)

Migrate and redesign UI components for guided journeys.

### Phase 4: Journey Implementation

Convert features into guided step-by-step journeys.

### Phase 5: Data Layer Integration

Connect to Firebase, migrate state management.

### Phase 6: Feature Parity

Ensure all existing features work in new structure.

### Phase 7: Deprecation

Remove old structure, complete transition.

## Step-by-Step: Migrating a Feature

### Example: Employer Onboarding

#### Old Structure (Technology-First)

```typescript
// apps/frontend/src/pages/EmployerSetup.tsx
export function EmployerSetup() {
  return (
    <div>
      <h1>Employer Setup</h1>
      <CompanyInfoForm />
      <EmployeeCountForm />
      <PolicyConfigForm />
      <SubmitButton />
    </div>
  );
}
```

**Problems:**

- All forms shown at once (overwhelming)
- No guidance or explanation
- User must know what to do
- No progress indication
- No auto-save

#### New Structure (Experience-First)

**Step 1: Define the Journey**

```typescript
// app/core/navigation/journeys/employer-onboarding.ts
import { Journey } from '../GuidedFlowEngine';

export const employerOnboardingJourney: Journey = {
  id: 'employer-onboarding',
  name: 'Employer Setup',
  description: 'Get your company set up for ESTA compliance',
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to ESTA-Logic',
      description: "Let's get you set up",
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
      description: 'Basic information',
      component: 'CompanyInfoStep',
      validation: [
        {
          field: 'companyName',
          type: 'required',
          message: 'Company name is required',
        },
      ],
      guidance: {
        message: 'This helps us customize your compliance requirements.',
        helpText: "We only collect what's needed.",
      },
      nextStep: 'employee-count',
      canSkip: false,
      estimatedTime: 60,
    },
    // ... more steps
  ],
  branchingLogic: [],
  entryConditions: [],
  exitConditions: [],
};
```

**Step 2: Create Step Components**

```typescript
// app/ui/steps/CompanyInfoStep.tsx
import { ConfidenceMessages } from '../../ui/reassurance/confidence-messages';

export function CompanyInfoStep({ onNext, onBack }) {
  const [data, setData] = useState({});
  const guidance = ConfidenceMessages.getMessage('guidance.companyInfo');

  return (
    <GuidedStepLayout
      title="Tell us about your company"
      progress={{ current: 2, total: 5 }}
      guidance={guidance}
    >
      <CompanyInfoForm
        data={data}
        onChange={setData}
      />

      <StepNavigation>
        <BackButton onClick={onBack} />
        <NextButton onClick={() => onNext(data)} />
      </StepNavigation>

      <TrustIndicators>
        <TrustIndicator type="encrypted" />
        <TrustIndicator type="saved" />
      </TrustIndicators>
    </GuidedStepLayout>
  );
}
```

**Step 3: Create Page Container**

```typescript
// app/pages/Guided-Setup/EmployerOnboarding.tsx
import { guidedFlowEngine } from '../../core/navigation/GuidedFlowEngine';
import { guidedSessionStore } from '../../state/guided-session-store';

export function EmployerOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Start or resume journey
    const startJourney = async () => {
      const existing = guidedSessionStore.getActiveSession(userId);

      if (existing) {
        // Resume
        const step = await guidedFlowEngine.loadProgress(userId);
        setCurrentStep(step);
        setSession(existing);
      } else {
        // Start new
        const step = await guidedFlowEngine.start('employer-onboarding', userId);
        const newSession = guidedSessionStore.createSession(
          userId,
          'employer-onboarding',
          step
        );
        setCurrentStep(step);
        setSession(newSession);
      }
    };

    startJourney();
  }, []);

  const handleNext = async (stepData) => {
    // Update session
    guidedSessionStore.updateProgress(session.id, currentStep.id, stepData);

    // Move to next step
    const nextStep = await guidedFlowEngine.next(stepData);
    setCurrentStep(nextStep);
  };

  const handleBack = async () => {
    const previousStep = await guidedFlowEngine.back();
    setCurrentStep(previousStep);
  };

  // Render current step component
  const StepComponent = getStepComponent(currentStep?.component);

  return (
    <GuidedJourneyContainer>
      <ProgressBar {...guidedFlowEngine.getProgress()} />
      <StepComponent
        onNext={handleNext}
        onBack={handleBack}
      />
    </GuidedJourneyContainer>
  );
}
```

## Key Differences

### State Management

#### Old Way

```typescript
// Manual state management
const [companyName, setCompanyName] = useState('');
const [employeeCount, setEmployeeCount] = useState(0);
// No auto-save, data could be lost
```

#### New Way

```typescript
// Automatic with guided session store
guidedSessionStore.updateProgress(sessionId, stepId, {
  companyName: 'Acme',
  employeeCount: 10,
});
// Auto-saved every 2 seconds!
```

### Validation

#### Old Way

```typescript
// Manual validation in form
if (!companyName) {
  setError('Company name is required');
  return;
}
```

#### New Way

```typescript
// Declarative validation in journey definition
{
  field: 'companyName',
  type: 'required',
  message: 'Company name is needed' // Supportive, not critical
}
// Handled by GuidedFlowEngine automatically
```

### User Guidance

#### Old Way

```typescript
// Static help text
<FormField
  label="Company Name"
  helperText="Enter your company name"
/>
```

#### New Way

```typescript
// Context-aware guidance
const guidance = ConfidenceMessages.getMessage('guidance.companyInfo');
// "This helps us customize your compliance requirements. We only collect what's needed."

// Plus progress indication
<ProgressBar current={2} total={5} />
// "You're making progress. Just a few more steps."
```

### Security Display

#### Old Way

```typescript
// Security hidden
<FileUpload onUpload={handleUpload} />
// Users wonder: "Is this secure?"
```

#### New Way

```typescript
// Security visible and reassuring
<FileUpload onUpload={handleUpload}>
  <TrustIndicators>
    <TrustIndicator type="encrypted" />
    {/* "🔒 Your data is encrypted and secure" */}
    <TrustIndicator type="audited" />
    {/* "📋 Complete audit trail" */}
  </TrustIndicators>
</FileUpload>
// Users feel: "I'm protected"
```

## Migration Checklist

For each feature to migrate:

- [ ] **Define Journey**
  - [ ] Identify user persona
  - [ ] Map out step-by-step flow
  - [ ] Determine branching logic
  - [ ] Define validation rules
  - [ ] Write guidance content

- [ ] **Create Step Components**
  - [ ] Break down into logical steps
  - [ ] Add progress indicators
  - [ ] Include confidence messages
  - [ ] Add trust indicators
  - [ ] Implement validation

- [ ] **Integrate State Management**
  - [ ] Use GuidedSessionStore
  - [ ] Enable auto-save
  - [ ] Add resume capability
  - [ ] Track progress

- [ ] **Test User Experience**
  - [ ] Users feel guided, not overwhelmed
  - [ ] Clear what to do next
  - [ ] Progress always visible
  - [ ] Can pause and resume
  - [ ] Security feels reassuring

- [ ] **Update Documentation**
  - [ ] Add journey to docs
  - [ ] Update user guides
  - [ ] Screenshot new flow

## Common Patterns

### Pattern 1: Conditional Branching

```typescript
// Journey with branching based on data
{
  id: 'employee-count',
  // ...
  nextStep: (data) => {
    const count = data['employee-count']?.employeeCount;
    return count < 10
      ? 'small-employer-policy'
      : 'large-employer-policy';
  }
}
```

### Pattern 2: Multi-Step Forms

Instead of one large form, break into:

1. Basic info (30 seconds)
2. Details (1 minute)
3. Review (30 seconds)

Each step auto-saves, shows progress, provides guidance.

### Pattern 3: Document Upload

```typescript
// Old: Just an upload button
<input type="file" />

// New: Trust-building experience
<DocumentUploadStep
  guidance={ConfidenceMessages.guidance.documentUpload}
  trustIndicators={[
    TrustLayer.getEncryptionIndicator(),
    TrustLayer.getAuditIndicator()
  ]}
  onUpload={handleSecureUpload}
/>
```

## Testing Migration

```typescript
// Test guided journey
describe('Employer Onboarding Journey', () => {
  it('guides user through all steps', async () => {
    await guidedFlowEngine.start('employer-onboarding', userId);

    // Step 1: Welcome
    expect(currentStep.id).toBe('welcome');

    // Step 2: Company info
    await guidedFlowEngine.next({});
    expect(currentStep.id).toBe('company-info');

    // ... test each step
  });

  it('saves progress automatically', async () => {
    const session = guidedSessionStore.createSession(/*...*/);

    // Update data
    guidedSessionStore.updateProgress(session.id, 'step-1', { data });

    // Wait for auto-save
    await wait(2500);

    // Verify saved
    const saved = guidedSessionStore.getSession(session.id);
    expect(saved.state.stepData['step-1']).toEqual({ data });
  });
});
```

## Rollout Strategy

1. **Pilot Feature** - Migrate one complete journey
2. **User Feedback** - Test with real users
3. **Iterate** - Refine based on feedback
4. **Gradual Migration** - One journey at a time
5. **Parallel Run** - Old and new coexist temporarily
6. **Full Transition** - Deprecate old structure
7. **Cleanup** - Remove legacy code

## Getting Help

- Read [Experience Vision](./docs/Experience-Vision.md)
- Study [UX Blueprint](./docs/UX-Blueprint.md)
- Review [app/README.md](./app/README.md)
- Check example journeys in `app/core/navigation/`

## Success Criteria

✅ Users say: "This was easy"  
✅ Support tickets decrease  
✅ Completion rates increase  
✅ Users feel confident, not confused

---

**"We are no longer building software. We are building confidence in compliance."**
