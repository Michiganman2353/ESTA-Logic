import { ConnectedWorkspace } from '@/components/ConnectedWorkspace';
import type { User } from '@/types';
export default function EmployeeDashboard({ user }: { user: User }) {
  return <ConnectedWorkspace user={user} />;
}
