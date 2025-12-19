import { WizardEngine, WizardProvider } from '@/modules/guidedFlow';

/**
 * GuidedFlow Page
 *
 * This page hosts the TurboTax-style guided compliance wizard.
 * It provides a complete onboarding experience for new employers
 * setting up ESTA compliance.
 */
export default function GuidedFlow() {
  return (
    <WizardProvider>
      <WizardEngine />
    </WizardProvider>
  );
}
