import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { workspaceCall, type WorkspaceData } from '@/lib/workspaceClient';
import { WorkspacePanel } from './WorkspaceShell';

export function ProgramSetup({
  data,
  refresh,
}: {
  data: WorkspaceData;
  refresh: () => Promise<void>;
}) {
  const [date, setDate] = useState(data.policy?.benefitYearStart ?? '');
  const [method, setMethod] = useState(data.policy?.method ?? 'manual');
  const [notes, setNotes] = useState(data.policy?.notes ?? '');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const pending = useRef({ signature: '', id: '' });
  return (
    <WorkspacePanel
      title="Set up your sick-time program"
      description={`Record the policy and process used by ${data.companyName}.`}
    >
      <p className="mb-4">
        These settings document your process. They do not automatically accrue
        hours, enforce annual limits or determine eligibility. Continue
        recording balances with a source and reviewing each leave request.
      </p>
      <form
        className="grid max-w-xl gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (busy) return;
          setBusy(true);
          setNotice('');
          setError('');
          const payload = {
            benefitYearStart: date,
            method,
            notes,
            version: data.policy?.version ?? 0,
          };
          const signature = JSON.stringify(payload);
          if (pending.current.signature !== signature)
            pending.current = { signature, id: crypto.randomUUID() };
          void workspaceCall('savePolicy', {
            ...payload,
            tenantId: data.tenantId,
            operationId: pending.current.id,
          })
            .then(async () => {
              setNotice('Program settings saved.');
              await refresh();
            })
            .catch((failure: Error) => setError(failure.message))
            .finally(() => setBusy(false));
        }}
      >
        <label>
          Current benefit year starts
          <input
            className="input mt-1 w-full"
            required
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <label>
          Recordkeeping method
          <select
            className="input mt-1 w-full"
            value={method}
            onChange={(event) => setMethod(event.target.value as typeof method)}
          >
            <option value="manual">Employer-maintained balances</option>
            <option value="accrual">
              Accrual calculated outside this workspace
            </option>
            <option value="frontload">
              Frontloaded hours recorded by employer
            </option>
          </select>
        </label>
        <label>
          Policy and process notes
          <textarea
            className="input mt-1 w-full"
            required
            maxLength={2000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Describe the policy source, how hours are calculated, who reviews requests and where supporting records are kept."
          />
        </label>
        <p className="text-sm">
          Visible to company employees and authorized bookkeepers. Do not
          include individual medical or payroll information.
        </p>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save program settings'}
        </button>
      </form>
      {error && (
        <p className="mt-4 text-red-800" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-4 text-green-800" role="status">
          {notice}
        </p>
      )}
      <Link className="mt-5 inline-block text-blue-800 underline" to="/learn">
        Review the employer ESTA guide
      </Link>
    </WorkspacePanel>
  );
}
