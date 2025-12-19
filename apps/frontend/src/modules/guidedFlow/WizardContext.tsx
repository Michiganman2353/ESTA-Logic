import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

/**
 * Wizard data structure that holds all step information
 */
export interface WizardData {
  // Intro step
  hasSeenIntro?: boolean;

  // Employer type step
  employerType?: 'small' | 'large' | 'municipal' | 'nonprofit';

  // Employee count step
  employeeCount?: number;

  // Policy logic step
  policyType?: 'small-business' | 'large-business';
  accrualRate?: number;
  carryoverLimit?: number;
  annualUsageLimit?: number;

  // Secure camera step
  capturedDocuments?: string[]; // base64 encoded images

  // Summary step
  completedAt?: string;
  certificateGenerated?: boolean;
}

interface WizardContextType {
  step: number;
  setStep: (step: number) => void;
  data: WizardData;
  update: (values: Partial<WizardData>) => void;
  reset: () => void;
  maxStepReached: number;
}

const WizardContext = createContext<WizardContextType | null>(null);

const STORAGE_KEY = 'esta-wizard';

interface WizardProviderProps {
  children: ReactNode;
}

/**
 * WizardProvider component that manages wizard state and persistence
 *
 * Features:
 * - Persists wizard state to localStorage
 * - Tracks current step and maximum step reached
 * - Provides methods to update wizard data and navigate steps
 */
export function WizardProvider({ children }: WizardProviderProps) {
  const [step, setStepState] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);
  const [data, setData] = useState<WizardData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load wizard state from localStorage:', error);
      return {};
    }
  });

  // Persist data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save wizard state to localStorage:', error);
    }
  }, [data]);

  // Track maximum step reached for progress indication
  const setStep = (newStep: number) => {
    setStepState(newStep);
    if (newStep > maxStepReached) {
      setMaxStepReached(newStep);
    }
  };

  /**
   * Update wizard data with partial updates
   */
  const update = (values: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...values }));
  };

  /**
   * Reset wizard to initial state and clear localStorage
   */
  const reset = () => {
    setData({});
    setStepState(0);
    setMaxStepReached(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear wizard state from localStorage:', error);
    }
  };

  return (
    <WizardContext.Provider
      value={{ step, setStep, data, update, reset, maxStepReached }}
    >
      {children}
    </WizardContext.Provider>
  );
}

/**
 * Hook to access wizard context
 * Must be used within WizardProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider');
  }
  return context;
}
