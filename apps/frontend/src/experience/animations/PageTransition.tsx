/**
 * PageTransition - Smooth page transition animation
 *
 * Provides fade-in animation for page/step transitions
 * with accessibility considerations
 */

import React, { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  duration?: number;
}

export default function PageTransition({
  children,
  duration = 350,
}: PageTransitionProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    // Trigger animation after a brief delay
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const animationStyle = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
    transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
  };

  return <div style={animationStyle}>{children}</div>;
}
