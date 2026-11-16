import { ConnectedWorkspace } from '@/components/ConnectedWorkspace';
import type { User } from '@/types';
export default function AuditLog({ user }: { user: User }) {
  return <ConnectedWorkspace user={user} initialTab="History" />;
}
