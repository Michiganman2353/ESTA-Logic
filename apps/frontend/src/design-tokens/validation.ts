/**
 * Design Token Validation Utility
 *
 * Validates that design tokens are correctly structured and accessible.
 * Use this during development to ensure token consistency.
 */

import { designTokens, DESIGN_TOKEN_VERSION } from './index';

/**
 * Validation results interface
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: {
    version: string;
    totalTokens: number;
    categories: string[];
  };
}

/**
 * Validates the design token system
 */
export function validateDesignTokens(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check that main object exists
    if (!designTokens) {
      errors.push('Design tokens object is undefined');
      return {
        isValid: false,
        errors,
        warnings,
        info: {
          version: 'unknown',
          totalTokens: 0,
          categories: [],
        },
      };
    }

    // Check each category exists
    const requiredCategories = [
      'colors',
      'typography',
      'spacing',
      'shadows',
      'borders',
    ];
    const categories = Object.keys(designTokens);

    requiredCategories.forEach((category) => {
      if (!categories.includes(category)) {
        errors.push(`Missing required category: ${category}`);
      }
    });

    // Validate colors
    if (designTokens.colors) {
      if (!designTokens.colors.primary?.royalBlue) {
        errors.push('Missing primary.royalBlue color');
      }
      if (!designTokens.colors.semantic?.trustBlue) {
        errors.push('Missing semantic.trustBlue color');
      }
    }

    // Validate typography
    if (designTokens.typography) {
      if (!designTokens.typography.fontSizes?.base) {
        errors.push('Missing typography.fontSizes.base');
      }
      if (!designTokens.typography.fontWeights?.regular) {
        errors.push('Missing typography.fontWeights.regular');
      }
    }

    // Validate spacing
    if (designTokens.spacing?.base) {
      if (!designTokens.spacing.base['4']) {
        errors.push('Missing spacing.base[4] (1rem)');
      }
    } else {
      errors.push('Missing spacing system');
    }

    // Count total tokens
    let tokenCount = 0;
    const countTokens = (obj: Record<string, unknown>, depth = 0): void => {
      if (depth > 10) return; // Prevent infinite recursion

      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          if (typeof value === 'object' && value !== null) {
            countTokens(value as Record<string, unknown>, depth + 1);
          } else {
            tokenCount++;
          }
        }
      }
    };

    countTokens(designTokens);

    // Warnings for best practices
    if (tokenCount < 50) {
      warnings.push(
        `Low token count (${tokenCount}). Expected 50+ tokens in a complete system.`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info: {
        version: DESIGN_TOKEN_VERSION,
        totalTokens: tokenCount,
        categories,
      },
    };
  } catch (error) {
    errors.push(
      `Validation error: ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      isValid: false,
      errors,
      warnings,
      info: {
        version: DESIGN_TOKEN_VERSION,
        totalTokens: 0,
        categories: [],
      },
    };
  }
}

/**
 * Logs validation results to console
 */
export function logValidationResults(result: ValidationResult): void {
  console.group('🎨 Design Token Validation');

  console.log(`Version: ${result.info.version}`);
  console.log(`Total Tokens: ${result.info.totalTokens}`);
  console.log(`Categories: ${result.info.categories.join(', ')}`);

  if (result.isValid) {
    console.log(
      '%c✅ All validations passed!',
      'color: green; font-weight: bold'
    );
  } else {
    console.log('%c❌ Validation failed', 'color: red; font-weight: bold');
  }

  if (result.errors.length > 0) {
    console.group('❌ Errors');
    result.errors.forEach((error) => console.error(error));
    console.groupEnd();
  }

  if (result.warnings.length > 0) {
    console.group('⚠️ Warnings');
    result.warnings.forEach((warning) => console.warn(warning));
    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * Development helper: Validates tokens and throws if invalid
 * Only use in development environment
 */
export function assertValidTokens(): void {
  if (process.env.NODE_ENV === 'development') {
    const result = validateDesignTokens();

    if (!result.isValid) {
      logValidationResults(result);
      throw new Error(
        `Design token validation failed with ${result.errors.length} error(s). Check console for details.`
      );
    } else {
      logValidationResults(result);
    }
  }
}

/**
 * Get a specific token value with type safety
 * Returns undefined if token doesn't exist
 */
export function getToken(path: string): unknown {
  const parts = path.split('.');
  let current: Record<string, unknown> = designTokens as Record<
    string,
    unknown
  >;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part] as Record<string, unknown>;
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Check if a specific token exists
 */
export function hasToken(path: string): boolean {
  return getToken(path) !== undefined;
}

// Export validation result type
export type { ValidationResult };
