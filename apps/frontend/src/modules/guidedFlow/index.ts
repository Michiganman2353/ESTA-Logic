/**
 * Guided Flow Module - TurboTax-Style Compliance Wizard
 *
 * A guided experience for configuring ESTA compliance policies.
 * This module provides a step-by-step wizard that:
 * - Determines employer type and size
 * - Calculates correct policy requirements
 * - Captures compliance documents
 * - Generates compliance certificates
 *
 * Usage:
 * ```tsx
 * import { WizardEngine, WizardProvider } from '@/modules/guidedFlow';
 *
 * function App() {
 *   return (
 *     <WizardProvider>
 *       <WizardEngine />
 *     </WizardProvider>
 *   );
 * }
 * ```
 */

export { default as WizardEngine } from './WizardEngine';
export { WizardProvider, useWizard } from './WizardContext';
export type { WizardData } from './WizardContext';
export { useWizardPersistence } from './hooks/useWizardPersistence';

// Re-export individual steps for testing or custom flows
export { default as IntroStep } from './steps/IntroStep';
export { default as EmployerTypeStep } from './steps/EmployerTypeStep';
export { default as EmployeeCountStep } from './steps/EmployeeCountStep';
export { default as PolicyLogicStep } from './steps/PolicyLogicStep';
export { default as SecureCameraStep } from './steps/SecureCameraStep';
export { default as SummaryStep } from './steps/SummaryStep';
