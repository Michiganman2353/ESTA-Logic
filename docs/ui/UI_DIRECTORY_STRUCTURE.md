# ESTA Tracker Frontend UI Directory Structure

## Overview

This document provides a comprehensive visual guide to ESTA Tracker's frontend architecture, showing how the UI is organized, where to find specific components, and how different parts of the system work together.

**Purpose**: Help developers, designers, and stakeholders quickly understand and navigate the frontend codebase.

---

## 📁 High-Level Frontend Structure

```
apps/frontend/
├── public/              # Static assets (images, icons, fonts)
├── src/                 # Source code (main application)
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route-level page components
│   ├── experience/      # Experience-first UX modules
│   ├── modules/         # Feature modules (guided flows)
│   ├── features/        # Specific feature implementations
│   ├── design-tokens/   # Design system tokens
│   ├── contexts/        # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API and external service integrations
│   ├── lib/             # Business logic and utilities
│   ├── store/           # State management
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Helper functions
│   └── styles/          # Global styles and CSS
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
└── package.json         # Dependencies and scripts
```

---

## 🎨 Component Architecture

### Design System Components

**Location**: `apps/frontend/src/components/DesignSystem/`

Core reusable components following the design token system:

```
components/DesignSystem/
├── Button.tsx           # Primary interactive element
├── Card.tsx             # Container component with elevation
├── LoadingSpinner.tsx   # Loading state indicator
├── SkeletonLoader.tsx   # Content placeholder during load
├── Tooltip.tsx          # Contextual help overlay
├── __tests__/           # Component unit tests
└── index.ts             # Barrel export
```

**Key Features**:

- Built on design tokens (colors, spacing, typography)
- Fully accessible (WCAG 2.1 AA compliant)
- Comprehensive prop interfaces
- Complete test coverage

**Example Usage**:

```tsx
import { Button, Card } from '@/components/DesignSystem';

<Card>
  <Button variant="primary" size="lg">
    Continue →
  </Button>
</Card>;
```

### UI Components

**Location**: `apps/frontend/src/components/`

Application-specific components:

```
components/
├── AccrualChart.tsx              # Sick time accrual visualization
├── AccrualNotificationBanner.tsx # Accrual status alerts
├── Calendar.tsx                  # PTO calendar view
├── CSVImporter.tsx               # Bulk employee import
├── DashboardWidgets.tsx          # Dashboard stat cards
├── DocumentScanner.tsx           # Mobile document capture
├── EmailVerification.tsx         # Email confirmation flow
├── ErrorBoundary.tsx             # Error handling wrapper
├── FormField.tsx                 # Standard form input
├── LoadingButton.tsx             # Button with loading state
├── Navigation.tsx                # App navigation bar
├── OnboardingWizard.tsx          # Step-by-step setup
├── PasswordField.tsx             # Secure password input
├── PhotoCapture.tsx              # Camera-based capture
├── PolicyConfiguration.tsx       # ESTA policy setup
├── SecurityStatusBanner.tsx      # Security trust indicators
├── Stepper.tsx                   # Progress step indicator
├── Toast.tsx                     # Notification system
├── Pricing/                      # Pricing components
│   ├── FeatureComparison.tsx
│   ├── PricingCard.tsx
│   └── index.ts
└── Settings/                     # Settings components
    ├── SecuritySection.tsx
    ├── TrustBadge.tsx
    └── index.ts
```

---

## 📄 Page Components

**Location**: `apps/frontend/src/pages/`

Top-level route components that compose the user interface:

```
pages/
├── Landing.tsx              # Public landing page
├── Login.tsx                # User authentication
├── Register.tsx             # Account creation
├── RegisterEmployee.tsx     # Employee registration flow
├── RegisterManager.tsx      # Manager registration flow
├── Dashboard.tsx            # Generic dashboard
├── EmployeeDashboard.tsx    # Employee-specific view
├── EmployerDashboard.tsx    # Employer-specific view
├── GuidedFlow.tsx           # Guided setup experience
├── GuidedSetupPage.tsx      # Setup wizard entry
├── Settings.tsx             # User settings
├── Pricing.tsx              # Pricing plans
├── AuditLog.tsx             # Compliance audit trail
├── PerformanceDashboard.tsx # Performance metrics
└── UIShowcase.tsx           # Component showcase/demo
```

**Routing Pattern**:

- Each page maps to a route in the application
- Pages compose components from `components/` and `experience/`
- Pages manage route-level state and data fetching

---

## 🌟 Experience-First Architecture

**Location**: `apps/frontend/src/experience/`

The experience layer implements ESTA Tracker's TurboTax-inspired UX philosophy:

```
experience/
├── README.md                          # Experience architecture guide
├── GUIDED_EXPERIENCE_GUIDE.md         # Implementation guide
│
├── wizard/                            # TurboTax-style guided flows
│   ├── components/                    # Wizard UI components
│   ├── steps/                         # Individual wizard steps
│   ├── validation/                    # Step validation logic
│   ├── routing/                       # Step navigation
│   ├── analytics/                     # User journey tracking
│   ├── core/                          # Wizard engine core
│   └── extensions/                    # Plugin extensions
│
├── dashboard/                         # Compliance confidence dashboard
│   ├── ComplianceConfidenceDashboard.tsx
│   └── components/                    # Dashboard-specific components
│
├── intelligence/                      # Smart decision assistance
│   ├── DecisionEngine.ts              # Policy decision logic
│   ├── PersonalizationEngine.ts       # User-specific adaptations
│   ├── RiskInterpreter.ts             # Compliance risk analysis
│   └── __tests__/
│
├── tone/                              # Emotional UX writing
│   ├── EmotionalUXWriter.ts           # Dynamic copy generation
│   ├── NarrativeLibrary.ts            # Story-based content
│   ├── ToneEngine.ts                  # Voice/tone consistency
│   ├── emotionalCopy.ts               # Copy templates
│   └── __tests__/
│
├── trust/                             # Security & trust signals
│   ├── TrustEngine.ts                 # Trust-building logic
│   ├── EncryptionIndicator.tsx        # Security status UI
│   ├── LegalAssurance.tsx             # Compliance messaging
│   ├── SecuritySignals.tsx            # Trust badges
│   ├── useTrustEngine.ts              # Trust state hook
│   └── __tests__/
│
├── enterprise/                        # Enterprise features
│   ├── AuditProofCore.ts              # Immutable audit trails
│   ├── IntegrityLedger.ts             # Tamper-proof logging
│   ├── roles.ts                       # RBAC definitions
│   └── __tests__/
│
├── animations/                        # UX animations
│   ├── PageTransition.tsx             # Smooth page changes
│   └── PulseSecure.tsx                # Trust indicator pulse
│
├── capture/                           # Document capture
│   └── SecureCapture.ts               # Encrypted document capture
│
├── a11y/                              # Accessibility utilities
│   └── focusManager.ts                # Focus management
│
├── design-system/                     # Experience tokens
│   └── tokens/                        # Experience-specific tokens
│
├── demo/                              # Demo mode
│   └── GuidedExperienceDemo.ts        # Demo data/flows
│
└── index.ts                           # Barrel exports
```

**Philosophy**:

- **Wizard**: Step-by-step guided experiences (TurboTax model)
- **Intelligence**: Smart assistance and personalization
- **Tone**: Emotional, reassuring, confidence-building copy
- **Trust**: Security signals and legal assurance
- **Enterprise**: Audit-ready compliance features

---

## 🧩 Feature Modules

### Guided Flow Module

**Location**: `apps/frontend/src/modules/guidedFlow/`

The core guided setup experience:

```
modules/guidedFlow/
├── README.md                # Module documentation
├── WizardEngine.tsx         # Core wizard orchestration
├── WizardContext.tsx        # Shared wizard state
├── hooks/                   # Custom wizard hooks
│   ├── useWizardStep.ts
│   ├── useWizardProgress.ts
│   └── useWizardValidation.ts
├── steps/                   # Individual wizard steps
│   ├── WelcomeStep.tsx
│   ├── BusinessInfoStep.tsx
│   ├── EmployerSizeStep.tsx
│   ├── PolicySetupStep.tsx
│   └── CompletionStep.tsx
└── index.ts                 # Module exports
```

**Purpose**: Implements the TurboTax-style guided setup that transforms complex compliance into a simple, reassuring experience.

### Document Capture Feature

**Location**: `apps/frontend/src/features/document-capture/`

Professional document scanning and upload:

```
features/document-capture/
├── camera.controller.ts     # Camera hardware interface
├── camera.view.tsx          # Camera UI component
├── document-processor.ts    # Image processing (OpenCV)
├── secure-uploader.ts       # Encrypted upload
├── permissions.ts           # Camera permission handling
├── mobile-fallback.ts       # Mobile app integration
└── index.ts                 # Feature exports
```

**Features**:

- Edge detection & perspective correction
- Client-side AES-GCM encryption
- Native mobile camera integration (Capacitor)
- Resumable uploads for large files

---

## 🎨 Design System

### Design Tokens

**Location**: `apps/frontend/src/design-tokens/`

Single source of truth for visual design:

```
design-tokens/
├── colors.ts         # Color palette & semantic colors
├── typography.ts     # Font families, sizes, weights
├── spacing.ts        # Spacing scale (8px grid)
├── shadows.ts        # Elevation & shadow system
├── borders.ts        # Border radius & widths
├── validation.ts     # Token validation helpers
└── index.ts          # Central export
```

**Token Categories**:

| File            | Purpose                               | Examples                                |
| --------------- | ------------------------------------- | --------------------------------------- |
| `colors.ts`     | Brand colors, semantic colors, scales | Trust Blue, Compliance Green, Navy Deep |
| `typography.ts` | Font system                           | Inter font family, 12px–60px scale      |
| `spacing.ts`    | Layout spacing                        | 8px base grid, component presets        |
| `shadows.ts`    | Depth & elevation                     | Card shadows, button elevation          |
| `borders.ts`    | Border styling                        | 8px buttons, 18px cards                 |

**Usage Example**:

```tsx
import { colors, spacing, typography } from '@/design-tokens';

const styles = {
  backgroundColor: colors.semanticColors.trustBlue,
  padding: `${spacing[4]} ${spacing[6]}`,
  fontSize: typography.fontSizes.lg,
};
```

**Design Token Benefits**:

- ✅ Consistency across entire application
- ✅ Easy theme changes (update once, apply everywhere)
- ✅ Design-engineering synchronization
- ✅ Type-safe styling (TypeScript)

### Global Styles

**Location**: `apps/frontend/src/styles/`

```
styles/
├── design-tokens.css   # CSS custom properties from tokens
└── index.css           # Global base styles
```

---

## 🔧 Infrastructure

### Context Providers

**Location**: `apps/frontend/src/contexts/`

React context for global state:

```
contexts/
├── AuthContext.tsx          # User authentication state
├── OnboardingContext.tsx    # Setup wizard state
├── SecurityContext.tsx      # Security status & encryption
├── useAuth.ts               # Auth hook
├── useOnboarding.ts         # Onboarding hook
└── index.ts                 # Context exports
```

### Custom Hooks

**Location**: `apps/frontend/src/hooks/`

```
hooks/
└── useEdgeConfig.ts         # Vercel Edge Config integration
```

### Services

**Location**: `apps/frontend/src/services/`

External integrations and core services:

```
services/
├── firebase.ts              # Firebase SDK initialization
├── kernel.ts                # WASM kernel integration
├── auditService.ts          # Audit logging service
└── performanceMonitoring.ts # Performance tracking
```

### Business Logic

**Location**: `apps/frontend/src/lib/`

Core business logic, separate from UI:

```
lib/
├── api.ts                      # API client wrapper
├── authService.ts              # Authentication logic
├── documentService.ts          # Document management
├── encryptedDocumentService.ts # Encrypted document handling
├── encryptionService.ts        # Client-side encryption
├── edgeConfigService.ts        # Edge configuration
├── reactiveDataService.ts      # Real-time data sync
├── csvImport.ts                # CSV parsing & validation
├── edgeCrypto/                 # Edge encryption utilities
│   ├── edgeHybrid.ts
│   └── edgeHybrid.test.ts
└── rules/                      # ESTA compliance rules
    ├── accrualRules.ts         # Accrual calculation
    ├── employerSizeRules.ts    # Size-based policy rules
    ├── frontloadRules.ts       # Frontloading logic
    ├── usageRules.ts           # Usage cap enforcement
    ├── offboardingRules.ts     # Employee offboarding
    ├── editReversionRules.ts   # Edit history
    ├── rulesEngine.ts          # Rules orchestration
    └── types.ts                # Rule type definitions
```

### State Management

**Location**: `apps/frontend/src/store/`

```
store/
├── appStore.ts              # Zustand global store
└── appStore.test.ts         # Store tests
```

### Utilities

**Location**: `apps/frontend/src/utils/`

```
utils/
├── accrualCalculations.ts   # ESTA accrual math
├── chartHelpers.ts          # Chart data formatting
├── lazyLoading.ts           # Code-splitting helpers
├── security.ts              # Security utilities
└── index.ts                 # Utility exports
```

### Types

**Location**: `apps/frontend/src/types/`

```
types/
├── index.ts                 # Shared type definitions
├── edgeConfig.ts            # Edge Config types
└── opencv.d.ts              # OpenCV type declarations
```

---

## 🗺️ Visual Component Hierarchy

### TurboTax-Style Guided Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    GuidedSetupPage                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              WizardEngine (orchestrator)              │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         Stepper (progress indicator)            │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         Current Step Component                  │  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │      FormField (with validation)          │  │  │  │
│  │  │  │      FormField (with help text)           │  │  │  │
│  │  │  │      EmotionalUXWriter (reassurance)      │  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         Navigation (Back / Continue)            │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         TrustEngine (security signals)          │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Employer Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                   EmployerDashboard                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Navigation (app header)                  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │      ComplianceConfidenceDashboard (main widget)      │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │   Compliance Score (98% - Excellent)            │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │      DashboardWidgets (stat cards grid)               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │ Employees│  │ Accrual  │  │ Requests │            │  │
│  │  │    8     │  │ 24.5 hrs │  │    2     │            │  │
│  │  └──────────┘  └──────────┘  └──────────┘            │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │      AccrualNotificationBanner (alerts)               │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │      Calendar (PTO requests)                          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Employee Portal

```
┌─────────────────────────────────────────────────────────────┐
│                   EmployeeDashboard                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Navigation (app header)                  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │      Card (Balance Overview)                          │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │   Your Sick Time Balance: 15.5 hours           │  │  │
│  │  │   Accrued: 20 hrs | Used: 4.5 hrs              │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │      AccrualChart (visual history)                    │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │      Button: Request Time Off                         │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │      SecurityStatusBanner (trust signals)             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interaction                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Page Component                           │
│  • Handles routing                                          │
│  • Composes UI components                                   │
│  • Manages route-level state                                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Context Providers                          │
│  • AuthContext (user session)                               │
│  • OnboardingContext (wizard state)                         │
│  • SecurityContext (encryption status)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Services Layer                             │
│  • authService (Firebase Auth)                              │
│  • documentService (Firestore)                              │
│  • encryptionService (Client-side crypto)                   │
│  • auditService (Compliance logging)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic (lib/)                      │
│  • rulesEngine (ESTA compliance)                            │
│  • accrualCalculations (sick time math)                     │
│  • csvImport (bulk employee import)                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Services                          │
│  • Firebase (auth, database, storage)                       │
│  • Google Cloud KMS (encryption keys)                       │
│  • Vercel Edge (configuration)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Frontend Patterns

### 1. Component Composition

**Philosophy**: Build complex UIs from simple, reusable components.

```tsx
// ❌ Monolithic component
<EmployerDashboardEverything />

// ✅ Composable components
<EmployerDashboard>
  <Navigation />
  <ComplianceConfidenceDashboard />
  <DashboardWidgets>
    <StatCard title="Employees" value={8} />
    <StatCard title="Accrual" value="24.5 hrs" />
  </DashboardWidgets>
  <AccrualNotificationBanner />
  <Calendar />
</EmployerDashboard>
```

### 2. Design Token Usage

**Philosophy**: Never hard-code visual values.

```tsx
// ❌ Hard-coded styles
<button style={{ color: '#1E4BD8', padding: '12px 24px' }}>

// ✅ Design token usage
import { colors, spacing } from '@/design-tokens';
<button style={{
  color: colors.semanticColors.trustBlue,
  padding: `${spacing[3]} ${spacing[6]}`
}}>
```

### 3. Experience-First UX

**Philosophy**: Every interaction builds trust and confidence.

```tsx
// ❌ Technical error message
<div>Error: ERR_INVALID_INPUT</div>

// ✅ Emotional, reassuring message
<EmotionalUXWriter
  context="validation_error"
  message="We noticed a small issue with your email. Let's fix that together."
  tone="reassuring"
/>
```

### 4. Progressive Enhancement

**Philosophy**: Core functionality works, enhanced features layer on top.

```tsx
// Base: Works without JavaScript
<form action="/api/submit" method="POST">

// Enhanced: Client-side validation + auto-save
<GuidedFlowForm
  onValidate={validateStep}
  onAutoSave={saveProgress}
/>
```

---

## 🛠️ Developer Workflows

### Adding a New Component

1. **Choose Location**:
   - Design system component? → `components/DesignSystem/`
   - UI component? → `components/`
   - Page? → `pages/`
   - Experience module? → `experience/`

2. **Use Design Tokens**:

   ```tsx
   import { colors, spacing, typography } from '@/design-tokens';
   ```

3. **Write Tests**:

   ```tsx
   // Component.test.tsx
   import { render, screen } from '@testing-library/react';
   import { Component } from './Component';

   test('renders correctly', () => {
     render(<Component />);
     expect(screen.getByText('Hello')).toBeInTheDocument();
   });
   ```

4. **Export from Barrel**:
   ```tsx
   // index.ts
   export { Component } from './Component';
   ```

### Working with the Wizard

1. **Create New Step**:

   ```tsx
   // experience/wizard/steps/MyNewStep.tsx
   export const MyNewStep = () => {
     return (
       <WizardStep
         title="Step Title"
         description="Help text"
         onContinue={handleContinue}
       >
         <FormField label="Question" />
       </WizardStep>
     );
   };
   ```

2. **Register Step**:

   ```tsx
   // experience/wizard/core/stepRegistry.ts
   import { MyNewStep } from '../steps/MyNewStep';

   export const steps = [
     // ... other steps
     { id: 'my-new-step', component: MyNewStep },
   ];
   ```

### Styling Components

**Tailwind CSS** (primary):

```tsx
<div className="rounded-lg bg-blue-600 px-6 py-3 text-white">
```

**Design Tokens** (for precise control):

```tsx
import { colors, spacing } from '@/design-tokens';

const styles = {
  backgroundColor: colors.primary.royalBlue,
  padding: `${spacing[3]} ${spacing[6]}`,
};
```

**CSS Modules** (for complex styles):

```css
/* Component.module.css */
.container {
  background: var(--color-trust-blue);
  padding: var(--spacing-4);
}
```

---

## 📚 Related Documentation

- **[Component Library](../design/COMPONENT_LIBRARY.md)** - Detailed component API documentation
- **[Design Tokens](../design/DESIGN_TOKENS.md)** - Complete design token reference
- **[Storyboards](../design/storyboards/README.md)** - Visual user flow documentation
- **[Figma Integration Guide](../FIGMA_INTEGRATION_GUIDE.md)** - Design-code synchronization
- **[UX Blueprint](../UX-Blueprint.md)** - Experience design principles
- **[Guided Flow README](../../apps/frontend/src/modules/guidedFlow/README.md)** - Wizard module details
- **[Experience README](../../apps/frontend/src/experience/README.md)** - Experience layer architecture
- **[Figma Links](../design/FIGMA_LINKS.md)** - Design file references
- **[UX Content Library](../../content/ux-writing/README.md)** - UX copy and tone guidance

---

## 🔍 Finding Components

### Quick Reference Table

| Component Type     | Location                   | Example                                  |
| ------------------ | -------------------------- | ---------------------------------------- |
| **Design System**  | `components/DesignSystem/` | Button, Card, Tooltip                    |
| **Forms**          | `components/`              | FormField, PasswordField, Input          |
| **Data Display**   | `components/`              | AccrualChart, Calendar, DashboardWidgets |
| **Navigation**     | `components/`              | Navigation, Stepper                      |
| **Wizards**        | `experience/wizard/`       | WizardEngine, step components            |
| **Trust Signals**  | `experience/trust/`        | SecuritySignals, EncryptionIndicator     |
| **Emotional UX**   | `experience/tone/`         | EmotionalUXWriter, NarrativeLibrary      |
| **Pages**          | `pages/`                   | Landing, Dashboard, Settings             |
| **Business Logic** | `lib/`                     | rulesEngine, accrualCalculations         |
| **Services**       | `services/`                | firebase, auditService                   |

---

## 🎓 Learning Path

### For New Developers

1. **Start Here**:
   - Read this document (UI_DIRECTORY_STRUCTURE.md)
   - Review [Design Tokens](../design/DESIGN_TOKENS.md)
   - Explore [Component Library](../design/COMPONENT_LIBRARY.md)

2. **Understand the Philosophy**:
   - Read [UX Blueprint](../UX-Blueprint.md)
   - Review [User Experience Vision](../../USER_EXPERIENCE_VISION.md)
   - Study [Storyboards](../design/storyboards/README.md)

3. **Build Something**:
   - Clone the repository
   - Run `npm run dev`
   - Add a simple component to `components/`
   - Use design tokens for styling
   - Write a test

4. **Go Deeper**:
   - Explore [Experience README](../../apps/frontend/src/experience/README.md)
   - Study the guided flow wizard implementation
   - Understand the rules engine in `lib/rules/`

### For Designers

1. **Visual System**:
   - Review [Design Tokens](../design/DESIGN_TOKENS.md)
   - Study [Component Library](../design/COMPONENT_LIBRARY.md)
   - See [Figma Integration Guide](../FIGMA_INTEGRATION_GUIDE.md)

2. **User Flows**:
   - Read [Storyboards](../design/storyboards/README.md)
   - Review [UX Blueprint](../UX-Blueprint.md)
   - Understand emotional journey in [User Experience Vision](../../USER_EXPERIENCE_VISION.md)

3. **Collaboration**:
   - Learn how designers and engineers sync via design tokens
   - Understand component API contracts
   - Follow the design change request process

---

## 🚀 Next Steps

**Want to dive deeper?**

- **Explore Components**: Browse `apps/frontend/src/components/` to see implementations
- **Study Flows**: Review `apps/frontend/src/experience/wizard/` for guided experience patterns
- **Read Tests**: Check `__tests__/` directories to understand expected behavior
- **Build Features**: Follow patterns from existing implementations
- **Contribute**: See [Contributing Guide](../../CONTRIBUTING.md)

---

**Document Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintained By**: ESTA Tracker Engineering Team
