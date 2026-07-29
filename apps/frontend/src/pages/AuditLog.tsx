import { User } from '@/types';
import { TrustBadgeGroup } from '@/components/Settings';
import { SecurityStatusBanner } from '@/components/SecurityStatusBanner';
import { ComplianceSecurityPanel } from '@/components/trust';

interface AuditLogProps {
  user: User;
}

export default function AuditLog({ user }: AuditLogProps) {
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
              Review selected account and workflow events recorded by the application.
            </p>
          </div>
          <TrustBadgeGroup badges={['security', 'pilot']} size="sm" />
        </div>

        <div className="mb-6">
          <SecurityStatusBanner variant="detailed" showDetails={true} />
        </div>

        <div className="mb-6">
          <ComplianceSecurityPanel />
        </div>

        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-4">
            <svg
              className="mt-1 h-6 w-6 flex-shrink-0 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
                Audit records currently implemented
              </h3>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>• Selected account and workflow events include timestamps and actor information.</li>
                <li>• Firestore rules prevent client updates and deletes for audit-log records.</li>
                <li>• Server-authoritative audit creation, retention enforcement, and export workflows remain under active hardening.</li>
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
