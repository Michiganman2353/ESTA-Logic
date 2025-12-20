/**
 * CompletionStep - Final step showing completion status
 */

import PageTransition from '../../animations/PageTransition';
import { useWizard } from '../core/useWizard';

export default function CompletionStep() {
  const { reset, getData } = useWizard();

  const companyName = getData('companyName');

  const handleStartOver = () => {
    reset();
    window.location.reload();
  };

  const handleGoToDashboard = () => {
    // In a real app, this would navigate to the dashboard
    console.log('Navigating to dashboard...');
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
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
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            Setup Complete!
          </h1>
          <p className="text-lg text-gray-600">
            Congratulations, {companyName}! Your ESTA compliance setup is now
            complete.
          </p>
        </div>

        <div className="mb-8 rounded-xl bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">
            What's Next?
          </h2>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                1
              </div>
              <div className="ml-4">
                <h3 className="mb-1 font-semibold text-gray-900">
                  Access Your Dashboard
                </h3>
                <p className="text-gray-600">
                  View employee balances, track accruals, and manage sick time
                  requests.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                2
              </div>
              <div className="ml-4">
                <h3 className="mb-1 font-semibold text-gray-900">
                  Add Employees
                </h3>
                <p className="text-gray-600">
                  Import your employee roster to start tracking their sick time
                  accruals.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                3
              </div>
              <div className="ml-4">
                <h3 className="mb-1 font-semibold text-gray-900">
                  Stay Compliant
                </h3>
                <p className="text-gray-600">
                  We'll automatically track everything and alert you to any
                  compliance issues.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
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
                Your Data is Secure
              </h3>
              <p className="text-sm text-blue-800">
                All your information is encrypted and stored securely. We take
                your privacy seriously.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleGoToDashboard}
            className="flex-1 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-md transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Dashboard
          </button>
          <button
            onClick={handleStartOver}
            className="flex-1 rounded-xl border border-gray-300 px-8 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Start Over
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
