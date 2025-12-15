interface StepperProps {
  steps: string[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="relative flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-colors ${
                  index < currentStep
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : index === currentStep
                      ? 'bg-primary-100 border-primary-600 text-primary-600 dark:bg-primary-900 dark:text-primary-200'
                      : 'border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500'
                }`}
              >
                {index < currentStep ? (
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              {/* Step Label */}
              <div
                className={`mt-2 text-center text-xs font-medium transition-colors sm:text-sm ${
                  index <= currentStep
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {step}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`absolute left-1/2 top-5 h-0.5 w-full transition-colors ${
                  index < currentStep
                    ? 'bg-primary-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                style={{ transform: 'translateY(-50%)' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
