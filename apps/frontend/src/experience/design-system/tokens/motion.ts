/**
 * Motion Design Tokens
 *
 * Defines animation timing, easing, and duration tokens
 * for consistent, accessible motion design across the application.
 */

export const motion = {
  // Duration tokens (in milliseconds)
  duration: {
    instant: 100,
    fast: 200,
    normal: 350,
    slow: 500,
    slower: 700,
  },

  // Easing functions
  easing: {
    standard: 'ease-out',
    emphasized: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerated: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerated: 'cubic-bezier(0.4, 0.0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
  },

  // Transition presets
  transitions: {
    fadeIn: 'opacity 350ms ease-out',
    fadeOut: 'opacity 200ms ease-in',
    slideUp: 'transform 350ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    slideDown: 'transform 350ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    scale: 'transform 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    all: 'all 350ms ease-out',
  },

  // Accessibility-safe timing
  // Users who prefer reduced motion get instant transitions
  prefersReducedMotion: {
    duration: 0,
    easing: 'linear',
  },
} as const;

export type MotionTokens = typeof motion;
