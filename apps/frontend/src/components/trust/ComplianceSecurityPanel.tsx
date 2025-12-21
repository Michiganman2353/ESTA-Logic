/**
 * ComplianceSecurityPanel Component
 *
 * Dashboard panel that displays active security and compliance status.
 * Provides ongoing reassurance that protections are working.
 *
 * Key UX Principles:
 * - Make invisible security visible
 * - Show active monitoring and protection
 * - Reinforce compliance readiness
 * - Build ongoing confidence
 */

import { TrustBadge } from './TrustBadge';

export interface ComplianceSecurityPanelProps {
  /** Whether to show encryption status */
  showEncryption?: boolean;
  /** Whether to show audit trail status */
  showAuditTrail?: boolean;
  /** Whether to show compliance status */
  showCompliance?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function ComplianceSecurityPanel({
  showEncryption = true,
  showAuditTrail = true,
  showCompliance = true,
  className = '',
}: ComplianceSecurityPanelProps) {
  return (
    <section className={`compliance-security-panel space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Security & Compliance
        </h2>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            Active
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {showEncryption && (
          <TrustBadge
            icon="encrypted"
            title="End-to-End Encryption Active"
            description="All data is encrypted with industry-standard AES-256-GCM. Your information is protected both in transit and at rest."
            variant="success"
            showPulse={true}
          />
        )}

        {showAuditTrail && (
          <TrustBadge
            icon="shield-check"
            title="Audit Trail Recording"
            description="All changes are logged immutably with timestamps and user details. Your compliance actions are tamper-resistant and ready for state audits."
            variant="info"
          />
        )}

        {showCompliance && (
          <TrustBadge
            icon="verified"
            title="ESTA Compliance Verified"
            description="Your system is configured to meet all Michigan ESTA law requirements. Calculations and record-keeping are automatically maintained."
            variant="primary"
          />
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Protected by Design
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Security measures are built into every action you take. No
              additional steps required from you.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
