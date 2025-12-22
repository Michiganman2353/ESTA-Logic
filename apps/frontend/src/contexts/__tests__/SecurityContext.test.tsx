/**
 * SecurityContext Tests
 *
 * Tests the security context provides correct state management
 * and updates security status appropriately.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SecurityProvider } from '../SecurityContext';
import { useSecurityContext } from '../SecurityContext.helpers';

// Test component that uses the context
function TestComponent() {
  const { securityState, checkSecurityStatus, recordSecurityEvent } =
    useSecurityContext();

  return (
    <div>
      <div data-testid="encryption-active">
        {String(securityState.encryptionActive)}
      </div>
      <div data-testid="audit-active">
        {String(securityState.auditLoggingActive)}
      </div>
      <div data-testid="security-status">{securityState.securityStatus}</div>
      <button onClick={checkSecurityStatus}>Check</button>
      <button onClick={() => recordSecurityEvent('test-event')}>Record</button>
    </div>
  );
}

describe('SecurityContext', () => {
  beforeEach(() => {
    // Mock crypto.subtle as available
    global.crypto = {
      subtle: {},
    } as unknown as Crypto;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('provides security state to children', () => {
    render(
      <SecurityProvider>
        <TestComponent />
      </SecurityProvider>
    );

    expect(screen.getByTestId('encryption-active')).toHaveTextContent('true');
    expect(screen.getByTestId('audit-active')).toHaveTextContent('true');
    expect(screen.getByTestId('security-status')).toHaveTextContent('secure');
  });

  it('initializes with secure status when crypto is available', () => {
    render(
      <SecurityProvider>
        <TestComponent />
      </SecurityProvider>
    );

    expect(screen.getByTestId('security-status')).toHaveTextContent('secure');
  });

  it('updates security status on check', async () => {
    render(
      <SecurityProvider>
        <TestComponent />
      </SecurityProvider>
    );

    const checkButton = screen.getByText('Check');
    checkButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('security-status')).toBeInTheDocument();
    });
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useSecurityContext must be used within SecurityProvider');

    consoleSpy.mockRestore();
  });
});
