import { Card } from '@/components/DesignSystem/Card';

const implementedControls = [
  {
    title: 'Authentication',
    description:
      'Firebase Authentication is used for account identity. Employer and employee routes apply role-aware application checks.',
  },
  {
    title: 'Database access rules',
    description:
      'Firestore security rules restrict records using authenticated identity, role, employer, and tenant relationships. These rules remain subject to automated emulator testing and review.',
  },
  {
    title: 'Storage access rules',
    description:
      'Firebase Storage rules restrict document paths by authenticated owner, employer, role, and tenant context, with file-size and content-type checks for supported upload paths.',
  },
  {
    title: 'Transport security',
    description:
      'The deployed web application is served over HTTPS through Vercel. Browser security headers are configured in the deployment and are being introduced conservatively to avoid breaking required Firebase connections.',
  },
  {
    title: 'Audit-oriented records',
    description:
      'Selected account and workflow events are recorded with timestamps and actor information. Server-authoritative audit creation, retention enforcement, and export remain under active hardening.',
  },
  {
    title: 'Automated verification',
    description:
      'The repository runs lint, product-claims checks, frontend tests, production builds, and public Calculation Lab end-to-end tests before deployment.',
  },
];

const plannedControls = [
  'Trusted server-side registration and role assignment',
  'Unified Firebase custom claims for role and tenant identity',
  'Firebase App Check monitoring and enforcement',
  'Server-authoritative audit and balance ledgers',
  'Real server-side rate limiting for sensitive endpoints and uploads',
  'Document quarantine, malware scanning, retention, and deletion workflows',
  'Backup and restore drills, incident alerts, and independent security review',
];

export function SecuritySection() {
  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-6">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Security & Privacy
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This page describes controls visible in the current codebase and separates them from planned hardening work. It does not represent an external certification, audit result, or guarantee of absolute security.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {implementedControls.map((control) => (
            <section
              key={control.title}
              className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900"
            >
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {control.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {control.description}
              </p>
            </section>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
          Security work still being completed
        </h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          These controls are part of the security roadmap and should not be treated as deployed until implementation and verification are complete.
        </p>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          {plannedControls.map((control) => (
            <li key={control} className="flex gap-3">
              <span aria-hidden="true">→</span>
              <span>{control}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
