/**
 * EmployeePolicyStep - Configure employee policy
 */

import { useState } from 'react';
import PageTransition from '../../animations/PageTransition';
import { useWizard } from '../core/WizardContext';

export default function EmployeePolicyStep() {
  const { next, back, setData, getData } = useWizard();
  const [employeeCount, setEmployeeCount] = useState(
    getData('employeeCount') || ''
  );

  const handleContinue = () => {
    setData('employeeCount', parseInt(employeeCount));
    next();
  };

  const isValid = employeeCount !== '' && parseInt(employeeCount) > 0;

  // Determine policy tier
  const count = parseInt(employeeCount) || 0;
  const policyTier = count < 50 ? 'Small Business Tier' : 'Large Business Tier';
  const accrualRate =
    count < 50 ? '1 hour per 30 hours worked' : '1 hour per 30 hours worked';

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          Employee Count
        </h1>
        <p className="mb-8 text-gray-600">
          How many employees do you currently have? This determines your
          compliance requirements.
        </p>

        <div className="mb-8 rounded-xl bg-white p-8 shadow-lg">
          <div className="mb-6">
            <label
              htmlFor="employeeCount"
              className="mb-2 block font-semibold text-gray-900"
            >
              Number of Employees
            </label>
            <input
              id="employeeCount"
              type="number"
              min="1"
              value={employeeCount}
              onChange={(e) => setEmployeeCount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter number of employees"
            />
            <p className="mt-2 text-sm text-gray-600">
              Count all employees, including part-time and seasonal workers
            </p>
          </div>

          {isValid && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-6">
              <h3 className="mb-2 font-semibold text-green-900">
                {policyTier}
              </h3>
              <p className="mb-2 text-sm text-green-800">
                Based on your employee count, here's your policy:
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-green-800">
                <li>Accrual Rate: {accrualRate}</li>
                <li>
                  Carryover: {count < 50 ? '40 hours max' : '72 hours max'}
                </li>
                <li>
                  Annual Usage Cap: {count < 50 ? '40 hours' : '72 hours'}
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <button
            onClick={back}
            className="rounded-xl border border-gray-300 px-8 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            ← Back
          </button>
          <button
            onClick={handleContinue}
            disabled={!isValid}
            className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-md transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue →
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
