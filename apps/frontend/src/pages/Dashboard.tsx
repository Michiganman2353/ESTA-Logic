import { Link } from 'react-router-dom';
import type { User } from '@/types';
import { WorkspaceShell, WorkspacePanel, ConnectionNote } from '@/components/WorkspaceShell';
import { Alert } from '@/components/Alert';

type Role = User['role'];
const destinations: Array<{ to: string; title: string; description: string; number: string; roles: Role[] }> = [
  { to: '/employer', title: 'Company workspace', number: '01', description: 'Your employer workspace, request-review area and company setup.', roles: ['employer', 'admin'] },
  { to: '/employee', title: 'My sick time', number: '02', description: 'Your personal leave record, balance explanation and request history.', roles: ['employee', 'admin'] },
  { to: '/audit', title: 'Activity & records', number: '03', description: 'Review the current audit status and the roadmap for traceable records.', roles: ['employee', 'employer', 'admin'] },
  { to: '/settings', title: 'Account settings', number: '04', description: 'Check your account profile, security status and planned connections.', roles: ['employee', 'employer', 'admin'] },
];

export default function Dashboard({ user }: { user: User }) {
  const visible = destinations.filter((item) => item.roles.includes(user.role));
  return (
    <WorkspaceShell user={user} eyebrow="Your ESTA workspace" title={'Welcome back, ' + user.name.split(' ')[0]} description="A central place for your sick-time information, company activity and account tools. Live operational records will appear only after the trusted service is connected.">
      {user.role === 'employer' && user.status === 'pending' && (
        <Alert variant="warning" title="Account pending approval" className="mb-5">
          Your employer account is pending. Tenant access must be verified before live records are available.
        </Alert>
      )}
      <ConnectionNote message="Your account is signed in, but the employee-record service is not yet verified for this workspace. We will not substitute fictional balances, requests or compliance scores for your records." />
      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((item) => (
          <Link key={item.to} to={item.to} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300">
            <div className="mb-5 flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#102f68] font-extrabold text-sky-200">{item.number}</span>
              <span aria-hidden="true" className="text-2xl text-blue-600 transition group-hover:translate-x-1">→</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6">
        <WorkspacePanel title="What happens next?" description="The next operational milestone is verified account and data access, not another demonstration.">
          <div className="grid gap-4 sm:grid-cols-3">
            {[['01','Identity & access','Verify organization membership and account permissions.'],['02','Connect records','Read authenticated balances and approved requests from the trusted backend.'],['03','Explain every hour','Reconstruct balances using the versioned ledger and applicable ruleset.']].map(([num,title,desc])=>(
              <div key={num} className="rounded-xl bg-slate-50 p-4">
                <span className="text-xs font-extrabold tracking-widest text-blue-600">STEP {num}</span>
                <h3 className="mt-2 font-bold text-slate-800">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </WorkspacePanel>
      </div>
    </WorkspaceShell>
  );
}
