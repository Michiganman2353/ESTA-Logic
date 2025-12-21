/**
 * UploadSuccessMessage Component
 *
 * Post-upload reassurance overlay that confirms security and compliance.
 * Appears after successful upload to reinforce trust and reduce anxiety.
 *
 * Key UX Principles:
 * - Immediate reassurance after critical action
 * - Confirm what just happened (upload)
 * - Confirm how it's protected (encrypted, logged)
 * - Empower user to proceed confidently
 */

import { TrustBadge } from './TrustBadge';

export interface UploadSuccessMessageProps {
  /** Name of the file(s) uploaded */
  fileName?: string;
  /** Number of files uploaded */
  fileCount?: number;
  /** Whether file was encrypted */
  encrypted?: boolean;
  /** Callback when user dismisses the message */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function UploadSuccessMessage({
  fileName,
  fileCount = 1,
  encrypted = true,
  onDismiss,
  className = '',
}: UploadSuccessMessageProps) {
  const fileText =
    fileCount === 1 ? fileName || 'Your file' : `${fileCount} files`;

  return (
    <div
      className={`upload-success-message space-y-4 rounded-lg border-2 border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {/* Success Icon */}
      <div className="flex items-center justify-center">
        <div className="rounded-full bg-green-100 p-3 dark:bg-green-800">
          <svg
            className="h-8 w-8 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      {/* Main Message */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
          Upload Complete
        </h3>
        <p className="mt-2 text-sm text-green-800 dark:text-green-200">
          {fileText} {fileCount === 1 ? 'has' : 'have'} been uploaded
          successfully.
        </p>
      </div>

      {/* Security Reassurance */}
      <TrustBadge
        icon={encrypted ? 'encrypted' : 'shield-check'}
        title={encrypted ? 'Encrypted & Secure' : 'Securely Stored'}
        description={
          encrypted
            ? 'Your file is encrypted and saved securely. It is ready for compliance processing and cannot be modified.'
            : 'Your file is saved securely and ready for compliance processing. All changes are logged for audit purposes.'
        }
        variant="success"
      />

      {/* Empowering Action Message */}
      <div className="rounded-lg bg-white p-4 text-center dark:bg-gray-900">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          ✓ You may proceed with confidence
        </p>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          This document is now part of your secure audit trail
        </p>
      </div>

      {/* Dismiss Button */}
      {onDismiss && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onDismiss}
            className="btn btn-success"
            aria-label="Dismiss success message"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
