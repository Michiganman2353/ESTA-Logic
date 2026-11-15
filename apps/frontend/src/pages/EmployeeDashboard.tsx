import type { User } from '@/types';
import WorkspaceDemo from '@/pages/WorkspaceDemo';

export default function EmployeeDashboard({ user }: { user: User }) {
  // Authenticated account records are not safe to display until trusted server-side
  // identity, tenant isolation, and authoritative balance persistence are verified.
  return <WorkspaceDemo initialPerspective="employee" authenticatedUser={user} />;
}
