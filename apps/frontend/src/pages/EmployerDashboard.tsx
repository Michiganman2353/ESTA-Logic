import { useEffect } from 'react';
import { User } from '@/types';
import { AccrualChart } from '@/components/AccrualChart';
import { InsightCard, DashboardCard } from '@/components/DashboardWidgets';
import { AccrualNotificationBanner } from '@/components/AccrualNotificationBanner';
import { useAccrualNotifications } from '@/components/AccrualNotificationBanner.utils';

interface EmployerDashboardProps {
  user: User;
}

export default function EmployerDashboard({ user }: EmployerDashboardProps) {
  // Mock data for demonstration - in real app, this would come from API
  const mockData = {
    totalEmployees: 25,
    activeRequests: 3,
    complianceScore: 98,
    totalAccrued: 1250,
    totalUsed: 320,
    totalRemaining: 930,
  };

  // Notification system for employer alerts
  const { notifications, removeNotification, addNotification } =
    useAccrualNotifications();

  // Check for employer-specific alerts on mount
  useEffect(() => {
    // Alert for pending requests
    if (mockData.activeRequests > 0) {
      addNotification({
        id: 'pending-requests',
        type: 'general',
        severity: 'info',
        title: 'Pending Requests',
        message: `You have ${mockData.activeRequests} time-off request${mockData.activeRequests !== 1 ? 's' : ''} awaiting approval.`,
        dismissible: true,
        action: {
          label: 'Review Now',
          onClick: () => {
            // Navigate to requests section
            const requestsSection = document.getElementById(
              'recent-activity-card'
            );
            requestsSection?.scrollIntoView({ behavior: 'smooth' });
          },
        },
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white shadow dark:bg-gray-800" role="banner">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Employer Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage employees and track ESTA compliance
              </p>
              {/* Hidden label for screen readers */}
              <span className="sr-only">
                Welcome {user.name}. You are managing {mockData.totalEmployees}{' '}
                employees.
              </span>
            </div>
            <nav className="mt-4 sm:mt-0" aria-label="Breadcrumb navigation">
              <a
                href="/"
                className="text-primary-600 hover:text-primary-700 focus:ring-primary-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                ← Back to Dashboard
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
        role="main"
        aria-label="Employer management dashboard"
      >
        {/* Real-time Notifications */}
        <AccrualNotificationBanner
          notifications={notifications}
          onDismiss={removeNotification}
          className="mb-6"
        />

        {/* Insights Cards */}
        <section
          className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Company statistics overview"
        >
          <InsightCard
            title="Total Employees"
            value={mockData.totalEmployees}
            subtitle="Active workforce"
            color="primary"
            ariaLabel={`Total employees: ${mockData.totalEmployees} active workers`}
            icon={
              <svg
                className="h-8 w-8"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            }
          />

          <InsightCard
            title="Pending Requests"
            value={mockData.activeRequests}
            subtitle="Awaiting approval"
            color="warning"
            ariaLabel={`Pending requests: ${mockData.activeRequests} awaiting approval`}
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
            title="Compliance Score"
            value={`${mockData.complianceScore}%`}
            subtitle="Excellent standing"
            trend="up"
            trendValue="+2%"
            color="success"
            ariaLabel={`Compliance score: ${mockData.complianceScore}% excellent standing, increased by 2%`}
            icon={
              <svg
                className="h-8 w-8"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />

          <InsightCard
            title="Hours Available"
            value={mockData.totalRemaining}
            subtitle={`${mockData.totalAccrued} total accrued`}
            color="info"
            ariaLabel={`Hours available: ${mockData.totalRemaining} hours, total accrued: ${mockData.totalAccrued} hours`}
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
        </section>

        {/* Main Grid */}
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Accrual Overview Chart */}
          <DashboardCard
            title="Company-Wide Accrual"
            subtitle="Total sick time across all employees"
            id="accrual-overview-card"
          >
            <div className="flex justify-center py-4">
              <AccrualChart
                data={{
                  accrued: mockData.totalAccrued,
                  used: mockData.totalUsed,
                  remaining: mockData.totalRemaining,
                }}
                size={240}
              />
            </div>
          </DashboardCard>

          {/* Quick Actions */}
          <DashboardCard
            title="Quick Actions"
            subtitle="Common tasks"
            id="quick-actions-card"
          >
            <div
              className="space-y-3"
              role="group"
              aria-label="Management action buttons"
            >
              <button
                className="btn btn-primary flex w-full items-center justify-center space-x-2"
                aria-label="Add a new employee"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                <span>Add Employee</span>
              </button>

              <button
                className="btn btn-secondary flex w-full items-center justify-center space-x-2"
                aria-label="Import employees from CSV file"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Import Employees (CSV)</span>
              </button>

              <button
                className="btn btn-secondary flex w-full items-center justify-center space-x-2"
                aria-label="Export compliance report"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Export Compliance Report</span>
              </button>
            </div>
          </DashboardCard>
        </div>

        {/* Recent Activity */}
        <DashboardCard
          title="Recent Activity"
          subtitle="Latest updates from your team"
          fullWidth
          id="recent-activity-card"
        >
          <div
            className="space-y-4"
            role="list"
            aria-label="Recent team activity"
          >
            <article
              className="flex items-start space-x-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50"
              role="listitem"
              aria-label="New time-off request from John Doe"
            >
              <div className="flex-shrink-0" aria-hidden="true">
                <div className="bg-primary-100 dark:bg-primary-900 flex h-10 w-10 items-center justify-center rounded-full">
                  <svg
                    className="text-primary-600 dark:text-primary-400 h-6 w-6"
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
                  New time-off request from John Doe
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Requesting 8 hours on Dec 25, 2024
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  2 hours ago
                </p>
              </div>
              <button
                className="btn btn-primary text-sm"
                aria-label="Review time-off request from John Doe"
              >
                Review
              </button>
            </article>

            <div className="py-4 text-center">
              <a
                href="/employer/activity"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 focus:ring-primary-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                View all activity →
              </a>
            </div>
          </div>
        </DashboardCard>
      </main>
    </div>
  );
}
