import type { ReactNode } from 'react';
import { Navigation } from '@/components/Navigation';
import type { User } from '@/types';

interface WorkspaceShellProps {
  user: User;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
}

export function WorkspaceShell({ user, eyebrow, title, description, children, action }: WorkspaceShellProps) {
  return (
    <div className="min-h-screen bg-[#f4f7fc] text-slate-900">
      <Navigation user={user} />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-7 sm:px-6 lg:px-8">
        <header className="relative isolate mb-7 overflow-hidden rounded-[1.75rem] bg-[#091e47] px-6 py-8 text-white shadow-xl shadow-blue-950/10 sm:px-9 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-blue-500/30 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-28 left-1/4 h-56 w-80 rounded-full bg-sky-400/15 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-3xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-300">{eyebrow}</p>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">{description}</p>
            </div>
            {action && <div>{action}</div>}
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

export function WorkspacePanel({ title, description, children, extra }: {
  title: string;
  description?: string;
  children: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
          {description && <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>}
        </div>
        {extra}
      </div>
      {children}
    </section>
  );
}

export function DataState({ title, detail, icon = 'clock' }: {
  title: string;
  detail: string;
  icon?: 'clock' | 'list' | 'shield';
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-center">
      <div aria-hidden="true" className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
        {icon === 'clock' ? (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
        ) : icon === 'list' ? (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>
        ) : (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="M9 12l2 2 4-4" /></svg>
        )}
      </div>
      <p className="mt-3 font-bold text-slate-800">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">{detail}</p>
    </div>
  );
}

export function ConnectionNote({ message }: { message: string }) {
  return (
    <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-blue-950 sm:px-5">
      <span aria-hidden="true" className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" />
      <p>{message}</p>
    </div>
  );
}
