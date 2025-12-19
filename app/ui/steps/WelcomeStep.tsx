/**
 * WelcomeStep - First step in employer onboarding journey
 * 
 * Purpose: Ground the user emotionally, establish trust, set expectations
 * Tone: Warm, reassuring, professional
 */

import React from 'react';

export interface WelcomeStepProps {
  /** User type: employer or employee */
  userType?: 'employer' | 'employee';
  
  /** Callback when user is ready to proceed */
  onContinue: () => void;
  
  /** Progress information */
  progress?: {
    estimatedTime: number; // in seconds
    totalSteps: number;
  };
}

/**
 * Welcome Step Component
 * 
 * Implements the guided welcome experience:
 * - Emotional grounding
 * - Clear expectations
 * - Trust indicators
 * - Single, clear call to action
 */
export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  userType = 'employer',
  onContinue,
  progress
}) => {
  const messages = {
    employer: {
      headline: "Let's take the stress out of compliance.",
      supporting: "We'll walk you through Michigan ESTA requirements step-by-step, just like TurboTax. No legal expertise required.",
      cta: "Start Guided Setup"
    },
    employee: {
      headline: "Welcome! Let's get you connected.",
      supporting: "Your employer uses ESTA-Logic to track your earned sick time. This will only take a minute to set up.",
      cta: "Get Started"
    }
  };

  const content = messages[userType];
  const estimatedMinutes = progress ? Math.ceil(progress.estimatedTime / 60) : 3;

  return (
    <div className="welcome-step">
      {/* Main Content Container */}
      <div className="welcome-content">
        {/* Headline */}
        <h1 className="welcome-headline">
          {content.headline}
        </h1>

        {/* Supporting Text */}
        <p className="welcome-supporting">
          {content.supporting}
        </p>

        {/* Progress Indicator */}
        {progress && (
          <div className="welcome-progress-info">
            <span className="progress-icon">⏱️</span>
            <span className="progress-text">
              Takes about {estimatedMinutes} minutes • {progress.totalSteps} simple steps
            </span>
          </div>
        )}

        {/* Primary CTA */}
        <button 
          className="welcome-cta primary"
          onClick={onContinue}
          aria-label={content.cta}
        >
          {content.cta}
        </button>
      </div>

      {/* Trust Indicators Footer */}
      <div className="welcome-trust-indicators">
        <div className="trust-indicator">
          <span className="trust-icon">🔒</span>
          <span className="trust-text">Bank-level encryption</span>
        </div>
        <div className="trust-indicator">
          <span className="trust-icon">📋</span>
          <span className="trust-text">Audit-ready records</span>
        </div>
        <div className="trust-indicator">
          <span className="trust-icon">✓</span>
          <span className="trust-text">Legally compliant</span>
        </div>
      </div>

      {/* Subtle Legal Reassurance */}
      <div className="welcome-legal-note">
        <p>
          ESTA-Logic automates Michigan Earned Sick Time Act compliance.
          All calculations follow current state regulations.
        </p>
      </div>
    </div>
  );
};

/**
 * Example CSS (to be implemented in actual stylesheet):
 * 
 * .welcome-step {
 *   max-width: 640px;
 *   margin: 0 auto;
 *   padding: 64px 24px;
 *   text-align: center;
 * }
 * 
 * .welcome-headline {
 *   font-size: 2.5rem;
 *   font-weight: 600;
 *   color: #1a1a1a;
 *   margin-bottom: 24px;
 *   line-height: 1.2;
 * }
 * 
 * .welcome-supporting {
 *   font-size: 1.25rem;
 *   color: #4a4a4a;
 *   margin-bottom: 32px;
 *   line-height: 1.6;
 * }
 * 
 * .welcome-progress-info {
 *   display: flex;
 *   align-items: center;
 *   justify-content: center;
 *   gap: 8px;
 *   margin-bottom: 32px;
 *   color: #6a6a6a;
 * }
 * 
 * .welcome-cta {
 *   padding: 16px 48px;
 *   font-size: 1.125rem;
 *   font-weight: 600;
 *   background: #2563eb;
 *   color: white;
 *   border: none;
 *   border-radius: 8px;
 *   cursor: pointer;
 *   transition: background 0.2s ease;
 * }
 * 
 * .welcome-cta:hover {
 *   background: #1d4ed8;
 * }
 * 
 * .welcome-trust-indicators {
 *   display: flex;
 *   justify-content: center;
 *   gap: 32px;
 *   margin-top: 48px;
 *   padding-top: 32px;
 *   border-top: 1px solid #e5e5e5;
 * }
 * 
 * .trust-indicator {
 *   display: flex;
 *   align-items: center;
 *   gap: 8px;
 *   color: #6a6a6a;
 *   font-size: 0.875rem;
 * }
 */

export default WelcomeStep;
