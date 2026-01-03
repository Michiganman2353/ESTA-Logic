/**
 * Welcome Page - Entry point for ESTA-Logic guided experience
 *
 * Purpose: Emotional grounding and journey initialization
 * First impression that sets the tone for the entire experience
 */

import React, { useState, useEffect } from 'react';
import WelcomeStep from '../../ui/steps/WelcomeStep';
import { guidedFlowEngine } from '../../core/navigation/GuidedFlowEngine';
import { guidedSessionStore } from '../../state/guided-session-store';

export interface WelcomePageProps {
  /** User ID if authenticated */
  userId?: string;

  /** User type (employer or employee) */
  userType?: 'employer' | 'employee';

  /** Callback when user starts journey */
  onStart?: (journeyId: string) => void;
}

/**
 * Welcome Page Component
 *
 * Implements the entry experience:
 * - Check for existing sessions (resume capability)
 * - Display welcome message
 * - Initialize journey on user action
 * - Set up session tracking
 */
export const WelcomePage: React.FC<WelcomePageProps> = ({
  userId,
  userType = 'employer',
  onStart,
}) => {
  const [existingSession, setExistingSession] = useState<any>(null);
  const [isReturning, setIsReturning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkExistingSession = async () => {
      if (userId) {
        const session = guidedSessionStore.getActiveSession(userId);
        if (session) {
          setExistingSession(session);
          setIsReturning(true);
        }
      }
      setIsLoading(false);
    };

    checkExistingSession();
  }, [userId]);

  const handleStart = async () => {
    const journeyId =
      userType === 'employer' ? 'employer-onboarding' : 'employee-onboarding';

    try {
      // Start the journey
      const firstStep = await guidedFlowEngine.start(
        journeyId,
        userId || 'guest'
      );

      // Create session
      const session = guidedSessionStore.createSession(
        userId || 'guest',
        journeyId,
        {
          journeyId,
          userId: userId || 'guest',
          currentStepId: firstStep.id,
          completedSteps: [],
          stepData: {},
          startedAt: new Date(),
          lastUpdatedAt: new Date(),
          status: 'in-progress',
        },
        {
          deviceType: getDeviceType(),
          browser: getBrowserType(),
          startedFrom: 'welcome-page',
        }
      );

      console.log('Journey started:', journeyId, 'Session:', session.id);

      // Notify parent component
      if (onStart) {
        onStart(journeyId);
      }
    } catch (error) {
      console.error('Failed to start journey:', error);
    }
  };

  const handleResume = async () => {
    if (existingSession) {
      // Resume existing journey
      console.log('Resuming session:', existingSession.id);

      if (onStart) {
        onStart(existingSession.journeyId);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="welcome-page loading">
        <div className="loading-spinner">
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="welcome-page">
      {/* Main Welcome Experience */}
      <div className="welcome-container">
        {isReturning ? (
          // Returning user experience
          <div className="returning-user-welcome">
            <div className="welcome-header">
              <h1 className="welcome-headline">Welcome back!</h1>
              <p className="welcome-message">
                We saved your progress. Ready to pick up where you left off?
              </p>
            </div>

            {/* Progress Summary */}
            <div className="progress-summary">
              <div className="summary-icon">📊</div>
              <div className="summary-content">
                <div className="summary-title">Your Progress</div>
                <div className="summary-stats">
                  <div className="stat-item">
                    <span className="stat-label">Journey:</span>
                    <span className="stat-value">
                      {existingSession.journeyId === 'employer-onboarding'
                        ? 'Employer Setup'
                        : 'Employee Setup'}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Last saved:</span>
                    <span className="stat-value">
                      {new Date(existingSession.lastSaved).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="btn-primary large" onClick={handleResume}>
                Continue Where I Left Off →
              </button>
              <button className="btn-secondary" onClick={handleStart}>
                Start Fresh
              </button>
            </div>
          </div>
        ) : (
          // New user experience
          <WelcomeStep
            userType={userType}
            onContinue={handleStart}
            progress={{
              estimatedTime: 180, // 3 minutes
              totalSteps: 6,
            }}
          />
        )}
      </div>

      {/* Background Elements */}
      <div className="welcome-background">
        <div className="bg-pattern" />
      </div>
    </div>
  );
};

/**
 * Utility functions
 */
const getDeviceType = (): string => {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua
    )
  ) {
    return 'mobile';
  }
  return 'desktop';
};

const getBrowserType = (): string => {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'chrome';
  if (ua.includes('Firefox')) return 'firefox';
  if (ua.includes('Safari')) return 'safari';
  if (ua.includes('Edge')) return 'edge';
  return 'other';
};

/**
 * Example CSS (to be implemented in actual stylesheet):
 *
 * .welcome-page {
 *   min-height: 100vh;
 *   display: flex;
 *   align-items: center;
 *   justify-content: center;
 *   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
 *   position: relative;
 *   overflow: hidden;
 * }
 *
 * .welcome-container {
 *   max-width: 800px;
 *   width: 100%;
 *   padding: 24px;
 *   background: white;
 *   border-radius: 16px;
 *   box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
 *   position: relative;
 *   z-index: 10;
 * }
 *
 * .returning-user-welcome {
 *   padding: 48px;
 * }
 *
 * .progress-summary {
 *   display: flex;
 *   gap: 20px;
 *   padding: 24px;
 *   background: #f9fafb;
 *   border-radius: 12px;
 *   margin: 32px 0;
 * }
 *
 * .summary-icon {
 *   font-size: 3rem;
 * }
 *
 * .summary-stats {
 *   display: flex;
 *   flex-direction: column;
 *   gap: 8px;
 *   margin-top: 12px;
 * }
 *
 * .stat-item {
 *   display: flex;
 *   gap: 8px;
 *   font-size: 0.875rem;
 * }
 *
 * .stat-label {
 *   color: #6a6a6a;
 * }
 *
 * .stat-value {
 *   font-weight: 500;
 *   color: #1a1a1a;
 * }
 *
 * .action-buttons {
 *   display: flex;
 *   flex-direction: column;
 *   gap: 12px;
 * }
 *
 * .btn-primary.large {
 *   padding: 16px 32px;
 *   font-size: 1.125rem;
 * }
 *
 * .welcome-background {
 *   position: absolute;
 *   inset: 0;
 *   opacity: 0.1;
 * }
 *
 * .bg-pattern {
 *   width: 100%;
 *   height: 100%;
 *   background-image:
 *     repeating-linear-gradient(45deg,
 *       transparent,
 *       transparent 35px,
 *       rgba(255,255,255,.1) 35px,
 *       rgba(255,255,255,.1) 70px);
 * }
 */

export default WelcomePage;
