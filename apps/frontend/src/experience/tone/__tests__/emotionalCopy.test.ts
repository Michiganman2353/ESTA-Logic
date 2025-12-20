/**
 * Tests for Emotional Copy Engine
 */

import { describe, it, expect } from 'vitest';
import {
  emotionalCopy,
  getReassurance,
  combineReassurances,
  humanizeTechnicalMessage,
  empathyError,
  celebrateSuccess,
  onboardingEncouragement,
} from '../emotionalCopy';

describe('Emotional Copy Engine', () => {
  describe('emotionalCopy', () => {
    it('should return onboarding message', () => {
      const message = emotionalCopy('onboarding');
      expect(message).toContain('right place');
      expect(message).toContain('walk you through');
    });

    it('should return risk message', () => {
      const message = emotionalCopy('risk');
      expect(message).toContain('not mean you are in trouble');
      expect(message).toContain('guide you');
    });

    it('should return success message', () => {
      const message = emotionalCopy('success');
      expect(message).toContain('covered');
      expect(message).toContain('under control');
    });

    it('should return audit message', () => {
      const message = emotionalCopy('audit');
      expect(message).toContain('transparent');
      expect(message).toContain('protects you');
    });

    it('should return error message', () => {
      const message = emotionalCopy('error');
      expect(message).toContain('went wrong');
      expect(message).toContain('data is safe');
    });

    it('should return loading message', () => {
      const message = emotionalCopy('loading');
      expect(message).toContain('working on this');
      expect(message).toContain('patience');
    });

    it('should personalize with user name', () => {
      const message = emotionalCopy('success', { userName: 'John' });
      expect(message).toContain('John');
    });

    it('should add detail when provided', () => {
      const message = emotionalCopy('success', {
        detail: 'All systems operational.',
      });
      expect(message).toContain('All systems operational');
    });
  });

  describe('getReassurance', () => {
    it('should return data protection reassurance', () => {
      const message = getReassurance('dataProtection');
      expect(message).toContain('encrypted');
      expect(message).toContain('secure');
    });

    it('should return legal compliance reassurance', () => {
      const message = getReassurance('legalCompliance');
      expect(message).toContain('legally compliant');
      expect(message).toContain('Michigan ESTA');
    });

    it('should return guidance reassurance', () => {
      const message = getReassurance('guidance');
      expect(message).toContain('guide you');
    });

    it('should return peace reassurance', () => {
      const message = getReassurance('peace');
      expect(message).toContain('focus on running your business');
    });
  });

  describe('combineReassurances', () => {
    it('should combine multiple reassurances', () => {
      const message = combineReassurances([
        'dataProtection',
        'legalCompliance',
      ]);
      expect(message).toContain('encrypted');
      expect(message).toContain('legally compliant');
    });

    it('should join with spaces', () => {
      const message = combineReassurances(['support', 'guidance']);
      expect(message.split('.').length).toBeGreaterThan(1);
    });
  });

  describe('humanizeTechnicalMessage', () => {
    it('should add a warm prefix to technical message', () => {
      const message = humanizeTechnicalMessage('Database sync complete');
      expect(message.includes('Database sync complete')).toBe(true);
      expect(
        message.startsWith('Just a heads up') ||
          message.startsWith('Here') ||
          message.startsWith('Quick update') ||
          message.startsWith('We wanted')
      ).toBe(true);
    });
  });

  describe('empathyError', () => {
    it('should create empathetic error message', () => {
      const message = empathyError('authentication');
      expect(message).toContain('encountered an issue');
      expect(message).toContain('authentication');
      expect(message).toContain('information is safe');
    });

    it('should include suggestion when provided', () => {
      const message = empathyError('network', 'Please check your connection.');
      expect(message).toContain('network');
      expect(message).toContain('check your connection');
    });
  });

  describe('celebrateSuccess', () => {
    it('should create celebratory message', () => {
      const message = celebrateSuccess('Employee added successfully!');
      expect(message).toContain('Great work');
      expect(message).toContain('Employee added successfully');
      expect(message).toContain('all set');
    });
  });

  describe('onboardingEncouragement', () => {
    it('should create welcome message for first step', () => {
      const message = onboardingEncouragement('Company Info', 5, 1);
      expect(message).toContain('Welcome');
      expect(message).toContain('Company Info');
      expect(message).toContain("won't take long");
    });

    it('should create final step message', () => {
      const message = onboardingEncouragement('Review', 5, 5);
      expect(message).toContain('Almost there');
      expect(message).toContain('Review');
    });

    it('should show progress for middle steps', () => {
      const message = onboardingEncouragement('Policy Setup', 5, 3);
      expect(message).toContain('60%');
      expect(message).toContain('Policy Setup');
      expect(message).toContain('doing great');
    });

    it('should calculate progress correctly', () => {
      const message = onboardingEncouragement('Step 2', 4, 2);
      expect(message).toContain('50%');
    });
  });
});
