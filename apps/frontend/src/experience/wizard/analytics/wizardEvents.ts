/**
 * Wizard Analytics Events
 *
 * Tracks wizard interactions and progress for analytics
 */

export interface WizardEvent {
  type:
    | 'step_view'
    | 'step_complete'
    | 'step_back'
    | 'wizard_complete'
    | 'wizard_abandon';
  stepId?: string;
  stepIndex?: number;
  timestamp: number;
  data?: Record<string, unknown>;
}

class WizardAnalytics {
  private events: WizardEvent[] = [];

  /**
   * Track step view
   */
  trackStepView(stepId: string, stepIndex: number) {
    this.trackEvent({
      type: 'step_view',
      stepId,
      stepIndex,
      timestamp: Date.now(),
    });
  }

  /**
   * Track step completion
   */
  trackStepComplete(
    stepId: string,
    stepIndex: number,
    data?: Record<string, unknown>
  ) {
    this.trackEvent({
      type: 'step_complete',
      stepId,
      stepIndex,
      timestamp: Date.now(),
      data,
    });
  }

  /**
   * Track step back navigation
   */
  trackStepBack(stepId: string, stepIndex: number) {
    this.trackEvent({
      type: 'step_back',
      stepId,
      stepIndex,
      timestamp: Date.now(),
    });
  }

  /**
   * Track wizard completion
   */
  trackWizardComplete(data?: Record<string, unknown>) {
    this.trackEvent({
      type: 'wizard_complete',
      timestamp: Date.now(),
      data,
    });
  }

  /**
   * Track wizard abandonment
   */
  trackWizardAbandon(stepId: string, stepIndex: number) {
    this.trackEvent({
      type: 'wizard_abandon',
      stepId,
      stepIndex,
      timestamp: Date.now(),
    });
  }

  /**
   * Internal event tracking
   */
  private trackEvent(event: WizardEvent) {
    this.events.push(event);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Wizard Analytics]', event);
    }

    // Here you could send to analytics service (Google Analytics, Mixpanel, etc.)
    // Example: window.gtag?.('event', event.type, event);
  }

  /**
   * Get all events
   */
  getEvents() {
    return [...this.events];
  }

  /**
   * Clear all events
   */
  clearEvents() {
    this.events = [];
  }

  /**
   * Get events by type
   */
  getEventsByType(type: WizardEvent['type']) {
    return this.events.filter((event) => event.type === type);
  }

  /**
   * Get wizard metrics
   */
  getMetrics() {
    const stepViews = this.getEventsByType('step_view');
    const stepCompletes = this.getEventsByType('step_complete');
    const wizardCompletes = this.getEventsByType('wizard_complete');
    const wizardAbandons = this.getEventsByType('wizard_abandon');

    return {
      totalStepViews: stepViews.length,
      totalStepCompletes: stepCompletes.length,
      totalWizardCompletes: wizardCompletes.length,
      totalWizardAbandons: wizardAbandons.length,
      completionRate:
        stepViews.length > 0
          ? (wizardCompletes.length / stepViews.length) * 100
          : 0,
    };
  }
}

// Export singleton instance
export const wizardEvents = new WizardAnalytics();
