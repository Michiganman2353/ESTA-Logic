import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { workspaceCall } from '@/lib/workspaceClient';
import { WorkspaceShell, WorkspacePanel } from '@/components/WorkspaceShell';
import type { User } from '@/types';

export default function Companies({ user }: { user: User }) {
  const [companies, setCompanies] = useState<
    { id: string; name: string; access: string }[]
  >([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void workspaceCall<{ companies: typeof companies }>('companies')
      .then((result) => {
        if (active) setCompanies(result.companies);
      })
      .catch((failure: Error) => {
        if (active) setError(failure.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user.id]);
  return (
    <WorkspaceShell
      user={user}
      eyebrow="Bookkeepers & employers"
      title="Your companies"
      description="Use one sign-in to work with each business that has authorized you. Company records stay separate."
    >
      <WorkspacePanel
        title="Choose a company"
        description="Open a company to review its employees, sick time and payroll imports."
      >
        {loading && <p role="status">Loading authorized companies…</p>}
        {error && <p role="alert">{error} Return to this page to retry.</p>}
        <ul className="grid gap-4 sm:grid-cols-2">
          {companies.map((company) => (
            <li key={company.id}>
              <Link
                className="block rounded-xl border p-5 hover:border-blue-600"
                to={`/employer?company=${encodeURIComponent(company.id)}`}
              >
                <strong>{company.name}</strong>
                <p>
                  {company.access === 'owner'
                    ? 'Company owner'
                    : 'Bookkeeper access'}{' '}
                  → Open workspace
                </p>
              </Link>
            </li>
          ))}
        </ul>
        {!loading && !error && !companies.length && (
          <p>No companies have granted access yet.</p>
        )}
      </WorkspacePanel>
      <div className="mt-5">
        <WorkspacePanel
          title="Add another client"
          description="Access starts with the business owner."
        >
          <p>
            Ask the company owner to open their company workspace, choose
            Bookkeeper access, and authorize your verified account email. You
            can then return here to open that business. Owners can revoke access
            at any time.
          </p>
          <p className="mt-3">
            Bookkeepers currently use an employer account for their own business
            or practice. Authorizing a bookkeeper permits employee approvals,
            balance adjustments, leave decisions and roster imports for that
            company. Bookkeepers cannot grant access to another account.
          </p>
        </WorkspacePanel>
      </div>
    </WorkspaceShell>
  );
}
