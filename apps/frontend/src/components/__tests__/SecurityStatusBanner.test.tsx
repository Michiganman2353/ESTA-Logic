/**
 * SecurityStatusBanner Component Tests
 * 
 * Tests the security status banner displays correct security states
 * and provides expandable details when needed.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SecurityStatusBanner } from '../SecurityStatusBanner';
import { SecurityProvider } from '@/contexts/SecurityContext';

// Mock the SecurityContext
vi.mock('@/contexts/SecurityContext', async () => {
  const actual = await vi.importActual('@/contexts/SecurityContext');
  return {
    ...actual,
    useSecurityContext: () => ({
      securityState: {
        encryptionActive: true,
        auditLoggingActive: true,
        firebaseConnected: true,
        lastSecurityCheck: new Date('2025-01-01T12:00:00Z'),
        securityStatus: 'secure' as const,
      },
      checkSecurityStatus: vi.fn(),
      recordSecurityEvent: vi.fn(),
    }),
  };
});

describe('SecurityStatusBanner', () => {
  it('renders compact variant with security status', () => {
    render(
      <SecurityProvider>
        <SecurityStatusBanner variant="compact" />
      </SecurityProvider>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Protected & Encrypted')).toBeInTheDocument();
  });

  it('renders detailed variant with expandable information', () => {
    render(
      <SecurityProvider>
        <SecurityStatusBanner variant="detailed" showDetails={false} />
      </SecurityProvider>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Security Active')).toBeInTheDocument();
    expect(screen.getByText('Your data is protected')).toBeInTheDocument();
  });

  it('displays security features when expanded', () => {
    render(
      <SecurityProvider>
        <SecurityStatusBanner variant="detailed" showDetails={true} />
      </SecurityProvider>
    );

    expect(screen.getByText('End-to-End Encryption')).toBeInTheDocument();
    expect(screen.getByText('Audit Logging')).toBeInTheDocument();
    expect(screen.getByText('Secure Connection')).toBeInTheDocument();
  });
});
