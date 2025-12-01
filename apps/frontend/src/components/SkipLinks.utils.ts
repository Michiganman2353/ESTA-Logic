/**
 * Skip Links Utilities
 *
 * Hook and constants for skip link functionality.
 * Separated from components to comply with React Fast Refresh requirements.
 */

export interface SkipTarget {
  /** Unique identifier matching target element id */
  id: string;
  /** Human-readable label for the skip link */
  label: string;
}

/**
 * Default skip targets for typical page layouts
 */
export const defaultSkipTargets: SkipTarget[] = [
  { id: 'main-content', label: 'Skip to main content' },
  { id: 'main-navigation', label: 'Skip to navigation' },
];

/**
 * useSkipToContent Hook
 *
 * Provides programmatic skip-to-content functionality.
 * Useful for SPA route changes where focus needs to be managed.
 */
export function useSkipToContent() {
  const skipToContent = (targetId: string = 'main-content') => {
    const target = document.getElementById(targetId);
    if (target) {
      // Make target focusable if it isn't already
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return { skipToContent };
}
