/**
 * Experience Module Exports
 *
 * Central export point for the guided UX system
 */

// Design System
export { motion } from './design-system/tokens/motion';
export { colors } from './design-system/tokens/colors';
export { typography } from './design-system/tokens/typography';

// Wizard Core
export { wizard, WizardEngine } from './wizard/core/WizardEngine';
export { WizardState } from './wizard/core/WizardState';
export { WizardProvider, useWizard } from './wizard/core/WizardContext';

// Wizard Routing
export { default as WizardRouter } from './wizard/routing/WizardRouter';

// Wizard Validation
export { validate, commonRules } from './wizard/validation/rules';
export type {
  ValidationRule,
  ValidationResult,
} from './wizard/validation/rules';

// Wizard Analytics
export { wizardEvents } from './wizard/analytics/wizardEvents';

// Wizard Steps
export { default as IntroStep } from './wizard/steps/IntroStep';
export { default as EmployerProfileStep } from './wizard/steps/EmployerProfileStep';
export { default as EmployeePolicyStep } from './wizard/steps/EmployeePolicyStep';
export { default as DocumentCaptureStep } from './wizard/steps/DocumentCaptureStep';
export { default as ReviewStep } from './wizard/steps/ReviewStep';
export { default as CompletionStep } from './wizard/steps/CompletionStep';

// Capture
export { SecureCapture } from './capture/SecureCapture';

// Animations
export { default as PageTransition } from './animations/PageTransition';
export { default as PulseSecure } from './animations/PulseSecure';

// Accessibility
export { focusManager } from './a11y/focusManager';
