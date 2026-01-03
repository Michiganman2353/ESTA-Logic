/**
 * TrustBadge - Visual trust indicator component
 *
 * Purpose: Display security and compliance status in a reassuring way
 * Makes security visible and confidence-building
 */

import React from 'react';

export type TrustBadgeType =
  | 'encrypted'
  | 'verified'
  | 'saved'
  | 'audited'
  | 'protected'
  | 'compliant';

export interface TrustBadgeProps {
  /** Type of trust indicator */
  type: TrustBadgeType;

  /** Badge size */
  size?: 'small' | 'medium' | 'large';

  /** Show detailed text */
  showDetails?: boolean;

  /** Custom message override */
  customMessage?: string;

  /** Badge variant */
  variant?: 'default' | 'compact' | 'inline';
}

const BADGE_CONFIG: Record<
  TrustBadgeType,
  {
    icon: string;
    message: string;
    details: string;
    color: string;
  }
> = {
  encrypted: {
    icon: '🔒',
    message: 'Encrypted',
    details: 'Your data is protected with bank-level encryption',
    color: '#2563eb',
  },
  verified: {
    icon: '✓',
    message: 'Verified',
    details: 'This information has been checked and validated',
    color: '#16a34a',
  },
  saved: {
    icon: '💾',
    message: 'Saved',
    details: 'Automatically saved and backed up',
    color: '#0891b2',
  },
  audited: {
    icon: '📋',
    message: 'Audit Trail',
    details: 'All changes are logged for compliance',
    color: '#7c3aed',
  },
  protected: {
    icon: '🛡️',
    message: 'Protected',
    details: 'Access controlled and monitored',
    color: '#dc2626',
  },
  compliant: {
    icon: '✓',
    message: 'Compliant',
    details: 'Meets Michigan ESTA requirements',
    color: '#059669',
  },
};

/**
 * Trust Badge Component
 *
 * Displays trust indicators in various formats:
 * - Compact: Icon + label
 * - Default: Icon + message + optional details
 * - Inline: Subtle inline indicator
 */
export const TrustBadge: React.FC<TrustBadgeProps> = ({
  type,
  size = 'medium',
  showDetails = false,
  customMessage,
  variant = 'default',
}) => {
  const config = BADGE_CONFIG[type];
  const message = customMessage || config.message;

  if (variant === 'compact') {
    return (
      <div className={`trust-badge compact ${size}`}>
        <span className="badge-icon" aria-label={message}>
          {config.icon}
        </span>
        <span className="badge-label">{message}</span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`trust-badge inline ${size}`}>
        <span className="badge-icon">{config.icon}</span>
        <span className="badge-text">{message}</span>
      </span>
    );
  }

  // Default variant
  return (
    <div className={`trust-badge default ${size}`}>
      <div className="badge-content">
        <span className="badge-icon">{config.icon}</span>
        <div className="badge-text-content">
          <div className="badge-message">{message}</div>
          {showDetails && <div className="badge-details">{config.details}</div>}
        </div>
      </div>
    </div>
  );
};

/**
 * TrustBadgeGroup - Display multiple trust badges together
 */
export interface TrustBadgeGroupProps {
  badges: TrustBadgeType[];
  variant?: 'default' | 'compact' | 'inline';
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export const TrustBadgeGroup: React.FC<TrustBadgeGroupProps> = ({
  badges,
  variant = 'compact',
  size = 'small',
  showDetails = false,
  orientation = 'horizontal',
}) => {
  return (
    <div className={`trust-badge-group ${orientation}`}>
      {badges.map((badgeType, index) => (
        <TrustBadge
          key={`${badgeType}-${index}`}
          type={badgeType}
          variant={variant}
          size={size}
          showDetails={showDetails}
        />
      ))}
    </div>
  );
};

/**
 * Example CSS (to be implemented in actual stylesheet):
 *
 * .trust-badge {
 *   display: inline-flex;
 *   align-items: center;
 *   border-radius: 6px;
 * }
 *
 * .trust-badge.compact {
 *   padding: 6px 12px;
 *   background: #f3f4f6;
 *   gap: 6px;
 * }
 *
 * .trust-badge.inline {
 *   gap: 4px;
 * }
 *
 * .trust-badge.default {
 *   padding: 12px 16px;
 *   background: white;
 *   border: 1px solid #e5e7eb;
 * }
 *
 * .badge-icon {
 *   font-size: 1rem;
 *   line-height: 1;
 * }
 *
 * .trust-badge.small .badge-icon {
 *   font-size: 0.875rem;
 * }
 *
 * .trust-badge.large .badge-icon {
 *   font-size: 1.25rem;
 * }
 *
 * .badge-label,
 * .badge-text {
 *   font-size: 0.875rem;
 *   color: #4a4a4a;
 *   font-weight: 500;
 * }
 *
 * .badge-content {
 *   display: flex;
 *   align-items: center;
 *   gap: 12px;
 * }
 *
 * .badge-message {
 *   font-weight: 600;
 *   color: #1a1a1a;
 *   font-size: 0.875rem;
 * }
 *
 * .badge-details {
 *   font-size: 0.75rem;
 *   color: #6a6a6a;
 *   margin-top: 4px;
 * }
 *
 * .trust-badge-group {
 *   display: flex;
 *   gap: 12px;
 * }
 *
 * .trust-badge-group.horizontal {
 *   flex-direction: row;
 *   flex-wrap: wrap;
 * }
 *
 * .trust-badge-group.vertical {
 *   flex-direction: column;
 * }
 */

export default TrustBadge;
