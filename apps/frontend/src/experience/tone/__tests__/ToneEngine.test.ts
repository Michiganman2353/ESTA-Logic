/**
 * Tests for ToneEngine
 */

import { describe, it, expect } from 'vitest';
import { ToneEngine } from '../ToneEngine';

describe('ToneEngine', () => {
  const testMessage = 'This is a test message.';

  it('should apply friendly tone', () => {
    const result = ToneEngine.friendly(testMessage);
    expect(result).toContain("Let's make this easy");
    expect(result).toContain(testMessage);
  });

  it('should apply reassuring tone', () => {
    const result = ToneEngine.reassuring(testMessage);
    expect(result).toContain("You're doing great");
    expect(result).toContain(testMessage);
  });

  it('should apply authoritative tone', () => {
    const result = ToneEngine.authoritative(testMessage);
    expect(result).toContain('Required by compliance');
    expect(result).toContain(testMessage);
  });

  it('should apply encouraging tone', () => {
    const result = ToneEngine.encouraging(testMessage);
    expect(result).toContain('Great progress');
    expect(result).toContain(testMessage);
  });

  it('should apply professional tone', () => {
    const result = ToneEngine.professional(testMessage);
    expect(result).toContain('For your business');
    expect(result).toContain(testMessage);
  });

  it('should transform message with specified tone', () => {
    const friendlyResult = ToneEngine.transform(testMessage, 'friendly');
    const reassuringResult = ToneEngine.transform(testMessage, 'reassuring');

    expect(friendlyResult).toContain("Let's make this easy");
    expect(reassuringResult).toContain("You're doing great");
  });

  it('should return original message for unknown tone', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = ToneEngine.transform(testMessage, 'unknown' as any);
    expect(result).toBe(testMessage);
  });
});
