/**
 * PulseSecure - Security indicator pulse animation
 *
 * Provides a subtle pulse animation for security indicators
 * to draw attention to secure states
 */

import { ReactNode } from 'react';

interface PulseSecureProps {
  children: ReactNode;
  duration?: number;
}

export default function PulseSecure({
  children,
  duration = 2000,
}: PulseSecureProps) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  const pulseStyle = {
    animation: `pulse ${duration}ms cubic-bezier(0.4, 0, 0.6, 1) infinite`,
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>
      <div style={pulseStyle}>{children}</div>
    </>
  );
}
