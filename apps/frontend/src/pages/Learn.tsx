import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { WorkspacePanel } from '@/components/WorkspaceShell';

const steps = [
  [
    'Understand your obligations',
    'Michigan’s Earned Sick Time Act concerns earned sick time for eligible employees. Start with the current state guidance: coverage, employer size, accrual or frontloading, permitted use, notices and recordkeeping all matter.',
  ],
  [
    'Document your company policy',
    'Choose a benefit year, confirm the rules that apply to your workforce, and record how you will calculate and maintain balances. Gather your existing policy and payroll records. The Calculation Lab helps explore examples; it does not change employee balances.',
  ],
  [
    'Set up your records',
    'Create an employer account, verify your email and open your company workspace. Invite employees using the company link. Review each membership before approving it, then record an opening balance with its source.',
  ],
  [
    'Keep everyday decisions understandable',
    'Employees submit requests. Employers review them against their policy and applicable requirements. Saved approvals deduct recorded hours once; decisions and adjustments appear in history. Automatic accrual and annual policy enforcement are not part of this recorded-balance workflow.',
  ],
  [
    'Work with your bookkeeper',
    'Authorize a verified employer account for each company you want the bookkeeper to manage. Review payroll CSV imports before saving. A roster import organizes employee information; it does not create accounts, set permissions or certify sick-time calculations.',
  ],
];

export default function Learn() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navigation />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
        <header className="rounded-3xl bg-[#091e47] p-8 text-white">
          <p className="text-sm font-bold text-sky-200">Employer guide</p>
          <h1 className="mt-2 text-4xl font-bold">
            Understand ESTA. Set up a practical process.
          </h1>
          <p className="mt-4">
            Start with the rules, then bring your people, records and decisions
            into one workspace.
          </p>
        </header>
        <WorkspacePanel title="Use the current Michigan guidance">
          <p>
            Use the Michigan Department of Labor and Economic Opportunity as
            your source for current requirements, official FAQs, notices and
            updates. This guide explains how to organize your work in ESTA
            Tracker; it is not individualized legal advice.
          </p>
          <a
            className="mt-4 inline-block font-semibold text-blue-800 underline"
            href="https://www.michigan.gov/leo/bureaus-agencies/ber/wage-and-hour/paid-medical-leave-act"
            target="_blank"
            rel="noreferrer"
          >
            Read Michigan’s official Earned Sick Time Act guidance ↗
          </a>
        </WorkspacePanel>
        {steps.map(([title, description], index) => (
          <WorkspacePanel key={title} title={`${index + 1}. ${title}`}>
            <p>{description}</p>
          </WorkspacePanel>
        ))}
        <section
          className="flex flex-wrap gap-4 rounded-2xl border bg-white p-6"
          aria-label="Next steps"
        >
          <Link className="btn btn-primary" to="/register/manager">
            Set up company records
          </Link>
          <Link className="btn btn-secondary" to="/guided-flow">
            Explore calculation examples
          </Link>
          <Link className="btn btn-secondary" to="/register/employee">
            Join your employer
          </Link>
        </section>
      </main>
    </div>
  );
}
