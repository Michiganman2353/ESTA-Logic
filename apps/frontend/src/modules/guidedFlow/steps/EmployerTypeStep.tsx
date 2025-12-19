import { useState } from 'react';
import { useWizard } from '../WizardContext';

type EmployerType = 'small' | 'large' | 'municipal' | 'nonprofit';

interface EmployerOption {
  value: EmployerType;
  title: string;
  description: string;
  icon: string;
}

const employerOptions: EmployerOption[] = [
  {
    value: 'small',
    title: 'Small Business',
    description: 'Fewer than 10 employees',
    icon: '🏪',
  },
  {
    value: 'large',
    title: 'Large Business',
    description: '10 or more employees',
    icon: '🏢',
  },
  {
    value: 'municipal',
    title: 'Municipal/Government',
    description: 'Government or public entity',
    icon: '🏛️',
  },
  {
    value: 'nonprofit',
    title: 'Nonprofit',
    description: '501(c)(3) organization',
    icon: '🤝',
  },
];

/**
 * EmployerTypeStep - Employer Type Selection
 *
 * Determines the type of employer to apply correct ESTA rules
 */
export default function EmployerTypeStep() {
  const { setStep, data, update } = useWizard();
  const [selectedType, setSelectedType] = useState<EmployerType | undefined>(
    data.employerType
  );

  const handleContinue = () => {
    if (selectedType) {
      update({ employerType: selectedType });
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(0);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-3 text-3xl font-bold text-gray-900">
          What type of employer are you?
        </h1>
        <p className="text-lg text-gray-600">
          This helps us determine which ESTA requirements apply to your
          organization.
        </p>
      </div>

      {/* Options Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {employerOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedType(option.value)}
            className={`rounded-xl border-2 p-6 text-left transition-all ${
              selectedType === option.value
                ? 'border-blue-600 bg-blue-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            <div className="mb-3 text-4xl">{option.icon}</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              {option.title}
            </h3>
            <p className="text-gray-600">{option.description}</p>

            {/* Selected Indicator */}
            {selectedType === option.value && (
              <div className="mt-4 flex items-center gap-2 text-blue-600">
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
                <span className="text-sm font-semibold">Selected</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Info Box */}
      {selectedType && (
        <div className="animate-fade-in mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
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
              <h3 className="mb-1 font-semibold text-blue-900">
                What this means for you
              </h3>
              <p className="text-sm text-blue-800">
                {selectedType === 'small' &&
                  "Small businesses have different accrual rates and requirements under ESTA. We'll guide you through the specific rules that apply."}
                {selectedType === 'large' &&
                  "Larger employers have higher accrual rates and carryover requirements. We'll help you set up the correct policy."}
                {selectedType === 'municipal' &&
                  'Municipal employers may have specific exemptions or modified requirements under ESTA.'}
                {selectedType === 'nonprofit' &&
                  'Nonprofit organizations must comply with ESTA but may have unique considerations for volunteers and board members.'}
              </p>
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
          disabled={!selectedType}
          className={`rounded-xl px-8 py-3 font-semibold shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            selectedType
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'cursor-not-allowed bg-gray-300 text-gray-500'
          } `}
        >
          Continue →
        </button>
      </div>

      {/* Help */}
      <div className="mt-6 text-center">
        <button className="text-sm text-blue-600 underline hover:text-blue-800">
          Not sure which category applies? Get help
        </button>
      </div>
    </div>
  );
}
