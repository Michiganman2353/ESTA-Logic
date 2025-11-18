/**
 * Email validation utilities for ESTA Tracker
 * Provides client-side email format validation before account creation
 */

/**
 * Regular expression for basic email format validation
 * Based on HTML5 email input specification
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Common disposable email domains to block
 */
const DISPOSABLE_DOMAINS = [
  'tempmail.com',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
  'throwaway.email',
  'trashmail.com',
];

export interface EmailValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates email address format
 * @param email - Email address to validate
 * @returns Validation result with error message if invalid
 */
export function validateEmailFormat(email: string): EmailValidationResult {
  if (!email || email.trim() === '') {
    return {
      valid: false,
      error: 'Email address is required',
    };
  }

  const trimmedEmail = email.trim();

  // Check length constraints
  if (trimmedEmail.length > 254) {
    return {
      valid: false,
      error: 'Email address is too long (max 254 characters)',
    };
  }

  // Check basic format
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return {
      valid: false,
      error: 'Please enter a valid email address',
    };
  }

  // Split and validate parts
  const parts = trimmedEmail.split('@');
  if (parts.length !== 2) {
    return {
      valid: false,
      error: 'Please enter a valid email address',
    };
  }

  const [localPart, domain] = parts;

  // Validate local part (before @)
  if (localPart.length === 0 || localPart.length > 64) {
    return {
      valid: false,
      error: 'Email address format is invalid',
    };
  }

  // Validate domain part (after @)
  if (domain.length === 0 || domain.length > 253) {
    return {
      valid: false,
      error: 'Email domain is invalid',
    };
  }

  // Check for consecutive dots
  if (trimmedEmail.includes('..')) {
    return {
      valid: false,
      error: 'Email address cannot contain consecutive dots',
    };
  }

  // Check if domain has at least one dot
  if (!domain.includes('.')) {
    return {
      valid: false,
      error: 'Email domain must include a top-level domain (e.g., .com)',
    };
  }

  // Check for disposable email domains
  const lowerDomain = domain.toLowerCase();
  if (DISPOSABLE_DOMAINS.includes(lowerDomain)) {
    return {
      valid: false,
      error: 'Please use a permanent email address, not a disposable one',
    };
  }

  return {
    valid: true,
  };
}

/**
 * Quickly validates if email format is acceptable
 * Returns true if valid, false otherwise
 * @param email - Email address to check
 */
export function isValidEmail(email: string): boolean {
  return validateEmailFormat(email).valid;
}
