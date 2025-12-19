import { useEffect } from 'react';
import { useWizard } from '../WizardContext';

/**
 * PolicyLogicStep - Policy Determination & Guidance
 *
 * Automatically determines and displays the correct policy based on previous inputs
 */
export default function PolicyLogicStep() {
  const { setStep, data, update } = useWizard();

  // Determine policy based on employee count
  const isSmallBusiness = (data.employeeCount || 0) < 10;
  const policyType = isSmallBusiness ? 'small-business' : 'large-business';

  // Policy details based on business size
  const policyDetails = isSmallBusiness
    ? {
        accrualRate: 1 / 30, // 1 hour per 30 hours worked
        carryoverLimit: 40,
        annualUsageLimit: 40,
        annualAccrualCap: 40,
      }
    : {
        accrualRate: 1 / 30, // 1 hour per 30 hours worked
        carryoverLimit: 72,
        annualUsageLimit: 72,
        annualAccrualCap: 72,
      };

  // Update wizard data with policy details
  useEffect(() => {
    update({
      policyType,
      accrualRate: policyDetails.accrualRate,
      carryoverLimit: policyDetails.carryoverLimit,
      annualUsageLimit: policyDetails.annualUsageLimit,
    });
  }, [policyType]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinue = () => {
    setStep(4);
  };

  const handleBack = () => {
    setStep(2);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-3 text-3xl font-bold text-gray-900">
          Your ESTA Policy Configuration
        </h1>
        <p className="text-lg text-gray-600">
          Based on your {data.employeeCount} employees, here's your required
          policy:
        </p>
      </div>

      {/* Policy Summary Card */}
      <div className="mb-8 rounded-xl border-2 border-blue-200 bg-white p-8 shadow-lg">
        <div className="mb-6 flex items-center gap-3">
          <div
            className={`rounded-full p-3 ${isSmallBusiness ? 'bg-green-100' : 'bg-blue-100'}`}
          >
            <svg
              className={`h-8 w-8 ${isSmallBusiness ? 'text-green-600' : 'text-blue-600'}`}
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
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isSmallBusiness ? 'Small Business' : 'Large Business'} Plan
            </h2>
            <p className="text-gray-600">
              Required under Michigan ESTA for businesses with{' '}
              {isSmallBusiness ? 'fewer than 10' : '10 or more'} employees
            </p>
          </div>
        </div>

        {/* Policy Details Grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Accrual Rate */}
          <div className="rounded-lg bg-gray-50 p-6">
            <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
              Accrual Rate
            </div>
            <div className="mb-2 text-3xl font-bold text-gray-900">1:30</div>
            <p className="text-sm text-gray-600">
              1 hour of sick time per 30 hours worked
            </p>
          </div>

          {/* Annual Cap */}
          <div className="rounded-lg bg-gray-50 p-6">
            <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
              Annual Accrual Cap
            </div>
            <div className="mb-2 text-3xl font-bold text-gray-900">
              {policyDetails.annualAccrualCap}h
            </div>
            <p className="text-sm text-gray-600">
              Maximum hours that can accrue per year
            </p>
          </div>

          {/* Carryover Limit */}
          <div className="rounded-lg bg-gray-50 p-6">
            <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
              Carryover Limit
            </div>
            <div className="mb-2 text-3xl font-bold text-gray-900">
              {policyDetails.carryoverLimit}h
            </div>
            <p className="text-sm text-gray-600">
              Maximum hours that can carry over to next year
            </p>
          </div>

          {/* Usage Limit */}
          <div className="rounded-lg bg-gray-50 p-6">
            <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
              Annual Usage Limit
            </div>
            <div className="mb-2 text-3xl font-bold text-gray-900">
              {policyDetails.annualUsageLimit}h
            </div>
            <p className="text-sm text-gray-600">
              Maximum hours that can be used per year
            </p>
          </div>
        </div>
      </div>

      {/* Legal Compliance Notice */}
      <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
        <div className="flex items-start gap-3">
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="mb-2 font-semibold text-blue-900">
              Compliance Requirements
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  Employees must be notified of their sick time balance at least
                  once per month
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Records must be maintained for at least 3 years</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  Employees must have access to their sick time information
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  Workplace poster with ESTA information must be displayed
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <button
          onClick={handleBack}
          className="rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          ← Back
        </button>
        <button
          onClick={handleContinue}
          className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Continue →
        </button>
      </div>

      {/* Help */}
      <div className="mt-6 text-center">
        <button className="text-sm text-blue-600 underline hover:text-blue-800">
          Have questions about these requirements? Contact support
        </button>
      </div>
    </div>
  );
}
