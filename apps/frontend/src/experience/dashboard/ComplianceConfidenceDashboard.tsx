/**
 * Compliance Confidence Dashboard - Main dashboard view
 * Combines all compliance indicators into a comprehensive view
 */

import React from 'react';
import ComplianceScore from './components/ComplianceScore';
import RiskHeatMap from './components/RiskHeatMap';
import ReadinessTimeline from './components/ReadinessTimeline';

export interface ComplianceConfidenceDashboardProps {
  score?: number;
  className?: string;
}

export default function ComplianceConfidenceDashboard({
  score = 92,
  className = '',
}: ComplianceConfidenceDashboardProps) {
  return (
    <div
      className={`compliance-confidence-dashboard ${className}`}
      role="main"
      aria-label="Compliance confidence dashboard"
    >
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Compliance Confidence
        </h1>
        <p className="text-gray-600">
          Monitor your organization's compliance health and readiness
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Compliance Score */}
        <div className="md:col-span-2">
          <ComplianceScore score={score} />
        </div>

        {/* Risk Heat Map */}
        <div>
          <RiskHeatMap />
        </div>

        {/* Readiness Timeline */}
        <div>
          <ReadinessTimeline />
        </div>
      </div>

      {/* Next Steps Section */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-3 text-lg font-semibold text-blue-900">
          Recommended Next Steps
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="mt-0.5">•</span>
            <span>Complete tracking system configuration</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5">•</span>
            <span>Enable employee portal access</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5">•</span>
            <span>Review and update historical records</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
