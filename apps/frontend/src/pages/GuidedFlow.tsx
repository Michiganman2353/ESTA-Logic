import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type AccrualMethod = 'accrual' | 'frontload';

const DAY_MS = 24 * 60 * 60 * 1000;

function numberValue(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export default function GuidedFlow() {
  const [employeeCount, setEmployeeCount] = useState('11');
  const [method, setMethod] = useState<AccrualMethod>('accrual');
  const [hoursWorked, setHoursWorked] = useState('30');
  const [existingBalance, setExistingBalance] = useState('0');
  const [carryover, setCarryover] = useState('0');
  const [usedThisYear, setUsedThisYear] = useState('0');
  const [hireDate, setHireDate] = useState('2026-01-01');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));
  const [enforceWaitingPeriod, setEnforceWaitingPeriod] = useState(true);

  const result = useMemo(() => {
    const employees = Math.max(1, Math.floor(numberValue(employeeCount)));
    const smallBusiness = employees <= 10;
    const annualUseLimit = smallBusiness ? 40 : 72;
    const carryoverLimit = smallBusiness ? 40 : 72;
    const worked = numberValue(hoursWorked);
    const priorBalance = numberValue(existingBalance);
    const priorCarryover = Math.min(numberValue(carryover), carryoverLimit);
    const used = numberValue(usedThisYear);

    const newlyEarned = method === 'accrual' ? worked / 30 : annualUseLimit;
    const bankBeforeUse = priorBalance + priorCarryover + newlyEarned;
    const bankAfterUse = Math.max(0, bankBeforeUse - used);
    const annualUseRemaining = Math.max(0, annualUseLimit - used);

    const hire = new Date(`${hireDate}T00:00:00`);
    const asOf = new Date(`${asOfDate}T00:00:00`);
    const daysEmployed =
      Number.isNaN(hire.getTime()) || Number.isNaN(asOf.getTime())
        ? 0
        : Math.max(0, Math.floor((asOf.getTime() - hire.getTime()) / DAY_MS));
    const waitingPeriodApplies = method === 'accrual' && enforceWaitingPeriod;
    const waitingPeriodComplete = !waitingPeriodApplies || daysEmployed >= 120;
    const usableNow = waitingPeriodComplete
      ? Math.min(bankAfterUse, annualUseRemaining)
      : 0;

    return {
      smallBusiness,
      annualUseLimit,
      carryoverLimit,
      newlyEarned,
      bankBeforeUse,
      bankAfterUse,
      annualUseRemaining,
      daysEmployed,
      waitingPeriodComplete,
      usableNow,
    };
  }, [
    employeeCount,
    method,
    hoursWorked,
    existingBalance,
    carryover,
    usedThisYear,
    hireDate,
    asOfDate,
    enforceWaitingPeriod,
  ]);

  const formatHours = (hours: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(hours);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="font-bold text-blue-700 dark:text-blue-300">
            ESTA Tracker
          </Link>
          <Link to="/" className="text-sm text-gray-600 hover:underline dark:text-gray-300">
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 max-w-3xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
            Public calculation laboratory
          </p>
          <h1 className="mb-4 text-3xl font-bold sm:text-4xl">
            Explore Michigan earned sick-time calculations
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Change the assumptions below to see how accrual, frontloading, carryover,
            annual use limits, and an optional 120-day waiting period affect an
            employee&apos;s available time. No account or employee information is saved.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-5 text-xl font-semibold">Scenario inputs</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Total U.S. employees</span>
                <input className="input w-full" type="number" min="1" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Employer method</span>
                <select className="input w-full" value={method} onChange={(e) => setMethod(e.target.value as AccrualMethod)}>
                  <option value="accrual">Accrual: 1 hour per 30 worked</option>
                  <option value="frontload">Frontload annual minimum</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Hours worked in scenario</span>
                <input className="input w-full" type="number" min="0" step="0.25" value={hoursWorked} onChange={(e) => setHoursWorked(e.target.value)} disabled={method === 'frontload'} />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Existing earned balance</span>
                <input className="input w-full" type="number" min="0" step="0.25" value={existingBalance} onChange={(e) => setExistingBalance(e.target.value)} />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Carryover entered</span>
                <input className="input w-full" type="number" min="0" step="0.25" value={carryover} onChange={(e) => setCarryover(e.target.value)} />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Hours used this benefit year</span>
                <input className="input w-full" type="number" min="0" step="0.25" value={usedThisYear} onChange={(e) => setUsedThisYear(e.target.value)} />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Hire date</span>
                <input className="input w-full" type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Calculate as of</span>
                <input className="input w-full" type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
              </label>
            </div>

            <label className="mt-5 flex items-start gap-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <input type="checkbox" checked={enforceWaitingPeriod} onChange={(e) => setEnforceWaitingPeriod(e.target.checked)} className="mt-1" />
              <span>
                <span className="block font-medium">Apply optional 120-day use waiting period</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  This affects use, not accrual, and applies only to the accrual method.
                </span>
              </span>
            </label>
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/40">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Calculated result</h2>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  {result.smallBusiness ? 'Small business: 10 or fewer' : 'Standard employer: 11 or more'}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Result label={method === 'accrual' ? 'Newly accrued' : 'Frontloaded'} value={`${formatHours(result.newlyEarned)} hours`} />
                <Result label="Bank before use" value={`${formatHours(result.bankBeforeUse)} hours`} />
                <Result label="Bank after recorded use" value={`${formatHours(result.bankAfterUse)} hours`} />
                <Result label="Annual use remaining" value={`${formatHours(result.annualUseRemaining)} hours`} />
                <Result label="Usable now" value={`${formatHours(result.usableNow)} hours`} emphasize />
                <Result label="Carryover limit used by lab" value={`${result.carryoverLimit} hours`} />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-xl font-semibold">Why this result</h2>
              <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <li><strong>1.</strong> Employer size is determined using 10 or fewer employees as the small-business threshold.</li>
                <li><strong>2.</strong> Under accrual, both employer sizes earn one hour for each 30 hours worked. The 40/72-hour values are annual use limits, not automatic accrual ceilings.</li>
                <li><strong>3.</strong> This lab limits entered carryover to {result.carryoverLimit} hours for the selected employer size.</li>
                <li><strong>4.</strong> The employee has been employed for {result.daysEmployed} calendar days. The optional waiting period is {result.waitingPeriodComplete ? 'complete or not applied' : 'not yet complete'}.</li>
                <li><strong>5.</strong> “Usable now” is the lower of the current bank and the remaining annual use allowance, and becomes zero while an applied waiting period is incomplete.</li>
              </ol>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              <strong>Scope:</strong> This is a transparent calculation aid based on current Michigan LEO guidance. It does not yet model prorated frontloading, collective bargaining agreements, delayed effective dates for certain new small businesses, employee exemptions, payout policies, or every fact-specific legal exception.
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Result({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${emphasize ? 'bg-blue-700 text-white' : 'bg-white dark:bg-gray-900'}`}>
      <div className={`text-sm ${emphasize ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
