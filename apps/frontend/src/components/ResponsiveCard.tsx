/**
 * Responsive Card Component with Container Queries
 *
 * Demonstrates advanced responsive design using CSS container queries.
 * Container queries allow components to adapt based on their parent container
 * size rather than viewport size, enabling truly modular responsive design.
 *
 * Features:
 * - Container query-based responsive layout
 * - Optimized with React.memo for performance
 * - Uses Zustand for global notifications
 * - Demonstrates functional component best practices
 */

import { memo, ReactNode } from 'react';

interface ResponsiveCardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  onAction?: () => void;
  actionLabel?: string;
}

/**
 * Responsive Card Component
 *
 * Uses container queries (@container) to adapt layout based on parent size.
 * This is more flexible than media queries for modular components.
 *
 * Container query breakpoints:
 * - < 320px: Ultra-compact (icon-only mode)
 * - 320px - 480px: Compact (minimal text)
 * - 480px - 768px: Standard (normal layout)
 * - > 768px: Detailed (expanded layout with extra info)
 */
export const ResponsiveCard = memo<ResponsiveCardProps>(
  ({
    title,
    description,
    children,
    className = '',
    variant = 'default',
    onAction,
    actionLabel = 'Action',
  }) => {
    const baseClasses =
      'rounded-lg border shadow-sm transition-all duration-200';

    const variantClasses = {
      default: 'bg-white border-gray-200 hover:shadow-md',
      compact: 'bg-gray-50 border-gray-300',
      detailed: 'bg-gradient-to-br from-white to-gray-50 border-gray-200',
    };

    return (
      <div className={`@container ${className}`}>
        <div className={`${baseClasses} ${variantClasses[variant]}`}>
          {/* Header - adapts based on container size */}
          <div className="@sm:p-6 @lg:p-8 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {/* Title - responsive typography */}
                <h3 className="@sm:text-lg @lg:text-xl @md:whitespace-normal truncate text-base font-semibold text-gray-900">
                  {title}
                </h3>

                {/* Description - hidden on ultra-small, shown on larger */}
                {description && (
                  <p className="@sm:text-base @xs:line-clamp-2 @md:line-clamp-none mt-1 hidden text-sm text-gray-600">
                    {description}
                  </p>
                )}
              </div>

              {/* Action button - adapts size and text visibility */}
              {onAction && (
                <button
                  onClick={onAction}
                  className="@sm:px-4 @sm:py-2 bg-primary-600 hover:bg-primary-700 @sm:text-base shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors"
                  aria-label={actionLabel}
                >
                  {/* Icon visible on all sizes, text hidden on ultra-small */}
                  <span className="@xs:inline hidden">{actionLabel}</span>
                  <span className="@xs:hidden">⚡</span>
                </button>
              )}
            </div>
          </div>

          {/* Content - responsive padding and layout */}
          {children && (
            <div className="@sm:px-6 @sm:pb-6 @lg:px-8 @lg:pb-8 px-4 pb-4">
              <div className="@md:space-y-4 space-y-3">{children}</div>
            </div>
          )}

          {/* Footer - only shown on larger containers */}
          {variant === 'detailed' && (
            <div className="@md:block @lg:px-6 @lg:py-4 hidden border-t border-gray-200 bg-gray-50 px-4 py-3">
              <div className="@lg:text-sm flex items-center gap-2 text-xs text-gray-500">
                <span>🔄</span>
                <span>Last updated: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ResponsiveCard.displayName = 'ResponsiveCard';

/**
 * Responsive Grid Layout
 *
 * Grid container that uses container queries to adapt column count.
 * More flexible than CSS Grid with media queries.
 */
interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  minColumnWidth?: string;
}

export const ResponsiveGrid = memo<ResponsiveGridProps>(
  ({ children, className = '', minColumnWidth = '280px' }) => {
    return (
      <div className={`@container ${className}`}>
        <div
          className="@sm:gap-6 grid gap-4"
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minColumnWidth}), 1fr))`,
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);

ResponsiveGrid.displayName = 'ResponsiveGrid';

/**
 * Responsive Stat Card
 *
 * Shows statistics with adaptive layout using container queries.
 */
interface ResponsiveStatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export const ResponsiveStatCard = memo<ResponsiveStatCardProps>(
  ({ label, value, change, icon, trend = 'neutral' }) => {
    const trendColors = {
      up: 'text-green-600',
      down: 'text-red-600',
      neutral: 'text-gray-600',
    };

    const trendIcons = {
      up: '↑',
      down: '↓',
      neutral: '→',
    };

    return (
      <div className="@container w-full">
        <div className="@sm:p-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          {/* Horizontal layout on small, vertical on ultra-small */}
          <div className="@xs:flex-row @xs:items-center @sm:gap-4 flex flex-col items-start gap-3">
            {/* Icon */}
            {icon && (
              <div className="@sm:w-12 @sm:h-12 bg-primary-50 text-primary-600 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                {icon}
              </div>
            )}

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="@sm:text-sm text-xs font-medium uppercase tracking-wide text-gray-600">
                {label}
              </p>
              <p className="@sm:text-3xl @lg:text-4xl mt-1 text-2xl font-bold text-gray-900">
                {value}
              </p>

              {/* Change indicator - hidden on ultra-small */}
              {change !== undefined && (
                <div
                  className={`@sm:text-base mt-1 text-sm font-medium ${trendColors[trend]} @xs:flex hidden items-center gap-1`}
                >
                  <span>{trendIcons[trend]}</span>
                  <span>{Math.abs(change)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ResponsiveStatCard.displayName = 'ResponsiveStatCard';
