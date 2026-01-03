/**
 * Narrative Library - Structured messaging system
 * Pre-crafted narrative content for key experience moments
 */

export type NarrativeKey =
  | 'welcome'
  | 'completion'
  | 'reassurance'
  | 'guidance'
  | 'error'
  | 'success'
  | 'loading'
  | 'saving'
  | 'stepIntro'
  | 'stepComplete';

export interface NarrativeContent {
  title?: string;
  message: string;
  action?: string;
}

export const NarrativeLibrary: Record<NarrativeKey, NarrativeContent> = {
  welcome: {
    title: 'Welcome to ESTA Tracker',
    message: 'We will walk with you through this. Step-by-step.',
    action: 'Get Started',
  },
  completion: {
    title: 'Setup Complete',
    message: 'You did it. Your organization is protected.',
    action: 'View Dashboard',
  },
  reassurance: {
    message:
      'We ensure compliance is handled correctly and safely. You can trust us to guide you through every requirement.',
  },
  guidance: {
    message:
      'Take your time. We will explain each step clearly and make sure you understand what is needed.',
  },
  error: {
    title: 'Something needs attention',
    message:
      'No worries—we will help you fix this. Check the highlighted fields and try again.',
  },
  success: {
    title: 'Perfect!',
    message: 'Everything looks good. Moving forward.',
  },
  loading: {
    message: 'Just a moment while we prepare everything for you...',
  },
  saving: {
    message: 'Saving your information securely...',
  },
  stepIntro: {
    message: 'This next step will help us understand your needs better.',
  },
  stepComplete: {
    message: 'Great! One more step closer to being fully compliant.',
  },
};

/**
 * Get narrative content by key
 */
export function getNarrative(key: NarrativeKey): NarrativeContent {
  return NarrativeLibrary[key];
}

/**
 * Get narrative message only
 */
export function getNarrativeMessage(key: NarrativeKey): string {
  return NarrativeLibrary[key].message;
}
