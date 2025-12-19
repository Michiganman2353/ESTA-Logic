import { useWizard } from '../WizardContext';
import { useNavigate } from 'react-router-dom';

/**
 * SummaryStep - Review & Compliance Certificate
 *
 * Final step that shows a summary and generates a compliance certificate
 */
export default function SummaryStep() {
  const { data, update, reset } = useWizard();
  const navigate = useNavigate();

  const isSmallBusiness = (data.employeeCount || 0) < 10;

  const handleGenerateCertificate = () => {
    const completedAt = new Date().toISOString();
    update({ certificateGenerated: true, completedAt });

    // In a real app, this would generate a PDF certificate
    alert(
      'Compliance certificate generated! In a production app, a PDF would be downloaded.'
    );
  };

  const handleStartOver = () => {
    if (
      confirm(
        'Are you sure you want to start over? This will clear all your progress.'
      )
    ) {
      reset();
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Success Header */}
      <div className="mb-8 text-center">
        <div className="animate-scale-in mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="mb-3 text-4xl font-bold text-gray-900">
          Configuration Complete! 🎉
        </h1>
        <p className="text-lg text-gray-600">
          Your ESTA compliance policy has been successfully configured
        </p>
      </div>

      {/* Summary Card */}
      <div className="mb-8 rounded-xl border-2 border-green-200 bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          Policy Summary
        </h2>

        <div className="space-y-6">
          {/* Business Information */}
          <div className="border-b pb-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Business Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-sm text-gray-600">Employer Type</div>
                <div className="font-semibold capitalize text-gray-900">
                  {data.employerType?.replace('-', ' ')}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Number of Employees</div>
                <div className="font-semibold text-gray-900">
                  {data.employeeCount}
                </div>
              </div>
            </div>
          </div>

          {/* Policy Configuration */}
          <div className="border-b pb-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              ESTA Policy Configuration
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="text-sm text-gray-600">Policy Type</div>
                <div className="font-semibold text-gray-900">
                  {isSmallBusiness ? 'Small Business' : 'Large Business'}
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="text-sm text-gray-600">Accrual Rate</div>
                <div className="font-semibold text-gray-900">
                  1 hour per 30 hours worked
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="text-sm text-gray-600">Annual Accrual Cap</div>
                <div className="font-semibold text-gray-900">
                  {data.annualUsageLimit} hours/year
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="text-sm text-gray-600">Carryover Limit</div>
                <div className="font-semibold text-gray-900">
                  {data.carryoverLimit} hours
                </div>
              </div>
            </div>
          </div>

          {/* Documents Captured */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Documents Captured
            </h3>
            {data.capturedDocuments && data.capturedDocuments.length > 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-semibold">
                  {data.capturedDocuments.length} document(s) securely stored
                </span>
              </div>
            ) : (
              <div className="text-gray-600">
                No documents were captured during this session
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Next Steps Card */}
      <div className="mb-8 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-green-50 p-8">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Next Steps</h2>
        <ul className="space-y-3 text-gray-800">
          <li className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-6 w-6 flex-shrink-0 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              <strong>Download your compliance certificate</strong> and keep it
              with your business records
            </span>
          </li>
          <li className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-6 w-6 flex-shrink-0 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span>
              <strong>Add your employees</strong> to start tracking sick time
              accrual
            </span>
          </li>
          <li className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-6 w-6 flex-shrink-0 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>
              <strong>Display the ESTA workplace poster</strong> in a visible
              location (available in your dashboard)
            </span>
          </li>
          <li className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-6 w-6 flex-shrink-0 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span>
              <strong>Review monthly reports</strong> to ensure compliance
            </span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex flex-wrap justify-center gap-4">
        <button
          onClick={handleGenerateCertificate}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-8 py-4 font-semibold text-white shadow-lg transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download Compliance Certificate
        </button>

        <button
          onClick={handleGoToDashboard}
          className="rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Go to Dashboard →
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="text-center">
        <button
          onClick={handleStartOver}
          className="text-sm text-gray-600 underline hover:text-gray-800"
        >
          Start over with new configuration
        </button>
      </div>
    </div>
  );
}
