import { useWizard } from '../WizardContext';

/**
 * IntroStep - Welcome & Explanation Screen
 *
 * This is the first step that introduces the guided compliance system
 * and explains what users can expect from the wizard flow.
 */
export default function IntroStep() {
  const { setStep, update } = useWizard();

  const handleContinue = () => {
    update({ hasSeenIntro: true });
    setStep(1);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          Welcome to ESTA Compliance
        </h1>
        <p className="text-lg text-gray-600">
          A guided experience to help you navigate Michigan's Employee Earned
          Sick Time Act
        </p>
      </div>

      {/* Main Content Card */}
      <div className="mb-8 rounded-xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-2xl font-semibold text-gray-900">
          What You'll Complete
        </h2>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
              1
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-gray-900">
                Determine Your Eligibility
              </h3>
              <p className="text-gray-600">
                We'll ask a few questions about your business to understand
                which ESTA requirements apply to you.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
              2
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-gray-900">
                Configure Your Policy
              </h3>
              <p className="text-gray-600">
                We'll help you set up the correct accrual rates, carryover
                limits, and usage caps based on your company size.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
              3
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-gray-900">
                Secure Document Capture
              </h3>
              <p className="text-gray-600">
                Optionally capture and securely store compliance documentation
                using your device's camera.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
              4
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-gray-900">
                Get Your Compliance Certificate
              </h3>
              <p className="text-gray-600">
                Receive a summary of your configuration and a compliance
                certificate for your records.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-6">
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
            <h3 className="mb-1 font-semibold text-green-900">
              Your Progress is Saved
            </h3>
            <p className="text-sm text-green-800">
              You can leave and come back anytime. Your progress is
              automatically saved to this device.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handleContinue}
          className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Get Started →
        </button>
      </div>

      {/* Help Link */}
      <div className="mt-6 text-center">
        <button className="text-sm text-blue-600 underline hover:text-blue-800">
          Need help? Contact support
        </button>
      </div>
    </div>
  );
}
