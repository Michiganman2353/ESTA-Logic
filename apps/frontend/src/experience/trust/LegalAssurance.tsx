/**
 * Legal Assurance - Legal clarity and confidence messaging
 * Provides reassurance about legal compliance
 */

export interface LegalAssuranceProps {
  className?: string;
  variant?: 'banner' | 'inline' | 'minimal';
}

export default function LegalAssurance({
  className = '',
  variant = 'banner',
}: LegalAssuranceProps) {
  if (variant === 'minimal') {
    return (
      <div className={`text-sm text-gray-600 ${className}`}>
        <span role="img" aria-label="Checkmark">
          ✓
        </span>{' '}
        Michigan ESTA Compliant
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        className={`flex items-center gap-2 text-sm text-gray-700 ${className}`}
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700"
          role="img"
          aria-label="Checkmark"
        >
          ✓
        </span>
        <span>Fully aligned with Michigan Employee Earned Sick Time Act</span>
      </div>
    );
  }

  return (
    <div
      className={`legal-assurance-banner rounded-lg border border-green-200 bg-green-50 p-4 ${className}`}
      role="complementary"
      aria-label="Legal compliance assurance"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-white"
          role="img"
          aria-label="Checkmark"
        >
          ✓
        </span>
        <div className="flex-1">
          <h3 className="mb-1 font-semibold text-green-900">
            Legal Compliance Verified
          </h3>
          <p className="text-sm text-green-800">
            This system is designed to meet all requirements of the Michigan
            Employee Earned Sick Time Act (ESTA). Your records are audit-ready
            and legally defensible.
          </p>
        </div>
      </div>
    </div>
  );
}
