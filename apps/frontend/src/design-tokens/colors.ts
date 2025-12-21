/**
 * ESTA Tracker Design Tokens - Colors
 * 
 * Centralized color palette for consistent design across the application.
 * These tokens provide semantic naming and ensure design-engineering alignment.
 * 
 * @see docs/design/DESIGN_TOKENS.md for usage guidelines
 */

/**
 * Primary Brand Colors
 * Core colors representing ESTA Tracker's professional, trustworthy identity
 */
export const primaryColors = {
  // Deep Navy - Primary anchor for headers and key UI elements
  navyDeep: '#0A1E45',
  // Royal Blue - Core brand color for primary actions
  royalBlue: '#1E63FF',
  // Sky Blue - Accent color for secondary elements
  skyBlue: '#74B7FF',
  // Graphite - Professional dark neutral
  graphite: '#1B1B1B',
} as const;

/**
 * Semantic UI Colors
 * Intent-based colors for specific UI purposes
 */
export const semanticColors = {
  // Trust & Confidence
  trustBlue: '#1E4BD8',
  accentBlue: '#3B82F6',
  
  // Success & Compliance
  govTrustGreen: '#00B289',
  successGreen: '#10B981',
  
  // Errors & Warnings
  complianceError: '#D32F2F',
  warningAmber: '#F59E0B',
  
  // Information
  infoBlue: '#3B82F6',
} as const;

/**
 * Navy Color Scale
 * Full spectrum for the primary navy color
 */
export const navyScale = {
  50: '#f0f4ff',
  100: '#d9e4ff',
  200: '#b8ccff',
  300: '#87a9ff',
  400: '#5578ff',
  500: '#2d4aff',
  600: '#1e32f5',
  700: '#1525d1',
  800: '#0f1f9e',
  900: '#0A1E45', // Deep Navy - Primary anchor
  950: '#070f2b',
} as const;

/**
 * Royal Blue Color Scale
 * Full spectrum for the core brand color
 */
export const royalScale = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#1E63FF', // Royal Blue - Core brand
  600: '#1a56e6',
  700: '#1547cc',
  800: '#1138a6',
  900: '#0d2b73',
  950: '#081d4d',
} as const;

/**
 * Sky Blue Color Scale
 * Full spectrum for accent and interactive elements
 */
export const skyScale = {
  50: '#f0f9ff',
  100: '#e0f2fe',
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#74B7FF', // Sky Blue - Accent
  500: '#4da9ff',
  600: '#2e8fe6',
  700: '#1d6fba',
  800: '#155a99',
  900: '#0f4673',
  950: '#0a2f4d',
} as const;

/**
 * Neutral Gray Scale
 * For text, backgrounds, and borders
 */
export const grayScale = {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
  950: '#030712',
} as const;

/**
 * Surface Colors
 * Background colors for different surface levels
 */
export const surfaces = {
  // Light theme
  background: '#F7FAFE',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFBFC',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

/**
 * Text Colors
 * Semantic text color hierarchy
 */
export const textColors = {
  primary: '#111827',
  secondary: '#4B5563',
  tertiary: '#6B7280',
  disabled: '#9CA3AF',
  inverse: '#FFFFFF',
  link: '#1E63FF',
  linkHover: '#1547cc',
} as const;

/**
 * Border Colors
 * Consistent border styling
 */
export const borderColors = {
  default: '#E5E7EB',
  light: '#F3F4F6',
  medium: '#D1D5DB',
  dark: '#9CA3AF',
  focus: '#1E63FF',
  error: '#D32F2F',
} as const;

/**
 * Status Colors
 * For various UI states and feedback
 */
export const statusColors = {
  success: {
    light: '#D1FAE5',
    default: '#10B981',
    dark: '#047857',
  },
  warning: {
    light: '#FEF3C7',
    default: '#F59E0B',
    dark: '#D97706',
  },
  error: {
    light: '#FEE2E2',
    default: '#D32F2F',
    dark: '#B91C1C',
  },
  info: {
    light: '#DBEAFE',
    default: '#3B82F6',
    dark: '#1D4ED8',
  },
} as const;

/**
 * Gradient Colors
 * Pre-defined gradients for consistent styling
 */
export const gradients = {
  navyRoyal: 'linear-gradient(135deg, #0A1E45 0%, #1E63FF 100%)',
  royalSky: 'linear-gradient(135deg, #1E63FF 0%, #74B7FF 100%)',
  blueGlow: 'radial-gradient(circle at center, #1E63FF 0%, transparent 70%)',
  mesh: 'linear-gradient(135deg, var(--tw-gradient-stops))',
} as const;

/**
 * Complete color palette export
 * Use this for design system documentation and tooling
 */
export const colors = {
  primary: primaryColors,
  semantic: semanticColors,
  navy: navyScale,
  royal: royalScale,
  sky: skyScale,
  gray: grayScale,
  surfaces,
  text: textColors,
  border: borderColors,
  status: statusColors,
  gradients,
} as const;

/**
 * Type exports for TypeScript support
 */
export type PrimaryColors = typeof primaryColors;
export type SemanticColors = typeof semanticColors;
export type NavyScale = typeof navyScale;
export type RoyalScale = typeof royalScale;
export type SkyScale = typeof skyScale;
export type GrayScale = typeof grayScale;
export type ColorPalette = typeof colors;
