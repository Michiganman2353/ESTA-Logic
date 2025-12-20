/**
 * Readiness Timeline - Progress tracking for compliance readiness
 * Shows timeline of compliance milestones and upcoming deadlines
 */

import React from 'react';

export interface TimelineItem {
  title: string;
  description: string;
  status: 'complete' | 'in-progress' | 'pending' | 'overdue';
  dueDate?: Date;
}

export interface ReadinessTimelineProps {
  items?: TimelineItem[];
  className?: string;
}

const defaultItems: TimelineItem[] = [
  {
    title: 'Policy Creation',
    description: 'Create compliant sick time policy',
    status: 'complete',
  },
  {
    title: 'Employee Notification',
    description: 'Distribute policy to all employees',
    status: 'complete',
  },
  {
    title: 'Tracking System Setup',
    description: 'Configure automated tracking',
    status: 'in-progress',
  },
  {
    title: 'Employee Portal Access',
    description: 'Enable employee self-service',
    status: 'pending',
  },
  {
    title: 'Compliance Audit',
    description: 'Complete initial compliance review',
    status: 'pending',
  },
];

export default function ReadinessTimeline({
  items = defaultItems,
  className = '',
}: ReadinessTimelineProps) {
  const getStatusIcon = (status: TimelineItem['status']): string => {
    switch (status) {
      case 'complete':
        return '✓';
      case 'in-progress':
        return '⟳';
      case 'overdue':
        return '!';
      case 'pending':
        return '○';
      default:
        return '○';
    }
  };

  const getStatusColor = (status: TimelineItem['status']): string => {
    switch (status) {
      case 'complete':
        return 'bg-green-500 text-white';
      case 'in-progress':
        return 'bg-blue-500 text-white';
      case 'overdue':
        return 'bg-red-500 text-white';
      case 'pending':
        return 'bg-gray-300 text-gray-600';
      default:
        return 'bg-gray-300 text-gray-600';
    }
  };

  const getStatusLabel = (status: TimelineItem['status']): string => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'in-progress':
        return 'In Progress';
      case 'overdue':
        return 'Overdue';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  return (
    <div
      className={`readiness-timeline rounded-lg border p-6 ${className}`}
      role="region"
      aria-label="Compliance readiness timeline"
    >
      <h3 className="mb-6 text-lg font-semibold text-gray-900">
        Compliance Readiness Timeline
      </h3>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 h-full w-0.5 bg-gray-200" />

        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={index} className="relative flex gap-4">
              {/* Status icon */}
              <div
                className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${getStatusColor(item.status)}`}
                role="img"
                aria-label={getStatusLabel(item.status)}
              >
                {getStatusIcon(item.status)}
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {item.description}
                    </p>
                  </div>
                  {item.dueDate && (
                    <span className="text-xs text-gray-500">
                      {item.dueDate.toLocaleDateString()}
                    </span>
                  )}
                </div>
                <span
                  className={`mt-2 inline-block rounded px-2 py-1 text-xs font-medium ${
                    item.status === 'complete'
                      ? 'bg-green-100 text-green-800'
                      : item.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800'
                        : item.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {getStatusLabel(item.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
