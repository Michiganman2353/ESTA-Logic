/**
 * Confidence Messages - Reassurance-Driven UI Content
 *
 * Provides contextual, confidence-building messages throughout the user journey.
 * Every interaction should make users feel more confident, not less.
 *
 * Philosophy: "Every pixel, every word, every interaction should make the user feel more confident."
 */

/**
 * Message type for different contexts
 */
export type MessageType =
  | 'welcome'
  | 'progress'
  | 'success'
  | 'validation'
  | 'guidance'
  | 'security'
  | 'completion'
  | 'error-recovery';

/**
 * Confidence message structure
 */
export interface ConfidenceMessage {
  type: MessageType;
  primary: string;
  secondary?: string;
  action?: string;
  icon?: string;
  tone: 'reassuring' | 'encouraging' | 'celebratory' | 'supportive';
}

/**
 * Confidence Messages Library
 */
export class ConfidenceMessages {
  /**
   * Welcome messages - First impression matters
   */
  static welcome = {
    employer: {
      primary: "You're in the right place.",
      secondary:
        "We'll walk you through Michigan ESTA compliance one clear step at a time.",
      tone: 'reassuring' as const,
      icon: '👋',
    },
    employee: {
      primary: "Welcome! Let's get you connected.",
      secondary:
        'Your employer uses ESTA-Logic to track your earned sick time. This will only take a minute.',
      tone: 'reassuring' as const,
      icon: '👋',
    },
    returning: {
      primary: 'Welcome back!',
      secondary: 'We saved your progress. Ready to pick up where you left off?',
      tone: 'encouraging' as const,
      icon: '🎉',
    },
  };

  /**
   * Progress messages - Keep users motivated
   */
  static progress = {
    started: {
      primary: 'Great start!',
      secondary:
        "You're making progress. We're here to guide you every step of the way.",
      tone: 'encouraging' as const,
      icon: '✨',
    },
    halfway: {
      primary: "You're halfway there!",
      secondary: "Looking good. Just a few more steps and you'll be all set.",
      tone: 'encouraging' as const,
      icon: '🎯',
    },
    almostDone: {
      primary: 'Almost there!',
      secondary: "Just one more step. You're doing great.",
      tone: 'encouraging' as const,
      icon: '🚀',
    },
    saving: {
      primary: 'Saving your progress...',
      secondary: 'Your information is being securely saved.',
      tone: 'supportive' as const,
      icon: '💾',
    },
    saved: {
      primary: '✓ Progress saved',
      secondary: 'You can safely close this and come back anytime.',
      tone: 'reassuring' as const,
      icon: '✓',
    },
  };

  /**
   * Success messages - Celebrate achievements
   */
  static success = {
    stepCompleted: {
      primary: '✓ Step completed',
      secondary: 'Moving to the next step...',
      tone: 'celebratory' as const,
      icon: '✓',
    },
    journeyCompleted: {
      primary: '🎉 All set!',
      secondary:
        "You're now fully compliant with Michigan ESTA requirements. We'll take it from here.",
      tone: 'celebratory' as const,
      icon: '🎉',
    },
    dataVerified: {
      primary: '✓ Verified',
      secondary: "Everything looks good. You're all set.",
      tone: 'reassuring' as const,
      icon: '✓',
    },
    employeeLinked: {
      primary: '✓ Connected successfully',
      secondary:
        "You're now linked to your employer's account. Your sick time tracking is active.",
      tone: 'celebratory' as const,
      icon: '🔗',
    },
  };

  /**
   * Validation messages - Helpful, not critical
   */
  static validation = {
    required: (fieldName: string) => ({
      primary: `${fieldName} is needed`,
      secondary: "This helps us ensure you're compliant with Michigan law.",
      tone: 'supportive' as const,
      icon: 'ℹ️',
    }),
    invalid: (fieldName: string) => ({
      primary: `Let's check that ${fieldName}`,
      secondary: "The format doesn't look quite right. Can you double-check?",
      tone: 'supportive' as const,
      icon: 'ℹ️',
    }),
    outOfRange: (fieldName: string, min?: number, max?: number) => ({
      primary: `${fieldName} is outside the expected range`,
      secondary:
        max && min
          ? `Expected between ${min} and ${max}`
          : max
            ? `Maximum is ${max}`
            : min
              ? `Minimum is ${min}`
              : 'Please check the value',
      tone: 'supportive' as const,
      icon: 'ℹ️',
    }),
  };

  /**
   * Guidance messages - Context-aware help
   */
  static guidance = {
    employeeCount: {
      primary: 'Why do we ask about employee count?',
      secondary:
        'Michigan ESTA has different rules for small (<10) and large (≥10) employers. This determines your accrual caps.',
      action: 'Learn more about ESTA requirements',
      tone: 'supportive' as const,
      icon: '💡',
    },
    accrualRate: {
      primary: 'How sick time accrual works',
      secondary:
        'Under Michigan ESTA, employees earn 1 hour of sick time for every 30 hours worked.',
      action: 'See examples',
      tone: 'supportive' as const,
      icon: '💡',
    },
    documentUpload: {
      primary: 'Your documents are secure',
      secondary:
        'We use bank-level encryption to protect your files. Only authorized users can access them.',
      tone: 'reassuring' as const,
      icon: '🔒',
    },
    policySetup: {
      primary: "We'll configure the right policy for you",
      secondary:
        "Based on your company size, we'll automatically set the correct accrual caps and carryover rules.",
      tone: 'supportive' as const,
      icon: '⚙️',
    },
  };

  /**
   * Security messages - Build trust
   */
  static security = {
    encrypted: {
      primary: '🔒 Your data is encrypted',
      secondary:
        'We use the same security as banks to protect your information.',
      tone: 'reassuring' as const,
      icon: '🔒',
    },
    audited: {
      primary: '📋 Complete audit trail',
      secondary: 'Every change is logged for compliance and transparency.',
      tone: 'reassuring' as const,
      icon: '📋',
    },
    accessControlled: {
      primary: '🛡️ Access protected',
      secondary: 'Only authorized users can view this information.',
      tone: 'reassuring' as const,
      icon: '🛡️',
    },
    backupActive: {
      primary: '☁️ Automatically backed up',
      secondary: 'Your data is safely stored with redundant backups.',
      tone: 'reassuring' as const,
      icon: '☁️',
    },
  };

  /**
   * Completion messages - Leave them feeling good
   */
  static completion = {
    employerOnboarding: {
      primary: '🎉 Welcome to ESTA-Logic!',
      secondary:
        "You're all set up. Your employees can now link their accounts and track their sick time.",
      action: 'Go to dashboard',
      tone: 'celebratory' as const,
      icon: '🎉',
    },
    employeeOnboarding: {
      primary: "✓ You're connected!",
      secondary:
        'Your sick time is now being tracked automatically. You can check your balance anytime.',
      action: 'View my balance',
      tone: 'celebratory' as const,
      icon: '✓',
    },
    documentSubmitted: {
      primary: '✓ Document submitted',
      secondary:
        'Your document has been securely uploaded and will be reviewed shortly.',
      tone: 'reassuring' as const,
      icon: '✓',
    },
  };

  /**
   * Error recovery messages - Help users fix problems
   */
  static errorRecovery = {
    connectionIssue: {
      primary: 'Connection interrupted',
      secondary:
        "No worries - we saved your progress. Try again when you're back online.",
      action: 'Retry',
      tone: 'supportive' as const,
      icon: '🔄',
    },
    validationFailed: {
      primary: "Let's fix a few things",
      secondary:
        "We found some items that need your attention. No problem - we'll help you fix them.",
      action: 'Show me what needs fixing',
      tone: 'supportive' as const,
      icon: '🔧',
    },
    sessionExpired: {
      primary: 'Session expired',
      secondary:
        'For security, we logged you out. Your progress is saved - just log back in to continue.',
      action: 'Log in',
      tone: 'supportive' as const,
      icon: '🔐',
    },
    unknownError: {
      primary: 'Something unexpected happened',
      secondary:
        "Don't worry - your progress is saved. Please try again, or contact support if this continues.",
      action: 'Try again',
      tone: 'supportive' as const,
      icon: '⚠️',
    },
  };

  /**
   * Get a confidence message by context
   */
  static getMessage(context: string): ConfidenceMessage {
    // Parse context (e.g., "welcome.employer", "progress.saving")
    const parts = context.split('.');
    const category = parts[0] as keyof typeof ConfidenceMessages;
    const specific = parts[1];

    const messages = this[category] as any;
    if (!messages) {
      return this.getDefaultMessage();
    }

    const message = specific ? messages[specific] : messages;
    if (!message) {
      return this.getDefaultMessage();
    }

    return {
      type: category as MessageType,
      ...message,
    };
  }

  /**
   * Get default fallback message
   */
  static getDefaultMessage(): ConfidenceMessage {
    return {
      type: 'guidance',
      primary: "We're here to help",
      secondary: "If you have any questions, we're here to guide you.",
      tone: 'supportive',
      icon: '💬',
    };
  }

  /**
   * Format message for display
   */
  static format(message: ConfidenceMessage): string {
    let formatted = '';

    if (message.icon) {
      formatted += `${message.icon} `;
    }

    formatted += message.primary;

    if (message.secondary) {
      formatted += `\n${message.secondary}`;
    }

    if (message.action) {
      formatted += `\n[${message.action}]`;
    }

    return formatted;
  }

  /**
   * Get progress percentage message
   */
  static getProgressMessage(percentComplete: number): ConfidenceMessage {
    if (percentComplete < 25) {
      return { type: 'progress', ...this.progress.started };
    } else if (percentComplete < 75) {
      return { type: 'progress', ...this.progress.halfway };
    } else if (percentComplete < 100) {
      return { type: 'progress', ...this.progress.almostDone };
    } else {
      return { type: 'completion', ...this.completion.employerOnboarding };
    }
  }

  /**
   * Get contextual help for a field
   */
  static getFieldHelp(fieldName: string): ConfidenceMessage {
    const helpMap: Record<string, ConfidenceMessage> = {
      employeeCount: { type: 'guidance', ...this.guidance.employeeCount },
      accrualRate: { type: 'guidance', ...this.guidance.accrualRate },
      documentUpload: { type: 'guidance', ...this.guidance.documentUpload },
      policySetup: { type: 'guidance', ...this.guidance.policySetup },
    };

    return helpMap[fieldName] || this.getDefaultMessage();
  }
}

/**
 * Example usage:
 *
 * ```typescript
 * // Get a welcome message
 * const welcomeMsg = ConfidenceMessages.getMessage('welcome.employer');
 * console.log(ConfidenceMessages.format(welcomeMsg));
 *
 * // Get progress-based message
 * const progressMsg = ConfidenceMessages.getProgressMessage(65);
 * console.log(progressMsg.primary); // "You're halfway there!"
 *
 * // Get field-specific help
 * const fieldHelp = ConfidenceMessages.getFieldHelp('employeeCount');
 * console.log(fieldHelp.secondary); // Explains why we need employee count
 *
 * // Validation message
 * const validationMsg = ConfidenceMessages.validation.required('Company Name');
 * console.log(validationMsg.primary); // "Company Name is needed"
 * ```
 */
