/**
 * IntroStep - Welcome and Introduction Step
 * Enhanced with trust signals and emotional UX
 */

import { useWizard } from '../core/useWizard';
import EnhancedWizardStep from '../components/EnhancedWizardStep';
import { ToneEngine } from '../../tone/ToneEngine';

export default function IntroStep() {
  const { next } = useWizard();

  return (
    <EnhancedWizardStep
      title="Welcome to ESTA-Logic Setup"
      subtitle={ToneEngine.reassuring(
        "We will walk you through everything step-by-step to ensure you're fully compliant with Michigan's Employee Earned Sick Time Act."
      )}
      showTrustBadges={true}
      showSecuritySignals={true}
      stepNumber={1}
      totalSteps={6}
    >
      <div className="space-y-6">
        {/* What You'll Accomplish */}
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            What You'll Accomplish
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Set up your employer profile and determine your compliance tier
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Configure employee sick time policies automatically</span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Securely capture and store compliance documentation</span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Receive compliance confidence dashboard and certificate
              </span>
            </li>
          </ul>
        </div>

        {/* Trust Building Section */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-600"
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
              <h3 className="mb-2 font-semibold text-green-900">
                You're in Safe Hands
              </h3>
              <p className="text-sm text-green-800">
                ESTA-Logic uses bank-level encryption to protect your data and
                automatically ensures you meet all Michigan ESTA requirements.
                Every recommendation is backed by legal compliance expertise.
              </p>
            </div>
          </div>
        </div>

        {/* Estimated Time */}
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm">
            Estimated time: <strong>5-8 minutes</strong>
          </span>
        </div>

        {/* Begin Button */}
        <div className="flex justify-end">
          <button
            onClick={next}
            className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-md transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Begin →
          </button>
        </div>
      </div>
    </EnhancedWizardStep>
  );
}
