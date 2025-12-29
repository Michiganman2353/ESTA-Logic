/**
 * Dashboard Page
 *
 * Main dashboard page for ESTA Tracker that provides navigation to
 * different sections based on user role.
 *
 * Features:
 * - Role-based navigation cards
 * - Employee dashboard link (for employees and admins)
 * - Employer dashboard link (for employers and admins)
 * - Audit trail access
 * - Settings page access
 * - Michigan ESTA compliance information
 * - Trust badge display
 * - Responsive design
 * - Dark mode support
 *
 * Uses:
 * - React Router Link for navigation
 * - TrustBadgeGroup component for security indicators
 * - User type for authentication
 */

import { User } from '@/types';
import { Link } from 'react-router-dom';
import { TrustBadgeGroup } from '@/components/Settings';
import { Navigation } from '@/components/Navigation';
import { Alert } from '@/components/Alert';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  return (
    <div className="gradient-bg min-h-screen">
      <Navigation user={user} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="px-0 sm:px-0">
          {/* Show pending status notification for managers */}
          {user.role === 'employer' && user.status === 'pending' && (
            <Alert
              variant="warning"
              title="Account Pending Approval"
              className="mb-6"
            >
              Your manager account is currently pending approval. You can
              explore the dashboard, but some features may be limited until your
              account is approved by an administrator.
            </Alert>
          )}

          <div className="animate-fade-in-up mb-8 text-center">
            <h2 className="gradient-header mb-3 text-3xl font-bold sm:text-4xl">
              Welcome back, {user.name}! 👋
            </h2>
            <p className="text-base text-gray-600 sm:text-lg dark:text-gray-400">
              Michigan Earned Sick Time Act Compliance System
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
            {(user.role === 'employee' || user.role === 'admin') && (
              <Link
                to="/employee"
                className="glass-card-hover animate-fade-in-up group p-6 sm:p-8"
                style={{ animationDelay: '0.1s' }}
              >
                <div className="flex items-start space-x-4 sm:space-x-5">
                  <div className="flex-shrink-0">
                    <div className="from-royal-100 to-royal-200 dark:from-royal-900 dark:to-royal-800 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110 sm:h-16 sm:w-16">
                      <svg
                        className="text-royal-600 dark:text-royal-400 h-7 w-7 sm:h-8 sm:w-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="group-hover:text-royal-600 dark:group-hover:text-royal-400 mb-2 text-xl font-bold text-gray-900 transition-colors sm:text-2xl dark:text-white">
                      Employee Dashboard
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-400">
                      View your sick time balance, request time off, and track
                      your accrual history
                    </p>
                  </div>
                </div>
              </Link>
            )}

            {(user.role === 'employer' || user.role === 'admin') && (
              <Link
                to="/employer"
                className="glass-card-hover animate-fade-in-up group p-6 sm:p-8"
                style={{ animationDelay: '0.2s' }}
              >
                <div className="flex items-start space-x-4 sm:space-x-5">
                  <div className="flex-shrink-0">
                    <div className="from-royal-100 to-royal-200 dark:from-royal-900 dark:to-royal-800 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110 sm:h-16 sm:w-16">
                      <svg
                        className="text-royal-600 dark:text-royal-400 h-7 w-7 sm:h-8 sm:w-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="group-hover:text-royal-600 dark:group-hover:text-royal-400 mb-2 text-xl font-bold text-gray-900 transition-colors sm:text-2xl dark:text-white">
                      Employer Dashboard
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-400">
                      Manage employees, approve requests, and maintain
                      compliance with Michigan ESTA law
                    </p>
                  </div>
                </div>
              </Link>
            )}

            <Link
              to="/audit"
              className="glass-card-hover animate-fade-in-up group p-6 sm:p-8"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="flex items-start space-x-4 sm:space-x-5">
                <div className="flex-shrink-0">
                  <div className="from-royal-100 to-royal-200 dark:from-royal-900 dark:to-royal-800 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110 sm:h-16 sm:w-16">
                    <svg
                      className="text-royal-600 dark:text-royal-400 h-7 w-7 sm:h-8 sm:w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="group-hover:text-royal-600 dark:group-hover:text-royal-400 mb-2 text-xl font-bold text-gray-900 transition-colors sm:text-2xl dark:text-white">
                    Audit Trail
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-400">
                    Complete 3-year compliance history and exportable reports
                    for state audits
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/settings"
              className="glass-card-hover animate-fade-in-up group p-6 sm:p-8"
              style={{ animationDelay: '0.4s' }}
            >
              <div className="flex items-start space-x-4 sm:space-x-5">
                <div className="flex-shrink-0">
                  <div className="from-royal-100 to-royal-200 dark:from-royal-900 dark:to-royal-800 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110 sm:h-16 sm:w-16">
                    <svg
                      className="text-royal-600 dark:text-royal-400 h-7 w-7 sm:h-8 sm:w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="group-hover:text-royal-600 dark:group-hover:text-royal-400 mb-2 text-xl font-bold text-gray-900 transition-colors sm:text-2xl dark:text-white">
                    Settings
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-400">
                    Manage account settings, security preferences, and system
                    integrations
                  </p>
                </div>
              </div>
            </Link>

            <div
              className="glass-card from-royal-50/90 dark:from-royal-900/30 animate-fade-in-up bg-gradient-to-br to-sky-50/90 p-6 sm:p-8 dark:to-sky-900/30"
              style={{ animationDelay: '0.5s' }}
            >
              <div className="flex items-start space-x-4 sm:space-x-5">
                <div className="flex-shrink-0">
                  <div className="from-royal-100 to-royal-200 dark:from-royal-900 dark:to-royal-800 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg sm:h-16 sm:w-16">
                    <svg
                      className="text-royal-600 dark:text-royal-400 h-7 w-7 sm:h-8 sm:w-8"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-royal-900 dark:text-royal-100 mb-3 text-xl font-bold sm:text-2xl">
                    Michigan ESTA Requirements
                  </h3>
                  <ul className="text-royal-800 dark:text-royal-200 space-y-2 text-sm sm:text-base">
                    <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
                      <svg
                        className="mr-2 h-5 w-5 flex-shrink-0 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-medium">
                        Small employers (&lt;10): 40 hours per year
                      </span>
                    </li>
                    <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
                      <svg
                        className="mr-2 h-5 w-5 flex-shrink-0 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-medium">
                        Large employers (10+): 1 hour per 30 worked
                      </span>
                    </li>
                    <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
                      <span className="mr-2 flex-shrink-0">✓</span>
                      <span>Year-to-year carryover</span>
                    </li>
                    <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
                      <span className="mr-2 flex-shrink-0">✓</span>
                      <span>Anti-retaliation protections</span>
                    </li>
                    <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
                      <span className="mr-2 flex-shrink-0">✓</span>
                      <span>3-year audit trail</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div
            className="animate-fade-in-up mt-8 flex justify-center"
            style={{ animationDelay: '0.6s' }}
          >
            <TrustBadgeGroup
              badges={['security', 'compliance', 'verified']}
              size="sm"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
