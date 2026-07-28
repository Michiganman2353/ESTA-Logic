import { Link } from 'react-router-dom';
import { User } from '@/types';
import { Navigation } from '@/components/Navigation';
import { Alert } from '@/components/Alert';
import { TrustBadgeGroup } from '@/components/Settings';

interface DashboardProps {
  user: User;
}

type UserRole = User['role'];

interface DashboardCard {
  path: string;
  title: string;
  description: string;
  roles: UserRole[];
}

const dashboardCards: DashboardCard[] = [
  {
    path: '/employee',
    title: 'Employee Workspace',
    description: 'Review balances, requests, and accrual history available to the signed-in employee.',
    roles: ['employee', 'admin'],
  },
  {
    path: '/employer',
    title: 'Employer Workspace',
    description: 'Manage employer workflows that are currently implemented and under active hardening.',
    roles: ['employer', 'admin'],
  },
  {
    path: '/audit',
    title: 'Audit Records',
    description: 'Review selected account and workflow events recorded by the application.',
    roles: ['employee', 'employer', 'admin'],
  },
  {
    path: '/settings',
    title: 'Settings',
    description: 'Manage account preferences and review the current product security boundary.',
    roles: ['employee', 'employer', 'admin'],
  },
];

export default function Dashboard({ user }: DashboardProps) {
  const visibleCards = dashboardCards.filter((card) => card.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      <Navigation user={user} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {user.role === 'employer' && user.status === 'pending' && (
          <Alert variant="warning" title="Account Pending Approval" className="mb-6">
            Some employer workflows remain unavailable until account approval is complete.
          </Alert>
        )}

        <section className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
            Authenticated workspace
          </p>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">Welcome back, {user.name}</h1>
          <p className="max-w-3xl text-gray-600 dark:text-gray-300">
            ESTA Tracker provides calculation, record, and workflow tools for Michigan earned sick time. Authenticated features remain under active hardening and should be reviewed before operational reliance.
          </p>
        </section>

        <div className="mb-8">
          <TrustBadgeGroup badges={['security', 'calculation', 'pilot']} size="sm" />
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          {visibleCards.map((card) => (
            <Link
              key={card.path}
              to={card.path}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <h2 className="mb-2 text-xl font-semibold">{card.title}</h2>
              <p className="text-gray-600 dark:text-gray-300">{card.description}</p>
            </Link>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/30">
          <h2 className="mb-2 text-lg font-semibold">Current product boundary</h2>
          <p className="text-sm text-blue-900 dark:text-blue-100">
            Firebase Authentication, Firestore rules, role-aware routes, deterministic calculations, and selected audit records are implemented. Server-authoritative identity, tenant enforcement, retention, and operational controls remain planned work.
          </p>
        </section>
      </main>
    </div>
  );
}
