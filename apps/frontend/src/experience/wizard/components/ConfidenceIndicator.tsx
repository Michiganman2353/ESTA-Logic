/**
 * ConfidenceIndicator Component
 * 
 * Displays user's confidence/completion quality score
 * Provides psychological reassurance during the guided flow
 */

export interface ConfidenceIndicatorProps {
  score: number; // 0-100
  label?: string;
  variant?: 'minimal' | 'detailed' | 'dashboard';
  showTips?: boolean;
  className?: string;
}

export default function ConfidenceIndicator({
  score,
  label,
  variant = 'minimal',
  showTips = false,
  className = '',
}: ConfidenceIndicatorProps) {
  // Determine confidence level
  const confidenceLevel =
    score >= 85 ? 'high' : score >= 65 ? 'medium' : 'low';

  const confidenceColors = {
    high: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      bar: 'bg-green-600',
      label: 'Excellent',
    },
    medium: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      bar: 'bg-yellow-600',
      label: 'Good',
    },
    low: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-900',
      bar: 'bg-orange-600',
      label: 'Needs Attention',
    },
  };

  const config = confidenceColors[confidenceLevel];
  const displayLabel = label || `${config.label} (${score}%)`;

  // Tips based on score
  const tips = {
    high: 'You\'re doing great! All information is complete and accurate.',
    medium: 'Good progress. Review any flagged items for best results.',
    low: 'Let\'s complete a few more details to ensure full compliance.',
  };

  if (variant === 'minimal') {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${config.bg} ${config.border} ${config.text} ${className}`}
        role="status"
        aria-label={`Confidence score: ${displayLabel}`}
      >
        <div className="h-2 w-2 rounded-full bg-current"></div>
        <span>{displayLabel}</span>
      </div>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div
        className={`rounded-lg border-2 p-6 ${config.bg} ${config.border} ${className}`}
        role="region"
        aria-label="Confidence dashboard"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${config.text}`}>
            Setup Confidence
          </h3>
          <span className={`text-2xl font-bold ${config.text}`}>{score}%</span>
        </div>

        {/* Progress Bar */}
        <div className="mb-3 h-3 overflow-hidden rounded-full bg-white bg-opacity-50">
          <div
            className={`h-full transition-all duration-500 ${config.bar}`}
            style={{ width: `${score}%` }}
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Status Message */}
        <p className={`text-sm ${config.text} opacity-90`}>
          {tips[confidenceLevel]}
        </p>
      </div>
    );
  }

  // Default: detailed variant
  return (
    <div
      className={`rounded-lg border-2 p-4 ${config.bg} ${config.border} ${className}`}
      role="status"
      aria-label={`Confidence: ${displayLabel}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className={`text-sm font-semibold ${config.text}`}>
          {displayLabel}
        </span>
        <span className={`text-lg font-bold ${config.text}`}>{score}%</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-2 h-2 overflow-hidden rounded-full bg-white bg-opacity-50">
        <div
          className={`h-full transition-all duration-500 ${config.bar}`}
          style={{ width: `${score}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Optional Tips */}
      {showTips && (
        <p className={`text-xs ${config.text} opacity-75`}>
          {tips[confidenceLevel]}
        </p>
      )}
    </div>
  );
}

/**
 * Step Confidence Indicator
 * Shows confidence for a specific wizard step
 */
export function StepConfidenceIndicator({
  stepData,
  requiredFields,
  className,
}: {
  stepData: Record<string, unknown>;
  requiredFields: string[];
  className?: string;
}) {
  // Calculate completion percentage
  const completedFields = requiredFields.filter(
    (field) => stepData[field] !== undefined && stepData[field] !== ''
  ).length;
  const score = Math.round((completedFields / requiredFields.length) * 100);

  return (
    <ConfidenceIndicator
      score={score}
      variant="minimal"
      className={className}
    />
  );
}
