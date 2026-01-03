/**
 * ESTA Tracker Design Tokens - Borders
 *
 * Border radius and width tokens for consistent edge styling.
 * Ensures cohesive visual language across components.
 *
 * @see docs/design/DESIGN_TOKENS.md for usage guidelines
 */

/**
 * Border Radius Scale
 * Corner rounding values from sharp to fully rounded
 */
export const borderRadius = {
  none: '0',
  xs: '0.125rem', // 2px - Very subtle
  sm: '0.25rem', // 4px - Subtle
  md: '0.375rem', // 6px - Default
  lg: '0.5rem', // 8px - Moderate
  xl: '0.75rem', // 12px - Prominent
  '2xl': '1rem', // 16px - Very rounded
  '3xl': '1.5rem', // 24px - Extra rounded
  full: '9999px', // Fully rounded (pills, circles)
} as const;

/**
 * Component-Specific Border Radius
 * Semantic radius tokens for common UI patterns
 */
export const componentBorderRadius = {
  // Buttons
  button: {
    default: borderRadius.lg, // 8px
    pill: borderRadius.full,
    square: borderRadius.none,
  },

  // Input fields
  input: {
    default: borderRadius.lg, // 8px
    compact: borderRadius.md, // 6px
  },

  // Cards
  card: {
    default: '1.125rem', // 18px - Custom card radius
    compact: borderRadius.xl, // 12px
    relaxed: borderRadius['2xl'], // 16px
  },

  // Badges
  badge: {
    default: borderRadius.md, // 6px
    pill: borderRadius.full,
  },

  // Avatars
  avatar: {
    square: borderRadius.md, // 6px
    rounded: borderRadius.xl, // 12px
    circle: borderRadius.full,
  },

  // Modals
  modal: {
    default: borderRadius['2xl'], // 16px
    large: borderRadius['3xl'], // 24px
  },

  // Images
  image: {
    default: borderRadius.lg, // 8px
    thumbnail: borderRadius.md, // 6px
  },
} as const;

/**
 * Border Width Scale
 * Consistent border thickness values
 */
export const borderWidth = {
  0: '0',
  1: '1px',
  2: '2px',
  4: '4px',
  8: '8px',
} as const;

/**
 * Component-Specific Border Widths
 * Semantic width tokens for common patterns
 */
export const componentBorderWidth = {
  // Default borders
  default: borderWidth[1], // 1px

  // Input borders
  input: {
    default: borderWidth[1], // 1px
    focus: borderWidth[2], // 2px
  },

  // Dividers
  divider: {
    thin: borderWidth[1], // 1px
    thick: borderWidth[2], // 2px
  },

  // Outline styles
  outline: {
    default: borderWidth[2], // 2px
    thick: borderWidth[4], // 4px
  },

  // Focus rings
  focus: {
    default: borderWidth[2], // 2px
    prominent: borderWidth[4], // 4px
  },
} as const;

/**
 * Border Styles
 * Common border style patterns
 */
export const borderStyles = {
  solid: 'solid',
  dashed: 'dashed',
  dotted: 'dotted',
  none: 'none',
} as const;

/**
 * Complete Border Presets
 * Common border combinations ready to use
 */
export const borderPresets = {
  // Default border
  default: `${borderWidth[1]} ${borderStyles.solid} #E5E7EB`,

  // Input borders
  input: {
    default: `${borderWidth[1]} ${borderStyles.solid} #D1D5DB`,
    focus: `${borderWidth[2]} ${borderStyles.solid} #1E63FF`,
    error: `${borderWidth[2]} ${borderStyles.solid} #D32F2F`,
  },

  // Card borders
  card: {
    default: `${borderWidth[1]} ${borderStyles.solid} #E5E7EB`,
    hover: `${borderWidth[1]} ${borderStyles.solid} #1E63FF`,
  },

  // Dividers
  divider: {
    light: `${borderWidth[1]} ${borderStyles.solid} #F3F4F6`,
    default: `${borderWidth[1]} ${borderStyles.solid} #E5E7EB`,
    dark: `${borderWidth[1]} ${borderStyles.solid} #D1D5DB`,
  },

  // Focus rings
  focus: {
    primary: `${borderWidth[2]} ${borderStyles.solid} #1E63FF`,
    success: `${borderWidth[2]} ${borderStyles.solid} #10B981`,
    error: `${borderWidth[2]} ${borderStyles.solid} #D32F2F`,
  },
} as const;

/**
 * Outline Styles
 * Focus and interaction outline configurations
 */
export const outlineStyles = {
  // Focus outlines
  focus: {
    default: {
      outline: `${borderWidth[2]} solid #1E63FF`,
      outlineOffset: '2px',
    },
    thick: {
      outline: `${borderWidth[4]} solid #1E63FF`,
      outlineOffset: '2px',
    },
  },

  // Accessibility outlines
  a11y: {
    default: {
      outline: `${borderWidth[2]} dashed #1E63FF`,
      outlineOffset: '4px',
    },
  },
} as const;

/**
 * Complete border system export
 */
export const borderSystem = {
  radius: borderRadius,
  componentRadius: componentBorderRadius,
  width: borderWidth,
  componentWidth: componentBorderWidth,
  styles: borderStyles,
  presets: borderPresets,
  outlines: outlineStyles,
} as const;

/**
 * Type exports for TypeScript support
 */
export type BorderRadius = typeof borderRadius;
export type ComponentBorderRadius = typeof componentBorderRadius;
export type BorderWidth = typeof borderWidth;
export type ComponentBorderWidth = typeof componentBorderWidth;
export type BorderStyles = typeof borderStyles;
export type BorderPresets = typeof borderPresets;
export type OutlineStyles = typeof outlineStyles;
export type BorderSystem = typeof borderSystem;
