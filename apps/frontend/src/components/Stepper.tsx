interface StepperProps {
  steps: string[];
  currentStep: number;
  /** Optional: Show step descriptions */
  descriptions?: string[];
  /** Optional: Variant style */
  variant?: 'default' | 'compact';
}

export function Stepper({
  steps,
  currentStep,
  descriptions,
  variant = 'default',
}: StepperProps) {
  const isCompact = variant === 'compact';

  return (
    <div className={`w-full ${isCompact ? 'py-2' : 'py-6'}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="relative flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center rounded-full border-2 font-semibold transition-all duration-300 ${
                  isCompact ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
                } ${
                  index < currentStep
                    ? 'bg-royal-600 border-royal-600 text-white shadow-md'
                    : index === currentStep
                      ? 'bg-royal-50 border-royal-600 text-royal-700 ring-royal-100 dark:bg-royal-900 dark:text-royal-200 dark:ring-royal-900/50 shadow-lg ring-4'
                      : 'border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500'
                }`}
              >
                {index < currentStep ? (
                  <svg
                    className={`${isCompact ? 'h-4 w-4' : 'h-6 w-6'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-label="Step completed"
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
              {!isCompact && (
                <div className="mt-3 max-w-[120px] text-center">
                  <div
                    className={`text-xs font-semibold transition-colors duration-300 sm:text-sm ${
                      index <= currentStep
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-500'
                    }`}
                  >
                    {step}
                  </div>
                  {descriptions && descriptions[index] && (
                    <div
                      className={`mt-1 text-xs transition-colors duration-300 ${
                        index === currentStep
                          ? 'text-gray-600 dark:text-gray-400'
                          : 'text-gray-400 dark:text-gray-600'
                      }`}
                    >
                      {descriptions[index]}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`absolute top-${isCompact ? '4' : '5'} left-1/2 h-0.5 w-full transition-all duration-300 ${
                  index < currentStep
                    ? 'bg-royal-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                style={{ transform: 'translateY(-50%)' }}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>

      {/* Compact mode labels below */}
      {isCompact && (
        <div className="mt-2 flex items-center justify-between">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex-1 text-center text-xs transition-colors duration-300 ${
                index === currentStep
                  ? 'font-semibold text-gray-900 dark:text-white'
                  : index < currentStep
                    ? 'text-gray-600 dark:text-gray-400'
                    : 'text-gray-400 dark:text-gray-600'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
