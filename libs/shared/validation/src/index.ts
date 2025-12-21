/**
 * Centralized Validation Module
 *
 * Single source of truth for all validation logic across the ESTA Tracker application.
 * Provides consistent validation for frontend, backend, and API layers.
 *
 * This replaces duplicate validation logic previously scattered across:
 * - /api/lib/validation.ts
 * - /libs/shared-utils/src/validation.ts
 * - Frontend-specific validation
 */

/**
 * Validates that all required fields are present in an object
 * @param data The data object to validate
 * @param requiredFields Array of required field names
 * @param context Context string for logging (e.g., 'user data', 'employer data')
 * @throws Error if any required fields are missing
 *
 * @remarks
 * Uses loose equality (== null) to check for both null and undefined values.
 * This intentionally allows valid falsy values like 0, false, and empty strings.
 */
export function validateRequiredFields(
  data: Record<string, unknown>,
  requiredFields: string[],
  context: string
): void {
  // Use == null (loose equality) to check for both null and undefined
  // This allows valid falsy values like 0, false, and "" to pass validation
  const missingFields = requiredFields.filter((field) => data[field] == null);

  if (missingFields.length > 0) {
    const fieldStatus = requiredFields.reduce(
      (acc, field) => {
        acc[`has${field.charAt(0).toUpperCase()}${field.slice(1)}`] =
          data[field] != null;
        return acc;
      },
      {} as Record<string, boolean>
    );

    console.error(
      `[DEBUG] Critical error: Missing required ${context} fields`,
      fieldStatus
    );
    throw new Error(
      `Failed to construct ${context}: missing required fields (${missingFields.join(', ')})`
    );
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (US format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex =
    /^(\+1)?[\s.-]?\(?([0-9]{3})\)?[\s.-]?([0-9]{3})[\s.-]?([0-9]{4})$/;
  return phoneRegex.test(phone);
}

/**
 * Validate ZIP code (US format)
 */
export function isValidZipCode(zip: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
}

/**
 * Validate that a value is within a range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate that a string is not empty or just whitespace
 */
export function isNonEmptyString(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate hours worked (0-24)
 */
export function isValidHoursWorked(hours: number): boolean {
  return isInRange(hours, 0, 24);
}

/**
 * Validate hours per week (0-168)
 */
export function isValidHoursPerWeek(hours: number): boolean {
  return isInRange(hours, 0, 168);
}

/**
 * Sanitize string input for safe display
 *
 * NOTE: This is a basic sanitizer for display purposes only.
 * For HTML context, use a proper HTML sanitizer like DOMPurify.
 * For SQL context, use parameterized queries.
 * For shell context, use proper escaping.
 *
 * This function only removes obviously dangerous characters.
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, ''); // Remove HTML tag markers only
}

/**
 * Validate that a date is not in the future
 */
export function isNotFutureDate(date: Date): boolean {
  return date <= new Date();
}

/**
 * Validate that a date is not more than N years in the past
 */
export function isRecentDate(date: Date, maxYearsAgo: number): boolean {
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - maxYearsAgo);
  return date >= minDate;
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains number
 * - Contains special character
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate employee count
 */
export function isValidEmployeeCount(count: number): boolean {
  return Number.isInteger(count) && count >= 1 && count <= 100000;
}

/**
 * Validate tenant code format
 */
export function isValidTenantCode(code: string): boolean {
  // 8 alphanumeric characters
  return /^[A-Z0-9]{8}$/.test(code);
}
