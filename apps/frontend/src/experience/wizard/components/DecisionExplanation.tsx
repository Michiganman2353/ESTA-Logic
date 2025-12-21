/**
 * DecisionExplanation Component
 *
 * Displays why a recommendation was made with confidence levels and reasoning.
 * Integrates with DecisionEngine to provide transparent, trust-building explanations.
 */

import { DecisionEngine } from '../../intelligence/DecisionEngine';

export interface DecisionExplanationProps {
  recommendation: string;
  why: string;
  confidence: 'High' | 'Medium' | 'Low';
  factors?: string[];
  alternativeOptions?: string[];
  className?: string;
}

export default function DecisionExplanation({
  recommendation,
  why,
  confidence,
  factors,
  alternativeOptions,
  className = '',
}: DecisionExplanationProps) {
  const confidenceColor = {
    High: 'bg-green-50 border-green-200 text-green-900',
    Medium: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    Low: 'bg-orange-50 border-orange-200 text-orange-900',
  }[confidence];

  const confidenceBadgeColor = {
    High: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Low: 'bg-orange-100 text-orange-800',
  }[confidence];

  const confidenceIcon = {
    High: '✓',
    Medium: '◐',
    Low: '◯',
  }[confidence];

  return (
    <div
      className={`decision-explanation rounded-lg border-2 p-6 ${confidenceColor} ${className}`}
      role="region"
      aria-label="Decision explanation"
    >
      {/* Header with Confidence Badge */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="mb-2 text-lg font-semibold">
            💡 Why We Recommend This
          </h3>
        </div>
        <div
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${confidenceBadgeColor}`}
          role="status"
          aria-label={`Confidence level: ${confidence}`}
        >
          <span className="text-sm">{confidenceIcon}</span>
          <span>{confidence} Confidence</span>
        </div>
      </div>

      {/* Recommendation */}
      <div className="mb-4">
        <p className="text-base font-medium">{recommendation}</p>
      </div>

      {/* Explanation */}
      <div className="mb-4">
        <p className="text-sm opacity-90">{why}</p>
      </div>

      {/* Decision Factors */}
      {factors && factors.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-semibold">Based on:</h4>
          <ul className="space-y-1 text-sm opacity-90">
            {factors.map((factor, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-0.5 text-xs">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alternative Options */}
      {alternativeOptions && alternativeOptions.length > 0 && (
        <div className="border-t border-current pt-4 opacity-75">
          <h4 className="mb-2 text-sm font-semibold">Other options:</h4>
          <ul className="space-y-1 text-sm">
            {alternativeOptions.map((option, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-0.5">→</span>
                <span>{option}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Helper component that generates a DecisionExplanation from DecisionEngine
 */
export function PolicyDecisionExplanation({
  employeeCount,
  hasExistingPolicy,
  className,
}: {
  employeeCount: number;
  hasExistingPolicy: boolean;
  className?: string;
}) {
  const decision = DecisionEngine.explainPolicyRecommendation(
    employeeCount,
    hasExistingPolicy
  );

  return <DecisionExplanation {...decision} className={className} />;
}

/**
 * Helper component for accrual rate explanations
 */
export function AccrualRateDecisionExplanation({
  employeeCount,
  className,
}: {
  employeeCount: number;
  className?: string;
}) {
  const decision = DecisionEngine.explainAccrualRate(employeeCount);

  return <DecisionExplanation {...decision} className={className} />;
}
