/**
 * ReassuranceFooter - Confidence-building footer component
 *
 * Purpose: Provide continuous reassurance throughout the journey
 * Displays trust indicators, auto-save status, and supportive messages
 */

import React from 'react';

export interface ReassuranceFooterProps {
  /** Show auto-save indicator */
  showAutoSave?: boolean;

  /** Last saved timestamp */
  lastSaved?: Date;

  /** Show trust indicators */
  showTrustIndicators?: boolean;

  /** Custom reassurance message */
  customMessage?: string;

  /** Estimated time remaining (seconds) */
  estimatedTimeRemaining?: number;
}

/**
 * Reassurance Footer Component
 *
 * Provides subtle, continuous confidence building:
 * - Auto-save status
 * - Security indicators
 * - Progress encouragement
 * - Time estimates
 */
export const ReassuranceFooter: React.FC<ReassuranceFooterProps> = ({
  showAutoSave = true,
  lastSaved,
  showTrustIndicators = true,
  customMessage,
  estimatedTimeRemaining,
}) => {
  const formatLastSaved = (date: Date): string => {
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 10) {
      return 'just now';
    } else if (diffSeconds < 60) {
      return `${diffSeconds} seconds ago`;
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 1) {
      return 'less than a minute';
    } else if (minutes === 1) {
      return '1 minute';
    } else {
      return `${minutes} minutes`;
    }
  };

  return (
    <div className="reassurance-footer">
      <div className="footer-strip">
        {/* Custom Message or Default Content */}
        {customMessage ? (
          <div className="custom-reassurance">
            <span className="reassurance-icon">✨</span>
            <span className="reassurance-text">{customMessage}</span>
          </div>
        ) : (
          <div className="default-content">
            {/* Auto-save Status */}
            {showAutoSave && (
              <div className="auto-save-indicator">
                <span className="save-icon">💾</span>
                <span className="save-text">
                  {lastSaved
                    ? `Saved ${formatLastSaved(lastSaved)}`
                    : 'Auto-saving your progress'}
                </span>
              </div>
            )}

            {/* Time Remaining */}
            {estimatedTimeRemaining !== undefined &&
              estimatedTimeRemaining > 0 && (
                <div className="time-remaining">
                  <span className="time-icon">⏱️</span>
                  <span className="time-text">
                    About {formatTimeRemaining(estimatedTimeRemaining)}{' '}
                    remaining
                  </span>
                </div>
              )}

            {/* Trust Indicators */}
            {showTrustIndicators && (
              <div className="trust-indicators-compact">
                <div className="trust-item">
                  <span className="trust-icon">🔒</span>
                  <span className="trust-label">Encrypted</span>
                </div>
                <div className="trust-item">
                  <span className="trust-icon">📋</span>
                  <span className="trust-label">Compliant</span>
                </div>
                <div className="trust-item">
                  <span className="trust-icon">✓</span>
                  <span className="trust-label">Secure</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Example CSS (to be implemented in actual stylesheet):
 *
 * .reassurance-footer {
 *   position: fixed;
 *   bottom: 0;
 *   left: 0;
 *   right: 0;
 *   background: white;
 *   border-top: 1px solid #e5e7eb;
 *   z-index: 90;
 * }
 *
 * .footer-strip {
 *   max-width: 1200px;
 *   margin: 0 auto;
 *   padding: 12px 24px;
 * }
 *
 * .default-content {
 *   display: flex;
 *   justify-content: space-between;
 *   align-items: center;
 *   gap: 24px;
 *   flex-wrap: wrap;
 * }
 *
 * .auto-save-indicator,
 * .time-remaining,
 * .custom-reassurance {
 *   display: flex;
 *   align-items: center;
 *   gap: 6px;
 *   font-size: 0.875rem;
 *   color: #6a6a6a;
 * }
 *
 * .save-icon,
 * .time-icon,
 * .reassurance-icon {
 *   font-size: 1rem;
 * }
 *
 * .trust-indicators-compact {
 *   display: flex;
 *   gap: 16px;
 * }
 *
 * .trust-item {
 *   display: flex;
 *   align-items: center;
 *   gap: 4px;
 *   font-size: 0.75rem;
 *   color: #6a6a6a;
 * }
 *
 * .trust-icon {
 *   font-size: 0.875rem;
 * }
 *
 * @media (max-width: 768px) {
 *   .default-content {
 *     flex-direction: column;
 *     align-items: start;
 *     gap: 12px;
 *   }
 *
 *   .trust-indicators-compact {
 *     width: 100%;
 *     justify-content: space-around;
 *   }
 * }
 */

export default ReassuranceFooter;
