import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';

const capabilities = [
  {
    title: 'Transparent ESTA calculations',
    text: 'Explore accrual, frontloading, carryover, use limits, and waiting-period scenarios without creating an account.',
  },
  {
    title: 'Employer and employee workspaces',
    text: 'Role-specific dashboards and workflows are being connected to authenticated Firebase records.',
  },
  {
    title: 'Code-enforced access controls',
    text: 'Firebase Authentication, Firestore security rules, input validation, and role checks protect application data.',
  },
  {
    title: 'Audit-oriented records',
    text: 'The application records important account and workflow events so reporting and retention features can be built on verifiable data.',
  },
  {
    title: 'Responsive web interface',
    text: 'The application is designed for desktop, tablet, and mobile browsers with accessible navigation patterns.',
  },
  {
    title: 'Deterministic calculation engine',
    text: 'Calculation logic is isolated in a testable TypeScript engine so the same inputs produce the same outputs.',
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="fixed left-0 right-0 top-0 z-50">
        <Navigation />
      </div>

      <main>
        <section className="px-4 pb-16 pt-32 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-4xl">
              <div className="mb-5 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                Michigan ESTA tools under active development
              </div>
              <h1 className="mb-6 text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
                Understand and track Michigan earned sick time with clearer calculations
              </h1>
              <p className="mb-8 max-w-3xl text-xl leading-relaxed text-gray-600 dark:text-gray-300">
                ESTA Tracker is being built to help Michigan employers calculate earned sick time, maintain employee records, and support employer and employee workflows. The public calculation lab is available now; authenticated account workflows are still being hardened.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={() => navigate('/guided-flow')}
                  className="btn btn-primary px-8 py-4 text-lg"
                  data-testid="hero-calculation-lab"
                >
                  Open Calculation Lab
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="btn btn-secondary px-8 py-4 text-lg"
                  data-testid="hero-test-registration"
                >
                  Test Account Registration
                </button>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                The calculation lab does not save personal or employee information.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-gray-200 bg-white px-4 py-16 sm:px-6 lg:px-8 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-3xl">
              <h2 className="mb-3 text-3xl font-bold">What the code supports today</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                These statements describe application behavior we can point to in the repository. They do not claim external certifications, audits, or guarantees.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {capabilities.map((capability) => (
                <article key={capability.title} className="rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-950">
                  <h3 className="mb-3 text-xl font-semibold">{capability.title}</h3>
                  <p className="leading-relaxed text-gray-600 dark:text-gray-300">{capability.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-8 dark:border-green-900 dark:bg-green-950/30">
              <h2 className="mb-4 text-2xl font-bold">Security implemented within the application</h2>
              <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                <li>• Firebase email/password authentication</li>
                <li>• Firestore rules limiting records by authenticated identity and employer relationship</li>
                <li>• Client-side input validation and rate-limiting safeguards</li>
                <li>• Role-aware protected routes for employer and employee pages</li>
                <li>• Audit records for selected account and workflow events</li>
                <li>• Automated dependency, lint, type, and test checks in the repository</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 dark:border-amber-900 dark:bg-amber-950/30">
              <h2 className="mb-4 text-2xl font-bold">Claims intentionally limited</h2>
              <p className="mb-4 text-gray-700 dark:text-gray-200">
                We describe controls that exist in the application and avoid claiming external certifications, independently audited practices, absolute security, or guaranteed legal outcomes.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                ESTA Tracker is a software aid, not legal advice. Employers remain responsible for their policies and fact-specific compliance decisions.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-blue-800 px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="mb-2 text-3xl font-bold">Test the calculation logic directly</h2>
              <p className="max-w-2xl text-blue-100">
                Compare small-business and standard-employer scenarios before relying on account workflows.
              </p>
            </div>
            <button
              onClick={() => navigate('/guided-flow')}
              className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-800 hover:bg-blue-50"
              data-testid="cta-calculation-lab"
            >
              Launch Calculation Lab
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
