import type { User } from '@/types';
import WorkspaceDemo from '@/pages/WorkspaceDemo';

export default function EmployerDashboard({ user }: { user: User }) {
  // Never render the historical fake compliance score or represent sample
  // accrual, usage, or leave decisions as the signed-in employer's real records.
  return <WorkspaceDemo initialPerspective="employer" authenticatedUser={user} />;
}
