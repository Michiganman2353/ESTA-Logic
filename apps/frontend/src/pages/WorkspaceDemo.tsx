import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import type { User } from '@/types';

type Perspective = 'employer' | 'employee';
type RequestStatus = 'pending' | 'approved' | 'denied';
type Request = {
  id: string;
  employeeId: string;
  date: string;
  hours: number;
  status: RequestStatus;
  created: string;
  decisionNote?: string;
};
type SampleEmployee = { id: string; name: string; group: string; earned: number; used: number };

const SAMPLE_EMPLOYEE_A: SampleEmployee = { id: 'sample-a', name: 'Sample Employee A', group: 'Operations', earned: 32, used: 8 };
const SAMPLE_EMPLOYEES: SampleEmployee[] = [
  SAMPLE_EMPLOYEE_A,
  { id: 'sample-b', name: 'Sample Employee B', group: 'Customer Service', earned: 50, used: 12 },
  { id: 'sample-c', name: 'Sample Employee C', group: 'Facilities', earned: 18, used: 0 },
];
const INITIAL_REQUESTS: Request[] = [
  { id: 'sample-1', employeeId: 'sample-a', date: '2026-12-03', hours: 6, status: 'pending', created: 'Example request' },
  { id: 'sample-2', employeeId: 'sample-a', date: '2026-10-28', hours: 4, status: 'approved', created: 'Example history', decisionNote: 'Illustrative manager approval' },
  { id: 'sample-3', employeeId: 'sample-b', date: '2026-12-09', hours: 8, status: 'pending', created: 'Example request' },
];
const SAMPLE_WARNING = 'All names, balances, requests, and decisions below are simulated. The demo does not read or write real employer or employee balance records. Changes reset when you leave or reload this page.';

function displayHours(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function dateLabel(date: string): string {
  const parsed = new Date(date + 'T12:00:00');
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusClass(status: RequestStatus) {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-800 ring-emerald-200';
  if (status === 'denied') return 'bg-rose-50 text-rose-800 ring-rose-200';
  return 'bg-amber-50 text-amber-800 ring-amber-200';
}

function StatCard({ label, value, description, accent = false }: { label: string; value: string; description: string; accent?: boolean }) {
  return (
    <div className={accent ? 'rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white shadow-lg shadow-blue-900/15' : 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'}>
      <p className={accent ? 'text-sm font-medium text-blue-100' : 'text-sm font-medium text-slate-500'}>{label}</p>
      <p className="mt-3 text-3xl font-extrabold tabular-nums">{value}</p>
      <p className={accent ? 'mt-2 text-xs text-blue-100' : 'mt-2 text-xs text-slate-500'}>{description}</p>
    </div>
  );
}

export default function WorkspaceDemo({ initialPerspective = 'employer', authenticatedUser }: { initialPerspective?: Perspective; authenticatedUser?: User }) {
  const [perspective, setPerspective] = useState<Perspective>(initialPerspective);
  const [requests, setRequests] = useState<Request[]>(INITIAL_REQUESTS);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('sample-a');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [requestHours, setRequestHours] = useState('4');
  const [notice, setNotice] = useState('');

  const employee = SAMPLE_EMPLOYEES.find((item) => item.id === selectedEmployeeId) ?? SAMPLE_EMPLOYEE_A;
  const visibleEmployees = SAMPLE_EMPLOYEES.filter((item) => (item.name + ' ' + item.group).toLowerCase().includes(employeeSearch.toLowerCase()));
  const pending = requests.filter((item) => item.status === 'pending');
  const employeeRequests = requests.filter((item) => item.employeeId === 'sample-a');
  const reviewing = requests.find((item) => item.id === reviewingId && item.status === 'pending');
  const bank = employee.earned - employee.used;

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hours = Number(requestHours);
    if (!requestDate || !Number.isFinite(hours) || hours <= 0 || hours > 24 || Math.round(hours * 4) !== hours * 4) {
      setNotice('Choose a date and a number of hours between 0.25 and 24, in quarter-hour increments.');
      return;
    }
    const next: Request = {
      id: 'demo-' + (requests.length + 1),
      employeeId: 'sample-a',
      date: requestDate,
      hours,
      status: 'pending',
      created: 'Added in this demo session',
    };
    setRequests((existing) => [next, ...existing]);
    setRequestDate('');
    setNotice('Example request added to the demo queue. It was not submitted to an employer.');
  }

  function decide(status: 'approved' | 'denied') {
    if (!reviewing || decisionReason.trim().length < 3) return;
    setRequests((existing) => existing.map((item) => (
      item.id === reviewing.id ? { ...item, status, decisionNote: decisionReason.trim() } : item
    )));
    setReviewingId(null);
    setDecisionReason('');
    setNotice('Demo request marked ' + status + '. No real employee balances or records were changed.');
  }

  const heading = perspective === 'employer' ? 'Employer workspace' : 'Employee workspace';
  return (
    <div className="min-h-screen bg-[#f3f6fc] text-slate-900">
      <Navigation user={authenticatedUser} />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-7 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link to={authenticatedUser ? '/dashboard' : '/'} className="text-sm font-semibold text-blue-700 hover:underline">
            ← {authenticatedUser ? 'Back to account overview' : 'Back to website'}
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-800">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-blue-500" />
            Interactive demo only
          </span>
        </div>

        <section className="relative overflow-hidden rounded-[1.75rem] bg-[#091d47] px-6 py-9 text-white shadow-xl sm:px-9 lg:py-12">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-40 h-96 w-96 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">ESTA Tracker · Workspace experience</p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{heading}</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100 sm:text-base">
                See how connected sick-time records, requests, and human review can work together. Explore the interface without entering private information.
              </p>
            </div>
            {!authenticatedUser && (
              <div role="group" aria-label="Demo perspective" className="flex w-full max-w-sm gap-1 rounded-xl border border-white/20 bg-white/10 p-1">
                <button type="button" aria-pressed={perspective === 'employer'} onClick={() => { setPerspective('employer'); setNotice(''); }} className={perspective === 'employer' ? 'flex-1 rounded-lg bg-white px-3 py-2.5 text-sm font-bold text-blue-800' : 'flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/15'}>Employer</button>
                <button type="button" aria-pressed={perspective === 'employee'} onClick={() => { setPerspective('employee'); setNotice(''); }} className={perspective === 'employee' ? 'flex-1 rounded-lg bg-white px-3 py-2.5 text-sm font-bold text-blue-800' : 'flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/15'}>Employee</button>
              </div>
            )}
          </div>
        </section>

        <div role="note" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-950">
          <strong>Sample data — not your account.</strong> {SAMPLE_WARNING}
        </div>
        {notice && <div role="status" className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">{notice}</div>}

        {perspective === 'employer' ? (
          <>
            <section aria-label="Sample employer overview" className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Sample employees" value={String(SAMPLE_EMPLOYEES.length)} description="Illustrative records, not a real roster" accent />
              <StatCard label="Pending sample requests" value={String(pending.length)} description="Require a human decision" />
              <StatCard label="Sample banked hours" value={displayHours(SAMPLE_EMPLOYEES.reduce((sum, item) => sum + item.earned - item.used, 0))} description="Illustrative aggregate, not legal availability" />
              <StatCard label="Completed sample reviews" value={String(requests.length - pending.length)} description="Changes only within this demo" />
            </section>
            <div className="mt-7 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="text-xs font-bold uppercase tracking-wide text-blue-600">People</p><h2 className="mt-1 text-xl font-bold">Sample team</h2></div>
                  <span className="text-xs text-slate-500">Select a row to inspect a record</span>
                </div>
                <label htmlFor="sample-employee-search" className="mt-5 block text-sm font-medium text-slate-700">Search sample employees</label>
                <input id="sample-employee-search" type="search" value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} placeholder="Name or department" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                <div className="mt-4 space-y-2">
                  {visibleEmployees.length === 0 && <p className="py-6 text-sm text-slate-500">No matching sample employees.</p>}
                  {visibleEmployees.map((item) => (
                    <button key={item.id} type="button" onClick={() => setSelectedEmployeeId(item.id)} aria-pressed={selectedEmployeeId === item.id} className={selectedEmployeeId === item.id ? 'flex w-full items-center gap-3 rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 text-left ring-1 ring-blue-100' : 'flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50'}>
                      <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-100 font-bold text-blue-700">{item.name.slice(-1)}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{item.name}</span><span className="block text-xs text-slate-500">{item.group}</span></span>
                      <span className="text-right"><span className="block font-bold tabular-nums">{displayHours(item.earned - item.used)} h</span><span className="block text-xs text-slate-500">sample bank</span></span>
                    </button>
                  ))}
                </div>
                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <h3 className="font-bold">{employee.name} — example history</h3>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div><p className="text-xl font-bold">{displayHours(employee.earned)}</p><p className="text-xs text-slate-500">Sample earned</p></div>
                    <div><p className="text-xl font-bold">{displayHours(employee.used)}</p><p className="text-xs text-slate-500">Sample used</p></div>
                    <div><p className="text-xl font-bold text-blue-700">{displayHours(bank)}</p><p className="text-xs text-slate-500">Sample bank</p></div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-xs font-bold uppercase tracking-wide text-blue-600">Human review</p><h2 className="mt-1 text-xl font-bold">Request queue</h2></div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-800">{pending.length} pending</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">Only an identified manager should make employment decisions. This demo simulates confirmation and records a reason locally.</p>
                <div className="mt-5 space-y-3">
                  {pending.length === 0 && <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">All example requests have been reviewed.</p>}
                  {pending.map((item) => (
                    <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-bold">{SAMPLE_EMPLOYEES.find((person) => person.id === item.employeeId)?.name}</p>
                          <p className="mt-1 text-sm text-slate-600">{dateLabel(item.date)} · {displayHours(item.hours)} hours</p>
                        </div>
                        <span className={'rounded-full px-3 py-1 text-xs font-bold ring-1 ' + statusClass(item.status)}>Pending</span>
                      </div>
                      <button type="button" onClick={() => { setReviewingId(item.id); setDecisionReason(''); }} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2">Review example request</button>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            {reviewing && (
              <section aria-label="Manager decision" className="mt-6 rounded-2xl border-2 border-blue-200 bg-white p-6 shadow-lg">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Simulation · Human decision</p>
                <h2 className="mt-2 text-xl font-bold">Review {SAMPLE_EMPLOYEES.find((item) => item.id === reviewing.employeeId)?.name}&apos;s sample request</h2>
                <p className="mt-1 text-sm text-slate-600">{dateLabel(reviewing.date)} · {displayHours(reviewing.hours)} hours. Confirming here does not change employment records.</p>
                <label htmlFor="sample-decision-reason" className="mt-5 block text-sm font-semibold">Manager decision note (required)</label>
                <textarea id="sample-decision-reason" rows={2} maxLength={300} value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} placeholder="Document the example review rationale without medical details" className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                <p className="mt-1 text-xs text-slate-500">Real approvals and denials require secure identity, policy context, and a durable audit trail. No decision is automated here.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" disabled={decisionReason.trim().length < 3} onClick={() => decide('approved')} className="rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">Approve in demo</button>
                  <button type="button" disabled={decisionReason.trim().length < 3} onClick={() => decide('denied')} className="rounded-xl bg-rose-600 px-5 py-2.5 font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40">Deny in demo</button>
                  <button type="button" onClick={() => { setReviewingId(null); setDecisionReason(''); }} className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold hover:bg-slate-50">Cancel</button>
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            <section aria-label="Sample employee overview" className="mt-7 grid gap-4 sm:grid-cols-3">
              <StatCard label="Illustrative bank" value={displayHours(SAMPLE_EMPLOYEE_A.earned - SAMPLE_EMPLOYEE_A.used) + ' h'} description="Not verified eligibility or available time" accent />
              <StatCard label="Illustrative earned" value={displayHours(SAMPLE_EMPLOYEE_A.earned) + ' h'} description="Synthetic example, not payroll data" />
              <StatCard label="Your sample requests" value={String(employeeRequests.length)} description="Demo statuses; no employer notified" />
            </section>
            <div className="mt-7 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Sample employee action</p>
                <h2 className="mt-1 text-xl font-bold">Try a time-off request</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">Use a fictional date and hours to see how a request moves into the example manager queue. Nothing is transmitted or stored.</p>
                <form onSubmit={submitRequest} className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="sample-request-date" className="block text-sm font-semibold">Example requested date</label>
                    <input id="sample-request-date" type="date" required value={requestDate} onChange={(event) => setRequestDate(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <div>
                    <label htmlFor="sample-request-hours" className="block text-sm font-semibold">Example hours</label>
                    <input id="sample-request-hours" type="number" required min="0.25" max="24" step="0.25" value={requestHours} onChange={(event) => setRequestHours(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <button type="submit" className="w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">Add request to demo queue</button>
                </form>
              </section>
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Activity feed</p>
                <h2 className="mt-1 text-xl font-bold">Sample request history</h2>
                <p className="mt-2 text-sm text-slate-500">A clearer timeline of requests and manager decisions—shown with invented data.</p>
                <div className="mt-6 space-y-3">
                  {employeeRequests.map((item) => (
                    <article key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
                      <span aria-hidden="true" className="mt-1 h-3 w-3 shrink-0 rounded-full bg-blue-500 ring-4 ring-blue-100" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2"><p className="font-bold">{dateLabel(item.date)} · {displayHours(item.hours)} hours</p><span className={'rounded-full px-2.5 py-1 text-xs font-bold ring-1 ' + statusClass(item.status)}>{item.status}</span></div>
                        <p className="mt-1 text-xs text-slate-500">{item.created}</p>
                        {item.decisionNote && <p className="mt-2 break-words text-sm text-slate-600">Demo manager note: {item.decisionNote}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}

        <section aria-label="Demo activity history" className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-wide text-blue-600">Transparency</p><h2 className="mt-1 text-xl font-bold">Sample activity timeline</h2></div>
            <span className="text-xs text-slate-500">Current page session only</span>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {requests.slice(0, 6).map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div><p className="text-sm font-semibold">{SAMPLE_EMPLOYEES.find((person) => person.id === item.employeeId)?.name} · {displayHours(item.hours)} hours</p><p className="mt-1 text-xs text-slate-500">{dateLabel(item.date)} · {item.created}</p></div>
                <span className={'rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ' + statusClass(item.status)}>{item.status}</span>
              </div>
            ))}
          </div>
        </section>
        <p className="mt-6 text-center text-xs text-slate-500">Illustrative workflows only. No legal compliance determination, real leave approval, accounting entry, or customer-data write occurs in this demo.</p>
      </main>
    </div>
  );
}
