import { useRef, useState } from 'react';
import { workspaceCall, type WorkspaceData } from '@/lib/workspaceClient';
import { WorkspacePanel } from './WorkspaceShell';

export function BookkeeperAccess({
  data,
  refresh,
}: {
  data: WorkspaceData;
  refresh: () => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function change(address: string, active: boolean) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await workspaceCall('bookkeeperAccess', {
        tenantId: data.tenantId,
        email: address,
        active,
      });
      setNotice(
        active ? 'Bookkeeper access granted.' : 'Bookkeeper access revoked.'
      );
      setEmail('');
      await refresh();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <WorkspacePanel
      title="Bookkeeper access"
      description="Only the company owner can authorize or revoke another account."
    >
      <p className="mb-4">
        Authorize a verified employer account to administer {data.companyName}.
        This gives access to the employee directory, approvals, balances, leave
        decisions, imports and feedback. It does not grant permission to
        authorize other bookkeepers.
      </p>
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void change(email, true);
        }}
      >
        <label>
          Bookkeeper account email
          <input
            className="input mt-1 w-full"
            type="email"
            maxLength={254}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button className="btn btn-primary" disabled={busy}>
          Grant company access
        </button>
      </form>
      {error && (
        <p role="alert" className="my-3 text-red-800">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="my-3 text-green-800">
          {notice}
        </p>
      )}
      <ul className="mt-5 space-y-3">
        {data.bookkeepers?.map((person) => (
          <li
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
            key={person.id}
          >
            <span>{person.email}</span>
            <button
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => void change(person.email, false)}
            >
              Revoke access
            </button>
          </li>
        ))}
      </ul>
    </WorkspacePanel>
  );
}

export function WorkspaceFeedback({ data }: { data: WorkspaceData }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const pending = useRef({ message: '', id: '' });
  return (
    <WorkspacePanel
      title="Help improve ESTA Tracker"
      description="Tell your company administrators where a task is confusing or what you need next."
    >
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (busy) return;
          setBusy(true);
          setError('');
          setStatus('');
          if (pending.current.message !== message)
            pending.current = { message, id: crypto.randomUUID() };
          void workspaceCall('feedback', {
            tenantId: data.tenantId,
            message,
            operationId: pending.current.id,
          })
            .then(() => {
              setMessage('');
              setStatus(
                'Feedback saved for your company administrators. Thank you.'
              );
            })
            .catch((failure: Error) => setError(failure.message))
            .finally(() => setBusy(false));
        }}
      >
        <label>
          What should we improve?
          <textarea
            className="input mt-1 w-full"
            required
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        <p className="text-sm">
          Visible to company administrators, including authorized bookkeepers.
          Please leave out medical information, passwords and payroll details.
        </p>
        <button className="btn btn-primary" disabled={busy}>
          Send feedback
        </button>
      </form>
      {error && (
        <p role="alert" className="my-3 text-red-800">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="my-3 text-green-800">
          {status}
        </p>
      )}
      {!!data.feedback?.length && (
        <div className="mt-6">
          <h3 className="font-bold">Recent company feedback</h3>
          <ul>
            {data.feedback.map((row) => (
              <li className="my-3 rounded-xl border p-3" key={row.id}>
                <p>{row.message}</p>
                <p className="text-sm">
                  {new Date(row.createdAt).toLocaleString()} · {row.status}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </WorkspacePanel>
  );
}
