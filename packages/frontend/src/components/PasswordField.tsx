import { useState } from 'react';

export interface PasswordFieldProps {
  id: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  label?: string;
  showStrengthIndicator?: boolean;
  className?: string;
  error?: string;
}

/**
 * PasswordField Component
 * 
 * A reusable password input field with show/hide toggle and optional strength indicator.
 * 
 * Features:
 * - Toggle password visibility with eye icon
 * - Optional password strength indicator
 * - Accessible ARIA labels
 * - Dark mode support
 * - Error state handling
 * 
 * @example
 * ```tsx
 * <PasswordField
 *   id="password"
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 *   label="Password"
 *   showStrengthIndicator
 *   required
 * />
 * ```
 */
export function PasswordField({
  id,
  name,
  value,
  onChange,
  placeholder = 'Enter password',
  required = false,
  autoComplete = 'current-password',
  label,
  showStrengthIndicator = false,
  className = '',
  error,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Calculate password strength (0-4)
  const calculateStrength = (password: string): number => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Character variety checks
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    // Cap at 4
    return Math.min(strength, 4);
  };

  const strength = showStrengthIndicator ? calculateStrength(value) : 0;
  
  const getStrengthLabel = (strength: number): string => {
    switch (strength) {
      case 0:
        return 'No password';
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      default:
        return '';
    }
  };

  const getStrengthColor = (strength: number): string => {
    switch (strength) {
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={id} 
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          id={id}
          name={name || id}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          className={`input block w-full pl-10 pr-12 focus:ring-2 focus:ring-primary-500 ${
            error ? 'border-red-500 focus:ring-red-500' : ''
          }`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        
        {/* Lock icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
            />
          </svg>
        </div>

        {/* Toggle visibility button */}
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:text-primary-600 dark:focus:text-primary-400 transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            // Eye slash icon (hide)
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" 
              />
            </svg>
          ) : (
            // Eye icon (show)
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
              />
            </svg>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Password strength indicator */}
      {showStrengthIndicator && value && (
        <div className="mt-2">
          <div className="flex items-center gap-1 mb-1">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  level <= strength ? getStrengthColor(strength) : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Password strength: <span className="font-medium">{getStrengthLabel(strength)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
