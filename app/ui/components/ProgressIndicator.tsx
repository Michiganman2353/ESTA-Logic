/**
 * ProgressIndicator - Visual progress tracking component
 *
 * Purpose: Show user progress through journey in a clear, encouraging way
 * Provides both visual and textual progress feedback
 */

import React from 'react';

export interface ProgressIndicatorProps {
  /** Current step (1-indexed) */
  currentStep: number;

  /** Total steps */
  totalSteps: number;

  /** Completed step IDs */
  completedSteps?: string[];

  /** Show percentage */
  showPercentage?: boolean;

  /** Show step numbers */
  showStepNumbers?: boolean;

  /** Variant style */
  variant?: 'bar' | 'dots' | 'steps' | 'minimal';

  /** Size */
  size?: 'small' | 'medium' | 'large';

  /** Show encouragement message */
  showEncouragement?: boolean;
}

/**
 * Progress Indicator Component
 *
 * Displays journey progress in various formats:
 * - Bar: Simple progress bar with percentage
 * - Dots: Step dots showing completion
 * - Steps: Detailed step list with status
 * - Minimal: Just text indication
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  completedSteps = [],
  showPercentage = true,
  showStepNumbers = true,
  variant = 'bar',
  size = 'medium',
  showEncouragement = true,
}) => {
  const percentComplete = Math.round((currentStep / totalSteps) * 100);
  const stepsRemaining = totalSteps - currentStep;

  const getEncouragementMessage = (): string => {
    if (percentComplete < 25) {
      return "Great start! You're making progress.";
    } else if (percentComplete < 50) {
      return "You're doing great! Keep going.";
    } else if (percentComplete < 75) {
      return "You're halfway there! Looking good.";
    } else if (percentComplete < 100) {
      return 'Almost there! Just a few more steps.';
    } else {
      return 'All done! Great work.';
    }
  };

  // Bar variant
  if (variant === 'bar') {
    return (
      <div className={`progress-indicator bar ${size}`}>
        {showStepNumbers && (
          <div className="progress-label">
            <span className="step-count">
              Step {currentStep} of {totalSteps}
            </span>
            {showPercentage && (
              <span className="percentage">{percentComplete}%</span>
            )}
          </div>
        )}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${percentComplete}%` }}
            role="progressbar"
            aria-valuenow={percentComplete}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress: ${percentComplete}% complete`}
          />
        </div>
        {showEncouragement && (
          <div className="encouragement-message">
            <span className="encouragement-icon">✨</span>
            <span className="encouragement-text">
              {getEncouragementMessage()}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Dots variant
  if (variant === 'dots') {
    return (
      <div className={`progress-indicator dots ${size}`}>
        <div className="dots-container">
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNumber = i + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div
                key={stepNumber}
                className={`progress-dot ${
                  isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming'
                }`}
                aria-label={`Step ${stepNumber}${
                  isCompleted ? ' completed' : isCurrent ? ' in progress' : ''
                }`}
              >
                {showStepNumbers && (
                  <span className="dot-number">{stepNumber}</span>
                )}
              </div>
            );
          })}
        </div>
        {showPercentage && (
          <div className="dots-label">{percentComplete}% complete</div>
        )}
      </div>
    );
  }

  // Steps variant (detailed list)
  if (variant === 'steps') {
    return (
      <div className={`progress-indicator steps ${size}`}>
        <div className="steps-list">
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNumber = i + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div
                key={stepNumber}
                className={`step-item ${
                  isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming'
                }`}
              >
                <div className="step-marker">
                  {isCompleted ? (
                    <span className="check-icon">✓</span>
                  ) : (
                    <span className="step-number">{stepNumber}</span>
                  )}
                </div>
                <div className="step-connector" />
              </div>
            );
          })}
        </div>
        <div className="steps-label">
          {currentStep} of {totalSteps} steps complete
        </div>
      </div>
    );
  }

  // Minimal variant
  return (
    <div className={`progress-indicator minimal ${size}`}>
      <span className="minimal-text">
        Step {currentStep} of {totalSteps}
        {showPercentage && ` (${percentComplete}%)`}
      </span>
      {stepsRemaining > 0 && (
        <span className="remaining-text">
          · {stepsRemaining} {stepsRemaining === 1 ? 'step' : 'steps'} remaining
        </span>
      )}
    </div>
  );
};

/**
 * Example CSS (to be implemented in actual stylesheet):
 *
 * .progress-indicator {
 *   width: 100%;
 * }
 *
 * // Bar variant
 * .progress-indicator.bar .progress-label {
 *   display: flex;
 *   justify-content: space-between;
 *   margin-bottom: 8px;
 *   font-size: 0.875rem;
 *   color: #6a6a6a;
 * }
 *
 * .progress-bar {
 *   width: 100%;
 *   height: 8px;
 *   background: #e5e7eb;
 *   border-radius: 4px;
 *   overflow: hidden;
 * }
 *
 * .progress-fill {
 *   height: 100%;
 *   background: linear-gradient(90deg, #2563eb, #3b82f6);
 *   transition: width 0.3s ease;
 * }
 *
 * .encouragement-message {
 *   display: flex;
 *   align-items: center;
 *   gap: 6px;
 *   margin-top: 8px;
 *   font-size: 0.875rem;
 *   color: #4a4a4a;
 * }
 *
 * // Dots variant
 * .dots-container {
 *   display: flex;
 *   justify-content: center;
 *   gap: 12px;
 *   margin-bottom: 8px;
 * }
 *
 * .progress-dot {
 *   width: 32px;
 *   height: 32px;
 *   border-radius: 50%;
 *   display: flex;
 *   align-items: center;
 *   justify-content: center;
 *   font-size: 0.75rem;
 *   font-weight: 600;
 *   transition: all 0.2s ease;
 * }
 *
 * .progress-dot.completed {
 *   background: #10b981;
 *   color: white;
 * }
 *
 * .progress-dot.current {
 *   background: #2563eb;
 *   color: white;
 *   box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
 * }
 *
 * .progress-dot.upcoming {
 *   background: #e5e7eb;
 *   color: #9ca3af;
 * }
 *
 * // Steps variant
 * .steps-list {
 *   display: flex;
 *   align-items: center;
 * }
 *
 * .step-item {
 *   display: flex;
 *   align-items: center;
 *   flex: 1;
 * }
 *
 * .step-marker {
 *   width: 32px;
 *   height: 32px;
 *   border-radius: 50%;
 *   display: flex;
 *   align-items: center;
 *   justify-content: center;
 *   font-weight: 600;
 *   font-size: 0.875rem;
 * }
 *
 * .step-item.completed .step-marker {
 *   background: #10b981;
 *   color: white;
 * }
 *
 * .step-item.current .step-marker {
 *   background: #2563eb;
 *   color: white;
 * }
 *
 * .step-item.upcoming .step-marker {
 *   background: #e5e7eb;
 *   color: #9ca3af;
 * }
 *
 * .step-connector {
 *   flex: 1;
 *   height: 2px;
 *   background: #e5e7eb;
 *   margin: 0 8px;
 * }
 *
 * .step-item:last-child .step-connector {
 *   display: none;
 * }
 *
 * .step-item.completed .step-connector {
 *   background: #10b981;
 * }
 *
 * // Minimal variant
 * .progress-indicator.minimal {
 *   font-size: 0.875rem;
 *   color: #6a6a6a;
 * }
 *
 * .remaining-text {
 *   color: #9ca3af;
 * }
 */

export default ProgressIndicator;
