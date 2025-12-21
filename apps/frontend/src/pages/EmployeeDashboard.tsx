import { useEffect } from 'react';
import { User } from '@/types';
import { AccrualChart, AccrualProgressBar } from '@/components/AccrualChart';
import { InsightCard, DashboardCard } from '@/components/DashboardWidgets';
import { AccrualNotificationBanner } from '@/components/AccrualNotificationBanner';
import {
  useAccrualNotifications,
  createESTANotification,
} from '@/components/AccrualNotificationBanner.utils';
import { Navigation } from '@/components/Navigation';
import { SecurityStatusBanner } from '@/components/SecurityStatusBanner';

interface EmployeeDashboardProps {
  user: User;
}

export default function EmployeeDashboard({ user }: EmployeeDashboardProps) {
  // Mock data for demonstration - in real app, this would come from API
  const mockData = {
    accrued: 48,
    used: 8,
    remaining: 40,
    maxAccrual: 72,
    pendingRequests: 1,
    approvedRequests: 2,
    daysInWaitingPeriod: 0, // Set to >0 to show waiting period notice
  };

  // Accrual notification system
  const { notifications, removeNotification, addNotification } =
    useAccrualNotifications();

  // Check accrual status on mount and data changes
  useEffect(() => {
    // Check if nearing cap (within 90%)
    const capPercentage = (mockData.accrued / mockData.maxAccrual) * 100;
    if (capPercentage >= 90 && capPercentage < 100) {
      addNotification({
        id: 'nearing-cap',
        type: 'general',
        severity: 'warning',
        title: 'Approaching Maximum Accrual',
        message: `You have accrued ${mockData.accrued} of ${mockData.maxAccrual} hours (${capPercentage.toFixed(0)}%). Consider using some of your balance.`,
        dismissible: true,
      });
    }

    // Check if cap is reached
    if (mockData.accrued >= mockData.maxAccrual) {
      addNotification(
        createESTANotification('cap_reached', {
          maxHours: mockData.maxAccrual,
        })
      );
    }

    // Check waiting period
    if (mockData.daysInWaitingPeriod > 0) {
      addNotification(
        createESTANotification('waiting_period', {
          daysRemaining: mockData.daysInWaitingPeriod,
        })
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="gradient-bg min-h-screen">
      {/* Navigation */}
      <Navigation user={user} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="animate-fade-in-down mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="gradient-header text-3xl font-bold">
                My Sick Time
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Track your balance and request time off
              </p>
              {/* Hidden label for screen readers */}
              <span className="sr-only">
                Welcome {user.name}. You have {mockData.remaining} hours
                available.
              </span>
            </div>
            <nav className="mt-4 sm:mt-0" aria-label="Breadcrumb navigation">
              <a
                href="/"
                className="text-royal-600 hover:text-royal-700 focus:ring-royal-500 rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                ← Back to Dashboard
              </a>
            </nav>
          </div>
        </div>

        {/* Real-time Notifications */}
        <AccrualNotificationBanner
          notifications={notifications}
          onDismiss={removeNotification}
          className="animate-fade-in mb-6"
        />

        {/* Security Status Indicator */}
        <div className="animate-fade-in mb-6">
          <SecurityStatusBanner variant="compact" />
        </div>

        {/* Quick Stats */}
        <section
          className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Sick time summary statistics"
        >
          <InsightCard
            title="Available Hours"
            value={mockData.remaining}
            subtitle="Ready to use"
            color="success"
            ariaLabel={`Available hours: ${mockData.remaining} hours ready to use`}
            icon={
              <svg
                className="h-8 w-8"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />

          <InsightCard
            title="Hours Used"
            value={mockData.used}
            subtitle="This year"
            color="info"
            ariaLabel={`Hours used: ${mockData.used} hours this year`}
            icon={
              <svg
                className="h-8 w-8"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />

          <InsightCard
            title="Total Accrued"
            value={mockData.accrued}
            subtitle={`Max: ${mockData.maxAccrual} hours`}
            color="primary"
            ariaLabel={`Total accrued: ${mockData.accrued} hours out of maximum ${mockData.maxAccrual} hours`}
            icon={
              <svg
                className="h-8 w-8"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
        </section>

        {/* Main Grid - Mobile Responsive */}
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Accrual Chart - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <DashboardCard
              title="Your Sick Time Balance"
              subtitle="Current year accrual status"
              id="accrual-balance-card"
            >
              {/* Show chart on desktop, progress bar on mobile */}
              <div className="block lg:hidden">
                <AccrualProgressBar
                  data={{
                    accrued: mockData.accrued,
                    used: mockData.used,
                    remaining: mockData.remaining,
                  }}
                />
              </div>
              <div className="hidden justify-center py-4 lg:flex">
                <AccrualChart
                  data={{
                    accrued: mockData.accrued,
                    used: mockData.used,
                    remaining: mockData.remaining,
                  }}
                  size={280}
                />
              </div>

              {/* Additional Info */}
              <div
                className="bg-primary-50 dark:bg-primary-900/20 mt-6 rounded-lg p-4"
                role="complementary"
                aria-label="Michigan ESTA information"
              >
                <h4 className="text-primary-900 dark:text-primary-100 mb-2 text-sm font-semibold">
                  Michigan ESTA Info
                </h4>
                <ul
                  className="text-primary-800 dark:text-primary-200 space-y-1 text-sm"
                  aria-label="ESTA policy details"
                >
                  <li>✓ Accrual: 1 hour per 30 hours worked</li>
                  <li>✓ Maximum: 72 hours per year</li>
                  <li>✓ Carryover: Up to 72 hours to next year</li>
                  <li>✓ Protected: Anti-retaliation guaranteed</li>
                </ul>
              </div>
            </DashboardCard>
          </div>

          {/* Quick Actions - 1 column */}
          <DashboardCard
            title="Quick Actions"
            subtitle="Request time off"
            id="quick-actions-card"
          >
            <div
              className="space-y-3"
              role="group"
              aria-label="Time off action buttons"
            >
              <button
                className="btn btn-primary flex w-full items-center justify-center space-x-2"
                aria-label="Request time off"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Request Time Off</span>
              </button>

              <button
                className="btn btn-secondary flex w-full items-center justify-center space-x-2"
                aria-label="View calendar"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>View Calendar</span>
              </button>

              <button
                className="btn btn-secondary flex w-full items-center justify-center space-x-2"
                aria-label="View request history"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>View History</span>
              </button>
            </div>

            <div
              className="mt-6 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20"
              role="note"
            >
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Tip:</strong> Request time off at least 7 days in
                advance when possible.
              </p>
            </div>
          </DashboardCard>
        </div>

        {/* Request Status */}
        <DashboardCard
          title="Recent Requests"
          subtitle="Your time-off request history"
          fullWidth
          id="recent-requests-card"
        >
          <div
            className="space-y-4"
            role="list"
            aria-label="Recent time off requests"
          >
            <article
              className="flex flex-col space-y-4 rounded-lg bg-yellow-50 p-4 sm:flex-row sm:items-start sm:space-x-4 sm:space-y-0 dark:bg-yellow-900/20"
              role="listitem"
              aria-label="Pending request for December 25, 2024"
            >
              <div className="flex-shrink-0" aria-hidden="true">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <svg
                    className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  8 hours on December 25, 2024
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Status:{' '}
                  <span className="font-medium text-yellow-700 dark:text-yellow-300">
                    Pending approval
                  </span>
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Submitted 2 days ago
                </p>
              </div>
              <div className="flex-shrink-0">
                <span
                  className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  role="status"
                >
                  Pending
                </span>
              </div>
            </article>

            <article
              className="flex flex-col space-y-4 rounded-lg bg-green-50 p-4 sm:flex-row sm:items-start sm:space-x-4 sm:space-y-0 dark:bg-green-900/20"
              role="listitem"
              aria-label="Approved request for November 28, 2024"
            >
              <div className="flex-shrink-0" aria-hidden="true">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <svg
                    className="h-6 w-6 text-green-600 dark:text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  8 hours on November 28, 2024
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Status:{' '}
                  <span className="font-medium text-green-700 dark:text-green-300">
                    Approved
                  </span>
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Used 1 week ago
                </p>
              </div>
              <div className="flex-shrink-0">
                <span
                  className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
                  role="status"
                >
                  Approved
                </span>
              </div>
            </article>

            <div className="py-4 text-center">
              <a
                href="/employee/history"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 focus:ring-primary-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                View full history →
              </a>
            </div>
          </div>
        </DashboardCard>
      </main>
    </div>
  );
}
