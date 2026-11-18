import { useRef, useState } from 'react';
import { workspaceCall, type WorkspaceData } from '@/lib/workspaceClient';
import { parsePayrollCsv, type PayrollRow } from '@/lib/payrollCsv';
import { WorkspacePanel } from './WorkspaceShell';

interface ReviewRow extends PayrollRow {
  action: string;
  employeeId: string | null;
  previous: PayrollRow | null;
  conflict: string | null;
}
interface Preview {
  previewToken: string;
  review: ReviewRow[];
}

export function PayrollImport({
  data,
  refresh,
}: {
  data: WorkspaceData;
  refresh: () => Promise<void>;
}) {
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const operation = useRef(crypto.randomUUID());
  const reading = useRef(0);
  async function review() {
    setBusy(true);
    setError('');
    setNotice('');
    setPreview(null);
    setConfirmed(false);
    try {
      const result = await workspaceCall<Preview>('previewImport', {
        tenantId: data.tenantId,
        rows,
      });
      operation.current = crypto.randomUUID();
      setPreview(result);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!preview || !confirmed || busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await workspaceCall<{ count: number }>('commitImport', {
        tenantId: data.tenantId,
        rows,
        previewToken: preview.previewToken,
        operationId: operation.current,
      });
      setNotice(
        `${result.count} employee records saved. No balances or account permissions were changed.`
      );
      setPreview(null);
      setRows([]);
      await refresh();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <WorkspacePanel
      title="Import payroll employees"
      description="Import a CSV roster exported from QuickBooks or another payroll system. This is a reviewed file import, not a live payroll connection."
    >
      <p className="mb-4 text-sm">
        Map your export to <code>name,email,payrollId</code>. Include a header
        and up to 100 rows. Payroll ID is optional. Do not include wages, tax
        identifiers or medical information. Email identifies the roster record;
        imports never create sign-in accounts or change sick-time balances.
      </p>
      <label className="block">
        Payroll CSV
        <input
          className="input my-3 block w-full"
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            const version = ++reading.current;
            setPreview(null);
            setRows([]);
            setError('');
            setNotice('');
            setConfirmed(false);
            if (!file) return;
            if (file.size > 200000) {
              setError('Choose a CSV smaller than 200 KB.');
              return;
            }
            void file
              .text()
              .then((source) => {
                if (version !== reading.current) return;
                try {
                  setRows(parsePayrollCsv(source));
                } catch (failure) {
                  setError((failure as Error).message);
                }
              })
              .catch(() => {
                if (version === reading.current)
                  setError('Unable to read this file. Choose it again.');
              });
          }}
        />
      </label>
      <button
        className="btn btn-secondary"
        disabled={busy || !rows.length}
        onClick={() => void review()}
      >
        Review {rows.length || ''} employee records
      </button>
      {error && (
        <p role="alert" className="my-4 text-red-800">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="my-4 text-green-800">
          {notice}
        </p>
      )}
      {preview && (
        <div className="mt-5 space-y-4">
          <h3 className="font-bold">Review every match before saving</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {[
                    'Employee',
                    'Email',
                    'Payroll ID',
                    'Change',
                    'Account match',
                  ].map((title) => (
                    <th className="p-2" key={title}>
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.review.map((row) => (
                  <tr key={row.email} className="border-t">
                    <td className="p-2">
                      {row.name}
                      {row.previous && <p>Previously: {row.previous.name}</p>}
                    </td>
                    <td className="p-2">{row.email}</td>
                    <td className="p-2">
                      {row.payrollId || 'None'}
                      {row.previous && (
                        <p>Previously: {row.previous.payrollId || 'None'}</p>
                      )}
                    </td>
                    <td className="p-2">{row.action}</td>
                    <td className="p-2">
                      {row.conflict ||
                        (row.employeeId
                          ? 'Exact email match to company member'
                          : 'No account match; invite employee separately')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm">
            To correct or omit a row, edit your CSV and upload it again.
            Existing records with the same email will be updated. A payroll ID
            assigned to a different email blocks saving.
          </p>
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={busy}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            I reviewed the names, duplicates and account matches for{' '}
            {data.companyName}.
          </label>
          <button
            className="btn btn-primary"
            disabled={
              busy || !confirmed || preview.review.some((row) => row.conflict)
            }
            onClick={() => void save()}
          >
            {busy ? 'Saving…' : 'Save reviewed import'}
          </button>
        </div>
      )}
      <h3 className="mb-2 mt-6 font-bold">Saved payroll roster</h3>
      {!data.payrollEmployees?.length ? (
        <p>No payroll employees imported yet.</p>
      ) : (
        <ul className="space-y-2">
          {data.payrollEmployees.map((row) => (
            <li key={row.id}>
              {row.name} · {row.email} · {row.payrollId || 'No payroll ID'}
            </li>
          ))}
        </ul>
      )}
    </WorkspacePanel>
  );
}
