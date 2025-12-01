/**
 * SkipLink Component
 *
 * Provides skip navigation links for keyboard users to bypass
 * repetitive content and navigate directly to main content areas.
 *
 * WCAG 2.1 AA Requirement:
 * - Bypass Blocks (2.4.1): Provides mechanism to bypass content
 * - Focus Visible (2.4.7): Clear focus indicator when activated
 *
 * Features:
 * - Hidden by default, visible on focus
 * - Multiple skip targets support
 * - High contrast focus state
 * - Smooth scroll to target
 *
 * Uses:
 * - Tailwind CSS for styling
 * - Native HTML anchor behavior
 *
 * Note: Import utilities separately:
 * - Utils: import { useSkipToContent, defaultSkipTargets } from './SkipLinks.utils'
 */

import { useRef, useEffect } from 'react';
import type { SkipTarget } from './SkipLinks.utils';

interface SkipLinksProps {
  /** Array of skip targets */
  targets?: SkipTarget[];
  /** Custom class name */
  className?: string;
}

/**
 * SkipLinks Component
 *
 * Renders skip navigation links at the top of the page.
 * Links are visually hidden until focused via keyboard.
 */
export function SkipLinks({ targets, className = '' }: SkipLinksProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Use default targets if none provided
  const skipTargets = targets || [
    { id: 'main-content', label: 'Skip to main content' },
    { id: 'main-navigation', label: 'Skip to navigation' },
  ];

  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    event.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      // Focus the target element
      target.focus({ preventScroll: true });
      // Smooth scroll to target
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus({ preventScroll: true });
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`skip-links ${className}`}
      role="navigation"
      aria-label="Skip links"
    >
      {skipTargets.map((target) => (
        <a
          key={target.id}
          href={`#${target.id}`}
          onClick={(e) => handleClick(e, target.id)}
          onKeyDown={(e) => handleKeyDown(e, target.id)}
          className="focus:bg-primary-600 focus:ring-offset-primary-600 sr-only transition-all duration-200 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
        >
          {target.label}
        </a>
      ))}
    </div>
  );
}

/**
 * FocusAnchor Component
 *
 * Creates an invisible focus anchor point for skip links.
 * Use this to mark the main content area or other landmarks.
 */
interface FocusAnchorProps {
  /** Unique identifier for the anchor */
  id: string;
  /** Optional label for screen readers */
  label?: string;
  /** Optional class name */
  className?: string;
}

export function FocusAnchor({ id, label, className = '' }: FocusAnchorProps) {
  const anchorRef = useRef<HTMLDivElement>(null);

  // Remove tabindex after focus to prevent focus trapping
  useEffect(() => {
    const element = anchorRef.current;
    if (element) {
      const handleBlur = () => {
        element.removeAttribute('tabindex');
      };
      element.addEventListener('blur', handleBlur);
      return () => element.removeEventListener('blur', handleBlur);
    }
  }, []);

  return (
    <div
      ref={anchorRef}
      id={id}
      tabIndex={-1}
      className={`outline-none ${className}`}
      aria-label={label}
    />
  );
}
