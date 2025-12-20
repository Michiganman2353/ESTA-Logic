/**
 * Risk Heat Map - Visual risk distribution
 * Shows compliance risks across different categories
 */

import React from 'react';
import { RiskLevel } from '../../intelligence/RiskInterpreter';

export interface RiskCategory {
  name: string;
  level: RiskLevel;
  description: string;
}

export interface RiskHeatMapProps {
  risks?: RiskCategory[];
  className?: string;
}

const defaultRisks: RiskCategory[] = [
  { name: 'Policy Documentation', level: 'none', description: 'All policies documented' },
  { name: 'Accrual Tracking', level: 'low', description: 'Minor tracking improvements needed' },
  { name: 'Employee Access', level: 'none', description: 'Employees can access balances' },
  { name: 'Record Retention', level: 'medium', description: 'Some historical gaps' },
  { name: 'Audit Readiness', level: 'low', description: 'Mostly prepared' },
];

export default function RiskHeatMap({
  risks = defaultRisks,
  className = '',
}: RiskHeatMapProps) {
  const getRiskColor = (level: RiskLevel): string => {
    switch (level) {
      case 'critical':
        return 'bg-red-600';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-400';
      case 'low':
        return 'bg-blue-400';
      case 'none':
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getRiskTextColor = (level: RiskLevel): string => {
    switch (level) {
      case 'critical':
        return 'text-red-900';
      case 'high':
        return 'text-orange-900';
      case 'medium':
        return 'text-yellow-900';
      case 'low':
        return 'text-blue-900';
      case 'none':
        return 'text-green-900';
      default:
        return 'text-gray-900';
    }
  };

  const getRiskBgColor = (level: RiskLevel): string => {
    switch (level) {
      case 'critical':
        return 'bg-red-50';
      case 'high':
        return 'bg-orange-50';
      case 'medium':
        return 'bg-yellow-50';
      case 'low':
        return 'bg-blue-50';
      case 'none':
        return 'bg-green-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div
      className={`risk-heat-map rounded-lg border p-6 ${className}`}
      role="region"
      aria-label="Risk heat map"
    >
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Compliance Risk Overview
      </h3>

      <div className="space-y-3">
        {risks.map((risk, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 rounded-lg p-3 ${getRiskBgColor(risk.level)}`}
          >
            <div
              className={`h-3 w-3 rounded-full ${getRiskColor(risk.level)}`}
              role="img"
              aria-label={`${risk.level} risk level`}
            />
            <div className="flex-1">
              <div className={`font-medium ${getRiskTextColor(risk.level)}`}>
                {risk.name}
              </div>
              <div className="text-sm text-gray-600">{risk.description}</div>
            </div>
            <div className="text-xs font-medium uppercase text-gray-500">
              {risk.level === 'none' ? 'OK' : risk.level}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 border-t pt-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>OK</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-blue-400" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-yellow-400" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-orange-500" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-red-600" />
          <span>Critical</span>
        </div>
      </div>
    </div>
  );
}
