/**
 * Structured Logger
 *
 * Provides environment-aware logging with proper levels and sanitization.
 * Replaces console.log/error/warn throughout the application.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export class Logger {
  private context: string;
  private isDevelopment: boolean;

  constructor(context: string) {
    this.context = context;
    // Check for development environment
    this.isDevelopment =
      typeof process !== 'undefined'
        ? process.env.NODE_ENV === 'development'
        : false; // Default to production mode if process is not available
  }

  /**
   * Debug-level logging (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(
        `[DEBUG] [${this.context}] ${message}`,
        context ? this.sanitize(context) : ''
      );
    }
  }

  /**
   * Info-level logging
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(
        `[INFO] [${this.context}] ${message}`,
        context ? this.sanitize(context) : ''
      );
    }
    // In production, send to logging service (e.g., Sentry, LogRocket)
    // this.sendToLoggingService('info', message, context);
  }

  /**
   * Warning-level logging
   */
  warn(message: string, context?: LogContext): void {
    console.warn(
      `[WARN] [${this.context}] ${message}`,
      context ? this.sanitize(context) : ''
    );
    // In production, send to logging service
    // this.sendToLoggingService('warn', message, context);
  }

  /**
   * Error-level logging
   */
  error(message: string, context?: LogContext): void {
    console.error(
      `[ERROR] [${this.context}] ${message}`,
      context ? this.sanitize(context) : ''
    );
    // In production, send to logging service
    // this.sendToLoggingService('error', message, context);
  }

  /**
   * Sanitize context to remove PII before logging
   */
  private sanitize(context: LogContext): LogContext {
    const sanitized: LogContext = {};

    for (const [key, value] of Object.entries(context)) {
      // Remove sensitive fields
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && this.looksLikeEmail(value)) {
        // Mask email addresses
        sanitized[key] = this.maskEmail(value);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitize(value as LogContext);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Check if field name indicates sensitive data
   */
  private isSensitiveField(key: string): boolean {
    const sensitivePatterns = [
      'password',
      'token',
      'secret',
      'apikey',
      'api_key',
      'authorization',
      'ssn',
      'creditcard',
      'credit_card',
    ];
    const lowerKey = key.toLowerCase();
    return sensitivePatterns.some((pattern) => lowerKey.includes(pattern));
  }

  /**
   * Check if string looks like an email
   */
  private looksLikeEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  /**
   * Mask email address (show first char and domain)
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return '[INVALID EMAIL]';
    return `${local[0]}***@${domain}`;
  }

  /**
   * Production logging service integration point
   */
  // private sendToLoggingService(
  //   level: LogLevel,
  //   message: string,
  //   context?: LogContext
  // ): void {
  //   // TODO: Integrate with logging service (Sentry, LogRocket, etc.)
  //   // if (!this.isDevelopment) {
  //   //   loggingService.log({ level, message, context, timestamp: new Date() });
  //   // }
  // }
}

/**
 * Create a logger instance for a specific context
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

/**
 * Default logger for quick use
 */
export const logger = new Logger('App');
