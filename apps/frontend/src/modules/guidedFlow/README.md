# Guided Flow Module

## Overview

The Guided Flow module provides a TurboTax-style wizard experience for ESTA compliance setup. It guides employers through a step-by-step process to configure their sick time policies based on Michigan law.

## Features

- **Progressive Disclosure**: Information is revealed step-by-step to prevent overwhelming users
- **State Persistence**: User progress is automatically saved to localStorage
- **Responsive Design**: Works seamlessly on mobile and desktop
- **Secure Camera Integration**: Capture compliance documents directly from the device
- **Policy Automation**: Automatically determines correct policy based on business size
- **Visual Progress**: Clear progress indicators show users where they are in the flow

## Architecture

### Components

```
guidedFlow/
├── WizardContext.tsx        # State management and persistence
├── WizardEngine.tsx         # Main orchestrator with progress bar
├── hooks/
│   └── useWizardPersistence.ts  # Persistence hook
├── steps/
│   ├── IntroStep.tsx         # Welcome screen
│   ├── EmployerTypeStep.tsx  # Employer type selection
│   ├── EmployeeCountStep.tsx # Employee count input
│   ├── PolicyLogicStep.tsx   # Policy configuration display
│   ├── SecureCameraStep.tsx  # Document capture
│   └── SummaryStep.tsx       # Final summary & certificate
└── index.ts                  # Public exports
```

### Data Flow

1. **WizardContext** provides global state accessible to all steps
2. Each step component accesses state via `useWizard()` hook
3. Steps update state by calling `update()` with partial data
4. Navigation between steps is controlled by `setStep()`
5. All data is automatically persisted to localStorage

## Usage

### Basic Implementation

```tsx
import { WizardEngine, WizardProvider } from '@/modules/guidedFlow';

function GuidedFlowPage() {
  return (
    <WizardProvider>
      <WizardEngine />
    </WizardProvider>
  );
}
```

### Accessing Wizard State

```tsx
import { useWizard } from '@/modules/guidedFlow';

function CustomStep() {
  const { data, update, step, setStep } = useWizard();

  const handleContinue = () => {
    update({ customField: 'value' });
    setStep(step + 1);
  };

  return (
    <div>
      <h1>Current employee count: {data.employeeCount}</h1>
      <button onClick={handleContinue}>Continue</button>
    </div>
  );
}
```

### Persistence Hook

```tsx
import { useWizardPersistence } from '@/modules/guidedFlow';

function StatusBar() {
  const { isInProgress, currentStep, hasData } = useWizardPersistence();

  return (
    <div>
      {isInProgress && <p>Resume your progress from step {currentStep}</p>}
    </div>
  );
}
```

## Step Details

### IntroStep

- Welcomes users to the guided flow
- Explains what they'll accomplish
- Shows trust indicators about data persistence

### EmployerTypeStep

- Four employer categories: Small Business, Large Business, Municipal, Nonprofit
- Visual cards with icons and descriptions
- Contextual help for each type

### EmployeeCountStep

- Number input with validation
- Real-time policy tier preview
- Helper text about who to count

### PolicyLogicStep

- Automatically calculates policy based on employee count
- Displays accrual rates, caps, and limits
- Shows compliance requirements

### SecureCameraStep

- Camera access for document capture
- Works on mobile (rear camera) and desktop
- Photo preview and retake functionality
- Optional step - users can skip

### SummaryStep

- Review all configured settings
- Download compliance certificate
- Navigate to dashboard
- Option to start over

## Design Tokens

The module uses the following design tokens aligned with Figma specs:

### Colors

- Primary Trust Blue: `#1E4BD8`
- Accent Blue: `#3B82F6`
- Government Trust Green: `#00B289`
- Compliance Error: `#D32F2F`
- Background: `#F7FAFE`
- Surface: `#FFFFFF`

### Border Radius

- Card: `18px` (use `rounded-card`)
- Button: `12px` (use `rounded-button`)
- Field: `10px` (use `rounded-field`)

### Shadow

- Elevation Soft: `shadow-elevation-soft`

### Transitions

- Standard: `350ms ease-in-out`

## Data Schema

```typescript
interface WizardData {
  // Intro step
  hasSeenIntro?: boolean;

  // Employer type step
  employerType?: 'small' | 'large' | 'municipal' | 'nonprofit';

  // Employee count step
  employeeCount?: number;

  // Policy logic step
  policyType?: 'small-business' | 'large-business';
  accrualRate?: number;
  carryoverLimit?: number;
  annualUsageLimit?: number;

  // Secure camera step
  capturedDocuments?: string[]; // base64 encoded images

  // Summary step
  completedAt?: string;
  certificateGenerated?: boolean;
}
```

## Best Practices

### Adding New Steps

1. Create a new component in `steps/` directory
2. Import and use `useWizard()` hook
3. Add step to `steps` array in `WizardEngine.tsx`
4. Update progress bar labels if needed

### State Updates

```tsx
// ✅ Good: Use partial updates
update({ employeeCount: 50 });

// ❌ Bad: Don't overwrite entire state
setData({ employeeCount: 50 });
```

### Navigation

```tsx
// ✅ Good: Use setStep for navigation
setStep(step + 1);

// ❌ Bad: Don't manually manipulate step
step = step + 1;
```

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { WizardProvider } from '@/modules/guidedFlow';
import IntroStep from '@/modules/guidedFlow/steps/IntroStep';

test('intro step renders welcome message', () => {
  render(
    <WizardProvider>
      <IntroStep />
    </WizardProvider>
  );

  expect(screen.getByText(/Welcome to ESTA Compliance/i)).toBeInTheDocument();
});
```

### E2E Tests

```typescript
test('complete wizard flow', async ({ page }) => {
  await page.goto('/guided-flow');

  // Step 1: Intro
  await page.click('text=Get Started');

  // Step 2: Employer Type
  await page.click('text=Small Business');
  await page.click('text=Continue');

  // Step 3: Employee Count
  await page.fill('input[type="number"]', '5');
  await page.click('text=Continue');

  // ... continue through all steps

  await expect(page.locator('text=Configuration Complete')).toBeVisible();
});
```

## Accessibility

- All interactive elements are keyboard accessible
- Focus management on step transitions
- ARIA labels on progress indicators
- Screen reader announcements for step changes
- Color contrast meets WCAG 2.1 AA standards

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Future Enhancements

- [ ] Multi-language support
- [ ] PDF certificate generation
- [ ] Integration with payroll systems
- [ ] Advanced policy customization
- [ ] Bulk employee import
- [ ] Progress export/import
- [ ] Email summary functionality
- [ ] State-specific wizard variations (for future multi-state support)

## Support

For questions or issues with the guided flow:

1. Check the inline help text in each step
2. Review the Michigan ESTA documentation
3. Contact support via the help button
