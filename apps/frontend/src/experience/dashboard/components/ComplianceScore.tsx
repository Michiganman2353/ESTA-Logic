/**
 * Compliance Score - Visual compliance health indicator
 * Displays current compliance score with color-coded status
 */

import React from 'react';

export interface ComplianceScoreProps {
  score: number;
  className?: string;
  showDetails?: boolean;
}

export default function ComplianceScore({
  score,
  className = '',
  showDetails = true,
}: ComplianceScoreProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 75) return 'bg-yellow-100';
    if (score >= 50) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 50) return 'Needs Attention';
    return 'Critical';
  };

  return (
    <div
      className={`compliance-score rounded-lg border p-6 ${className}`}
      role="region"
      aria-label="Compliance score"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Compliance Score
        </h3>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${getScoreBgColor(score)} ${getScoreColor(score)}`}
        >
          {getScoreLabel(score)}
        </span>
      </div>

      <div className="flex items-end gap-4">
        <div className={`text-5xl font-bold ${getScoreColor(score)}`}>
          {score}
        </div>
        <div className="mb-2 text-2xl font-medium text-gray-500">/100</div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full transition-all duration-500 ${
            score >= 90
              ? 'bg-green-600'
              : score >= 75
                ? 'bg-yellow-600'
                : score >= 50
                  ? 'bg-orange-600'
                  : 'bg-red-600'
          }`}
          style={{ width: `${score}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {showDetails && (
        <p className="mt-4 text-sm text-gray-600">
          {score >= 90
            ? 'Your organization is fully compliant with Michigan ESTA requirements.'
            : score >= 75
              ? 'Your compliance is good, but there are some areas to improve.'
              : score >= 50
                ? 'Action required: Several compliance issues need attention.'
                : 'Critical: Immediate action required to avoid penalties.'}
        </p>
      )}
    </div>
  );
}
