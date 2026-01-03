/\*\*

- Step Components README
-
- Guide for creating and using step components in guided journeys
  \*/

# Step Components

Step components are the building blocks of guided journeys in ESTA-Logic. Each step represents a single, focused interaction point in a user's compliance journey.

## Design Philosophy

**"One question, one screen, one decision at a time."**

Step components follow the TurboTax-inspired guided experience model:

- Present one clear task per step
- Provide contextual guidance and help
- Validate inputs supportively
- Show progress and reassurance
- Enable easy navigation (back/forward)

## Available Step Components

### WelcomeStep

**Purpose:** Emotional grounding and journey initialization  
**When to use:** First step of any journey  
**Key features:**

- Warm, reassuring welcome message
- Clear expectations (time, steps)
- Trust indicators
- Single clear CTA

```typescript
<WelcomeStep
  userType="employer"
  onContinue={handleContinue}
  progress={{ estimatedTime: 180, totalSteps: 6 }}
/>
```

### CompanyInfoStep

**Purpose:** Collect company information  
**When to use:** Early in employer onboarding  
**Key features:**

- Clear field labels with contextual help
- Supportive validation messages
- Optional fields clearly marked
- Guidance on why information is needed

```typescript
<CompanyInfoStep
  initialData={existingData}
  onNext={handleNext}
  onBack={handleBack}
  errors={validationErrors}
/>
```

### EmployeeCountStep

**Purpose:** Collect employee count and show tier implications  
**When to use:** After company info, before policy setup  
**Key features:**

- Real-time tier preview
- Clear explanation of ESTA tiers
- Legal context in plain language
- Visual tier differentiation

```typescript
<EmployeeCountStep
  initialData={{ employeeCount: 5 }}
  onNext={handleNext}
  onBack={handleBack}
/>
```

## Creating a New Step Component

### Template

```typescript
import React, { useState } from 'react';

export interface YourStepData {
  // Define data structure
}

export interface YourStepProps {
  initialData?: Partial<YourStepData>;
  onNext: (data: YourStepData) => void;
  onBack: () => void;
  errors?: Record<string, string>;
}

export const YourStep: React.FC<YourStepProps> = ({
  initialData = {},
  onNext,
  onBack,
  errors = {}
}) => {
  const [formData, setFormData] = useState<YourStepData>({
    // Initialize from initialData
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate
    // Call onNext with data
  };

  return (
    <div className="your-step">
      {/* Step Header */}
      <div className="step-header">
        <h2 className="step-title">Clear, Action-Oriented Title</h2>
        <p className="step-description">
          Brief explanation of what and why
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="step-form">
        {/* Fields */}

        {/* Guidance */}
        <div className="guidance-box">
          <div className="guidance-icon">💡</div>
          <div className="guidance-content">
            <div className="guidance-title">Why this matters</div>
            <div className="guidance-text">
              Clear, supportive explanation
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="step-navigation">
          <button type="button" className="btn-secondary" onClick={onBack}>
            ← Back
          </button>
          <button type="submit" className="btn-primary">
            Continue →
          </button>
        </div>
      </form>

      {/* Reassurance */}
      <div className="step-footer">
        <div className="reassurance-message">
          <span className="reassurance-icon">💾</span>
          <span className="reassurance-text">
            Progress automatically saved
          </span>
        </div>
      </div>
    </div>
  );
};
```

### Best Practices

#### Content

- **Title:** Action-oriented, clear (e.g., "Tell us about your company")
- **Description:** Brief explanation of what and why
- **Fields:** One primary focus per step
- **Guidance:** Contextual help that answers "why"
- **Validation:** Supportive, never critical

#### Tone

- Use conversational language
- Avoid legal jargon (or explain it)
- Focus on helping, not commanding
- Provide reassurance throughout

#### Structure

- Clear visual hierarchy
- Ample whitespace
- Grouped related fields
- Prominent navigation
- Visible progress indication

#### Validation

- Validate on blur or submit
- Show supportive error messages
- Explain what's needed and why
- Never make user feel at fault

#### Accessibility

- Proper label/input associations
- ARIA labels for screen readers
- Keyboard navigation support
- Focus management
- Error announcements

## Step Data Flow

```
Parent Component
    ↓
  Step Component
    ↓
  User Interaction
    ↓
  Validation
    ↓
  onNext(data) callback
    ↓
  Parent updates state
    ↓
  Navigate to next step
```

## Integration with GuidedFlowEngine

Steps are defined in journey configurations:

```typescript
{
  id: 'step-id',
  title: 'Step Title',
  description: 'Step description',
  component: 'YourStep', // Component name
  validation: [
    {
      field: 'fieldName',
      type: 'required',
      message: 'Supportive message'
    }
  ],
  guidance: {
    message: 'Why this step matters',
    helpText: 'Additional context'
  },
  nextStep: 'next-step-id',
  canSkip: false,
  estimatedTime: 60
}
```

## Styling Guidelines

### Colors

- Primary action: `#2563eb` (Blue)
- Secondary action: White with border
- Success: `#10b981` (Green)
- Error support: `#fef2f2` background, `#991b1b` text
- Guidance: `#f0f9ff` background

### Typography

- Title: 1.875rem, weight 600
- Description: 1rem, color #6a6a6a
- Field labels: 0.875rem, weight 500
- Help text: 0.875rem, color #6a6a6a

### Spacing

- Step header: 32px bottom margin
- Form fields: 24px bottom margin
- Navigation: 32px top margin
- Footer: 16px top padding

### Interactive Elements

- Buttons: 12px vertical, 32px horizontal padding
- Inputs: 12px padding, 6px border-radius
- Hover states: 0.2s transition
- Focus: Blue outline with shadow

## Testing Step Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import YourStep from './YourStep';

describe('YourStep', () => {
  it('renders with initial data', () => {
    render(
      <YourStep
        initialData={{ field: 'value' }}
        onNext={jest.fn()}
        onBack={jest.fn()}
      />
    );

    expect(screen.getByLabelText('Field')).toHaveValue('value');
  });

  it('validates required fields', () => {
    const onNext = jest.fn();
    render(
      <YourStep
        onNext={onNext}
        onBack={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText('Continue →'));
    expect(onNext).not.toHaveBeenCalled();
  });

  it('calls onNext with data on valid submit', () => {
    const onNext = jest.fn();
    render(
      <YourStep
        onNext={onNext}
        onBack={jest.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Field'), {
      target: { value: 'test' }
    });
    fireEvent.click(screen.getByText('Continue →'));

    expect(onNext).toHaveBeenCalledWith({ field: 'test' });
  });
});
```

## Questions?

See:

- [GuidedFlowEngine Documentation](../../core/navigation/GuidedFlowEngine.ts)
- [UX Blueprint](../../../docs/UX-Blueprint.md)
- [Design Tone Guide](../../../docs/Design-Tone-Guide.md)
