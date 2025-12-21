/**
 * Trust Components - Unit Tests
 *
 * Tests for Security UX components that provide user reassurance
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TrustBadge,
  TrustBadgeCompact,
  SecureUploadPanel,
  UploadSuccessMessage,
  ComplianceSecurityPanel,
} from '../index';

describe('TrustBadge', () => {
  it('renders with title and description', () => {
    render(
      <TrustBadge
        title="Encrypted Upload"
        description="Your files are protected"
      />
    );

    expect(screen.getByText('Encrypted Upload')).toBeInTheDocument();
    expect(screen.getByText('Your files are protected')).toBeInTheDocument();
  });

  it('applies pulse animation when showPulse is true', () => {
    render(
      <TrustBadge
        title="Test"
        description="Test description"
        showPulse={true}
      />
    );

    const badge = screen.getByRole('status');
    expect(badge.className).toContain('trust-pulse');
  });
});

describe('TrustBadgeCompact', () => {
  it('renders compact version with label', () => {
    render(<TrustBadgeCompact label="Encrypted" />);

    expect(screen.getByText('Encrypted')).toBeInTheDocument();
  });
});

describe('SecureUploadPanel', () => {
  it('renders upload panel with security indicators', () => {
    render(<SecureUploadPanel />);

    expect(screen.getByText('Encrypted Upload')).toBeInTheDocument();
    expect(screen.getByText('Audit Trail Enabled')).toBeInTheDocument();
    expect(screen.getByText('Choose Files')).toBeInTheDocument();
  });

  it('shows custom title and description', () => {
    render(
      <SecureUploadPanel
        title="Upload Employee Documents"
        description="Select documents to upload"
      />
    );

    expect(screen.getByText('Upload Employee Documents')).toBeInTheDocument();
    expect(screen.getByText('Select documents to upload')).toBeInTheDocument();
  });
});

describe('UploadSuccessMessage', () => {
  it('renders success message with file name', () => {
    render(<UploadSuccessMessage fileName="document.pdf" />);

    expect(screen.getByText('Upload Complete')).toBeInTheDocument();
  });

  it('calls onDismiss when continue button is clicked', () => {
    const mockDismiss = vi.fn();

    render(<UploadSuccessMessage onDismiss={mockDismiss} />);

    const continueButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueButton);

    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('ComplianceSecurityPanel', () => {
  it('renders security panel with all indicators', () => {
    render(<ComplianceSecurityPanel />);

    expect(screen.getByText('Security & Compliance')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(
      screen.getByText('End-to-End Encryption Active')
    ).toBeInTheDocument();
  });
});
