/**
 * Tests for ComplianceConfidenceDashboard component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComplianceConfidenceDashboard from '../ComplianceConfidenceDashboard';

describe('ComplianceConfidenceDashboard', () => {
  it('should render dashboard title', () => {
    render(<ComplianceConfidenceDashboard />);

    expect(screen.getByText('Compliance Confidence')).toBeInTheDocument();
  });

  it('should render with default score', () => {
    render(<ComplianceConfidenceDashboard />);

    expect(screen.getByText('92')).toBeInTheDocument();
  });

  it('should render with custom score', () => {
    render(<ComplianceConfidenceDashboard score={85} />);

    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('should render ComplianceScore component', () => {
    render(<ComplianceConfidenceDashboard />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render RiskHeatMap', () => {
    render(<ComplianceConfidenceDashboard />);

    expect(screen.getByText('Compliance Risk Overview')).toBeInTheDocument();
  });

  it('should render ReadinessTimeline', () => {
    render(<ComplianceConfidenceDashboard />);

    expect(
      screen.getByText('Compliance Readiness Timeline')
    ).toBeInTheDocument();
  });

  it('should render next steps section', () => {
    render(<ComplianceConfidenceDashboard />);

    expect(screen.getByText('Recommended Next Steps')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<ComplianceConfidenceDashboard />);

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute(
      'aria-label',
      'Compliance confidence dashboard'
    );
  });

  it('should apply custom className', () => {
    render(<ComplianceConfidenceDashboard className="custom-class" />);

    const main = screen.getByRole('main');
    expect(main).toHaveClass('custom-class');
  });
});
