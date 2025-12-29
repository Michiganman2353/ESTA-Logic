import { ReactNode } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Reusable form field wrapper component
 *
 * Features:
 * - Consistent label styling using design system
 * - Error and success message display
 * - Helper text support
 * - Required field indicator
 * - Accessible markup (WCAG 2.1 AA)
 * - Dark mode support
 */
export function FormField({
  id,
  label,
  error,
  success,
  hint,
  required = false,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={`label ${required ? 'label-required' : ''}`}
      >
        {label}
      </label>
      {children}
      {hint && !error && !success && <p className="form-hint">{hint}</p>}
      {error && (
        <p
          id={`${id}-error`}
          className="form-error animate-fade-in flex items-center gap-1"
          role="alert"
        >
          <svg
            className="h-4 w-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
      {success && !error && (
        <p
          id={`${id}-success`}
          className="form-success animate-fade-in flex items-center gap-1"
        >
          <svg
            className="h-4 w-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          {success}
        </p>
      )}
    </div>
  );
}
