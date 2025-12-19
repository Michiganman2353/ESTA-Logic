/**
 * ComplianceDashboard - Main compliance health and status view
 * 
 * Purpose: Provide calm, clear overview of compliance status
 * Tone: Reassuring, informative, action-oriented when needed
 */

import React, { useState, useEffect } from 'react';
import { TrustBadgeGroup } from '../../ui/components/TrustBadge';

export interface ComplianceStatus {
  isCompliant: boolean;
  lastChecked: Date;
  nextAction?: {
    title: string;
    description: string;
    dueDate?: Date;
  };
  metrics: {
    employeesTracked: number;
    documentsSecured: number;
    recordsMaintained: number;
  };
}

export interface ComplianceDashboardProps {
  /** User ID */
  userId: string;
  
  /** User role */
  role: 'employer' | 'employee' | 'admin';
  
  /** Compliance status data */
  status?: ComplianceStatus;
}

/**
 * Compliance Dashboard Component
 * 
 * Implements the main compliance view:
 * - Clear compliance health indicator
 * - Next action (if any)
 * - Key metrics
 * - Trust indicators
 * - Quick actions
 */
export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
  userId,
  role,
  status
}) => {
  const [isLoading, setIsLoading] = useState(!status);
  const [complianceData, setComplianceData] = useState<ComplianceStatus | null>(
    status || null
  );

  useEffect(() => {
    // Load compliance status if not provided
    if (!status) {
      loadComplianceStatus();
    }
  }, [status]);

  const loadComplianceStatus = async () => {
    // Simulate API call
    setTimeout(() => {
      setComplianceData({
        isCompliant: true,
        lastChecked: new Date(),
        metrics: {
          employeesTracked: 12,
          documentsSecured: 24,
          recordsMaintained: 156
        }
      });
      setIsLoading(false);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="compliance-dashboard loading">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading your compliance status...</p>
        </div>
      </div>
    );
  }

  if (!complianceData) {
    return (
      <div className="compliance-dashboard error">
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <h2>Unable to load compliance status</h2>
          <p>Please try refreshing the page.</p>
          <button className="btn-primary" onClick={loadComplianceStatus}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="compliance-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1 className="dashboard-title">Compliance Dashboard</h1>
        <p className="dashboard-subtitle">
          Last updated: {complianceData.lastChecked.toLocaleString()}
        </p>
      </header>

      {/* Compliance Health Card */}
      <div className="compliance-health-card">
        <div className={`health-status ${complianceData.isCompliant ? 'compliant' : 'needs-attention'}`}>
          <div className="status-icon">
            {complianceData.isCompliant ? '✓' : '⚠️'}
          </div>
          <div className="status-content">
            <h2 className="status-title">
              {complianceData.isCompliant ? 'Compliance Health: COMPLIANT' : 'Action Needed'}
            </h2>
            <p className="status-description">
              {complianceData.isCompliant
                ? 'Everything required is currently handled. You\'re meeting all Michigan ESTA requirements.'
                : 'We noticed a few items that need your attention to maintain compliance.'}
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="health-trust-indicators">
          <TrustBadgeGroup
            badges={['encrypted', 'audited', 'compliant']}
            variant="compact"
            size="small"
          />
        </div>
      </div>

      {/* Next Action (if applicable) */}
      {complianceData.nextAction && (
        <div className="next-action-card">
          <div className="action-header">
            <h3 className="action-title">Next Action</h3>
            {complianceData.nextAction.dueDate && (
              <span className="action-due-date">
                Due: {complianceData.nextAction.dueDate.toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="action-content">
            <h4 className="action-item-title">
              {complianceData.nextAction.title}
            </h4>
            <p className="action-description">
              {complianceData.nextAction.description}
            </p>
            <button className="btn-primary">
              Complete This Action →
            </button>
          </div>
        </div>
      )}

      {/* No Action Needed State */}
      {!complianceData.nextAction && complianceData.isCompliant && (
        <div className="no-action-card">
          <div className="no-action-icon">✔</div>
          <div className="no-action-content">
            <h3 className="no-action-title">All caught up!</h3>
            <p className="no-action-description">
              No action required right now. We'll notify you if anything needs attention.
            </p>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="metrics-section">
        <h3 className="section-title">Overview</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">👥</div>
            <div className="metric-content">
              <div className="metric-value">
                {complianceData.metrics.employeesTracked}
              </div>
              <div className="metric-label">Employees Tracked</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📄</div>
            <div className="metric-content">
              <div className="metric-value">
                {complianceData.metrics.documentsSecured}
              </div>
              <div className="metric-label">Documents Secured</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📋</div>
            <div className="metric-content">
              <div className="metric-value">
                {complianceData.metrics.recordsMaintained}
              </div>
              <div className="metric-label">Records Maintained</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h3 className="section-title">Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-button">
            <span className="action-button-icon">📊</span>
            <span className="action-button-text">View Reports</span>
          </button>

          <button className="action-button">
            <span className="action-button-icon">👤</span>
            <span className="action-button-text">Add Employee</span>
          </button>

          <button className="action-button">
            <span className="action-button-icon">📄</span>
            <span className="action-button-text">Export Records</span>
          </button>

          <button className="action-button">
            <span className="action-button-icon">⚙️</span>
            <span className="action-button-text">Settings</span>
          </button>
        </div>
      </div>

      {/* Footer Reassurance */}
      <div className="dashboard-footer">
        <div className="footer-message">
          <span className="footer-icon">🛡️</span>
          <span className="footer-text">
            Your compliance data is automatically monitored and securely backed up.
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Example CSS (to be implemented in actual stylesheet):
 * 
 * .compliance-dashboard {
 *   max-width: 1200px;
 *   margin: 0 auto;
 *   padding: 32px 24px;
 * }
 * 
 * .dashboard-header {
 *   margin-bottom: 32px;
 * }
 * 
 * .dashboard-title {
 *   font-size: 2rem;
 *   font-weight: 600;
 *   color: #1a1a1a;
 *   margin-bottom: 8px;
 * }
 * 
 * .dashboard-subtitle {
 *   font-size: 0.875rem;
 *   color: #6a6a6a;
 * }
 * 
 * .compliance-health-card {
 *   background: white;
 *   border-radius: 12px;
 *   padding: 32px;
 *   margin-bottom: 24px;
 *   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
 * }
 * 
 * .health-status {
 *   display: flex;
 *   gap: 24px;
 *   align-items: start;
 *   padding-bottom: 24px;
 *   border-bottom: 1px solid #e5e7eb;
 *   margin-bottom: 24px;
 * }
 * 
 * .health-status.compliant .status-icon {
 *   background: #d1fae5;
 *   color: #059669;
 * }
 * 
 * .health-status.needs-attention .status-icon {
 *   background: #fee2e2;
 *   color: #dc2626;
 * }
 * 
 * .status-icon {
 *   width: 64px;
 *   height: 64px;
 *   border-radius: 12px;
 *   display: flex;
 *   align-items: center;
 *   justify-content: center;
 *   font-size: 2rem;
 *   flex-shrink: 0;
 * }
 * 
 * .status-title {
 *   font-size: 1.5rem;
 *   font-weight: 600;
 *   color: #1a1a1a;
 *   margin-bottom: 8px;
 * }
 * 
 * .status-description {
 *   font-size: 1rem;
 *   color: #4a4a4a;
 *   line-height: 1.6;
 * }
 * 
 * .next-action-card,
 * .no-action-card {
 *   background: white;
 *   border-radius: 12px;
 *   padding: 24px;
 *   margin-bottom: 24px;
 *   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
 * }
 * 
 * .no-action-card {
 *   display: flex;
 *   gap: 20px;
 *   align-items: center;
 *   background: #f0fdf4;
 * }
 * 
 * .no-action-icon {
 *   width: 48px;
 *   height: 48px;
 *   background: #059669;
 *   color: white;
 *   border-radius: 50%;
 *   display: flex;
 *   align-items: center;
 *   justify-content: center;
 *   font-size: 1.5rem;
 *   flex-shrink: 0;
 * }
 * 
 * .metrics-grid,
 * .actions-grid {
 *   display: grid;
 *   grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
 *   gap: 16px;
 * }
 * 
 * .metric-card {
 *   background: white;
 *   border-radius: 8px;
 *   padding: 20px;
 *   display: flex;
 *   gap: 16px;
 *   align-items: center;
 *   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
 * }
 * 
 * .metric-icon {
 *   font-size: 2rem;
 * }
 * 
 * .metric-value {
 *   font-size: 1.875rem;
 *   font-weight: 600;
 *   color: #1a1a1a;
 * }
 * 
 * .metric-label {
 *   font-size: 0.875rem;
 *   color: #6a6a6a;
 * }
 * 
 * .action-button {
 *   background: white;
 *   border: 1px solid #e5e7eb;
 *   border-radius: 8px;
 *   padding: 16px;
 *   display: flex;
 *   align-items: center;
 *   gap: 12px;
 *   cursor: pointer;
 *   transition: all 0.2s ease;
 * }
 * 
 * .action-button:hover {
 *   background: #f9fafb;
 *   border-color: #2563eb;
 * }
 * 
 * .action-button-icon {
 *   font-size: 1.5rem;
 * }
 * 
 * .dashboard-footer {
 *   margin-top: 48px;
 *   padding-top: 24px;
 *   border-top: 1px solid #e5e7eb;
 *   text-align: center;
 * }
 * 
 * .footer-message {
 *   display: inline-flex;
 *   align-items: center;
 *   gap: 8px;
 *   font-size: 0.875rem;
 *   color: #6a6a6a;
 * }
 */

export default ComplianceDashboard;
