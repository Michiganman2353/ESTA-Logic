/**
 * WizardState - State Management for Wizard Flow
 *
 * Manages the internal state of the wizard including
 * step navigation, data persistence, and validation state.
 */

export interface StepConfig {
  id: string;
  title: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: React.ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validation?: (data: any) => boolean;
  canSkip?: boolean;
}

export class WizardState {
  private steps: StepConfig[] = [];
  private index = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private data: Record<string, any> = {};

  /**
   * Register a step in the wizard flow
   */
  registerStep(id: string, config: Omit<StepConfig, 'id'>) {
    this.steps.push({ id, ...config });
  }

  /**
   * Navigate to the next step
   */
  goNext() {
    if (this.index < this.steps.length - 1) {
      this.index++;
    }
  }

  /**
   * Navigate to the previous step
   */
  goBack() {
    if (this.index > 0) {
      this.index--;
    }
  }

  /**
   * Get the current step
   */
  current() {
    return this.steps[this.index];
  }

  /**
   * Get the current step index
   */
  getCurrentIndex() {
    return this.index;
  }

  /**
   * Get total number of steps
   */
  getTotalSteps() {
    return this.steps.length;
  }

  /**
   * Check if at first step
   */
  isFirst() {
    return this.index === 0;
  }

  /**
   * Check if at last step
   */
  isLast() {
    return this.index === this.steps.length - 1;
  }

  /**
   * Set wizard data
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setData(key: string, value: any) {
    this.data[key] = value;
  }

  /**
   * Get wizard data
   */
  getData(key?: string) {
    if (key) {
      return this.data[key];
    }
    return this.data;
  }

  /**
   * Persist state to localStorage
   */
  persist() {
    try {
      const state = {
        index: this.index,
        data: this.data,
      };
      localStorage.setItem('wizard_state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to persist wizard state:', error);
    }
  }

  /**
   * Restore state from localStorage
   */
  restore() {
    try {
      const savedState = localStorage.getItem('wizard_state');
      if (!savedState) return;

      const parsed = JSON.parse(savedState);
      this.index = parsed.index || 0;
      this.data = parsed.data || {};
    } catch (error) {
      console.error('Failed to restore wizard state:', error);
    }
  }

  /**
   * Clear persisted state
   */
  clear() {
    try {
      localStorage.removeItem('wizard_state');
      this.index = 0;
      this.data = {};
    } catch (error) {
      console.error('Failed to clear wizard state:', error);
    }
  }

  /**
   * Jump to a specific step by index
   */
  goToStep(index: number) {
    if (index >= 0 && index < this.steps.length) {
      this.index = index;
    }
  }

  /**
   * Get all steps
   */
  getAllSteps() {
    return this.steps;
  }
}
