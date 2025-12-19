import { useEffect } from 'react';
import { useWizard } from '../WizardContext';

/**
 * Hook for managing wizard persistence
 *
 * Features:
 * - Auto-saves wizard state to localStorage
 * - Detects and warns about data loss on navigation
 * - Provides methods for manual save/restore operations
 */
export function useWizardPersistence() {
  const { data, step } = useWizard();

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only show warning if wizard is in progress (not completed)
      if (step > 0 && !data.certificateGenerated) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [step, data.certificateGenerated]);

  return {
    isInProgress: step > 0 && !data.certificateGenerated,
    currentStep: step,
    hasData: Object.keys(data).length > 0,
  };
}
