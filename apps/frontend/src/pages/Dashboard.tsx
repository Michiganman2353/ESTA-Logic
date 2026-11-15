import { Link } from 'react-router-dom';
import { User } from '@/types';
import { Navigation } from '@/components/Navigation';
import { Alert } from '@/components/Alert';

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
    description: 'Explore a clearly labeled sample employee dashboard. Real balances and requests are not yet connected.',
    roles: ['employee', 'admin'],
  },
  {
    path: '/employer',
    title: 'Employer Workspace',
    description: 'Explore the example employer dashboard and simulated manager decisions. No real records are modified.',
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
            Your employer and employee dashboards are interactive previews with synthetic records only. They do not display or change actual sick-time balances. Authentication and secure persistence remain under development.
          </p>
        </section>


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
            The public Calculation Lab models selected ESTA scenarios. Account dashboards currently show synthetic records only. Trusted identity, tenant isolation, authoritative calculations, retention, and durable recordkeeping require further verification before operational use.
          </p>
        </section>
      </main>
    </div>
  );
}
