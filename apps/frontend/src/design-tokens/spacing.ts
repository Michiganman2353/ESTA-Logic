/**
 * ESTA Tracker Design Tokens - Spacing
 *
 * Consistent spacing scale based on 8px grid system.
 * Ensures visual harmony and alignment across the application.
 *
 * @see docs/design/DESIGN_TOKENS.md for usage guidelines
 */

/**
 * Base Spacing Scale
 * 8px base grid with rem units
 */
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px - Base unit
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px
} as const;

/**
 * Component-Specific Spacing
 * Semantic spacing tokens for common UI patterns
 */
export const componentSpacing = {
  // Padding presets
  padding: {
    none: spacing[0],
    xs: spacing[2], // 8px
    sm: spacing[3], // 12px
    md: spacing[4], // 16px
    lg: spacing[6], // 24px
    xl: spacing[8], // 32px
    '2xl': spacing[12], // 48px
  },

  // Gap between elements
  gap: {
    none: spacing[0],
    xs: spacing[1], // 4px
    sm: spacing[2], // 8px
    md: spacing[4], // 16px
    lg: spacing[6], // 24px
    xl: spacing[8], // 32px
  },

  // Section spacing
  section: {
    xs: spacing[8], // 32px
    sm: spacing[12], // 48px
    md: spacing[16], // 64px
    lg: spacing[24], // 96px
    xl: spacing[32], // 128px
  },

  // Card padding
  card: {
    compact: spacing[4], // 16px
    default: spacing[6], // 24px
    relaxed: spacing[8], // 32px
  },

  // Form spacing
  form: {
    fieldGap: spacing[4], // 16px - Between form fields
    labelGap: spacing[1.5], // 6px - Between label and input
    groupGap: spacing[6], // 24px - Between field groups
  },

  // Button padding
  button: {
    xs: `${spacing[2]} ${spacing[3]}`, // 8px 12px
    sm: `${spacing[2.5]} ${spacing[4]}`, // 10px 16px
    md: `${spacing[3]} ${spacing[6]}`, // 12px 24px
    lg: `${spacing[4]} ${spacing[8]}`, // 16px 32px
    xl: `${spacing[5]} ${spacing[10]}`, // 20px 40px
  },

  // Container spacing
  container: {
    xs: spacing[4], // 16px
    sm: spacing[6], // 24px
    md: spacing[8], // 32px
    lg: spacing[12], // 48px
    xl: spacing[16], // 64px
  },
} as const;

/**
 * Layout Spacing
 * Spacing for layout-level structures
 */
export const layoutSpacing = {
  // Page margins
  pageMargin: {
    mobile: spacing[4], // 16px
    tablet: spacing[6], // 24px
    desktop: spacing[8], // 32px
  },

  // Header heights
  header: {
    mobile: spacing[14], // 56px
    desktop: spacing[16], // 64px
  },

  // Sidebar widths
  sidebar: {
    collapsed: spacing[16], // 64px
    expanded: spacing[64], // 256px
  },

  // Content max widths
  contentMaxWidth: {
    narrow: spacing[96], // 384px - 768px total with padding
    medium: '1024px',
    wide: '1280px',
    full: '1536px',
  },
} as const;

/**
 * Complete spacing system export
 */
export const spacingSystem = {
  base: spacing,
  component: componentSpacing,
  layout: layoutSpacing,
} as const;

/**
 * Type exports for TypeScript support
 */
export type Spacing = typeof spacing;
export type ComponentSpacing = typeof componentSpacing;
export type LayoutSpacing = typeof layoutSpacing;
export type SpacingSystem = typeof spacingSystem;
