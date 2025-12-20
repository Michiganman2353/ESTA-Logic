/**
 * WizardRouter - Routes and renders wizard steps
 *
 * Handles step routing and component rendering based on
 * the current wizard state.
 */

import { useWizard } from '../core/useWizard';
import { wizard } from '../core/WizardEngine';

interface WizardRouterProps {
  fallback?: React.ReactNode;
}

/**
 * WizardRouter component that renders the current step
 */
export default function WizardRouter({ fallback }: WizardRouterProps) {
  useWizard(); // Ensure we're within WizardProvider context
  const step = wizard.getCurrentStep();

  // If no step is available, show fallback or loading state
  if (!step) {
    return <div>{fallback || <div>Loading...</div>}</div>;
  }

  // If step has a component, render it
  if (step.component) {
    const StepComponent = step.component;
    return <StepComponent />;
  }

  // Default fallback
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">{step.title}</h2>
        {step.description && (
          <p className="text-gray-600">{step.description}</p>
        )}
      </div>
    </div>
  );
}
