/**
 * EnhancedWizardStep Component
 * 
 * Wrapper component that adds TurboTax-style UX enhancements to wizard steps:
 * - Trust badges and security signals
 * - Decision explanations with confidence scores
 * - Psychological reassurance
 * - Legal assurance indicators
 * - Emotional UX writing
 */

import { ReactNode } from 'react';
import SecuritySignals from '../../trust/SecuritySignals';
import LegalAssurance from '../../trust/LegalAssurance';
import { TrustBadge } from '../../../components/Settings/TrustBadge';
import PageTransition from '../../animations/PageTransition';

export interface EnhancedWizardStepProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showTrustBadges?: boolean;
  showSecuritySignals?: boolean;
  showLegalAssurance?: boolean;
  confidenceScore?: number;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
}

export default function EnhancedWizardStep({
  children,
  title,
  subtitle,
  showTrustBadges = true,
  showSecuritySignals = false,
  showLegalAssurance = false,
  confidenceScore,
  stepNumber,
  totalSteps,
  className = '',
}: EnhancedWizardStepProps) {
  return (
    <PageTransition>
      <div className={`enhanced-wizard-step mx-auto max-w-4xl px-4 py-8 ${className}`}>
        {/* Progress Indicator */}
        {stepNumber !== undefined && totalSteps !== undefined && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Step {stepNumber} of {totalSteps}
              </span>
              <span>{Math.round((stepNumber / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Header Section with Trust Elements */}
        <div className="mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
            </div>

            {/* Trust Badges */}
            {showTrustBadges && (
              <div className="flex items-center gap-2">
                <TrustBadge variant="security" size="sm" />
                <TrustBadge variant="compliance" size="sm" />
              </div>
            )}
          </div>

          {/* Security Signals */}
          {showSecuritySignals && (
            <div className="mt-4">
              <SecuritySignals />
            </div>
          )}

          {/* Legal Assurance */}
          {showLegalAssurance && (
            <div className="mt-4">
              <LegalAssurance variant="inline" />
            </div>
          )}

          {/* Confidence Score */}
          {confidenceScore !== undefined && (
            <div className="mt-4">
              <ConfidenceScoreBanner score={confidenceScore} />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="wizard-step-content">{children}</div>

        {/* Footer Reassurance */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600"
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
            <div className="flex-1">
              <p className="text-sm text-blue-900">
                <strong>Your progress is automatically saved.</strong> You can leave and
                return anytime without losing your work.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

/**
 * Confidence Score Banner Component
 */
function ConfidenceScoreBanner({ score }: { score: number }) {
  const level = score >= 85 ? 'high' : score >= 65 ? 'medium' : 'low';

  const config = {
    high: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      icon: '✓',
      message: 'Excellent! Your setup is on track.',
    },
    medium: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      icon: '◐',
      message: 'Good progress. Keep going!',
    },
    low: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-900',
      icon: '◯',
      message: "Let's complete a few more details.",
    },
  }[level];

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 ${config.bg} ${config.border}`}
    >
      <div className="flex items-center gap-3">
        <span className={`text-xl ${config.text}`}>{config.icon}</span>
        <span className={`text-sm font-medium ${config.text}`}>
          {config.message}
        </span>
      </div>
      <span className={`text-lg font-bold ${config.text}`}>{score}%</span>
    </div>
  );
}
