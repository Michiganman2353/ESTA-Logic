/**
 * ESTA Tracker Design Tokens - Main Export
 * 
 * Central export point for all design tokens.
 * Import from this file to access the complete design system.
 * 
 * @example
 * ```typescript
 * import { colors, typography, spacing } from '@/design-tokens';
 * 
 * const buttonStyle = {
 *   backgroundColor: colors.primary.royalBlue,
 *   fontSize: typography.fontSizes.base,
 *   padding: spacing.base[4],
 * };
 * ```
 */

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './shadows';
export * from './borders';

import { colors } from './colors';
import { typography } from './typography';
import { spacingSystem } from './spacing';
import { shadowSystem } from './shadows';
import { borderSystem } from './borders';

/**
 * Complete Design System
 * All design tokens in a single object
 */
export const designTokens = {
  colors,
  typography,
  spacing: spacingSystem,
  shadows: shadowSystem,
  borders: borderSystem,
} as const;

/**
 * Design Token Version
 * Increment this when making breaking changes to tokens
 */
export const DESIGN_TOKEN_VERSION = '1.0.0';

/**
 * Type export for the complete design system
 */
export type DesignTokens = typeof designTokens;
