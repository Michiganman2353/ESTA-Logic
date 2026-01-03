/**
 * EmployerProfileStep - Collect employer information
 * Enhanced with TurboTax-style UX: confidence indicators, decision explanations, trust signals
 */

import { useState } from 'react';
import { useWizard } from '../core/useWizard';
import EnhancedWizardStep from '../components/EnhancedWizardStep';
import { StepConfidenceIndicator } from '../components/ConfidenceIndicator';
import { ToneEngine } from '../../tone/ToneEngine';

export default function EmployerProfileStep() {
  const { next, back, setData, getData } = useWizard();
  const [companyName, setCompanyName] = useState(getData('companyName') || '');
  const [employerType, setEmployerType] = useState(
    getData('employerType') || ''
  );

  const handleContinue = () => {
    setData('companyName', companyName);
    setData('employerType', employerType);
    next();
  };

  const isValid = companyName.trim() !== '' && employerType !== '';

  // Calculate confidence score for this step
  const stepData = { companyName, employerType };
  const requiredFields = ['companyName', 'employerType'];

  return (
    <EnhancedWizardStep
      title="Tell Us About Your Business"
      subtitle={ToneEngine.reassuring(
        'This helps us determine which ESTA requirements apply to you.'
      )}
      showTrustBadges={true}
      showSecuritySignals={false}
      showLegalAssurance={false}
      stepNumber={2}
      totalSteps={6}
    >
      <div className="space-y-6">
        {/* Confidence Indicator */}
        <div className="flex justify-end">
          <StepConfidenceIndicator
            stepData={stepData}
            requiredFields={requiredFields}
          />
        </div>

        {/* Main Input Card */}
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <div className="mb-6">
            <label
              htmlFor="companyName"
              className="mb-2 block font-semibold text-gray-900"
            >
              Company Name
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your company name"
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block font-semibold text-gray-900">
              Employer Type
            </label>
            <p className="mb-3 text-sm text-gray-600">
              💡 Choose the category that best describes your organization
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  value: 'small',
                  label: 'Small Business',
                  desc: 'Fewer than 50 employees',
                },
                {
                  value: 'large',
                  label: 'Large Business',
                  desc: '50 or more employees',
                },
                {
                  value: 'municipal',
                  label: 'Municipal',
                  desc: 'Government entity',
                },
                {
                  value: 'nonprofit',
                  label: 'Nonprofit',
                  desc: '501(c)(3) organization',
                },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setEmployerType(type.value)}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    employerType === type.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">
                    {type.label}
                  </div>
                  <div className="text-sm text-gray-600">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Why This Matters - Educational Component */}
        {employerType && (
          <div className="animate-fade-in rounded-lg border border-blue-200 bg-blue-50 p-6">
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
                  Why This Matters
                </h3>
                <p className="text-sm text-blue-800">
                  Your employer type determines specific ESTA requirements and
                  benefits. We'll automatically configure the correct policies
                  and accrual rates for your organization.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
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
    </EnhancedWizardStep>
  );
}
