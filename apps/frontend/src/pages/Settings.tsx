import { useState } from 'react';
import type { User } from '@/types';
import { WorkspaceShell, WorkspacePanel, DataState, ConnectionNote } from '@/components/WorkspaceShell';

type Tab = 'profile' | 'security' | 'notifications' | 'integrations';

const tabs: ReadonlyArray<{ key: Tab; label: string }> = [
  { key: 'profile', label: 'Account' },
  { key: 'security', label: 'Security' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'integrations', label: 'Integrations' },
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-2 break-words font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

export default function Settings({ user }: { user: User }) {
  const [tab, setTab] = useState<Tab>('profile');
  const employerLabel = user.employerSize === 'large' ? 'Large (more than 10 employees, based on the applicable lookback)' : 'Small (10 or fewer employees, based on the applicable lookback)';

  return (
    <WorkspaceShell user={user} eyebrow="Account & preferences" title="Settings" description="View your account information and the status of connected services. Changes are only offered when they can be saved securely.">
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Account settings">
        {tabs.map(({ key, label }) => (
          <button key={key} id={'settings-tab-' + key} type="button" role="tab" aria-selected={tab === key} aria-controls={'settings-panel-' + key} onClick={() => setTab(key)} className={tab === key ? 'rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-md' : 'rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-800'}>
            {label}
          </button>
        ))}
      </div>

      <div id={'settings-panel-' + tab} role="tabpanel" aria-labelledby={'settings-tab-' + tab}>
        {tab === 'profile' && (
          <>
            <ConnectionNote message="Profile details are displayed read-only. This page will not claim to save changes until a trusted account-update endpoint is available." />
            <WorkspacePanel title="Account profile" description="Information associated with the current account. Contact an administrator for corrections until secure editing is available.">
              <dl className="grid gap-3 sm:grid-cols-2">
                <Field label="Name" value={user.name} />
                <Field label="Email" value={user.email} />
                <Field label="Account role" value={user.role} />
                <Field label="Account status" value={user.status || 'Not provided'} />
                {(user.role === 'employer' || user.role === 'admin') && <Field label="Employer classification" value={employerLabel} />}
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-slate-500">Employer classification must be verified against statutory workforce-count rules before it is used for calculations.</p>
            </WorkspacePanel>
          </>
        )}
        {tab === 'security' && (
          <WorkspacePanel title="Account security" description="Authentication and authorization are separate controls.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="font-bold text-blue-900">Sign-in method</h3>
                <p className="mt-2 text-sm leading-relaxed text-blue-900">Your session is managed by the application's authentication provider. Sign out through the workspace menu. Passkey enrollment is not available yet.</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="font-bold text-amber-900">Permissions</h3>
                <p className="mt-2 text-sm leading-relaxed text-amber-950">Server-authoritative role and organization membership verification are still undergoing hardening. This page does not certify access-control compliance.</p>
              </div>
            </div>
          </WorkspacePanel>
        )}
        {tab === 'notifications' && (
          <WorkspacePanel title="Notification preferences" description="Only working settings should present a Save action.">
            <DataState icon="list" title="Notification delivery isn't connected" detail="Email and in-app alerts will be configurable after authenticated notification preferences can be saved and verified." />
          </WorkspacePanel>
        )}
        {tab === 'integrations' && (
          <WorkspacePanel title="Payroll integrations" description="Connections require explicit authorization and a verifiable synchronization history.">
            <DataState icon="shield" title="No verified payroll connection" detail="QuickBooks, ADP and Paychex connectors are not represented as active until synchronization and reconciliation are implemented." />
          </WorkspacePanel>
        )}
      </div>
    </WorkspaceShell>
  );
}
