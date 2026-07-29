/**
 * CompletionStep - Final step showing completion status.
 */

import { useWizard } from '../core/useWizard';
import EnhancedWizardStep from '../components/EnhancedWizardStep';
import ConfidenceIndicator from '../components/ConfidenceIndicator';
import { TrustBadgeGroup } from '../../../components/Settings/TrustBadge';
import { ToneEngine } from '../../tone/ToneEngine';

export default function CompletionStep() {
  const { reset, getData } = useWizard();

  const companyName = getData('companyName');
  const employeeCount = getData('employeeCount');

  const handleStartOver = () => {
    reset();
    window.location.reload();
  };

  const handleGoToDashboard = () => {
    console.log('Navigating to dashboard...');
  };

  return (
    <EnhancedWizardStep
      title={ToneEngine.celebratory('🎉 Setup Inputs Complete')}
      subtitle={`${companyName || 'Your organization'} has completed this guided setup flow. Review the information before relying on it.`}
      showTrustBadges={false}
      showSecuritySignals={false}
      stepNumber={6}
      totalSteps={6}
    >
      <div className="space-y-6">
        <ConfidenceIndicator
          score={100}
          label="Guided Inputs Complete"
          variant="dashboard"
        />

        <div className="flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-12 w-12 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">
            What&apos;s Next?
          </h2>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                1
              </div>
              <div className="ml-4">
                <h3 className="mb-1 font-semibold text-gray-900">
                  Review the setup summary
                </h3>
                <p className="text-gray-600">
                  Confirm employer size, policies, and dates before connecting records.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                2
              </div>
              <div className="ml-4">
                <h3 className="mb-1 font-semibold text-gray-900">
                  Prepare employee records
                </h3>
                <p className="text-gray-600">
                  The workflow currently reflects {employeeCount || 'the entered'} employee count. Persistent employee imports remain under active hardening.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                3
              </div>
              <div className="ml-4">
                <h3 className="mb-1 font-semibold text-gray-900">
                  Validate policies and calculations
                </h3>
                <p className="text-gray-600">
                  Use the Calculation Lab and employer review before relying on account workflows.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <TrustBadgeGroup
            badges={['security', 'calculation', 'pilot']}
            size="lg"
          />
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start">
            <svg
              className="mr-3 h-6 w-6 flex-shrink-0 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <div>
              <h3 className="mb-1 font-semibold text-blue-900">
                Current security boundary
              </h3>
              <p className="text-sm text-blue-800">
                Firebase Authentication, security rules, and role-aware routes are implemented. Server-authoritative identity and tenant controls remain under active hardening.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleGoToDashboard}
            className="flex-1 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-md transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Dashboard →
          </button>
          <button
            onClick={handleStartOver}
            className="flex-1 rounded-xl border border-gray-300 px-8 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Start Over
          </button>
        </div>
      </div>
    </EnhancedWizardStep>
  );
}
