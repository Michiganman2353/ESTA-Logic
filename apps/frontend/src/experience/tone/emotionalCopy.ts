/**
 * Emotional Copy Engine - Context-aware reassurance messaging
 * Provides human, supportive, zero-panic tone for different contexts
 */

export type EmotionalContext =
  | 'onboarding'
  | 'risk'
  | 'success'
  | 'audit'
  | 'error'
  | 'loading';

export interface EmotionalCopyOptions {
  context: EmotionalContext;
  userName?: string;
  detail?: string;
}

/**
 * Get emotionally intelligent copy for a given context
 * Uses reassuring, supportive language to reduce anxiety
 */
export function emotionalCopy(
  context: EmotionalContext,
  options?: { userName?: string; detail?: string }
): string {
  const tones: Record<EmotionalContext, string> = {
    onboarding:
      "You are in the right place. We'll walk you through everything, one step at a time.",
    risk: 'This does not mean you are in trouble. It simply means something needs attention, and we will guide you through it.',
    success: 'You are covered. Take a breath. Compliance is under control.',
    audit:
      'Everything here is transparent and provable. This audit trail protects you and your business.',
    error:
      "Something went wrong, but don't worry. Your data is safe, and we're here to help you fix this.",
    loading: "We're working on this for you. Thank you for your patience.",
  };

  let message = tones[context] || tones.success;

  // Personalize with user name if provided
  if (options?.userName) {
    message = `${options.userName}, ${message.charAt(0).toLowerCase()}${message.slice(1)}`;
  }

  // Add detail if provided
  if (options?.detail) {
    message = `${message} ${options.detail}`;
  }

  return message;
}

/**
 * Reassurance phrases for different scenarios
 */
export const ReassurancePhrases = {
  dataProtection: 'Your data is encrypted and secure.',
  legalCompliance: 'You are legally compliant with Michigan ESTA requirements.',
  noAction: 'No action needed from you right now.',
  guidance: "We'll guide you through every step.",
  support: 'Our team is here to help if you need us.',
  transparency: 'Everything is documented and accessible to you.',
  control: 'You have full control over your data.',
  peace: 'You can focus on running your business.',
} as const;

/**
 * Get a reassurance message based on the situation
 */
export function getReassurance(
  situation: keyof typeof ReassurancePhrases
): string {
  return ReassurancePhrases[situation];
}

/**
 * Combine multiple reassurance messages
 */
export function combineReassurances(
  situations: Array<keyof typeof ReassurancePhrases>
): string {
  return situations.map((s) => ReassurancePhrases[s]).join(' ');
}

/**
 * Tone transformation - add emotional warmth to technical messages
 */
export function humanizeTechnicalMessage(technicalMessage: string): string {
  const warmPrefixes = [
    'Just a heads up: ',
    "Here's what's happening: ",
    'Quick update: ',
    'We wanted to let you know: ',
  ];

  const randomPrefix =
    warmPrefixes[Math.floor(Math.random() * warmPrefixes.length)];
  return randomPrefix + technicalMessage;
}

/**
 * Error message with empathy
 */
export function empathyError(errorType: string, suggestion?: string): string {
  const base = `We encountered an issue with ${errorType}. Don't worry—your information is safe.`;

  if (suggestion) {
    return `${base} ${suggestion}`;
  }

  return `${base} Please try again, or contact support if this continues.`;
}

/**
 * Success message with celebration
 */
export function celebrateSuccess(action: string): string {
  return `Great work! ${action} You're all set.`;
}

/**
 * Onboarding encouragement
 */
export function onboardingEncouragement(
  step: string,
  totalSteps: number,
  currentStep: number
): string {
  const progress = Math.round((currentStep / totalSteps) * 100);

  if (currentStep === 1) {
    return `Welcome! Let's get started with ${step}. This won't take long.`;
  }

  if (currentStep === totalSteps) {
    return `Almost there! Just one more step: ${step}.`;
  }

  return `You're doing great—${progress}% complete. Next up: ${step}.`;
}
