/**
 * Tests for ComplianceScore component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComplianceScore from '../ComplianceScore';

describe('ComplianceScore', () => {
  it('should render with score', () => {
    render(<ComplianceScore score={92} />);

    expect(screen.getByText('92')).toBeInTheDocument();
    expect(screen.getByText('/100')).toBeInTheDocument();
  });

  it('should show Excellent label for high score', () => {
    render(<ComplianceScore score={95} />);

    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('should show Good label for good score', () => {
    render(<ComplianceScore score={80} />);

    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('should show Needs Attention label for medium score', () => {
    render(<ComplianceScore score={60} />);

    expect(screen.getByText('Needs Attention')).toBeInTheDocument();
  });

  it('should show Critical label for low score', () => {
    render(<ComplianceScore score={30} />);

    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('should have progress bar with correct width', () => {
    render(<ComplianceScore score={75} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    expect(progressBar).toHaveStyle({ width: '75%' });
  });

  it('should show details by default', () => {
    render(<ComplianceScore score={92} />);

    expect(
      screen.getByText(/Your organization is fully compliant/i)
    ).toBeInTheDocument();
  });

  it('should hide details when showDetails is false', () => {
    render(<ComplianceScore score={92} showDetails={false} />);

    expect(
      screen.queryByText(/Your organization is fully compliant/i)
    ).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<ComplianceScore score={92} className="custom-class" />);

    const container = screen.getByRole('region');
    expect(container).toHaveClass('custom-class');
  });
});
