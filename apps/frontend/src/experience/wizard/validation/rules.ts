/**
 * Validation Rules for Wizard Steps
 *
 * Provides validation functions for wizard step data
 */

export interface ValidationRule {
  field: string;
  type: 'required' | 'email' | 'number' | 'min' | 'max' | 'pattern' | 'custom';
  message: string;
  value?: any;
  validator?: (value: any) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate a single field against a rule
 */
function validateField(data: any, rule: ValidationRule): string | null {
  const value = data[rule.field];

  switch (rule.type) {
    case 'required':
      if (value === undefined || value === null || value === '') {
        return rule.message || `${rule.field} is required`;
      }
      break;

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return rule.message || 'Please enter a valid email address';
      }
      break;

    case 'number':
      if (isNaN(Number(value))) {
        return rule.message || 'Please enter a valid number';
      }
      break;

    case 'min':
      if (Number(value) < (rule.value || 0)) {
        return rule.message || `Value must be at least ${rule.value}`;
      }
      break;

    case 'max':
      if (Number(value) > (rule.value || Infinity)) {
        return rule.message || `Value must be at most ${rule.value}`;
      }
      break;

    case 'pattern':
      if (rule.value && !new RegExp(rule.value).test(value)) {
        return rule.message || 'Invalid format';
      }
      break;

    case 'custom':
      if (rule.validator && !rule.validator(value)) {
        return rule.message || 'Validation failed';
      }
      break;
  }

  return null;
}

/**
 * Validate data against multiple rules
 */
export function validate(data: any, rules: ValidationRule[]): ValidationResult {
  const errors: Record<string, string> = {};

  for (const rule of rules) {
    const error = validateField(data, rule);
    if (error) {
      errors[rule.field] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Common validation rules
 */
export const commonRules = {
  required: (field: string, message?: string): ValidationRule => ({
    field,
    type: 'required',
    message: message || `${field} is required`,
  }),

  email: (field: string, message?: string): ValidationRule => ({
    field,
    type: 'email',
    message: message || 'Please enter a valid email address',
  }),

  number: (field: string, message?: string): ValidationRule => ({
    field,
    type: 'number',
    message: message || 'Please enter a valid number',
  }),

  min: (field: string, min: number, message?: string): ValidationRule => ({
    field,
    type: 'min',
    value: min,
    message: message || `Value must be at least ${min}`,
  }),

  max: (field: string, max: number, message?: string): ValidationRule => ({
    field,
    type: 'max',
    value: max,
    message: message || `Value must be at most ${max}`,
  }),

  pattern: (
    field: string,
    pattern: string,
    message?: string
  ): ValidationRule => ({
    field,
    type: 'pattern',
    value: pattern,
    message: message || 'Invalid format',
  }),

  custom: (
    field: string,
    validator: (value: any) => boolean,
    message: string
  ): ValidationRule => ({
    field,
    type: 'custom',
    validator,
    message,
  }),
};
