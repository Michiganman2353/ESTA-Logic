import { ConnectedWorkspace } from '@/components/ConnectedWorkspace';
import type { User } from '@/types';
import { useSearchParams } from 'react-router-dom';
export default function EmployerDashboard({ user }: { user: User }) {
  const [params] = useSearchParams();
  return (
    <ConnectedWorkspace
      key={`${user.id}:${params.get('company') ?? ''}`}
      user={user}
    />
  );
}
