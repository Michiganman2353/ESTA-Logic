/**
 * SecureUploadPanel Component
 *
 * Upload interface with built-in security reassurance messaging.
 * Shows users that their uploads are protected before they even start.
 *
 * Key UX Principles:
 * - Preemptive reassurance (show security before user uploads)
 * - Clear language: "encrypted", "protected", "secure"
 * - Visual trust signals via badges and icons
 */

import { TrustBadge } from './TrustBadge';

export interface SecureUploadPanelProps {
  /** Main heading for the upload panel */
  title?: string;
  /** Instructions or description */
  description?: string;
  /** Whether to show encryption indicator */
  showEncryption?: boolean;
  /** Whether to show audit trail indicator */
  showAuditTrail?: boolean;
  /** File input accept types */
  accept?: string;
  /** Whether to allow multiple files */
  multiple?: boolean;
  /** Upload handler */
  onUpload?: (files: FileList | null) => void;
  /** Additional CSS classes */
  className?: string;
  children?: React.ReactNode;
}

export function SecureUploadPanel({
  title = 'Upload Documents',
  description = 'Drag files here or browse to upload.',
  showEncryption = true,
  showAuditTrail = true,
  accept,
  multiple = true,
  onUpload,
  className = '',
  children,
}: SecureUploadPanelProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpload) {
      onUpload(event.target.files);
    }
  };

  return (
    <div className={`secure-upload-panel space-y-4 ${className}`}>
      {/* Security Trust Indicators */}
      <div className="space-y-3">
        {showEncryption && (
          <TrustBadge
            icon="encrypted"
            title="Encrypted Upload"
            description="Your documents are encrypted automatically during upload and stored securely. Only authorized personnel in your organization can access them."
            variant="success"
            showPulse={true}
          />
        )}
        {showAuditTrail && (
          <TrustBadge
            icon="shield-check"
            title="Audit Trail Enabled"
            description="Every upload is logged with timestamp and user details for compliance validation. This protects your legal position."
            variant="info"
          />
        )}
      </div>

      {/* Upload Area */}
      <div className="hover:border-royal-400 hover:bg-royal-50 dark:hover:border-royal-600 dark:hover:bg-royal-900/20 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-colors dark:border-gray-700 dark:bg-gray-800">
        <div className="space-y-4">
          <div className="flex justify-center">
            <svg
              className="h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          </div>

          <div className="flex justify-center">
            <label className="btn btn-primary cursor-pointer">
              <span>Choose Files</span>
              <input
                type="file"
                className="hidden"
                accept={accept}
                multiple={multiple}
                onChange={handleFileChange}
              />
            </label>
          </div>

          {accept && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Accepted formats: {accept}
            </p>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
