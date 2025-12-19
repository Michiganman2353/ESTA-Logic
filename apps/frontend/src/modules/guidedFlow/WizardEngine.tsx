import IntroStep from './steps/IntroStep';
import EmployerTypeStep from './steps/EmployerTypeStep';
import EmployeeCountStep from './steps/EmployeeCountStep';
import PolicyLogicStep from './steps/PolicyLogicStep';
import SecureCameraStep from './steps/SecureCameraStep';
import SummaryStep from './steps/SummaryStep';
import { useWizard } from './WizardContext';

/**
 * Steps in the guided flow wizard
 */
const steps = [
  IntroStep,
  EmployerTypeStep,
  EmployeeCountStep,
  PolicyLogicStep,
  SecureCameraStep,
  SummaryStep,
];

/**
 * WizardEngine - Main Orchestrator
 *
 * Manages the wizard flow and renders the current step
 */
export default function WizardEngine() {
  const { step, maxStepReached } = useWizard();

  // Ensure step is within valid range
  const validStep = Math.max(0, Math.min(step, steps.length - 1));
  const Current = steps[validStep];

  // Safety check - should never happen but satisfies TypeScript
  if (!Current) {
    return <div>Error: Invalid step</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          {/* Progress Steps */}
          <div className="mb-3 flex items-center justify-between">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`flex flex-1 items-center ${index < steps.length - 1 ? 'relative' : ''} `}
              >
                {/* Step Circle */}
                <div
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                    index < validStep
                      ? 'border-green-600 bg-green-600 text-white'
                      : index === validStep
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : index <= maxStepReached
                          ? 'border-blue-300 bg-blue-100 text-blue-600'
                          : 'border-gray-300 bg-gray-100 text-gray-400'
                  } `}
                >
                  {index < validStep ? (
                    <svg
                      className="h-5 w-5"
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
                    index + 1
                  )}
                </div>

                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 ${
                      index < validStep ? 'bg-green-600' : 'bg-gray-300'
                    } `}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex items-center justify-between">
            <span className="flex-1 text-left text-xs font-semibold text-gray-600">
              Welcome
            </span>
            <span className="flex-1 text-center text-xs font-semibold text-gray-600">
              Type
            </span>
            <span className="flex-1 text-center text-xs font-semibold text-gray-600">
              Count
            </span>
            <span className="flex-1 text-center text-xs font-semibold text-gray-600">
              Policy
            </span>
            <span className="flex-1 text-center text-xs font-semibold text-gray-600">
              Docs
            </span>
            <span className="flex-1 text-right text-xs font-semibold text-gray-600">
              Complete
            </span>
          </div>

          {/* Overall Progress Percentage */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-700">
                Overall Progress
              </span>
              <span className="text-gray-600">
                {Math.round((validStep / (steps.length - 1)) * 100)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                style={{
                  width: `${(validStep / (steps.length - 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Current Step Content */}
      <div className="py-8">
        <Current />
      </div>
    </div>
  );
}
