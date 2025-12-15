import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  showRequiredIndicator?: boolean;
}

/**
 * Enhanced input component with validation states
 *
 * Features:
 * - Label and hint text support
 * - Error state with message
 * - Optional icon
 * - Required field indicator
 * - Accessible markup
 * - Focus and hover states
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      showRequiredIndicator = false,
      required = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasIcon = !!icon;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {(required || showRequiredIndicator) && (
              <span className="ml-1 text-red-500" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {hasIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={`input block w-full ${hasIcon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className} `.trim()}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
        </div>
        {hint && !error && (
          <p
            id={`${inputId}-hint`}
            className="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            {hint}
          </p>
        )}
        {error && (
          <p
            id={`${inputId}-error`}
            className="animate-fade-in mt-1 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
