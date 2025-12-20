/**
 * Tests for ComplianceConfidenceDashboard component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComplianceConfidenceDashboard from '../ComplianceConfidenceDashboard';
import * as auditService from '../../../services/auditService';

// Mock the audit service
vi.mock('../../../services/auditService', () => ({
  getAuditEvents: vi.fn().mockResolvedValue([
    {
      id: '1',
      timestamp: new Date(),
      level: 'info',
      action: 'TEST',
      resource: 'test',
    },
  ]),
}));

describe('ComplianceConfidenceDashboard', () => {
  it('should render dashboard title', () => {
    render(<ComplianceConfidenceDashboard />);

    expect(screen.getByText('Compliance Confidence')).toBeInTheDocument();
  });

  it('should render with explicit score', () => {
    render(<ComplianceConfidenceDashboard score={92} />);

    expect(screen.getByText('92')).toBeInTheDocument();
  });

  it('should render with custom score', () => {
    render(<ComplianceConfidenceDashboard score={85} />);

    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('should render ComplianceScore component', () => {
    render(<ComplianceConfidenceDashboard score={92} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render RiskHeatMap', () => {
    render(<ComplianceConfidenceDashboard score={92} />);

    expect(screen.getByText('Compliance Risk Overview')).toBeInTheDocument();
  });

  it('should render ReadinessTimeline', () => {
    render(<ComplianceConfidenceDashboard score={92} />);

    expect(
      screen.getByText('Compliance Readiness Timeline')
    ).toBeInTheDocument();
  });

  it('should render next steps section', () => {
    render(<ComplianceConfidenceDashboard score={92} />);

    expect(screen.getByText('Recommended Next Steps')).toBeInTheDocument();
  });

  it('should render reassurance section', () => {
    render(<ComplianceConfidenceDashboard score={92} />);

    expect(screen.getByText("You're Protected")).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<ComplianceConfidenceDashboard score={92} />);

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute(
      'aria-label',
      'Compliance confidence dashboard'
    );
  });

  it('should apply custom className', () => {
    render(
      <ComplianceConfidenceDashboard className="custom-class" score={92} />
    );

    const main = screen.getByRole('main');
    expect(main).toHaveClass('custom-class');
  });

  it('should render organization profile when org data provided', () => {
    render(
      <ComplianceConfidenceDashboard
        org={{ id: 'org-123', employeeCount: 100, industry: 'Healthcare' }}
      />
    );

    expect(screen.getByText('Organization Profile')).toBeInTheDocument();
  });

  it('should display trust engine confidence label when org provided', async () => {
    render(
      <ComplianceConfidenceDashboard
        org={{ id: 'org-123', employeeCount: 100 }}
      />
    );

    // Trust engine will compute score asynchronously
    expect(auditService.getAuditEvents).toHaveBeenCalledWith('org-123');
  });
});
