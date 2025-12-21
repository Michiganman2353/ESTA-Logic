/**
 * SecurityStatusBanner Component
 * 
 * Displays a persistent security status banner that provides real-time
 * reassurance of active security measures.
 * 
 * Features:
 * - Real-time encryption status
 * - Audit logging indicator
 * - Compact banner design
 * - Animated pulse for active states
 * - Collapsible detailed view
 * - Dark mode support
 * 
 * Used in: Document Scanner, Audit Log, Dashboards
 */

import { useState } from 'react';
import { useSecurityContext } from '@/contexts/SecurityContext';

export interface SecurityStatusBannerProps {
  variant?: 'compact' | 'detailed';
  className?: string;
  showDetails?: boolean;
}

export function SecurityStatusBanner({
  variant = 'compact',
  className = '',
  showDetails = false,
}: SecurityStatusBannerProps) {
  const { securityState } = useSecurityContext();
  const [isExpanded, setIsExpanded] = useState(showDetails);

  const statusColors = {
    secure: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  };

  const iconColors = {
    secure: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
  };

  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg border ${statusColors[securityState.securityStatus]} px-3 py-2 ${className}`}
        role="status"
        aria-label="Security status"
      >
        <div className="relative">
          <svg
            className={`h-5 w-5 ${iconColors[securityState.securityStatus]}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          {securityState.encryptionActive && (
            <span className="absolute -right-1 -top-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
          )}
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Protected & Encrypted
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border ${statusColors[securityState.securityStatus]} ${className}`}
      role="status"
      aria-label="Detailed security status"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <svg
            className={`h-6 w-6 ${iconColors[securityState.securityStatus]}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              Security Active
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your data is protected
            </p>
          </div>
        </div>
        <svg
          className={`h-5 w-5 transform text-gray-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-2 w-2 rounded-full ${
                    securityState.encryptionActive ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                ></span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  End-to-End Encryption
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {securityState.encryptionActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-2 w-2 rounded-full ${
                    securityState.auditLoggingActive ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                ></span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Audit Logging
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {securityState.auditLoggingActive ? 'Recording' : 'Inactive'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-2 w-2 rounded-full ${
                    securityState.firebaseConnected ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                ></span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Secure Connection
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {securityState.firebaseConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {securityState.lastSecurityCheck && (
              <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last verified: {securityState.lastSecurityCheck.toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
