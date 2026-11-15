import { Link } from 'react-router-dom';
import type { User } from '@/types';

interface RegisterManagerProps {
  onRegister?: (user: User) => void;
}

/**
 * Safe public gate for manager enrollment.
 *
 * The former wizard posted credentials to an unverified legacy backend API.
 * The deployed Vercel app does not currently serve that registration endpoint,
 * and the historical backend handler issues mock credentials. Do not restore
 * this form until server-authoritative tenant onboarding, authorization and
 * end-to-end integration tests are complete.
 *
 * This component never collects credentials or creates an account.
 */
export default function RegisterManager(_props: RegisterManagerProps) {
  return (
    <main className="gradient-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="animate-float absolute -left-20 top-8 h-80 w-80 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="animate-float absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="glass-card relative z-10 w-full max-w-xl space-y-7 rounded-3xl p-7 shadow-2xl sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          Employer enrollment is not available yet
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Your account deserves a secure start.
          </h1>
          <p className="text-base leading-relaxed text-slate-200">
            We are completing secure employer onboarding and account verification.
            Live manager registration is paused while those safeguards are tested.
          </p>
        </div>

        <div role="status" className="rounded-2xl border border-sky-400/25 bg-sky-400/10 p-5 text-sm leading-relaxed text-slate-100">
          <strong className="block text-base">About your registration attempt</strong>
          <p className="mt-2">
            The previous registration screen could display an error because its
            backend connection was incomplete. We cannot confirm that an account
            was created from that attempt. Please do not retry with a new password
            until enrollment is available.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/workspace-demo"
            className="btn btn-primary inline-flex min-h-12 flex-1 items-center justify-center text-center"
            data-testid="manager-demo-link"
          >
            Explore the Interactive Demo
          </Link>
          <Link
            to="/"
            className="btn btn-secondary inline-flex min-h-12 items-center justify-center text-center"
          >
            Back to Home
          </Link>
        </div>
        <p className="text-xs leading-relaxed text-slate-400">
          The demo uses fictional employee records. It does not register a user,
          store sick-time data, or change employer accounts.
        </p>
      </div>
    </main>
  );
}
