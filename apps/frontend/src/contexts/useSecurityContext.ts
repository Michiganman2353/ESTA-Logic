/**
 * Hook for accessing SecurityContext
 * Separated from SecurityContext.tsx to avoid react-refresh warnings
 */

import { useContext } from 'react';
import { SecurityContext } from './SecurityContext';

export function useSecurityContext() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within SecurityProvider');
  }
  return context;
}
