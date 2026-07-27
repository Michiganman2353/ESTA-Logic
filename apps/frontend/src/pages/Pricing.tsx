import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/DesignSystem/Button';

const verifiedCapabilities = [
  'Public Michigan ESTA calculation lab with no account required',
  'Deterministic accrual and scenario calculations in the shared TypeScript engine',
  'Firebase Authentication and Firestore-backed application structure',
  'Role-aware routes and selected audit records',
  'CSV and employee workflow components that remain under active hardening',
];

const workInProgress = [
  'Authoritative employee balance ledger and benefit-year processing',
  'Employer and employee dashboards connected to persisted records',
  'Employee registration, employer-code lookup, and tenant-isolation validation',
  'Billing, cancellation, account closure, and export lifecycle',
  'External legal, accessibility, security, and operational review',
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white shadow dark:bg-gray-800">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            ESTA Logic
          </h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/guided-flow')}>
              Open Calculation Lab
            </Button>
            <Button variant="primary" onClick={() => navigate('/register')}>
              Test Registration
            </Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
            Pilot status
          </p>
          <h2 className="mb-5 text-4xl font-bold text-gray-900 dark:text-white">
            Commercial pricing is not published yet
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-gray-300">
            ESTA Logic is being hardened as a Michigan earned sick time calculation,
            record-keeping, and employee-access application. Subscription billing,
            paid trials, support commitments, and enterprise integrations are not
            represented as available until those workflows are implemented and
            verified.
          </p>
        </section>

        <section className="mb-10 grid gap-8 md:grid-cols-2">
          <article className="rounded-xl bg-white p-7 shadow dark:bg-gray-800">
            <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Verifiable today
            </h3>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              {verifiedCapabilities.map((capability) => (
                <li key={capability} className="flex gap-3">
                  <span aria-hidden="true">✓</span>
                  <span>{capability}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl bg-white p-7 shadow dark:bg-gray-800">
            <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Being completed
            </h3>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              {workInProgress.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden="true">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="rounded-xl border border-amber-200 bg-amber-50 p-7 dark:border-amber-800 dark:bg-amber-950/30">
          <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
            Product boundary
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            The application assists with calculations, records, and administrative
            workflows. It does not replace legal advice, determine employee
            eligibility without employer review, or certify that an organization has
            satisfied every legal obligation.
          </p>
        </section>

        <section className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Button variant="primary" onClick={() => navigate('/guided-flow')}>
            Try the Calculation Lab
          </Button>
          <Button variant="secondary" onClick={() => navigate('/')}>
            Return Home
          </Button>
        </section>
      </main>
    </div>
  );
}
