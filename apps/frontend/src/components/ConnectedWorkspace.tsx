import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { WorkspaceShell, WorkspacePanel } from './WorkspaceShell';
import { workspaceCall, type WorkspaceData } from '@/lib/workspaceClient';
import type { User } from '@/types';
import { Link, useSearchParams } from 'react-router-dom';
import { PayrollImport } from './PayrollImport';
import { BookkeeperAccess, WorkspaceFeedback } from './WorkspaceSupport';
import { ProgramSetup } from './ProgramSetup';

const hours = (value: number) =>
  (value / 60).toLocaleString(undefined, { maximumFractionDigits: 2 });

export function ConnectedWorkspace({
  user,
  initialTab,
}: {
  user: User;
  initialTab?: string;
}) {
  const manager = user.role === 'employer';
  const [searchParams] = useSearchParams();
  const tenantId = manager ? searchParams.get('company') : null;
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState(
    initialTab ?? (manager ? 'Team' : 'My balance')
  );
  const [employee, setEmployee] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  // Retain the same operation identifier after an uncertain network result.
  const pending = useRef<{ signature: string; id: string } | null>(null);
  const busyRef = useRef(false);
  const revision = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++revision.current;
    try {
      const result = await workspaceCall<WorkspaceData>(
        'workspace',
        tenantId ? { tenantId } : {}
      );
      if (revision.current === current) {
        setData(result);
        setError('');
      }
    } catch (failure) {
      if (revision.current === current)
        setError(
          failure instanceof Error ? failure.message : 'Unable to load records.'
        );
    }
  }, [tenantId]);
  useEffect(() => {
    setData(null);
    setNotice('');
    setError('');
    setTab(initialTab ?? (manager ? 'Team' : 'My balance'));
    pending.current = null;
    void refresh();
    const lifecycleRevision = revision;
    return () => {
      ++lifecycleRevision.current;
    };
  }, [refresh, user.id, initialTab, manager]);

  async function mutate(action: string, payload: Record<string, unknown>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    const signature = JSON.stringify({ action, payload });
    if (pending.current?.signature !== signature)
      pending.current = { signature, id: crypto.randomUUID() };
    try {
      await workspaceCall(action, {
        ...payload,
        ...(tenantId ? { tenantId } : {}),
        operationId: pending.current.id,
      });
      pending.current = null;
      setNotice('Saved successfully.');
      await refresh();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Unable to save. Please retry.'
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const raw = Number(amount) * 60;
    const value = Math.round(raw);
    if (
      !Number.isSafeInteger(value) ||
      value === 0 ||
      Math.abs(raw - value) > 0.000001
    ) {
      setError('Enter hours in whole-minute increments.');
      return;
    }
    void mutate(
      manager ? 'adjustBalance' : 'requestLeave',
      manager
        ? { employeeId: employee, minutes: value, reason }
        : { date, minutes: value }
    );
  }
  const tabs = manager
    ? [
        'Program setup',
        'Team',
        'Leave requests',
        'Balances',
        'Payroll import',
        ...(data?.isOwner ? ['Bookkeeper access'] : []),
        'History',
        'Feedback',
      ]
    : ['My balance', 'My requests', 'History', 'Feedback'];
  const balance = data?.balances.find((row) => row.employeeId === user.id);
  return (
    <WorkspaceShell
      user={user}
      eyebrow={manager ? 'Company operations' : 'Personal benefits'}
      title={manager ? 'Employer workspace' : 'My earned sick time'}
      description={data?.companyName ?? 'Loading your company workspace'}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {manager
            ? 'Manage membership, recorded hours and leave decisions.'
            : 'Review recorded hours and send leave requests to your employer.'}
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy}
          onClick={() => {
            void refresh();
          }}
        >
          Refresh
        </button>
      </div>
      {manager && (
        <Link
          className="mb-5 inline-block font-semibold text-blue-800 underline"
          to="/companies"
        >
          Switch company / bookkeeper workspace
        </Link>
      )}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-4 text-red-800"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="mb-4 rounded-xl bg-green-50 p-4 text-green-800"
        >
          {notice}
        </div>
      )}
      {!data ? (
        <p role="status">
          {error
            ? 'Use Refresh to retry loading your records.'
            : 'Loading records…'}
        </p>
      ) : (
        <>
          {data.limited && (
            <p role="status" className="mb-4 rounded-xl bg-amber-50 p-4">
              This view is limited to 200 records per section. Contact support
              for a complete export.
            </p>
          )}
          <div
            role="tablist"
            aria-label="Workspace views"
            className="mb-6 flex flex-wrap gap-2"
          >
            {tabs.map((label) => (
              <button
                key={label}
                role="tab"
                aria-selected={tab === label}
                onClick={() => setTab(label)}
                className={
                  tab === label ? 'btn btn-primary' : 'btn btn-secondary'
                }
              >
                {label}
              </button>
            ))}
          </div>
          <div role="tabpanel" aria-label={tab}>
            {tab === 'Program setup' && (
              <ProgramSetup key={data.tenantId} data={data} refresh={refresh} />
            )}
            {tab === 'Payroll import' && (
              <PayrollImport
                key={data.tenantId}
                data={data}
                refresh={refresh}
              />
            )}
            {tab === 'Bookkeeper access' && data.isOwner && (
              <BookkeeperAccess
                key={data.tenantId}
                data={data}
                refresh={refresh}
              />
            )}
            {tab === 'Feedback' && (
              <WorkspaceFeedback key={data.tenantId} data={data} />
            )}
            {tab === 'Team' && (
              <WorkspacePanel
                title="Employee directory"
                description="Employees verify their email and request membership using your company code."
              >
                <div className="mb-5 rounded-xl bg-blue-50 p-4">
                  <h3 className="font-bold">Company setup checklist</h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    <li>
                      {data.policy ? (
                        '✓ Sick-time program settings recorded.'
                      ) : (
                        <button
                          className="text-blue-800 underline"
                          onClick={() => setTab('Program setup')}
                        >
                          Next: document your sick-time program settings.
                        </button>
                      )}
                    </li>
                    <li>✓ Company workspace created and email verified.</li>
                    <li>
                      {data.members.some(
                        (row) =>
                          row.role === 'employee' && row.status === 'approved'
                      )
                        ? '✓ Employee membership approved.'
                        : 'Next: invite employees and review their membership requests.'}
                    </li>
                    <li>
                      {data.balances.length
                        ? '✓ Opening balances started. Review each approved employee in Balances.'
                        : 'Next: record opening balances and their source in Balances.'}
                    </li>
                    <li>
                      <Link className="text-blue-800 underline" to="/learn">
                        Review your policy, benefit year and recordkeeping
                        process.
                      </Link>
                    </li>
                  </ul>
                </div>
                <p className="mb-5">
                  Company code{' '}
                  <strong className="break-all font-mono">
                    {data.companyCode}
                  </strong>
                </p>
                <label className="mb-5 block">
                  Employee invitation link
                  <input
                    className="input mt-1 w-full"
                    readOnly
                    value={`${window.location.origin}/register/employee?code=${encodeURIComponent(data.companyCode ?? '')}`}
                    onFocus={(event) => event.target.select()}
                  />
                </label>
                <ol className="mb-5 list-inside list-decimal space-y-2 text-sm">
                  <li>Share this link directly with your employees.</li>
                  <li>Employees create an account and verify their email.</li>
                  <li>
                    Approve each employee below, then record their opening
                    sick-time balance.
                  </li>
                </ol>
                {data.members.filter((row) => row.role === 'employee')
                  .length === 0 && <p>No employees have joined yet.</p>}
                <ul className="space-y-3">
                  {data.members
                    .filter((row) => row.role === 'employee')
                    .map((row) => (
                      <li
                        key={row.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                      >
                        <div>
                          <strong>{row.name}</strong>
                          <p>{row.email}</p>
                          <p>{row.status}</p>
                        </div>
                        {row.status === 'pending' && (
                          <button
                            disabled={busy}
                            className="btn btn-primary"
                            onClick={() => {
                              void mutate('approveMember', {
                                employeeId: row.id,
                              });
                            }}
                          >
                            Approve membership
                          </button>
                        )}
                      </li>
                    ))}
                </ul>
              </WorkspacePanel>
            )}
            {(tab === 'Balances' || tab === 'My balance') && (
              <WorkspacePanel
                title={manager ? 'Recorded balances' : 'My recorded balance'}
                description="These are employer-maintained records. Eligibility, annual use limits and policy must be reviewed before a decision."
              >
                {!manager && (
                  <>
                    <p className="my-5 text-4xl font-bold">
                      {balance
                        ? `${hours(balance.bankMinutes)} hours`
                        : 'Balance not recorded'}
                    </p>
                    {data.policy && (
                      <div className="mb-5 rounded-xl bg-blue-50 p-4">
                        <h3 className="font-bold">Company sick-time process</h3>
                        <p>
                          Benefit year starts: {data.policy.benefitYearStart}
                        </p>
                        <p className="whitespace-pre-wrap">
                          {data.policy.notes}
                        </p>
                      </div>
                    )}
                  </>
                )}
                {manager && (
                  <>
                    <ul className="mb-6 space-y-2">
                      {data.members
                        .filter(
                          (row) =>
                            row.role === 'employee' && row.status === 'approved'
                        )
                        .map((row) => {
                          const record = data.balances.find(
                            (item) => item.employeeId === row.id
                          );
                          return (
                            <li key={row.id}>
                              {row.name} —{' '}
                              {record
                                ? `${hours(record.bankMinutes)} hours`
                                : 'Balance not recorded'}
                            </li>
                          );
                        })}
                    </ul>
                    <form onSubmit={submit} className="grid max-w-xl gap-4">
                      <label>
                        Employee
                        <select
                          required
                          className="input mt-1 w-full"
                          value={employee}
                          onChange={(e) => setEmployee(e.target.value)}
                        >
                          <option value="">Select employee</option>
                          {data.members
                            .filter(
                              (row) =>
                                row.role === 'employee' &&
                                row.status === 'approved'
                            )
                            .map((row) => (
                              <option key={row.id} value={row.id}>
                                {row.name}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label>
                        Hours to add or subtract
                        <input
                          className="input mt-1 w-full"
                          type="number"
                          step="any"
                          required
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </label>
                      <label>
                        Source or reason
                        <input
                          className="input mt-1 w-full"
                          required
                          maxLength={500}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </label>
                      <button
                        disabled={busy}
                        className="btn btn-primary"
                        type="submit"
                      >
                        Record adjustment
                      </button>
                    </form>
                  </>
                )}
              </WorkspacePanel>
            )}
            {(tab === 'My requests' || tab === 'Leave requests') && (
              <WorkspacePanel
                title="Time-off requests"
                description="An approved request deducts hours from the recorded bank once."
              >
                {!manager && (
                  <form onSubmit={submit} className="mb-8 grid max-w-xl gap-4">
                    <label>
                      Leave date
                      <input
                        required
                        className="input mt-1 w-full"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </label>
                    <label>
                      Requested hours
                      <input
                        required
                        className="input mt-1 w-full"
                        type="number"
                        min="0.0166666667"
                        max="24"
                        step="any"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </label>
                    <button
                      disabled={busy}
                      className="btn btn-primary"
                      type="submit"
                    >
                      Submit request
                    </button>
                  </form>
                )}
                {data.requests.length === 0 && <p>No requests recorded.</p>}
                <ul className="space-y-4">
                  {data.requests
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((row) => (
                      <li key={row.id} className="rounded-xl border p-4">
                        <strong>{row.employeeName}</strong>
                        <p>
                          {row.date} · {hours(row.minutes)} hours · {row.status}
                        </p>
                        {row.decisionReason && <p>{row.decisionReason}</p>}
                        {manager && row.status === 'pending' && (
                          <div className="mt-3 grid gap-3">
                            <label>
                              Decision reason
                              <input
                                className="input mt-1 w-full"
                                maxLength={500}
                                value={decisions[row.id] ?? ''}
                                onChange={(e) =>
                                  setDecisions({
                                    ...decisions,
                                    [row.id]: e.target.value,
                                  })
                                }
                              />
                            </label>
                            <div className="flex gap-3">
                              {(['approved', 'denied'] as const).map(
                                (decision) => (
                                  <button
                                    key={decision}
                                    className="btn btn-secondary"
                                    disabled={
                                      busy || !decisions[row.id]?.trim()
                                    }
                                    onClick={() => {
                                      void mutate('decideLeave', {
                                        requestId: row.id,
                                        decision,
                                        reason: decisions[row.id],
                                      });
                                    }}
                                  >
                                    {decision === 'approved'
                                      ? 'Approve'
                                      : 'Deny'}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                </ul>
              </WorkspacePanel>
            )}
            {tab === 'History' && (
              <WorkspacePanel
                title="Record history"
                description="Saved requests, decisions and balance adjustments with the responsible account and time."
              >
                {data.history.length === 0 && <p>No activity recorded.</p>}
                <ul className="space-y-3">
                  {data.history
                    .slice()
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .map((row) => (
                      <li className="rounded-xl border p-4" key={row.id}>
                        <strong>{row.action.replace(/_/g, ' ')}</strong>
                        <p>{new Date(row.createdAt).toLocaleString()}</p>
                        <p>
                          Employee{' '}
                          {data.members.find((m) => m.id === row.employeeId)
                            ?.name ?? row.employeeId}
                        </p>
                        <p>
                          Recorded by{' '}
                          {data.members.find((m) => m.id === row.actorId)
                            ?.name ?? row.actorId}
                        </p>
                        {row.minutes !== undefined && (
                          <p>{hours(row.minutes)} hours</p>
                        )}
                        {row.reason && <p>{row.reason}</p>}
                      </li>
                    ))}
                </ul>
              </WorkspacePanel>
            )}
          </div>
        </>
      )}
    </WorkspaceShell>
  );
}
