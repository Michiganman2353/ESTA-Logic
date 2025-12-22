/**
 * SecurityContext Helper Exports
 *
 * Separated from main context file to maintain React Fast Refresh compatibility.
 * Non-component exports should be in this file.
 */

import { useContext } from 'react';
import { SecurityContext } from './SecurityContext';

/**
 * Hook to access security context
 * Must be used within SecurityProvider
 */
export function useSecurityContext() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within SecurityProvider');
  }
  return context;
}
