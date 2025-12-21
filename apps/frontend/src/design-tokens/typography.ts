/**
 * ESTA Tracker Design Tokens - Typography
 * 
 * Centralized typography system for consistent text styling.
 * Defines font families, sizes, weights, and line heights.
 * 
 * @see docs/design/DESIGN_TOKENS.md for usage guidelines
 */

/**
 * Font Families
 * Primary and fallback font stacks
 */
export const fontFamilies = {
  // Primary sans-serif stack for UI
  sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  
  // Monospace stack for code
  mono: '"JetBrains Mono", "Fira Code", Consolas, Monaco, "Courier New", monospace',
  
  // Serif stack for special use cases
  serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
} as const;

/**
 * Font Size Scale
 * Consistent type scale following 8px base grid
 */
export const fontSizes = {
  // Display & Hero Text
  '6xl': '3.75rem',    // 60px - Hero headings
  '5xl': '3rem',       // 48px - Major headings
  '4xl': '2.25rem',    // 36px - Page titles
  '3xl': '1.875rem',   // 30px - Section headings
  
  // Headings
  '2xl': '1.5rem',     // 24px - H2
  'xl': '1.25rem',     // 20px - H3
  'lg': '1.125rem',    // 18px - H4
  
  // Body Text
  'base': '1rem',      // 16px - Body default
  'sm': '0.875rem',    // 14px - Small text, labels
  'xs': '0.75rem',     // 12px - Captions, meta
  'xxs': '0.625rem',   // 10px - Tiny text (rare)
} as const;

/**
 * Font Weights
 * Semantic weight tokens
 */
export const fontWeights = {
  thin: 100,
  extralight: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

/**
 * Line Heights
 * Relative and absolute line height values
 */
export const lineHeights = {
  // Relative (unitless)
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
  
  // Fixed (for precise control)
  '3': '0.75rem',      // 12px
  '4': '1rem',         // 16px
  '5': '1.25rem',      // 20px
  '6': '1.5rem',       // 24px
  '7': '1.75rem',      // 28px
  '8': '2rem',         // 32px
  '9': '2.25rem',      // 36px
  '10': '2.5rem',      // 40px
} as const;

/**
 * Letter Spacing
 * Tracking values for different text styles
 */
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

/**
 * Text Styles
 * Pre-composed typography styles for common use cases
 */
export const textStyles = {
  // Display styles
  displayLarge: {
    fontSize: fontSizes['6xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
  },
  displayMedium: {
    fontSize: fontSizes['5xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
  },
  displaySmall: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacing.tight,
  },
  
  // Heading styles
  h1: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacing.normal,
  },
  h3: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacing.normal,
  },
  h4: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  
  // Body styles
  bodyLarge: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  
  // Specialized styles
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.wide,
  },
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  legal: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  button: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.wide,
  },
  code: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
} as const;

/**
 * Complete typography system export
 */
export const typography = {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
  textStyles,
} as const;

/**
 * Type exports for TypeScript support
 */
export type FontFamilies = typeof fontFamilies;
export type FontSizes = typeof fontSizes;
export type FontWeights = typeof fontWeights;
export type LineHeights = typeof lineHeights;
export type LetterSpacing = typeof letterSpacing;
export type TextStyles = typeof textStyles;
export type Typography = typeof typography;
