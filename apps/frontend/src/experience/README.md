# ESTA-Logic Experience Module

## Overview

The Experience Module is a production-ready guided UX system that transforms ESTA-Logic from a raw toolset into a TurboTax-style compliance experience with Apple-grade polish.

## Features

### ✨ Core Capabilities

- **Guided Wizard System**: Step-by-step user flows with state persistence
- **Secure Document Capture**: Camera-based document scanning with encryption
- **Design System**: Consistent tokens for motion, colors, and typography
- **Accessibility**: WCAG 2.1 AA compliant with focus management
- **Analytics**: Built-in tracking for wizard interactions
- **Mobile Optimized**: Touch-friendly with responsive design

### 🎯 User Experience

- **Progressive Disclosure**: Information revealed step-by-step
- **Confidence Building**: Plain English, contextual help, success feedback
- **Error Recovery**: Helpful guidance instead of blocking errors
- **State Persistence**: Auto-save with resume capability

## Directory Structure

```
experience/
├── design-system/
│   └── tokens/
│       ├── motion.ts          # Animation & transition tokens
│       ├── colors.ts          # Color palette
│       └── typography.ts      # Font tokens
│
├── wizard/
│   ├── core/
│   │   ├── WizardEngine.ts    # Main orchestrator
│   │   ├── WizardState.ts     # State management
│   │   └── WizardContext.tsx  # React context
│   │
│   ├── routing/
│   │   └── WizardRouter.tsx   # Step routing
│   │
│   ├── validation/
│   │   └── rules.ts           # Validation logic
│   │
│   ├── analytics/
│   │   └── wizardEvents.ts    # Analytics tracking
│   │
│   └── steps/
│       ├── IntroStep.tsx
│       ├── EmployerProfileStep.tsx
│       ├── EmployeePolicyStep.tsx
│       ├── DocumentCaptureStep.tsx
│       ├── ReviewStep.tsx
│       └── CompletionStep.tsx
│
├── capture/
│   └── SecureCapture.ts       # Document capture engine
│
├── animations/
│   ├── PageTransition.tsx     # Page transition animations
│   └── PulseSecure.tsx        # Security indicator pulse
│
├── a11y/
│   └── focusManager.ts        # Accessibility focus management
│
└── index.ts                   # Public exports
```

## Quick Start

### Basic Usage

```tsx
import { WizardProvider, wizard } from '@/experience';
import IntroStep from '@/experience/wizard/steps/IntroStep';
import EmployerProfileStep from '@/experience/wizard/steps/EmployerProfileStep';

// Register wizard steps
wizard.registerStep('intro', {
  title: 'Welcome',
  component: IntroStep,
});

wizard.registerStep('profile', {
  title: 'Employer Profile',
  component: EmployerProfileStep,
});

// Use in your app
function App() {
  return (
    <WizardProvider>
      <WizardRouter />
    </WizardProvider>
  );
}
```

### Advanced Example

```tsx
import {
  WizardProvider,
  useWizard,
  validate,
  commonRules,
  wizardEvents,
} from '@/experience';

function CustomStep() {
  const { next, setData, getData } = useWizard();
  const [email, setEmail] = useState(getData('email') || '');

  const handleSubmit = () => {
    // Validate
    const result = validate({ email }, [
      commonRules.required('email'),
      commonRules.email('email'),
    ]);

    if (!result.isValid) {
      console.error(result.errors);
      return;
    }

    // Save and track
    setData('email', email);
    wizardEvents.trackStepComplete('custom-step', 1, { email });
    next();
  };

  return (
    <div>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <button onClick={handleSubmit}>Continue</button>
    </div>
  );
}
```

## API Reference

### WizardEngine

Main orchestrator for wizard navigation and state.

```typescript
// Register a step
wizard.registerStep(id, config);

// Navigate
wizard.next();
wizard.back();
wizard.goToStep(index);

// State management
wizard.setData(key, value);
wizard.getData(key);
wizard.reset();

// Status
wizard.getCurrentStep();
wizard.getCurrentIndex();
wizard.getProgress(); // Returns percentage
```

### useWizard Hook

React hook for accessing wizard context.

```typescript
const {
  currentStep,
  totalSteps,
  progress,
  next,
  back,
  goToStep,
  setData,
  getData,
  reset,
  isFirst,
  isLast,
} = useWizard();
```

### SecureCapture

Document capture with security features.

```typescript
import { SecureCapture } from '@/experience';

// Start session
const session = SecureCapture.startSession();

// Validate capture quality
const stable = await SecureCapture.enforceStability(videoElement);
const hasGlare = SecureCapture.glareDetection(canvasElement);
const edges = SecureCapture.edgeDetection(canvasElement);

// Upload securely
const result = await SecureCapture.submitToStorage(blob);
```

### Validation

Form validation utilities.

```typescript
import { validate, commonRules } from '@/experience';

const result = validate(data, [
  commonRules.required('name'),
  commonRules.email('email'),
  commonRules.min('age', 18),
  commonRules.custom('password', (val) => val.length >= 8, 'Too short'),
]);

if (result.isValid) {
  // Proceed
} else {
  console.log(result.errors); // { name: "name is required" }
}
```

### Analytics

Track user interactions.

```typescript
import { wizardEvents } from '@/experience';

wizardEvents.trackStepView('intro', 0);
wizardEvents.trackStepComplete('intro', 0);
wizardEvents.trackWizardComplete();

const metrics = wizardEvents.getMetrics();
console.log(metrics.completionRate); // Percentage
```

## Design Tokens

### Motion

```typescript
import { motion } from '@/experience';

motion.duration.normal; // 350ms
motion.easing.standard; // 'ease-out'
motion.transitions.fadeIn; // 'opacity 350ms ease-out'
```

### Colors

```typescript
import { colors } from '@/experience';

colors.primary[600]; // '#1E4BD8'
colors.success[500]; // '#00B289'
colors.error[500]; // '#D32F2F'
```

### Typography

```typescript
import { typography } from '@/experience';

typography.fontSize['2xl']; // '1.5rem'
typography.fontWeight.semibold; // 600
typography.lineHeight.normal; // 1.5
```

## Accessibility

The experience module is built with accessibility in mind:

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: ARIA labels and live regions
- **Focus Management**: Automatic focus handling on step changes
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Color Contrast**: WCAG 2.1 AA compliant

```typescript
import { focusManager } from '@/experience';

// Focus management
focusManager.focusHeading('step-title');
focusManager.announce('Step completed', 'polite');

// Focus trap (for modals)
const cleanup = focusManager.trapFocus(modalElement);
// Later: cleanup()
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Contributing

When adding new steps or features:

1. Follow existing patterns
2. Include TypeScript types
3. Add accessibility features
4. Test on mobile and desktop
5. Respect reduced motion preferences

## License

Part of the ESTA-Logic project.
