/**
 * useWizard - Hook to access wizard context
 */

import { useContext } from 'react';
import { WizardContext } from './WizardContext';

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider');
  }
  return context;
}
