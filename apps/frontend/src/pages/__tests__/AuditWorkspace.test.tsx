import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import AuditLog from '../AuditLog';
import type { User } from '@/types';
vi.mock('@/lib/workspaceClient', () => ({
  workspaceCall: vi
    .fn()
    .mockResolvedValue({
      companyName: 'Company',
      members: [],
      requests: [],
      balances: [],
      history: [
        {
          id: 'event',
          employeeId: 'worker',
          actorId: 'owner',
          action: 'leave_approved',
          minutes: 120,
          reason: 'Approved per policy',
          createdAt: '2026-11-15T12:00:00Z',
        },
      ],
      limited: false,
    }),
}));
it('opens the persisted history and identifies the responsible account', async () => {
  const user = {
    id: 'worker',
    name: 'Worker',
    email: 'worker@example.test',
    role: 'employee',
    employerSize: 'large',
  } as User;
  render(
    <MemoryRouter>
      <AuditLog user={user} />
    </MemoryRouter>
  );
  expect(await screen.findByText('leave approved')).toBeInTheDocument();
  expect(screen.getByText('Recorded by owner')).toBeInTheDocument();
  expect(screen.getByText('Approved per policy')).toBeInTheDocument();
});
