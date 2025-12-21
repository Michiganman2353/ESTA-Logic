/**
 * Trust Components - Unit Tests
 *
 * Tests for Security UX components that provide user reassurance
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('renders with different icon types', () => {
    const { rerender } = render(
      <TrustBadge
        icon="shield-check"
        title="Test"
        description="Test description"
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(
      <TrustBadge icon="lock" title="Test" description="Test description" />
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
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
    expect(badge).toHaveClass('trust-pulse');
  });

  it('applies correct variant styles', () => {
    const { rerender } = render(
      <TrustBadge
        title="Test"
        description="Test description"
        variant="success"
      />
    );

    let badge = screen.getByRole('status');
    expect(badge).toHaveClass('bg-green-50');

    rerender(
      <TrustBadge title="Test" description="Test description" variant="info" />
    );

    badge = screen.getByRole('status');
    expect(badge).toHaveClass('bg-blue-50');
  });
});

describe('TrustBadgeCompact', () => {
  it('renders compact version with label', () => {
    render(<TrustBadgeCompact label="Encrypted" />);

    expect(screen.getByText('Encrypted')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<TrustBadgeCompact label="Secure Upload" />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-label', 'Security: Secure Upload');
  });
});

describe('SecureUploadPanel', () => {
  it('renders upload panel with security indicators', () => {
    render(<SecureUploadPanel />);

    expect(screen.getByText('Encrypted Upload')).toBeInTheDocument();
    expect(screen.getByText('Audit Trail Enabled')).toBeInTheDocument();
    expect(screen.getByText('Choose Files')).toBeInTheDocument();
  });

  it('calls onUpload when files are selected', async () => {
    const user = userEvent.setup();
    const mockOnUpload = vi.fn();

    render(<SecureUploadPanel onUpload={mockOnUpload} />);

    const input = screen
      .getByText('Choose Files')
      .querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    await user.upload(input, file);

    expect(mockOnUpload).toHaveBeenCalled();
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

  it('can hide security indicators', () => {
    render(<SecureUploadPanel showEncryption={false} showAuditTrail={false} />);

    expect(screen.queryByText('Encrypted Upload')).not.toBeInTheDocument();
    expect(screen.queryByText('Audit Trail Enabled')).not.toBeInTheDocument();
  });
});

describe('UploadSuccessMessage', () => {
  it('renders success message with file name', () => {
    render(<UploadSuccessMessage fileName="document.pdf" />);

    expect(screen.getByText('Upload Complete')).toBeInTheDocument();
    expect(
      screen.getByText(/document.pdf has been uploaded successfully/)
    ).toBeInTheDocument();
  });

  it('renders success message for multiple files', () => {
    render(<UploadSuccessMessage fileCount={3} />);

    expect(
      screen.getByText(/3 files have been uploaded successfully/)
    ).toBeInTheDocument();
  });

  it('shows encrypted message when encrypted is true', () => {
    render(<UploadSuccessMessage encrypted={true} />);

    expect(screen.getByText('Encrypted & Secure')).toBeInTheDocument();
  });

  it('shows regular secure message when encrypted is false', () => {
    render(<UploadSuccessMessage encrypted={false} />);

    expect(screen.getByText('Securely Stored')).toBeInTheDocument();
  });

  it('calls onDismiss when continue button is clicked', async () => {
    const user = userEvent.setup();
    const mockDismiss = vi.fn();

    render(<UploadSuccessMessage onDismiss={mockDismiss} />);

    const continueButton = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton);

    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not show dismiss button when onDismiss is not provided', () => {
    render(<UploadSuccessMessage />);

    expect(
      screen.queryByRole('button', { name: /continue/i })
    ).not.toBeInTheDocument();
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
    expect(screen.getByText('Audit Trail Recording')).toBeInTheDocument();
    expect(screen.getByText('ESTA Compliance Verified')).toBeInTheDocument();
  });

  it('can hide individual indicators', () => {
    render(
      <ComplianceSecurityPanel
        showEncryption={false}
        showAuditTrail={false}
        showCompliance={false}
      />
    );

    expect(
      screen.queryByText('End-to-End Encryption Active')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Audit Trail Recording')).not.toBeInTheDocument();
    expect(
      screen.queryByText('ESTA Compliance Verified')
    ).not.toBeInTheDocument();
  });

  it('shows protected by design message', () => {
    render(<ComplianceSecurityPanel />);

    expect(screen.getByText('Protected by Design')).toBeInTheDocument();
    expect(
      screen.getByText(/Security measures are built into every action you take/)
    ).toBeInTheDocument();
  });
});
