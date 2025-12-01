/**
 * InsightCard Props
 *
 * Props for the InsightCard component with full WCAG 2.1 AA accessibility support.
 */
interface InsightCardProps {
  /** Card title displayed as header */
  title: string;
  /** Primary value to display (can be number or formatted string) */
  value: string | number;
  /** Additional context shown below the value */
  subtitle?: string;
  /** Trend indicator direction */
  trend?: 'up' | 'down' | 'neutral';
  /** Trend value display (e.g., "+5%") */
  trendValue?: string;
  /** Icon element to display */
  icon?: React.ReactNode;
  /** Color theme for the card */
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /** Unique identifier for accessibility purposes */
  id?: string;
  /** Click handler for interactive cards */
  onClick?: () => void;
  /** Tab index override for keyboard navigation */
  tabIndex?: number;
  /** ARIA label override for screen readers */
  ariaLabel?: string;
}

/**
 * InsightCard Component
 *
 * Displays key metrics in a visually appealing card format with full
 * accessibility support including ARIA labels, keyboard navigation,
 * and screen reader announcements.
 *
 * WCAG 2.1 AA Features:
 * - Proper heading hierarchy
 * - ARIA labels for values and trends
 * - Keyboard focusable with visible focus ring
 * - Color contrast compliant
 * - Screen reader friendly value announcements
 */
export function InsightCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color = 'primary',
  id,
  onClick,
  tabIndex,
  ariaLabel,
}: InsightCardProps) {
  const colorClasses = {
    primary:
      'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
    success:
      'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    warning:
      'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    danger: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    info: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  };

  const trendIcons = {
    up: (
      <svg
        className="h-4 w-4"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
          clipRule="evenodd"
        />
      </svg>
    ),
    down: (
      <svg
        className="h-4 w-4"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    ),
    neutral: null,
  };

  // Generate accessible description for screen readers
  const getAccessibleDescription = () => {
    let description = `${title}: ${value}`;
    if (subtitle) description += `. ${subtitle}`;
    if (trend && trendValue) {
      const trendText =
        trend === 'up'
          ? 'increased by'
          : trend === 'down'
            ? 'decreased by'
            : '';
      if (trendText) description += `. ${trendText} ${trendValue}`;
    }
    return description;
  };

  const isInteractive = Boolean(onClick);
  const cardId =
    id || `insight-card-${title.toLowerCase().replace(/\s+/g, '-')}`;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isInteractive && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <article
      id={cardId}
      className={`rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-800 ${isInteractive ? 'focus:ring-primary-500 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2' : ''}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={tabIndex ?? (isInteractive ? 0 : undefined)}
      role={isInteractive ? 'button' : 'article'}
      aria-label={ariaLabel || getAccessibleDescription()}
      aria-labelledby={`${cardId}-title`}
      aria-describedby={subtitle ? `${cardId}-subtitle` : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3
            id={`${cardId}-title`}
            className="text-sm font-medium text-gray-600 dark:text-gray-400"
          >
            {title}
          </h3>
          <div className="mt-2 flex items-baseline">
            <p
              className="text-3xl font-semibold text-gray-900 dark:text-white"
              aria-label={`Value: ${value}`}
            >
              {value}
            </p>
            {trendValue && trend && (
              <div
                className={`ml-2 flex items-center text-sm ${
                  trend === 'up'
                    ? 'text-green-600 dark:text-green-400'
                    : trend === 'down'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                }`}
                aria-label={`Trend: ${trend === 'up' ? 'increasing' : trend === 'down' ? 'decreasing' : 'stable'} ${trendValue}`}
              >
                {trendIcons[trend]}
                <span className="ml-1">{trendValue}</span>
              </div>
            )}
          </div>
          {subtitle && (
            <p
              id={`${cardId}-subtitle`}
              className="mt-1 text-sm text-gray-500 dark:text-gray-400"
            >
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={`rounded-lg p-3 ${colorClasses[color]}`}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>
    </article>
  );
}

interface InsightsPanelProps {
  /** Array of insight card configurations */
  insights: Array<
    Omit<InsightCardProps, 'color'> & { color?: InsightCardProps['color'] }
  >;
  /** Optional heading override */
  heading?: string;
  /** Optional unique identifier */
  id?: string;
}

/**
 * InsightsPanel Component
 *
 * Container for multiple InsightCard components with proper
 * heading hierarchy and landmark roles for accessibility.
 */
export function InsightsPanel({
  insights,
  heading = 'Insights',
  id,
}: InsightsPanelProps) {
  const panelId = id || 'insights-panel';

  return (
    <section
      className="space-y-6"
      aria-labelledby={`${panelId}-heading`}
      role="region"
    >
      <h2
        id={`${panelId}-heading`}
        className="text-2xl font-bold text-gray-900 dark:text-white"
      >
        {heading}
      </h2>
      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        role="list"
        aria-label={`${heading} metrics`}
      >
        {insights.map((insight, index) => (
          <div key={index} role="listitem">
            <InsightCard {...insight} />
          </div>
        ))}
      </div>
    </section>
  );
}

// Reusable dashboard card component
interface DashboardCardProps {
  /** Card title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Card content */
  children: React.ReactNode;
  /** Optional action buttons */
  actions?: React.ReactNode;
  /** Whether card spans full width */
  fullWidth?: boolean;
  /** Optional unique identifier for accessibility */
  id?: string;
  /** Optional ARIA role override */
  role?: 'region' | 'article' | 'group';
}

/**
 * DashboardCard Component
 *
 * Reusable card container for dashboard sections with proper
 * heading hierarchy and ARIA landmarks for accessibility.
 *
 * WCAG 2.1 AA Features:
 * - Proper heading levels (h3 for card titles)
 * - ARIA labelledby for section association
 * - Region role for landmark navigation
 * - Keyboard focusable action buttons
 */
export function DashboardCard({
  title,
  subtitle,
  children,
  actions,
  fullWidth = false,
  id,
  role = 'region',
}: DashboardCardProps) {
  const cardId =
    id || `dashboard-card-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <section
      id={cardId}
      className={`rounded-lg bg-white p-6 shadow dark:bg-gray-800 ${fullWidth ? 'col-span-full' : ''}`}
      role={role}
      aria-labelledby={`${cardId}-title`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3
            id={`${cardId}-title`}
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </h3>
          {subtitle && (
            <p
              id={`${cardId}-subtitle`}
              className="mt-1 text-sm text-gray-500 dark:text-gray-400"
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div
            className="flex items-center space-x-2"
            role="group"
            aria-label={`${title} actions`}
          >
            {actions}
          </div>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}
