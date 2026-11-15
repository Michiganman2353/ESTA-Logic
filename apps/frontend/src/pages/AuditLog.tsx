import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '@/types';
import { WorkspaceShell, WorkspacePanel, DataState, ConnectionNote } from '@/components/WorkspaceShell';

type RecordView = 'activity' | 'evidence' | 'exports';
const views: Array<{ key: RecordView; label: string }> = [
  { key: 'activity', label: 'Activity' },
  { key: 'evidence', label: 'Balance evidence' },
  { key: 'exports', label: 'Exports' },
];

export default function AuditLog({ user }: { user: User }) {
  const [view, setView] = useState<RecordView>('activity');

  return (
    <WorkspaceShell
      user={user}
      eyebrow="Traceability & records"
      title="Activity and audit history"
      description="Review the history behind earned sick time, managerial decisions and balance changes. Your records will display only when retrieved through a trusted account-scoped service."
      action={<Link to="/dashboard" className="inline-flex min-h-11 items-center rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">Back to overview</Link>}
    >
      <ConnectionNote message="A verified audit-record feed is not connected to this account. The absence of displayed events does not mean that no historical activity exists." />
      <div role="tablist" aria-label="Audit record views" className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {views.map(({key,label})=>(
          <button type="button" key={key} role="tab" id={'audit-tab-' + key} aria-selected={view===key} aria-controls={'audit-panel-' + key} onClick={() => setView(key)} className={view===key ? 'whitespace-nowrap rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow' : 'whitespace-nowrap rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-800'}>{label}</button>
        ))}
      </div>
      <div role="tabpanel" id={'audit-panel-' + view} aria-labelledby={'audit-tab-' + view}>
        {view==='activity' && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <WorkspacePanel title="Event timeline" description="A unified event history will include requests, approvals, usage, accruals and corrections.">
              <DataState icon="list" title="No authorized activity feed" detail="This workspace does not invent audit entries, actors or timestamps. The event list will be populated only after tenant and employee access checks are verified." />
            </WorkspacePanel>
            <WorkspacePanel title="What gets recorded?" description="Each actionable event should have a verifiable source.">
              <div className="space-y-3">
                {[
                  ['Event', 'Accrual, request, decision or correction.'],
                  ['Attribution', 'Verified actor and authorized organization.'],
                  ['Effective date', 'When a change affects the benefit ledger.'],
                  ['Knowledge date', 'When the application recorded the change.'],
                ].map(([label,details])=>(
                  <div key={label} className="rounded-xl bg-slate-50 p-4">
                    <h3 className="text-sm font-bold text-slate-900">{label}</h3>
                    <p className="mt-1 text-sm text-slate-600">{details}</p>
                  </div>
                ))}
              </div>
            </WorkspacePanel>
          </div>
        )}
        {view==='evidence' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <WorkspacePanel title="Ledger reconstruction" description="The Decision Intelligence engine supports bitemporal event replay in the repository.">
              <DataState icon="shield" title="Awaiting signed-in ledger history" detail="A balance receipt requires authorized source events, a ruleset version and a reproducible reconstruction. SHA hashes alone are not proof of independent record integrity." />
            </WorkspacePanel>
            <WorkspacePanel title="Discrepancy review" description="Corrections should not erase what was known earlier.">
              <DataState icon="clock" title="No verified discrepancy results" detail="Once the trusted ledger is connected, historical projections can be compared, anomalies flagged and a human reviewer assigned." />
            </WorkspacePanel>
          </div>
        )}
        {view==='exports' && (
          <WorkspacePanel title="Records export" description="Exports require complete authorization, retention policy and verified event coverage.">
            <DataState icon="shield" title="Audit export isn't available" detail="A partial or browser-generated export could be misleading. Download controls will appear only when server-generated records can be scoped to the authorized account." />
          </WorkspacePanel>
        )}
      </div>
    </WorkspaceShell>
  );
}
