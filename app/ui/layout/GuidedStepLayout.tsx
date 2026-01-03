/**
 * GuidedStepLayout - Consistent layout for all guided journey steps
 *
 * Purpose: Provide consistent structure, progress indication, and reassurance
 * Philosophy: User always knows where they are and what's next
 */

import React, { ReactNode } from 'react';

export interface GuidedStepLayoutProps {
  /** Current step number (1-indexed) */
  currentStep: number;

  /** Total number of steps */
  totalSteps: number;

  /** Step content */
  children: ReactNode;

  /** Journey name for context */
  journeyName?: string;

  /** Show progress bar */
  showProgress?: boolean;

  /** Custom progress message */
  progressMessage?: string;

  /** Show help button */
  showHelp?: boolean;

  /** Help button callback */
  onHelp?: () => void;
}

/**
 * Guided Step Layout Component
 *
 * Provides:
 * - Consistent header with progress
 * - Main content area
 * - Reassurance footer
 * - Subtle navigation context
 */
export const GuidedStepLayout: React.FC<GuidedStepLayoutProps> = ({
  currentStep,
  totalSteps,
  children,
  journeyName = 'Setup',
  showProgress = true,
  progressMessage,
  showHelp = true,
  onHelp,
}) => {
  const percentComplete = Math.round((currentStep / totalSteps) * 100);
  const stepsRemaining = totalSteps - currentStep;

  return (
    <div className="guided-step-layout">
      {/* Top Progress Bar */}
      {showProgress && (
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${percentComplete}%` }}
            role="progressbar"
            aria-valuenow={percentComplete}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}

      {/* Header */}
      <header className="layout-header">
        <div className="header-content">
          <div className="journey-context">
            <span className="journey-name">{journeyName}</span>
            <span className="step-indicator">
              Step {currentStep} of {totalSteps}
            </span>
          </div>

          {showHelp && (
            <button
              className="help-button"
              onClick={onHelp}
              aria-label="Get help"
            >
              <span className="help-icon">❓</span>
              <span className="help-text">Help</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="layout-main">
        <div className="content-container">{children}</div>
      </main>

      {/* Reassurance Footer */}
      <footer className="layout-footer">
        <div className="footer-content">
          {progressMessage ? (
            <div className="custom-message">
              <span className="message-icon">✨</span>
              <span className="message-text">{progressMessage}</span>
            </div>
          ) : (
            <div className="default-reassurance">
              {stepsRemaining > 0 ? (
                <>
                  <span className="reassurance-icon">🎯</span>
                  <span className="reassurance-text">
                    {stepsRemaining === 1
                      ? 'Almost there! Just 1 more step.'
                      : `${stepsRemaining} steps remaining. You're doing great.`}
                  </span>
                </>
              ) : (
                <>
                  <span className="reassurance-icon">🎉</span>
                  <span className="reassurance-text">
                    Final step! You're almost done.
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

/**
 * Example CSS (to be implemented in actual stylesheet):
 *
 * .guided-step-layout {
 *   min-height: 100vh;
 *   display: flex;
 *   flex-direction: column;
 *   background: #fafafa;
 * }
 *
 * .progress-bar-container {
 *   position: fixed;
 *   top: 0;
 *   left: 0;
 *   right: 0;
 *   height: 4px;
 *   background: #e5e7eb;
 *   z-index: 1000;
 * }
 *
 * .progress-bar-fill {
 *   height: 100%;
 *   background: linear-gradient(90deg, #2563eb, #3b82f6);
 *   transition: width 0.3s ease;
 * }
 *
 * .layout-header {
 *   background: white;
 *   border-bottom: 1px solid #e5e7eb;
 *   padding: 16px 24px;
 *   position: sticky;
 *   top: 0;
 *   z-index: 100;
 * }
 *
 * .header-content {
 *   max-width: 1200px;
 *   margin: 0 auto;
 *   display: flex;
 *   justify-content: space-between;
 *   align-items: center;
 * }
 *
 * .journey-context {
 *   display: flex;
 *   align-items: center;
 *   gap: 16px;
 * }
 *
 * .journey-name {
 *   font-weight: 600;
 *   font-size: 1.125rem;
 *   color: #1a1a1a;
 * }
 *
 * .step-indicator {
 *   font-size: 0.875rem;
 *   color: #6a6a6a;
 *   padding: 4px 12px;
 *   background: #f3f4f6;
 *   border-radius: 12px;
 * }
 *
 * .help-button {
 *   display: flex;
 *   align-items: center;
 *   gap: 6px;
 *   padding: 8px 16px;
 *   background: white;
 *   border: 1px solid #d1d5db;
 *   border-radius: 6px;
 *   cursor: pointer;
 *   font-size: 0.875rem;
 *   color: #4a4a4a;
 *   transition: all 0.2s ease;
 * }
 *
 * .help-button:hover {
 *   background: #f9fafb;
 *   border-color: #9ca3af;
 * }
 *
 * .layout-main {
 *   flex: 1;
 *   padding: 48px 24px;
 * }
 *
 * .content-container {
 *   max-width: 1200px;
 *   margin: 0 auto;
 * }
 *
 * .layout-footer {
 *   background: white;
 *   border-top: 1px solid #e5e7eb;
 *   padding: 16px 24px;
 * }
 *
 * .footer-content {
 *   max-width: 1200px;
 *   margin: 0 auto;
 *   text-align: center;
 * }
 *
 * .default-reassurance,
 * .custom-message {
 *   display: inline-flex;
 *   align-items: center;
 *   gap: 8px;
 *   font-size: 0.875rem;
 *   color: #6a6a6a;
 * }
 *
 * .reassurance-icon,
 * .message-icon {
 *   font-size: 1rem;
 * }
 */

export default GuidedStepLayout;
