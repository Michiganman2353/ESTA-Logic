/**
 * Tone Engine - Emotional tone transformation
 * Adapts messaging tone based on user emotional state
 */

export type ToneType = 'friendly' | 'reassuring' | 'authoritative' | 'encouraging' | 'professional';

export const ToneEngine = {
  /**
   * Apply friendly, approachable tone
   */
  friendly(message: string): string {
    return `Let's make this easy. ${message}`;
  },

  /**
   * Apply reassuring, confidence-building tone
   */
  reassuring(message: string): string {
    return `You're doing great. ${message}`;
  },

  /**
   * Apply authoritative, compliance-focused tone
   */
  authoritative(message: string): string {
    return `Required by compliance: ${message}`;
  },

  /**
   * Apply encouraging, positive tone
   */
  encouraging(message: string): string {
    return `Great progress! ${message}`;
  },

  /**
   * Apply professional, business tone
   */
  professional(message: string): string {
    return `For your business: ${message}`;
  },

  /**
   * Transform message with specified tone
   */
  transform(message: string, tone: ToneType): string {
    switch (tone) {
      case 'friendly':
        return this.friendly(message);
      case 'reassuring':
        return this.reassuring(message);
      case 'authoritative':
        return this.authoritative(message);
      case 'encouraging':
        return this.encouraging(message);
      case 'professional':
        return this.professional(message);
      default:
        return message;
    }
  },
};
