import { User } from '@/types';
import { TrustBadgeGroup } from '@/components/Settings';
import { SecurityStatusBanner } from '@/components/SecurityStatusBanner';
import { ComplianceSecurityPanel } from '@/components/trust';

interface AuditLogProps {
  user: User;
}

export default function AuditLog({ user }: AuditLogProps) {
  // User prop is passed for potential future use
  void user;

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              Audit Trail
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              3-year compliance audit trail - view all accruals, usage, and
              actions
            </p>
          </div>
          <TrustBadgeGroup badges={['security', 'compliance']} size="sm" />
        </div>

        {/* Security Status Banner */}
        <div className="mb-6">
          <SecurityStatusBanner variant="detailed" showDetails={true} />
        </div>

        {/* Enhanced Compliance Security Panel */}
        <div className="mb-6">
          <ComplianceSecurityPanel />
        </div>

        {/* Security Features Information */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-4">
            <svg
              className="mt-1 h-6 w-6 flex-shrink-0 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <div>
              <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
                Tamper-Proof Audit Records
              </h3>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    All records are cryptographically signed and immutable
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>3-year retention as required by Michigan ESTA law</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Complete audit trail with timestamps and user identities
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Instant export for state compliance audits</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <a href="/" className="text-primary-600 hover:text-primary-700">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
