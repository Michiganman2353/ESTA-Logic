import { Tooltip } from '@/components/DesignSystem/Tooltip';

export interface TrustBadgeProps {
  variant?: 'security' | 'calculation' | 'pilot';
  size?: 'sm' | 'md' | 'lg';
}

export function TrustBadge({
  variant = 'security',
  size = 'md',
}: TrustBadgeProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
  };

  const badges = {
    security: {
      icon: (
        <svg
          className="h-full w-full"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect width="100" height="100" rx="8" fill="#3B82F6" />
          <path
            d="M50 20L30 30V50C30 62 40 70 50 80C60 70 70 62 70 50V30L50 20Z"
            fill="white"
          />
        </svg>
      ),
      tooltip:
        'Uses Firebase Authentication, Firestore security rules, and role-aware application routes. Security controls remain subject to testing and review.',
      label: 'Security Controls',
    },
    calculation: {
      icon: (
        <svg
          className="h-full w-full"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect width="100" height="100" rx="8" fill="#10B981" />
          <circle cx="50" cy="50" r="25" fill="white" />
          <path
            d="M45 55L40 50L38 52L45 59L62 42L60 40L45 55Z"
            fill="#10B981"
          />
        </svg>
      ),
      tooltip:
        'Provides deterministic Michigan earned sick time calculations for the scenarios described in the Calculation Lab.',
      label: 'Calculation Model',
    },
    pilot: {
      icon: (
        <svg
          className="h-full w-full"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect width="100" height="100" rx="8" fill="#8B5CF6" />
          <path
            d="M50 20L58 35L75 38L62 50L66 67L50 59L34 67L38 50L25 38L42 35L50 20Z"
            fill="white"
          />
        </svg>
      ),
      tooltip:
        'Authenticated workflows, persistent ledgers, registration, and operational controls are still being hardened.',
      label: 'Pilot Status',
    },
  };

  const badge = badges[variant];

  return (
    <Tooltip content={badge.tooltip} position="top">
      <div className="inline-flex items-center space-x-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className={sizeClasses[size]}>{badge.icon}</div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {badge.label}
        </span>
      </div>
    </Tooltip>
  );
}

export function TrustBadgeGroup({
  badges = ['security', 'calculation', 'pilot'],
  size = 'md',
}: {
  badges?: Array<'security' | 'calculation' | 'pilot'>;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {badges.map((badge) => (
        <TrustBadge key={badge} variant={badge} size={size} />
      ))}
    </div>
  );
}
