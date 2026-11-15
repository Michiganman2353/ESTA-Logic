import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EmployerDashboard from '../EmployerDashboard';
import { workspaceCall } from '@/lib/workspaceClient';
import type { User } from '@/types';
vi.mock('@/lib/workspaceClient', () => ({ workspaceCall: vi.fn() }));
const user = {
  id: 'owner',
  name: 'Owner',
  email: 'owner@example.test',
  role: 'employer',
  status: 'approved',
  employerSize: 'large',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
} as User;
const records = {
  companyName: 'Test Company',
  companyCode: 'INVITE',
  members: [
    {
      id: 'worker',
      name: 'Worker',
      email: 'worker@example.test',
      role: 'employee',
      status: 'pending',
    },
  ],
  requests: [],
  history: [],
  balances: [],
  limited: false,
};
const view = () =>
  render(
    <MemoryRouter>
      <EmployerDashboard user={user} />
    </MemoryRouter>
  );
beforeEach(() => {
  vi.mocked(workspaceCall).mockReset();
  vi.mocked(workspaceCall).mockResolvedValue(records);
});
describe('connected employer workspace', () => {
  it('loads real members and submits membership approval', async () => {
    view();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Approve membership' })
    );
    await waitFor(() =>
      expect(workspaceCall).toHaveBeenCalledWith(
        'approveMember',
        expect.objectContaining({
          employeeId: 'worker',
          operationId: expect.any(String),
        })
      )
    );
    expect(await screen.findByText('Saved successfully.')).toBeInTheDocument();
  });
  it('shows an actionable failure instead of fabricated records', async () => {
    vi.mocked(workspaceCall).mockRejectedValueOnce(new Error('Access denied'));
    view();
    expect(await screen.findByRole('alert')).toHaveTextContent('Access denied');
    expect(screen.queryByText('Worker')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(await screen.findByText('Worker')).toBeInTheDocument();
  });
  it('does not show missing approved employee balances as zero', async () => {
    vi.mocked(workspaceCall).mockResolvedValue({
      ...records,
      members: [{ ...records.members[0], status: 'approved' }],
    });
    view();
    fireEvent.click(await screen.findByRole('tab', { name: 'Balances' }));
    expect(screen.getByText(/Balance not recorded/)).toBeInTheDocument();
  });
});
