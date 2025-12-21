/**
 * TrustBadge Component - Enhanced Security UX
 *
 * User-facing security reassurance component that makes security protections
 * visible, understandable, and reassuring.
 *
 * Design Philosophy:
 * - Security for humans, not just developers
 * - Calm, empowering, non-technical language
 * - Visual trust signals throughout critical flows
 *
 * Features:
 * - Shield/lock icons for visual trust
 * - Clear, reassuring messaging
 * - Subtle pulse animation for active protection
 * - Multiple variants for different contexts
 * - Responsive design with dark mode support
 */

import React from 'react';

export interface TrustBadgeProps {
  /** Icon type to display */
  icon?: 'shield-check' | 'lock' | 'verified' | 'encrypted';
  /** Main title text */
  title: string;
  /** Description text explaining what this means for the user */
  description: string;
  /** Visual variant */
  variant?: 'default' | 'success' | 'info' | 'primary';
  /** Whether to show pulse animation indicating active protection */
  showPulse?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const iconPaths = {
  'shield-check': (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  ),
  lock: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  ),
  verified: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
  encrypted: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
    />
  ),
};

const variantStyles = {
  default: 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700',
  success:
    'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  primary:
    'bg-royal-50 border-royal-200 dark:bg-royal-900/20 dark:border-royal-800',
};

const iconColors = {
  default: 'text-gray-600 dark:text-gray-400',
  success: 'text-green-600 dark:text-green-400',
  info: 'text-blue-600 dark:text-blue-400',
  primary: 'text-royal-600 dark:text-royal-400',
};

export function TrustBadge({
  icon = 'shield-check',
  title,
  description,
  variant = 'success',
  showPulse = false,
  className = '',
}: TrustBadgeProps) {
  return (
    <div
      className={`trust-badge flex items-start gap-3 rounded-lg border p-4 ${variantStyles[variant]} ${showPulse ? 'trust-pulse' : ''} ${className}`}
      role="status"
      aria-label={`Security: ${title}`}
    >
      <div className="flex-shrink-0">
        <svg
          className={`h-6 w-6 ${iconColors[variant]}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {iconPaths[icon]}
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}

/**
 * Compact TrustBadge for inline use (headers, footers, small spaces)
 */
export function TrustBadgeCompact({
  icon = 'shield-check',
  label,
  variant = 'success',
  showPulse = false,
  className = '',
}: {
  icon?: 'shield-check' | 'lock' | 'verified' | 'encrypted';
  label: string;
  variant?: 'default' | 'success' | 'info' | 'primary';
  showPulse?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 ${variantStyles[variant]} ${showPulse ? 'trust-pulse' : ''} ${className}`}
      role="status"
      aria-label={`Security: ${label}`}
    >
      <svg
        className={`h-4 w-4 ${iconColors[variant]}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {iconPaths[icon]}
      </svg>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
    </div>
  );
}
