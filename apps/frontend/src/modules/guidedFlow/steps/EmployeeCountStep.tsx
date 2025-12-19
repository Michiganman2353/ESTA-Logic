import { useState } from 'react';
import { useWizard } from '../WizardContext';

/**
 * EmployeeCountStep - Employee Count Input
 *
 * Collects the number of employees to determine policy thresholds
 */
export default function EmployeeCountStep() {
  const { setStep, data, update } = useWizard();
  const [employeeCount, setEmployeeCount] = useState<string>(
    data.employeeCount?.toString() || ''
  );
  const [error, setError] = useState<string>('');

  const handleContinue = () => {
    const count = parseInt(employeeCount, 10);

    if (!employeeCount.trim()) {
      setError('Please enter the number of employees');
      return;
    }

    if (isNaN(count) || count < 1) {
      setError('Please enter a valid number of employees (at least 1)');
      return;
    }

    if (count > 10000) {
      setError(
        'Please enter a realistic number of employees (less than 10,000)'
      );
      return;
    }

    update({ employeeCount: count });
    setStep(3);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleInputChange = (value: string) => {
    setEmployeeCount(value);
    setError('');
  };

  // Determine policy tier based on count
  const count = parseInt(employeeCount, 10);
  const showPolicyInfo = !isNaN(count) && count > 0;
  const isSmallBusiness = count < 10;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-3 text-3xl font-bold text-gray-900">
          How many employees do you have?
        </h1>
        <p className="text-lg text-gray-600">
          Include all full-time and part-time employees. This determines your
          accrual rates and requirements.
        </p>
      </div>

      {/* Input Card */}
      <div className="mb-8 rounded-xl bg-white p-8 shadow-lg">
        <label
          htmlFor="employee-count"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          Total Number of Employees
        </label>
        <input
          id="employee-count"
          type="number"
          min="1"
          max="10000"
          value={employeeCount}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Enter number of employees"
          className={`w-full rounded-lg border-2 px-4 py-3 text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${error ? 'border-red-300' : 'border-gray-300'} `}
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        {/* Helper Text */}
        <div className="mt-4 text-sm text-gray-500">
          <p className="mb-1">
            💡 <strong>Tip:</strong> Count everyone on your payroll, including:
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Full-time employees</li>
            <li>Part-time employees</li>
            <li>Seasonal workers</li>
            <li>Temporary staff</li>
          </ul>
        </div>
      </div>

      {/* Policy Information */}
      {showPolicyInfo && (
        <div
          className={`animate-fade-in mb-8 rounded-lg border-2 p-6 ${isSmallBusiness ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'} `}
        >
          <div className="flex items-start gap-3">
            <svg
              className={`mt-0.5 h-6 w-6 flex-shrink-0 ${isSmallBusiness ? 'text-green-600' : 'text-blue-600'}`}
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
            <div>
              <h3
                className={`mb-2 font-semibold ${isSmallBusiness ? 'text-green-900' : 'text-blue-900'}`}
              >
                {isSmallBusiness
                  ? 'Small Business Policy'
                  : 'Large Business Policy'}
              </h3>
              <div
                className={`space-y-2 text-sm ${isSmallBusiness ? 'text-green-800' : 'text-blue-800'}`}
              >
                {isSmallBusiness ? (
                  <>
                    <p>
                      <strong>Accrual Rate:</strong> 1 hour per 30 hours worked
                    </p>
                    <p>
                      <strong>Annual Cap:</strong> 40 hours per year
                    </p>
                    <p>
                      <strong>Carryover:</strong> Up to 40 hours to next year
                    </p>
                    <p>
                      <strong>Usage Limit:</strong> Up to 40 hours per year
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>Accrual Rate:</strong> 1 hour per 30 hours worked
                    </p>
                    <p>
                      <strong>Annual Cap:</strong> 72 hours per year
                    </p>
                    <p>
                      <strong>Carryover:</strong> Up to 72 hours to next year
                    </p>
                    <p>
                      <strong>Usage Limit:</strong> Up to 72 hours per year
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
          Questions about who to count? Get help
        </button>
      </div>
    </div>
  );
}
