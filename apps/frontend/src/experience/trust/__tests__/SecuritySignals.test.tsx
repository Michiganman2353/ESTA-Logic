/**
 * Tests for SecuritySignals component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SecuritySignals from '../SecuritySignals';

describe('SecuritySignals', () => {
  it('should render security indicators', () => {
    render(<SecuritySignals />);

    expect(screen.getByText(/Secure Encryption Active/i)).toBeInTheDocument();
    expect(screen.getByText(/Policy Verified/i)).toBeInTheDocument();
    expect(screen.getByText(/Audit Supported/i)).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<SecuritySignals />);

    const panel = screen.getByRole('status');
    expect(panel).toHaveAttribute(
      'aria-label',
      'Security and compliance indicators'
    );
  });

  it('should apply custom className', () => {
    render(<SecuritySignals className="custom-class" />);

    const panel = screen.getByRole('status');
    expect(panel).toHaveClass('custom-class');
  });

  it('should have trust-panel class', () => {
    render(<SecuritySignals />);

    const panel = screen.getByRole('status');
    expect(panel).toHaveClass('trust-panel');
  });
});
