# ESTA Tracker Component Library

## Overview

The ESTA Tracker Component Library is a collection of reusable, accessible, and consistent UI components built on top of the design token system. These components form the building blocks of all user interfaces in the application.

---

## 🎯 Design Principles

### Consistency

All components use design tokens for styling, ensuring visual coherence across the application.

### Accessibility

Components are built to WCAG 2.1 AA standards with keyboard navigation, screen reader support, and proper ARIA attributes.

### Reusability

Each component is self-contained and can be composed to create complex interfaces.

### Customization

Components accept props for customization while maintaining design system constraints.

---

## 📦 Component Categories

### 1. Foundation Components

#### Button

**Location**: `apps/frontend/src/components/DesignSystem/Button.tsx`

Primary interactive element for user actions.

**Variants**:

- `primary` - Main call-to-action (trust blue background)
- `secondary` - Secondary actions (gray background)
- `ghost` - Transparent background, colored text
- `danger` - Destructive actions (red)
- `success` - Positive confirmations (green)

**Sizes**:

- `xs` - Extra small (rare use)
- `sm` - Small
- `md` - Default
- `lg` - Large (prominent CTAs)
- `xl` - Extra large

**Props**:

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
}
```

**Usage**:

```tsx
import { Button } from '@/components/DesignSystem';

<Button variant="primary" size="lg" onClick={handleContinue}>
  Continue →
</Button>

<Button variant="ghost" icon={<HelpIcon />} iconPosition="left">
  Need Help?
</Button>

<Button variant="danger" loading={isDeleting}>
  Delete Account
</Button>
```

**Design Tokens Used**:

- Colors: `semanticColors.trustBlue`, `semanticColors.complianceError`
- Spacing: `componentSpacing.button.md`
- Typography: `textStyles.button`
- Borders: `componentBorderRadius.button.default`
- Shadows: `componentShadows.button.*`

---

#### Card

**Location**: `apps/frontend/src/components/DesignSystem/Card.tsx`

Container component for grouping related content.

**Variants**:

- `default` - Standard white card
- `gradient` - Subtle gradient background
- `elevated` - Higher elevation with stronger shadow
- `outlined` - Bordered instead of shadowed
- `glass` - Glassmorphism effect

**Props**:

```typescript
interface CardProps {
  variant?: 'default' | 'gradient' | 'elevated' | 'outlined' | 'glass';
  padding?: 'compact' | 'default' | 'relaxed' | 'none';
  hoverable?: boolean; // Adds hover effect
  clickable?: boolean; // Shows pointer cursor
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}
```

**Usage**:

```tsx
import { Card } from '@/components/DesignSystem';

<Card variant="default" padding="default">
  <h2>Card Title</h2>
  <p>Card content goes here</p>
</Card>

<Card variant="elevated" hoverable onClick={handleCardClick}>
  <h3>Clickable Card</h3>
</Card>
```

**Design Tokens Used**:

- Spacing: `componentSpacing.card.*`
- Borders: `componentBorderRadius.card.default`
- Shadows: `componentShadows.card.*`
- Colors: `surfaces.*`

---

#### Input

**Location**: `apps/frontend/src/components/Input.tsx`

Text input field with label, help text, and validation support.

**Types**:

- `text` - Standard text input
- `email` - Email with validation
- `password` - Password with toggle visibility
- `number` - Numeric input
- `tel` - Telephone number
- `url` - URL with validation

**Props**:

```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  label?: string;
  placeholder?: string;
  helpText?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}
```

**Usage**:

```tsx
import { Input } from '@/components';

<Input
  label="Company Name"
  placeholder="Enter your company name"
  value={companyName}
  onChange={setCompanyName}
  required
  helpText="This will be visible to your employees"
  error={errors.companyName}
/>

<Input
  type="email"
  label="Email Address"
  value={email}
  onChange={setEmail}
  icon={<EmailIcon />}
  iconPosition="left"
/>
```

**Design Tokens Used**:

- Spacing: `componentSpacing.form.*`
- Typography: `textStyles.label`, `fontSizes.base`
- Borders: `componentBorderRadius.input.default`, `borderPresets.input.*`
- Colors: `textColors.*`, `borderColors.*`
- Shadows: `componentShadows.input.*`

---

### 2. Navigation Components

#### Stepper

**Location**: `apps/frontend/src/components/Stepper.tsx`

Progress indicator for multi-step flows.

**Variants**:

- `horizontal` - Default, steps shown left to right
- `vertical` - Steps shown top to bottom (mobile)

**Props**:

```typescript
interface StepperProps {
  steps: Array<{
    label: string;
    description?: string;
    icon?: React.ReactNode;
  }>;
  currentStep: number;
  variant?: 'horizontal' | 'vertical';
  onStepClick?: (step: number) => void; // Allow clicking completed steps
  showStepNumbers?: boolean;
}
```

**Usage**:

```tsx
import { Stepper } from '@/components';

<Stepper
  steps={[
    { label: 'Company Info', description: 'Basic details' },
    { label: 'Contact', description: 'Primary contact' },
    { label: 'Branding', description: 'Customize appearance' },
    { label: 'Complete', description: 'Review and finish' },
  ]}
  currentStep={2}
  onStepClick={(step) => navigateToStep(step)}
  showStepNumbers
/>;
```

**Design Tokens Used**:

- Colors: `semanticColors.trustBlue`, `grayScale.*`
- Spacing: `spacing.base[4]`
- Typography: `fontSizes.sm`, `fontWeights.medium`

---

### 3. Feedback Components

#### Toast

**Location**: `apps/frontend/src/components/Toast.tsx`

Temporary notification messages.

**Types**:

- `success` - Success messages (green)
- `error` - Error messages (red)
- `warning` - Warning messages (amber)
- `info` - Informational messages (blue)

**Props**:

```typescript
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // Auto-dismiss time in ms
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Usage**:

```tsx
import { useToast } from '@/components/Toast.hooks';

const { showToast } = useToast();

// Success toast
showToast({
  type: 'success',
  title: 'Profile Saved',
  message: 'Your changes have been saved successfully.',
  duration: 5000,
});

// Error toast with action
showToast({
  type: 'error',
  title: 'Upload Failed',
  message: 'Unable to upload logo. Please try again.',
  action: {
    label: 'Retry',
    onClick: retryUpload,
  },
});
```

**Design Tokens Used**:

- Colors: `statusColors.*`
- Shadows: `shadows.xl`
- Borders: `borderRadius.lg`
- Spacing: `spacing.base[4]`

---

#### LoadingSpinner

**Location**: `apps/frontend/src/components/DesignSystem/LoadingSpinner.tsx`

Visual indicator for loading states.

**Sizes**:

- `xs` - 16px
- `sm` - 24px
- `md` - 32px
- `lg` - 48px
- `xl` - 64px

**Props**:

```typescript
interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string; // Defaults to trust-blue
  label?: string; // Accessibility label
  overlay?: boolean; // Full-screen overlay
}
```

**Usage**:

```tsx
import { LoadingSpinner } from '@/components/DesignSystem';

// Inline spinner
<LoadingSpinner size="sm" />

// Full-page loading
<LoadingSpinner size="lg" overlay label="Loading your profile..." />

// Custom color
<LoadingSpinner color={colors.semantic.govTrustGreen} />
```

---

### 4. Data Display Components

#### Tooltip

**Location**: `apps/frontend/src/components/DesignSystem/Tooltip.tsx`

Contextual information on hover or focus.

**Placements**:

- `top`, `top-start`, `top-end`
- `right`, `right-start`, `right-end`
- `bottom`, `bottom-start`, `bottom-end`
- `left`, `left-start`, `left-end`

**Props**:

```typescript
interface TooltipProps {
  content: string | React.ReactNode;
  placement?: TooltipPlacement;
  delay?: number; // Show delay in ms
  children: React.ReactElement;
  maxWidth?: string;
}
```

**Usage**:

```tsx
import { Tooltip } from '@/components/DesignSystem';

<Tooltip content="This helps us calculate your compliance requirements" placement="right">
  <HelpIcon />
</Tooltip>

<Tooltip
  content="Click to copy enrollment code to clipboard"
  placement="top"
>
  <button onClick={copyCode}>ACME</button>
</Tooltip>
```

---

### 5. Layout Components

#### SkipLinks

**Location**: `apps/frontend/src/components/SkipLinks.tsx`

Accessibility navigation for keyboard users.

**Props**:

```typescript
interface SkipLinksProps {
  links: Array<{
    href: string;
    label: string;
  }>;
}
```

**Usage**:

```tsx
import { SkipLinks } from '@/components';

<SkipLinks
  links={[
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#footer', label: 'Skip to footer' },
  ]}
/>;
```

---

### 6. Form Components

#### FormField

**Location**: `apps/frontend/src/components/FormField.tsx`

Wrapper for form inputs with label, help text, and error display.

**Props**:

```typescript
interface FormFieldProps {
  label: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}
```

**Usage**:

```tsx
import { FormField } from '@/components';

<FormField
  label="Company Name"
  required
  helpText="Your legal business name"
  error={errors.companyName}
  htmlFor="company-name"
>
  <input id="company-name" type="text" />
</FormField>;
```

---

## 🎨 Component Styling Patterns

### Using Design Tokens

All components should use design tokens instead of hard-coded values:

```tsx
// ❌ Don't do this
<div style={{ backgroundColor: '#1E63FF', padding: '12px' }}>

// ✅ Do this
import { colors, spacing } from '@/design-tokens';

<div style={{
  backgroundColor: colors.semantic.trustBlue,
  padding: spacing.base[3]
}}>
```

### Tailwind Integration

Components can use Tailwind classes that reference design tokens:

```tsx
<button className="bg-trust-blue hover:bg-accent-blue rounded-lg px-6 py-3 text-white">
  Click me
</button>
```

### Style Composition

Use `clsx` for conditional styling:

```tsx
import clsx from 'clsx';

const buttonClasses = clsx(
  'btn',
  variant === 'primary' && 'btn-primary',
  variant === 'secondary' && 'btn-secondary',
  fullWidth && 'w-full',
  disabled && 'opacity-50 cursor-not-allowed'
);

<button className={buttonClasses}>
```

---

## ♿ Accessibility Guidelines

### Keyboard Navigation

All interactive components must be keyboard accessible:

- **Tab** - Move to next element
- **Shift+Tab** - Move to previous element
- **Enter/Space** - Activate buttons, links
- **Escape** - Close modals, dropdowns, tooltips
- **Arrow keys** - Navigate within component groups

### Focus Management

```tsx
// Visible focus indicator
<button className="focus:ring-trust-blue focus:outline-none focus:ring-2 focus:ring-offset-2">
  Click me
</button>;

// Focus trap in modals
import { FocusTrap } from '@/components';

<FocusTrap>
  <Modal>...</Modal>
</FocusTrap>;
```

### ARIA Attributes

```tsx
// Button with loading state
<button
  aria-busy={isLoading}
  aria-label={isLoading ? 'Saving...' : 'Save changes'}
>
  {isLoading ? <Spinner /> : 'Save'}
</button>

// Form with error
<input
  aria-invalid={!!error}
  aria-describedby={error ? 'input-error' : 'input-help'}
/>
{error && <span id="input-error" role="alert">{error}</span>}
```

### Screen Reader Support

```tsx
// Announce dynamic content changes
import { LiveRegion } from '@/components';

<LiveRegion aria-live="polite">
  {notification}
</LiveRegion>

// Hide decorative elements
<svg aria-hidden="true">
  <DecorativeIcon />
</svg>
```

---

## 🧪 Component Testing

### Unit Tests

Test component behavior and accessibility:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole('button', { name: 'Click me' })
    ).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is keyboard accessible', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    const button = screen.getByRole('button');
    button.focus();
    await userEvent.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalled();
  });
});
```

### Accessibility Testing

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## 📝 Creating New Components

### Component Checklist

When creating a new component:

- [ ] Use design tokens for all styling
- [ ] Support all required props
- [ ] Implement keyboard navigation
- [ ] Add ARIA attributes for accessibility
- [ ] Handle loading and error states
- [ ] Write unit tests
- [ ] Run accessibility tests
- [ ] Document props and usage
- [ ] Add to component library docs

### Component Template

```tsx
import { colors, spacing, typography } from '@/design-tokens';
import clsx from 'clsx';

interface MyComponentProps {
  // Define props
  variant?: 'default' | 'alternative';
  disabled?: boolean;
  children: React.ReactNode;
}

export function MyComponent({
  variant = 'default',
  disabled = false,
  children,
}: MyComponentProps) {
  const classes = clsx(
    'my-component-base',
    variant === 'default' && 'my-component-default',
    variant === 'alternative' && 'my-component-alternative',
    disabled && 'opacity-50 cursor-not-allowed'
  );

  return (
    <div className={classes} aria-disabled={disabled}>
      {children}
    </div>
  );
}
```

---

## 🔗 Related Documentation

- **[Design Tokens](./DESIGN_TOKENS.md)** - Color, typography, spacing tokens
- **[Storyboards](./storyboards/README.md)** - Visual flow documentation
- **[Figma Integration](../FIGMA_INTEGRATION_GUIDE.md)** - Design-code sync

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintained By**: ESTA Tracker Frontend Team
