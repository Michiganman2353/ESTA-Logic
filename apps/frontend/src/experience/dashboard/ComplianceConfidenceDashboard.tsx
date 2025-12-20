/**
 * Compliance Confidence Dashboard - Main dashboard view
 * Combines all compliance indicators into a comprehensive view
 * Enhanced with Trust Engine and Personalization Intelligence
 */

import ComplianceScore from './components/ComplianceScore';
import RiskHeatMap from './components/RiskHeatMap';
import ReadinessTimeline from './components/ReadinessTimeline';
import { useTrustEngine } from '../trust/useTrustEngine';
import { determineOrgProfile } from '../intelligence/PersonalizationEngine';

export interface ComplianceConfidenceDashboardProps {
  score?: number;
  className?: string;
  org?: {
    id: string;
    employeeCount: number;
    industry?: string;
  };
}

export default function ComplianceConfidenceDashboard({
  score,
  className = '',
  org,
}: ComplianceConfidenceDashboardProps) {
  // Use Trust Engine if org is provided
  const { trustScore, confidenceLabel } = useTrustEngine(org?.id || '');

  // Use provided score or trust score
  const displayScore = score !== undefined ? score : trustScore;

  // Determine org profile if org data is available
  const profile = org
    ? determineOrgProfile({
        employeeCount: org.employeeCount,
        industry: org.industry,
      })
    : null;

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
          <ComplianceScore score={displayScore} />
          {org && (
            <div className="mt-2 text-sm text-gray-600">
              <strong>{confidenceLabel}</strong>
            </div>
          )}
        </div>

        {/* Organization Profile */}
        {profile && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 md:col-span-2">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Organization Profile
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                <strong>Tier:</strong> {profile.tier} —{' '}
                <strong>Risk Level:</strong> {profile.riskLevel}
              </p>
              <p className="text-sm text-gray-600">
                {profile.complianceExpectation}
              </p>
            </div>
          </div>
        )}

        {/* Risk Heat Map */}
        <div>
          <RiskHeatMap />
        </div>

        {/* Readiness Timeline */}
        <div>
          <ReadinessTimeline />
        </div>
      </div>

      {/* Reassurance Section */}
      <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6">
        <h3 className="mb-3 text-lg font-semibold text-green-900">
          You're Protected
        </h3>
        <p className="text-sm text-green-800">
          You are currently operating within compliant thresholds. ESTA-Logic
          continuously monitors rules so you stay protected.
        </p>
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
