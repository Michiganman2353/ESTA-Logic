/**
 * WizardEngine - Main Orchestrator for Guided Wizard Flow
 *
 * Provides a clean API for managing wizard navigation,
 * state persistence, and step registration.
 */

import { WizardState, StepConfig } from './WizardState';

export class WizardEngine {
  private state: WizardState;

  constructor() {
    this.state = new WizardState();
  }

  /**
   * Register a step in the wizard
   */
  registerStep(id: string, config: Omit<StepConfig, 'id'>) {
    this.state.registerStep(id, config);
  }

  /**
   * Navigate to next step
   */
  next() {
    this.state.goNext();
    this.saveState();
  }

  /**
   * Navigate to previous step
   */
  back() {
    this.state.goBack();
    this.saveState();
  }

  /**
   * Jump to a specific step
   */
  goToStep(index: number) {
    this.state.goToStep(index);
    this.saveState();
  }

  /**
   * Save current wizard state
   */
  saveState() {
    this.state.persist();
  }

  /**
   * Restore wizard state from storage
   */
  restoreState() {
    this.state.restore();
  }

  /**
   * Get current step configuration
   */
  getCurrentStep() {
    return this.state.current();
  }

  /**
   * Get current step index
   */
  getCurrentIndex() {
    return this.state.getCurrentIndex();
  }

  /**
   * Get total number of steps
   */
  getTotalSteps() {
    return this.state.getTotalSteps();
  }

  /**
   * Check if at first step
   */
  isFirst() {
    return this.state.isFirst();
  }

  /**
   * Check if at last step
   */
  isLast() {
    return this.state.isLast();
  }

  /**
   * Set data for a specific key
   */
  setData(key: string, value: any) {
    this.state.setData(key, value);
    this.saveState();
  }

  /**
   * Get data by key or all data
   */
  getData(key?: string) {
    return this.state.getData(key);
  }

  /**
   * Clear all wizard data and reset
   */
  reset() {
    this.state.clear();
  }

  /**
   * Get all registered steps
   */
  getAllSteps() {
    return this.state.getAllSteps();
  }

  /**
   * Calculate progress percentage
   */
  getProgress() {
    const total = this.getTotalSteps();
    const current = this.getCurrentIndex();
    return total > 0 ? Math.round((current / (total - 1)) * 100) : 0;
  }
}

// Export singleton instance
export const wizard = new WizardEngine();
