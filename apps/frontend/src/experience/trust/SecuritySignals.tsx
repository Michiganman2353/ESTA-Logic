/**
 * Security Signals - Visual trust indicators
 * Displays security and compliance confidence badges
 */

export interface SecuritySignalsProps {
  className?: string;
}

export default function SecuritySignals({
  className = '',
}: SecuritySignalsProps) {
  return (
    <div
      className={`trust-panel flex flex-wrap gap-3 rounded-lg bg-blue-50 p-4 ${className}`}
      role="status"
      aria-label="Security and compliance indicators"
    >
      <span className="flex items-center gap-2 text-sm text-blue-900">
        <span role="img" aria-label="Lock">
          🔒
        </span>
        <span className="font-medium">Secure Encryption Active</span>
      </span>
      <span className="flex items-center gap-2 text-sm text-blue-900">
        <span role="img" aria-label="Document">
          📜
        </span>
        <span className="font-medium">Policy Verified</span>
      </span>
      <span className="flex items-center gap-2 text-sm text-blue-900">
        <span role="img" aria-label="Shield">
          🛡
        </span>
        <span className="font-medium">Audit Supported</span>
      </span>
    </div>
  );
}
