import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';

type PreviewAudience = 'employer' | 'employee';
type JourneyStage = 'explore' | 'organize' | 'review';
type IconName = 'spark' | 'arrow' | 'chart' | 'shield' | 'activity' | 'clock' | 'users' | 'check' | 'layers';

const iconPaths: Record<IconName, string> = {
  spark: 'M12 3l1.9 5.7L20 11l-6.1 2.3L12 19l-1.9-5.7L4 11l6.1-2.3L12 3zM19 18v4m-2-2h4',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  chart: 'M4 19h16M7 15v-5m5 5V5m5 10V9',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zm-4-10 3 3 5-6',
  activity: 'M3 12h4l3-7 4 14 3-7h4',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  check: 'M5 12l4 4L19 6',
  layers: 'M12 2 2 7l10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5',
};

function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={iconPaths[name]} />
    </svg>
  );
}

const stages: Record<JourneyStage, { number: string; name: string; headline: string; description: string; note: string; icon: IconName }> = {
  explore: {
    number: '01',
    name: 'Explore',
    headline: 'Understand the rules before entering a record.',
    description: 'Open the public Calculation Lab and change employer size, hours, carryover, frontloading, and other assumptions. See the example results respond instantly.',
    note: 'Available now · No account or employee information required',
    icon: 'spark',
  },
  organize: {
    number: '02',
    name: 'Organize',
    headline: 'Bring your people and balances into one place.',
    description: 'The employer and employee workspaces are being connected to persistent, authorized records, including hours, earned time, and leave history.',
    note: 'In development · Authenticated workflows are being hardened',
    icon: 'layers',
  },
  review: {
    number: '03',
    name: 'Review',
    headline: 'Make decisions with context, not guesswork.',
    description: 'The planned record history and request review experience will make it easier to understand how a balance was calculated and who approved a change.',
    note: 'In development · Employment decisions remain human-controlled',
    icon: 'check',
  },
};

const foundations: { name: string; description: string; icon: IconName }[] = [
  {
    name: 'Transparent ESTA calculations',
    description: 'Change inputs in a public lab and inspect the assumptions behind the result.',
    icon: 'chart',
  },
  {
    name: 'Code-enforced access controls',
    description: 'Firebase authentication, Firestore rules, and role-aware routes are represented in the codebase; security testing is ongoing.',
    icon: 'shield',
  },
  {
    name: 'Deterministic calculation engine',
    description: 'A testable TypeScript calculation engine is the foundation for consistent results.',
    icon: 'activity',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [audience, setAudience] = useState<PreviewAudience>('employer');
  const [hoursWorked, setHoursWorked] = useState(120);
  const [stage, setStage] = useState<JourneyStage>('explore');
  const exampleAccrual = hoursWorked / 30;
  const currentStage = stages[stage];

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="fixed inset-x-0 top-0 z-50">
        <Navigation />
      </div>

      <main>
        <section className="relative isolate overflow-hidden bg-[#071a3f] px-4 pb-20 pt-32 text-white sm:px-6 lg:px-8 lg:pb-28 lg:pt-36">
          <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-6 h-[540px] w-[540px] rounded-full bg-blue-500/25 blur-[100px]" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-64 -left-24 h-[460px] w-[460px] rounded-full bg-cyan-400/15 blur-[110px]" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#ffffff22 1px, transparent 1px), linear-gradient(90deg, #ffffff22 1px, transparent 1px)', backgroundSize: '56px 56px' }} />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] xl:gap-16">
            <div className="max-w-2xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-sky-100 shadow-sm backdrop-blur">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-cyan-300" />
                Michigan ESTA tools under active development
              </div>
              <h1 className="text-4xl font-extrabold leading-[1.09] tracking-tight sm:text-5xl xl:text-6xl">
                Earned sick time,
                <span className="mt-2 block bg-gradient-to-r from-sky-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                  finally easier to understand.
                </span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
                A more connected way to explore Michigan&apos;s earned sick time rules. Try real calculation scenarios today while we finish the account and record-keeping experience.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button type="button" onClick={() => navigate('/interactive-world')} className="btn btn-primary" data-testid="hero-esta-academy">Explore ESTA Academy</button>
                <button type="button" onClick={() => navigate('/learn')} className="btn btn-primary">Learn ESTA & set up records</button>
                <button type="button" onClick={() => navigate('/guided-flow')} data-testid="hero-calculation-lab" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-[#103c91] shadow-xl shadow-blue-950/25 transition hover:-translate-y-0.5 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300">
                  Open Calculation Lab <Icon name="arrow" className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => navigate('/pricing')} data-testid="hero-pilot-status" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300">
                  See Pilot Status
                </button>
                <button type="button" onClick={() => navigate('/workspace-demo')} data-testid="hero-workspace-demo" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-sky-300/50 bg-sky-400/15 px-6 py-3 font-semibold text-white transition hover:bg-sky-400/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300">
                  Explore Workspace Demo
                </button>
              </div>
              <div className="mt-6 flex items-start gap-2 text-sm text-blue-100/85">
                <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>The public calculation lab does not save personal or employee information.</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-2xl">
              <div aria-hidden="true" className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-cyan-300/25 to-violet-400/25 blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.5rem] border border-white/20 bg-white text-slate-900 shadow-2xl shadow-black/30">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    <span className="ml-2 text-xs font-semibold text-slate-500 sm:text-sm">ESTA workspace</span>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700 sm:text-xs">Interactive preview</span>
                </div>

                <div className="grid sm:grid-cols-[148px_1fr]">
                  <div className="hidden border-r border-slate-100 bg-[#f7f9fd] p-4 sm:block">
                    <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-3 text-sm font-bold text-blue-700"><Icon name="chart" className="h-4 w-4" /> Overview</div>
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400"><Icon name="users" className="h-4 w-4" /> People</div>
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400"><Icon name="clock" className="h-4 w-4" /> Requests</div>
                    <div className="mt-28 rounded-xl border border-blue-100 bg-white p-3 text-xs leading-relaxed text-slate-500">
                      <Icon name="spark" className="mb-2 h-5 w-5 text-blue-600" />
                      A preview of the planned connected workspace.
                    </div>
                  </div>

                  <div className="min-w-0 p-4 sm:p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Workspace concept</p>
                        <h2 className="mt-1 text-xl font-bold text-slate-900">{audience === 'employer' ? 'Employer overview' : 'Employee overview'}</h2>
                      </div>
                      <div className="flex -space-x-2" aria-hidden="true">
                        <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-blue-200 text-xs font-bold text-blue-900">E</span>
                        <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-violet-200 text-xs font-bold text-violet-900">T</span>
                      </div>
                    </div>

                    <div role="group" aria-label="Preview perspective" className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                      <button type="button" aria-pressed={audience === 'employer'} onClick={() => setAudience('employer')} className={audience === 'employer' ? 'rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm' : 'rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900'}>
                        Employer view
                      </button>
                      <button type="button" aria-pressed={audience === 'employee'} onClick={() => setAudience('employee')} className={audience === 'employee' ? 'rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm' : 'rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900'}>
                        Employee view
                      </button>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-[#1e63ff] to-[#2448c4] p-5 text-white shadow-lg shadow-blue-500/20">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">{audience === 'employer' ? 'Example employee accrual' : 'Your sample earned time'}</p>
                        <Icon name="activity" className="h-5 w-5 text-blue-100" />
                      </div>
                      <div className="mt-3 flex items-end gap-2">
                        <output aria-live="polite" className="text-4xl font-extrabold tabular-nums">{exampleAccrual.toFixed(0)}</output>
                        <span className="pb-1 text-sm text-blue-100">hours accrued</span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
                        <div className="h-full rounded-full bg-cyan-200 transition-all duration-300" style={{ width: (hoursWorked / 240) * 100 + '%' }} />
                      </div>
                      <p className="mt-2 text-xs text-blue-100">Illustrative accrual only • 1 hour per 30 hours worked</p>
                    </div>

                    <div className="mt-5">
                      <label htmlFor="sample-hours" className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                        <span>Try changing hours worked</span>
                        <span className="rounded-lg bg-blue-50 px-3 py-1 font-bold tabular-nums text-blue-700">{hoursWorked} hrs</span>
                      </label>
                      <input id="sample-hours" type="range" min="30" max="240" step="30" value={hoursWorked} onChange={(event) => setHoursWorked(Number(event.target.value))} className="mt-3 w-full cursor-pointer accent-blue-600" />
                      <div className="mt-1 flex justify-between text-[11px] text-slate-400"><span>30 hours</span><span>240 hours</span></div>
                    </div>

                    <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><Icon name="check" className="h-5 w-5" /></span>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{audience === 'employer' ? 'See the calculation change' : 'Understand where hours come from'}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">A preview, not a live record. Open the full lab for use limits, carryover, and waiting-period scenarios.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-blue-100/80">Interactive sample · No account connection or personal data</p>
            </div>
          </div>
        </section>

        <section className="relative -mt-9 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xl shadow-slate-900/5 sm:grid-cols-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 rounded-xl p-3 sm:border-r sm:border-slate-100 dark:sm:border-slate-800">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon name="chart" /></span>
              <div><p className="font-bold text-slate-900 dark:text-white">Explore calculations</p><p className="text-sm text-slate-500 dark:text-slate-300">Try scenarios without signing in</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-xl p-3 sm:border-r sm:border-slate-100 dark:sm:border-slate-800">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600"><Icon name="users" /></span>
              <div><p className="font-bold text-slate-900 dark:text-white">Designed for both sides</p><p className="text-sm text-slate-500 dark:text-slate-300">Employers and employees</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-xl p-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-600"><Icon name="activity" /></span>
              <div><p className="font-bold text-slate-900 dark:text-white">Built around clear records</p><p className="text-sm text-slate-500 dark:text-slate-300">Persistent workflows in progress</p></div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">See how it comes together</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">A workspace you can interact with, not just read about.</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">Explore the experience we are building. Each stage clearly shows what works today and what still needs development.</p>
            </div>

            <div className="mt-9 grid gap-6 lg:grid-cols-[320px_1fr]">
              <div role="group" aria-label="Explore workflow stages" className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {(Object.keys(stages) as JourneyStage[]).map((key) => (
                  <button type="button" key={key} aria-pressed={stage === key} onClick={() => setStage(key)} className={stage === key ? 'group flex items-center gap-4 rounded-2xl border border-blue-300 bg-white p-4 text-left shadow-lg shadow-blue-100 ring-1 ring-blue-100 transition dark:border-blue-500 dark:bg-slate-900 dark:shadow-none' : 'group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/65 p-4 text-left transition hover:border-blue-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/50'}>
                    <span className={stage === key ? 'grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white' : 'grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-bold text-slate-500 dark:bg-slate-800'}>{stages[key].number}</span>
                    <span><span className="block font-bold text-slate-900 dark:text-white">{stages[key].name}</span><span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{key === 'explore' ? 'Try it now' : 'Coming together'}</span></span>
                    <Icon name="arrow" className="ml-auto hidden h-5 w-5 text-blue-600 sm:block" />
                  </button>
                ))}
              </div>
              <div className="relative min-h-[320px] overflow-hidden rounded-3xl bg-[#102957] p-7 text-white shadow-xl shadow-blue-950/10 sm:p-10">
                <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
                <div className="relative">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/10 text-sky-200"><Icon name={currentStage.icon} className="h-6 w-6" /></span>
                  <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-sky-300">Step {currentStage.number} / {currentStage.name}</p>
                  <h3 className="mt-3 max-w-xl text-2xl font-bold leading-tight sm:text-3xl">{currentStage.headline}</h3>
                  <p className="mt-4 max-w-xl leading-relaxed text-blue-100">{currentStage.description}</p>
                  <div className="mt-7 inline-flex max-w-full items-start gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-sky-100"><Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0" />{currentStage.note}</div>
                  {stage === 'explore' && (
                    <button type="button" onClick={() => navigate('/guided-flow')} className="mt-6 flex items-center gap-2 font-bold text-white underline decoration-sky-300 underline-offset-4 hover:text-sky-200">Try the public Calculation Lab <Icon name="arrow" /></button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 dark:bg-slate-900">
          <div className="mx-auto max-w-6xl">
            <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Real foundations</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">What powers ESTA Tracker</h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-300">No unsupported certifications or promises—just the capabilities and components we can identify in the current code.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {foundations.map((foundation) => (
                <article key={foundation.name} className="group rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-900/40 dark:text-blue-200"><Icon name={foundation.icon} className="h-6 w-6" /></span>
                  <h3 className="mt-6 text-lg font-bold">{foundation.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{foundation.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-7 sm:p-9 dark:border-emerald-900 dark:bg-emerald-950/20">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm"><Icon name="shield" /></span>
              <h2 className="mt-5 text-xl font-bold">Security implemented within the application</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">Firebase email/password authentication, role-aware routes, Firestore access rules, and selected audit records are represented in the application. Security and tenant-isolation testing remain active work.</p>
            </article>
            <article className="rounded-3xl border border-amber-100 bg-amber-50/80 p-7 sm:p-9 dark:border-amber-900 dark:bg-amber-950/20">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-amber-700 shadow-sm"><Icon name="check" /></span>
              <h2 className="mt-5 text-xl font-bold">Claims intentionally limited</h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">The application is a software aid, not legal advice. We do not certify legal outcomes, claim external security audits, or represent the product as production-ready. Employers remain responsible for their policies and decisions.</p>
            </article>
          </div>
        </section>

        <section className="bg-[#092b67] px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Start with something real</p>
              <h2 className="mt-2 text-3xl font-extrabold">Explore the calculations yourself.</h2>
              <p className="mt-3 text-blue-100">See how example assumptions affect earned time and potential availability—no sign-in required.</p>
            </div>
            <button type="button" onClick={() => navigate('/guided-flow')} data-testid="cta-calculation-lab" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-blue-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300">
              Launch Calculation Lab <Icon name="arrow" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
