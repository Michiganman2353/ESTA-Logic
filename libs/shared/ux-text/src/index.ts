/**
 * UX Text and Messaging Module
 *
 * Centralized source of truth for all user-facing text, error messages,
 * trust indicators, and emotional copy throughout the ESTA Tracker application.
 *
 * This module provides:
 * - Consistent messaging across frontend, backend, and API layers
 * - Easy localization support (future enhancement)
 * - Single source of truth for UX copy
 * - Type-safe message access
 */

import messages from './messages.json';

/**
 * Message template types
 */
type MessageParams = Record<string, string | number>;

/**
 * Replace template variables in messages
 * Example: "Hello {name}" with {name: "John"} => "Hello John"
 */
function interpolate(template: string, params?: MessageParams): string {
  if (!params) return template;

  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }, template);
}

/**
 * Error Messages
 */
export const errors = {
  auth: {
    sessionExpired: () => messages.errors.auth.sessionExpired,
    loginFailed: () => messages.errors.auth.loginFailed,
    registrationFailed: () => messages.errors.auth.registrationFailed,
    invalidEmail: () => messages.errors.auth.invalidEmail,
    weakPassword: () => messages.errors.auth.weakPassword,
    emailInUse: () => messages.errors.auth.emailInUse,
    tooManyAttempts: (minutes: number) =>
      interpolate(messages.errors.auth.tooManyAttempts, {
        minutes: minutes.toString(),
      }),
    configurationError: () => messages.errors.auth.configurationError,
    productionLoginDisabled: () => messages.errors.auth.productionLoginDisabled,
    windowLocationUnavailable: () =>
      messages.errors.auth.windowLocationUnavailable,
  },
  rateLimit: {
    exceeded: () => messages.errors.rateLimit.exceeded,
    uploadExceeded: () => messages.errors.rateLimit.uploadExceeded,
  },
  server: {
    configurationError: () => messages.errors.server.configurationError,
    unknownError: () => messages.errors.server.unknownError,
    connectionError: () => messages.errors.server.connectionError,
  },
  validation: {
    requiredFieldMissing: (context: string, fields: string) =>
      interpolate(messages.errors.validation.requiredFieldMissing, {
        context,
        fields,
      }),
    invalidFormat: (field: string) =>
      interpolate(messages.errors.validation.invalidFormat, { field }),
  },
  registration: {
    failed: () => messages.errors.registration.failed,
    closedMessage: () => messages.errors.registration.closedMessage,
  },
  policy: {
    saveFailed: () => messages.errors.policy.saveFailed,
    applyFailed: () => messages.errors.policy.applyFailed,
  },
  email: {
    verificationFailed: () => messages.errors.email.verificationFailed,
    sendFailed: () => messages.errors.email.sendFailed,
  },
};

/**
 * Success Messages
 */
export const success = {
  auth: {
    registrationComplete: () => messages.success.auth.registrationComplete,
    loginSuccess: () => messages.success.auth.loginSuccess,
    emailVerified: () => messages.success.auth.emailVerified,
  },
  policy: {
    saved: () => messages.success.policy.saved,
    applied: () => messages.success.policy.applied,
  },
  upload: {
    complete: () => messages.success.upload.complete,
  },
};

/**
 * UX Copy - Trust and Emotional Messaging
 */
export const ux = {
  trust: {
    security: () => messages.ux.trust.security,
    privacy: () => messages.ux.trust.privacy,
    compliance: () => messages.ux.trust.compliance,
    support: () => messages.ux.trust.support,
    peaceOfMind: () => messages.ux.trust.peaceOfMind,
    weAreHere: () => messages.ux.trust.weAreHere,
    together: () => messages.ux.trust.together,
    confidence: () => messages.ux.trust.confidence,
    trustInUs: () => messages.ux.trust.trustInUs,
  },
  onboarding: {
    welcome: () => messages.ux.onboarding.welcome,
    stepByStep: () => messages.ux.onboarding.stepByStep,
    simple: () => messages.ux.onboarding.simple,
    easy: () => messages.ux.onboarding.easy,
    noGuesswork: () => messages.ux.onboarding.noGuesswork,
  },
  loading: {
    default: () => messages.ux.loading.default,
    checkingStatus: () => messages.ux.loading.checkingStatus,
    processing: () => messages.ux.loading.processing,
  },
  cta: {
    getStarted: () => messages.ux.cta.getStarted,
    viewPricing: () => messages.ux.cta.viewPricing,
    returnToLogin: () => messages.ux.cta.returnToLogin,
    tryAgain: () => messages.ux.cta.tryAgain,
    contactSupport: () => messages.ux.cta.contactSupport,
  },
  features: {
    noCardRequired: () => messages.ux.features.noCardRequired,
    freeTrial: () => messages.ux.features.freeTrial,
    cancelAnytime: () => messages.ux.features.cancelAnytime,
  },
};

/**
 * Validation Messages
 */
export const validation = {
  email: {
    required: () => messages.validation.email.required,
    invalid: () => messages.validation.email.invalid,
  },
  password: {
    required: () => messages.validation.password.required,
    tooShort: () => messages.validation.password.tooShort,
    confirmRequired: () => messages.validation.password.confirmRequired,
    mismatch: () => messages.validation.password.mismatch,
  },
  required: (field: string) =>
    interpolate(messages.validation.required, { field }),
  invalidRange: (field: string, min: number, max: number) =>
    interpolate(messages.validation.invalidRange, {
      field,
      min: min.toString(),
      max: max.toString(),
    }),
};

/**
 * Compliance Messages
 */
export const compliance = {
  esta: {
    title: () => messages.compliance.esta.title,
    description: () => messages.compliance.esta.description,
    smallEmployer: () => messages.compliance.esta.smallEmployer,
    largeEmployer: () => messages.compliance.esta.largeEmployer,
    accrualRate: () => messages.compliance.esta.accrualRate,
    annualGrant: () => messages.compliance.esta.annualGrant,
  },
};

/**
 * Support Messages
 */
export const support = {
  email: () => messages.support.email,
  contactMessage: () =>
    interpolate(messages.support.contactMessage, {
      email: messages.support.email,
    }),
  helpMessage: () => messages.support.helpMessage,
};

/**
 * Export raw messages for advanced use cases
 */
export { messages };
