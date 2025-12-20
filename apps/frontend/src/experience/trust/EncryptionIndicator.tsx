/**
 * Encryption Indicator - Visual encryption status
 * Shows encryption status and provides confidence
 */

import React from 'react';

export interface EncryptionIndicatorProps {
  isActive?: boolean;
  className?: string;
  showLabel?: boolean;
}

export default function EncryptionIndicator({
  isActive = true,
  className = '',
  showLabel = true,
}: EncryptionIndicatorProps) {
  if (!isActive) {
    return null;
  }

  return (
    <div
      className={`encryption-indicator flex items-center gap-2 ${className}`}
      role="status"
      aria-label="Encryption status: active"
    >
      <div className="relative">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700"
          role="img"
          aria-label="Lock"
        >
          🔒
        </span>
        <span className="absolute -right-1 -top-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
        </span>
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">
            End-to-End Encrypted
          </span>
          <span className="text-xs text-gray-600">
            Your data is secure
          </span>
        </div>
      )}
    </div>
  );
}
