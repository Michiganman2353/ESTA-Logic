/**
 * ReviewStep - Review configuration before completion
 */

import PageTransition from '../../animations/PageTransition';
import { useWizard } from '../core/WizardContext';

export default function ReviewStep() {
  const { next, back, getData } = useWizard();

  const companyName = getData('companyName');
  const employerType = getData('employerType');
  const employeeCount = getData('employeeCount');
  const documentCaptured = getData('documentCaptured');

  const handleComplete = () => {
    next();
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          Review Your Configuration
        </h1>
        <p className="mb-8 text-gray-600">
          Please review your information before completing the setup.
        </p>

        <div className="mb-8 rounded-xl bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            Configuration Summary
          </h2>

          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <div className="text-sm font-semibold text-gray-600">
                Company Name
              </div>
              <div className="text-lg text-gray-900">
                {companyName || 'Not provided'}
              </div>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <div className="text-sm font-semibold text-gray-600">
                Employer Type
              </div>
              <div className="text-lg capitalize text-gray-900">
                {employerType || 'Not provided'}
              </div>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <div className="text-sm font-semibold text-gray-600">
                Number of Employees
              </div>
              <div className="text-lg text-gray-900">
                {employeeCount || 'Not provided'}
              </div>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <div className="text-sm font-semibold text-gray-600">
                Policy Tier
              </div>
              <div className="text-lg text-gray-900">
                {Number(employeeCount) < 50
                  ? 'Small Business Tier'
                  : 'Large Business Tier'}
              </div>
            </div>

            <div className="pb-4">
              <div className="text-sm font-semibold text-gray-600">
                Document Capture
              </div>
              <div className="text-lg text-gray-900">
                {documentCaptured ? 'Completed' : 'Skipped'}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6">
            <div className="flex items-start">
              <svg
                className="mr-3 h-6 w-6 flex-shrink-0 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="mb-1 font-semibold text-green-900">
                  Ready to Complete
                </h3>
                <p className="text-sm text-green-800">
                  Your configuration looks good! Click "Complete Setup" to
                  finalize your ESTA compliance setup.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={back}
            className="rounded-xl border border-gray-300 px-8 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            ← Back
          </button>
          <button
            onClick={handleComplete}
            className="rounded-xl bg-green-600 px-8 py-3 font-semibold text-white shadow-md transition-all hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Complete Setup ✓
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
