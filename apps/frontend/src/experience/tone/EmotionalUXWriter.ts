/**
 * Emotional UX Writer - Context-aware comfort messaging
 * Provides psychologically supportive copy based on user context
 */

export type EmotionalContext =
  | 'legalFear'
  | 'overwhelm'
  | 'confusion'
  | 'uncertainty'
  | 'frustration'
  | 'confidence'
  | 'completion';

export interface ComfortingCopyOptions {
  context: EmotionalContext;
  personalized?: boolean;
  userName?: string;
}

/**
 * Get comforting copy for emotional context
 */
export function comfortingCopy(
  context: EmotionalContext | string
): string {
  switch (context) {
    case 'legalFear':
      return "We understand compliance can feel stressful. We exist to make it easier, safer, and fully supported.";
    
    case 'overwhelm':
      return "One screen at a time. No pressure. We'll take care of the complexity for you.";
    
    case 'confusion':
      return "It's okay to have questions. We're here to explain everything in plain English, step by step.";
    
    case 'uncertainty':
      return "You're in good hands. Thousands of businesses trust us to handle their compliance correctly.";
    
    case 'frustration':
      return "We know this can be challenging. Let us help make it simpler and remove the obstacles.";
    
    case 'confidence':
      return "You're doing exactly what you need to do. Your business is becoming more secure with every step.";
    
    case 'completion':
      return "You've successfully protected your organization. Everything is set up and ready to go.";
    
    default:
      return "We've got you covered.";
  }
}

/**
 * Get personalized comforting copy
 */
export function personalizedComfortingCopy(
  options: ComfortingCopyOptions
): string {
  const baseMessage = comfortingCopy(options.context);
  
  if (options.personalized && options.userName) {
    return `${options.userName}, ${baseMessage.charAt(0).toLowerCase()}${baseMessage.slice(1)}`;
  }
  
  return baseMessage;
}

/**
 * Get encouragement message for progress
 */
export function encouragementMessage(progressPercentage: number): string {
  if (progressPercentage < 25) {
    return "Great start! You're on your way to full compliance.";
  } else if (progressPercentage < 50) {
    return "You're making excellent progress. Keep going!";
  } else if (progressPercentage < 75) {
    return "More than halfway there! Your business is getting more protected with each step.";
  } else if (progressPercentage < 100) {
    return "Almost done! Just a few more steps to complete protection.";
  } else {
    return "Perfect! Your organization is fully protected and compliant.";
  }
}
