/**
 * ESTA Tracker Design Tokens - Shadows
 * 
 * Elevation and shadow system for depth and hierarchy.
 * Creates visual layers and improves UI depth perception.
 * 
 * @see docs/design/DESIGN_TOKENS.md for usage guidelines
 */

/**
 * Base Shadow Scale
 * Progressive elevation levels from subtle to prominent
 */
export const shadows = {
  // No shadow
  none: 'none',
  
  // Subtle shadows for minimal elevation
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  
  // Default shadows for cards and containers
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  
  // Prominent shadows for modals and popovers
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Inner shadows
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
} as const;

/**
 * Colored Shadows
 * Brand-colored shadows for interactive elements
 */
export const coloredShadows = {
  // Royal Blue shadows (primary brand)
  royalSoft: '0 6px 18px rgba(30, 99, 255, 0.08)',
  royalMedium: '0 10px 25px rgba(30, 99, 255, 0.15)',
  royalStrong: '0 20px 40px rgba(30, 99, 255, 0.25)',
  
  // Sky Blue shadows (accent)
  skySoft: '0 6px 18px rgba(116, 183, 255, 0.08)',
  skyMedium: '0 10px 25px rgba(116, 183, 255, 0.15)',
  
  // Navy shadows (dark theme)
  navySoft: '0 6px 18px rgba(10, 30, 69, 0.08)',
  navyMedium: '0 10px 25px rgba(10, 30, 69, 0.15)',
  
  // Success shadows
  successSoft: '0 6px 18px rgba(16, 185, 129, 0.08)',
  successMedium: '0 10px 25px rgba(16, 185, 129, 0.15)',
  
  // Error shadows
  errorSoft: '0 6px 18px rgba(211, 47, 47, 0.08)',
  errorMedium: '0 10px 25px rgba(211, 47, 47, 0.15)',
  
  // Warning shadows
  warningSoft: '0 6px 18px rgba(245, 158, 11, 0.08)',
  warningMedium: '0 10px 25px rgba(245, 158, 11, 0.15)',
} as const;

/**
 * Glow Effects
 * Luminous effects for interactive states
 */
export const glowEffects = {
  // Blue glow for primary elements
  blueGlow: '0 0 20px rgba(30, 99, 255, 0.3), 0 0 40px rgba(30, 99, 255, 0.1)',
  blueGlowStrong: '0 0 30px rgba(30, 99, 255, 0.5), 0 0 60px rgba(30, 99, 255, 0.2)',
  
  // Focus glow
  focusGlow: '0 0 0 3px rgba(30, 99, 255, 0.25)',
  focusGlowStrong: '0 0 0 4px rgba(30, 99, 255, 0.4)',
  
  // Success glow
  successGlow: '0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.1)',
  
  // Error glow
  errorGlow: '0 0 20px rgba(211, 47, 47, 0.3), 0 0 40px rgba(211, 47, 47, 0.1)',
} as const;

/**
 * Component-Specific Shadows
 * Pre-configured shadows for common components
 */
export const componentShadows = {
  // Cards
  card: {
    default: shadows.md,
    hover: shadows.lg,
    active: shadows.sm,
  },
  
  // Buttons
  button: {
    default: 'none',
    hover: shadows.sm,
    active: shadows.inner,
    focus: glowEffects.focusGlow,
  },
  
  // Modals
  modal: {
    backdrop: 'none',
    content: shadows['2xl'],
  },
  
  // Dropdowns
  dropdown: {
    default: shadows.lg,
  },
  
  // Tooltips
  tooltip: {
    default: shadows.md,
  },
  
  // Floating elements
  floating: {
    default: shadows.xl,
  },
  
  // Input fields
  input: {
    default: shadows.sm,
    focus: glowEffects.focusGlow,
    error: glowEffects.errorGlow,
  },
} as const;

/**
 * Elevation System
 * Semantic elevation levels for z-index coordination
 */
export const elevationLevels = {
  // Base level (default surface)
  base: {
    shadow: shadows.none,
    zIndex: 0,
  },
  
  // Level 1 (raised elements like cards)
  raised: {
    shadow: shadows.sm,
    zIndex: 1,
  },
  
  // Level 2 (sticky elements, floating buttons)
  floating: {
    shadow: shadows.md,
    zIndex: 10,
  },
  
  // Level 3 (dropdowns, popovers)
  overlay: {
    shadow: shadows.lg,
    zIndex: 100,
  },
  
  // Level 4 (modals, dialogs)
  modal: {
    shadow: shadows.xl,
    zIndex: 1000,
  },
  
  // Level 5 (tooltips, notifications)
  tooltip: {
    shadow: shadows.lg,
    zIndex: 1100,
  },
  
  // Level 6 (maximum elevation)
  maximum: {
    shadow: shadows['2xl'],
    zIndex: 9999,
  },
} as const;

/**
 * Complete shadow system export
 */
export const shadowSystem = {
  base: shadows,
  colored: coloredShadows,
  glow: glowEffects,
  component: componentShadows,
  elevation: elevationLevels,
} as const;

/**
 * Type exports for TypeScript support
 */
export type Shadows = typeof shadows;
export type ColoredShadows = typeof coloredShadows;
export type GlowEffects = typeof glowEffects;
export type ComponentShadows = typeof componentShadows;
export type ElevationLevels = typeof elevationLevels;
export type ShadowSystem = typeof shadowSystem;
