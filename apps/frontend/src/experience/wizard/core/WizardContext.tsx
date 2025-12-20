/**
 * WizardContext - React Context for Wizard State
 *
 * Provides a React context and hooks for accessing wizard state
 * throughout the component tree.
 */

import { createContext, useState, useEffect, ReactNode } from 'react';
import { wizard } from './WizardEngine';

interface WizardContextType {
  currentStep: number;
  totalSteps: number;
  progress: number;
  next: () => void;
  back: () => void;
  goToStep: (index: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setData: (key: string, value: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getData: (key?: string) => any;
  reset: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export { WizardContext };

interface WizardProviderProps {
  children: ReactNode;
}

/**
 * WizardProvider - Provides wizard context to children
 */
export function WizardProvider({ children }: WizardProviderProps) {
  const [currentStep, setCurrentStep] = useState(wizard.getCurrentIndex());
  const [, forceUpdate] = useState({});

  // Restore state on mount
  useEffect(() => {
    wizard.restoreState();
    setCurrentStep(wizard.getCurrentIndex());
  }, []);

  const next = () => {
    wizard.next();
    setCurrentStep(wizard.getCurrentIndex());
    forceUpdate({});
  };

  const back = () => {
    wizard.back();
    setCurrentStep(wizard.getCurrentIndex());
    forceUpdate({});
  };

  const goToStep = (index: number) => {
    wizard.goToStep(index);
    setCurrentStep(wizard.getCurrentIndex());
    forceUpdate({});
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setData = (key: string, value: any) => {
    wizard.setData(key, value);
    forceUpdate({});
  };

  const getData = (key?: string) => {
    return wizard.getData(key);
  };

  const reset = () => {
    wizard.reset();
    setCurrentStep(0);
    forceUpdate({});
  };

  const value: WizardContextType = {
    currentStep,
    totalSteps: wizard.getTotalSteps(),
    progress: wizard.getProgress(),
    next,
    back,
    goToStep,
    setData,
    getData,
    reset,
    isFirst: wizard.isFirst(),
    isLast: wizard.isLast(),
  };

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}
