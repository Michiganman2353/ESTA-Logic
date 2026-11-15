import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '@/types';
import { WorkspaceShell, WorkspacePanel, ConnectionNote, DataState } from '@/components/WorkspaceShell';

type EmployerView = 'overview' | 'people' | 'requests' | 'intelligence';
const views: ReadonlyArray<{ key: EmployerView; name: string }> = [
  { key: 'overview', name: 'Overview' },
  { key: 'people', name: 'Team' },
  { key: 'requests', name: 'Leave requests' },
  { key: 'intelligence', name: 'Decision intelligence' },
];

const metrics = [
  { label: 'Verified team members', value: '—', hint: 'Awaiting secure roster connection' },
  { label: 'Requests awaiting review', value: '—', hint: 'Not yet synchronized' },
  { label: 'Ledger-backed hours', value: '—', hint: 'Awaiting authenticated balances' },
  { label: 'Review exceptions', value: '—', hint: 'No verified exception feed' },
];

export default function EmployerDashboard({ user }: { user: User }) {
  const [view, setView] = useState<EmployerView>('overview');

  return (
    <WorkspaceShell
      user={user}
      eyebrow="Company operations"
      title="Employer workspace"
      description="A modern command center for sick-time records, requests, balance explanations and human review—without substituting sample employee information for your organization."
      action={<Link to="/guided-flow" className="inline-flex min-h-11 items-center rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20">Open Calculation Lab <span aria-hidden="true" className="ml-2">↗</span></Link>}
    >
      {user.status === 'pending' && (
        <div role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900">
          Employer approval is pending. Real company records must not be displayed until membership and access are verified.
        </div>
      )}
      <ConnectionNote message="No trusted company-data connection is active for this workspace. Counts and balances are shown as unavailable—not zero—until the backend verifies the account and returns records." />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Company metrics">
        {metrics.map((metric, index) => (
          <div key={metric.label} className={index === 0 ? 'rounded-2xl bg-gradient-to-br from-[#10336c] to-[#1f5ed3] p-5 text-white shadow-lg shadow-blue-900/10' : 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'}>
            <p className={'text-sm font-semibold ' + (index === 0 ? 'text-blue-100' : 'text-slate-500')}>{metric.label}</p>
            <p className="mt-3 text-4xl font-extrabold tabular-nums">{metric.value}</p>
            <p className={'mt-2 text-xs ' + (index === 0 ? 'text-blue-100' : 'text-slate-500')}>{metric.hint}</p>
          </div>
        ))}
      </div>

      <div role="tablist" aria-label="Employer dashboard views" className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {views.map(({key,name}) => (
          <button key={key} type="button" role="tab" id={'employer-tab-' + key} aria-controls={'employer-panel-' + key} aria-selected={view===key} onClick={() => setView(key)} className={view === key ? 'whitespace-nowrap rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white shadow' : 'whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-800'}>
            {name}
          </button>
        ))}
      </div>

      <div id={'employer-panel-' + view} role="tabpanel" aria-labelledby={'employer-tab-' + view}>
        {view === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <WorkspacePanel title="Your activity feed" description="Traceable requests, decisions and corrections will appear here after verified integration.">
              <DataState icon="list" title="No authenticated activity source" detail="An empty feed is not evidence that no events exist. We will display only records returned by the trusted tenant-scoped service." />
            </WorkspacePanel>
            <WorkspacePanel title="Ready for operational data" description="Three integration gates keep financial and employee records accurate.">
              <ol className="space-y-4">
                {[
                  ['Trusted membership', 'Confirm the signed-in manager belongs to this employer.'],
                  ['Authenticated ledger', 'Load versioned accrual and usage events without cross-tenant access.'],
                  ['Reviewed decisions', 'Record approvals, denials and corrections with responsible actors.'],
                ].map(([name,detail],i)=>(
                  <li key={name} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">{i+1}</span>
                    <span><strong className="block text-sm text-slate-800">{name}</strong><span className="mt-1 block text-sm leading-relaxed text-slate-600">{detail}</span></span>
                  </li>
                ))}
              </ol>
              <Link to="/settings" className="mt-6 inline-flex min-h-10 items-center rounded-xl border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50">View account settings</Link>
            </WorkspacePanel>
          </div>
        )}
        {view === 'people' && (
          <WorkspacePanel title="Employee directory" description="A searchable roster with balances and employment status will be driven by authorized company records.">
            <DataState icon="list" title="Roster connection required" detail="Employee identities, benefit-year classification and balances will not be guessed from account metadata or public demo fixtures." />
          </WorkspacePanel>
        )}
        {view === 'requests' && (
          <WorkspacePanel title="Manager review queue" description="A single location for pending time-off requests and documented human decisions.">
            <DataState icon="clock" title="Request history isn't connected" detail="Review and approval controls stay unavailable until authorization, request persistence and a durable audit trail are verified. No leave decisions are made on this page today." />
          </WorkspacePanel>
        )}
        {view === 'intelligence' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <WorkspacePanel title="Why this balance?" description="Decision Intelligence is available in the codebase; the customer data adapter is the next integration step.">
              <DataState icon="shield" title="Waiting for authorized ledger history" detail="Once connected, each balance can be reconstructed by effective date and knowledge date, with source entries and ruleset versions shown for review." />
            </WorkspacePanel>
            <WorkspacePanel title="Discrepancy review" description="A historical correction can change what we now know without rewriting old reports.">
              <DataState icon="list" title="No verified exception feed" detail="The new replay engine can compare projections, but it cannot claim discrepancies in your actual records until authorized event history is available." />
              <Link to="/audit" className="mt-5 inline-flex min-h-10 items-center rounded-xl border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50">Review audit status</Link>
            </WorkspacePanel>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
