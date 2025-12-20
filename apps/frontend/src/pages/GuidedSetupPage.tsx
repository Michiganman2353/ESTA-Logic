/**
 * GuidedSetupPage - Example implementation of the guided wizard
 *
 * This page demonstrates the complete guided UX system in action.
 * It can be integrated into the main app routing.
 */

import { useEffect } from 'react';
import {
  WizardProvider,
  wizard,
  WizardRouter,
  IntroStep,
  EmployerProfileStep,
  EmployeePolicyStep,
  DocumentCaptureStep,
  ReviewStep,
  CompletionStep,
  focusManager,
  useWizard,
} from '@/experience';

// Initialize wizard steps
function initializeWizard() {
  wizard.registerStep('intro', {
    title: 'Welcome',
    description: 'Introduction to ESTA compliance',
    component: IntroStep,
  });

  wizard.registerStep('profile', {
    title: 'Employer Profile',
    description: 'Tell us about your business',
    component: EmployerProfileStep,
  });

  wizard.registerStep('policy', {
    title: 'Employee Policy',
    description: 'Configure your policy',
    component: EmployeePolicyStep,
  });

  wizard.registerStep('capture', {
    title: 'Document Capture',
    description: 'Secure document upload',
    component: DocumentCaptureStep,
    canSkip: true,
  });

  wizard.registerStep('review', {
    title: 'Review',
    description: 'Review your configuration',
    component: ReviewStep,
  });

  wizard.registerStep('completion', {
    title: 'Complete',
    description: 'Setup complete',
    component: CompletionStep,
  });
}

export default function GuidedSetupPage() {
  useEffect(() => {
    // Initialize wizard on mount
    initializeWizard();

    // Restore previous state if exists
    wizard.restoreState();

    // Announce page load to screen readers
    focusManager.announce('Guided setup wizard loaded');

    return () => {
      // Cleanup
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <WizardProvider>
        <WizardProgressBar />
        <WizardRouter fallback={<LoadingState />} />
      </WizardProvider>
    </div>
  );
}

/**
 * Progress bar component showing wizard completion
 */
function WizardProgressBar() {
  const { currentStep, totalSteps, progress } = useWizard();

  return (
    <div className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-700">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-gray-600">{progress}% Complete</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading state while wizard initializes
 */
function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="text-gray-600">Loading guided setup...</p>
      </div>
    </div>
  );
}
