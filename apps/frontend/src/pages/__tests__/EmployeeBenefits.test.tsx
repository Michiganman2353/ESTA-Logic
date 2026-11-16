import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EmployeeDashboard from '../EmployeeDashboard';
import { workspaceCall } from '@/lib/workspaceClient';
import type { User } from '@/types';
vi.mock('@/lib/workspaceClient', () => ({ workspaceCall: vi.fn() }));
const employee = {
  id: 'worker',
  name: 'Worker',
  email: 'worker@example.test',
  role: 'employee',
  status: 'approved',
  employerSize: 'large',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
} as User;
const records = {
  companyName: 'Test Company',
  companyCode: null,
  members: [],
  requests: [],
  history: [],
  balances: [],
  limited: false,
};
const view = () =>
  render(
    <MemoryRouter>
      <EmployeeDashboard user={employee} />
    </MemoryRouter>
  );
beforeEach(() => {
  vi.mocked(workspaceCall).mockReset();
  vi.mocked(workspaceCall).mockResolvedValue(records);
});
describe('connected employee workspace', () => {
  it('distinguishes missing balances from recorded zero', async () => {
    view();
    expect(await screen.findByText('Balance not recorded')).toBeInTheDocument();
    vi.mocked(workspaceCall).mockResolvedValue({
      ...records,
      balances: [{ employeeId: 'worker', bankMinutes: 0 }],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(await screen.findByText('0 hours')).toBeInTheDocument();
  });
  it('preserves the operation ID when retrying an uncertain submission', async () => {
    view();
    fireEvent.click(await screen.findByRole('tab', { name: 'My requests' }));
    fireEvent.change(screen.getByLabelText('Leave date'), {
      target: { value: '2026-12-01' },
    });
    fireEvent.change(screen.getByLabelText('Requested hours'), {
      target: { value: '2' },
    });
    vi.mocked(workspaceCall).mockRejectedValueOnce(
      new Error('Connection interrupted')
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit request' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Connection interrupted'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit request' }));
    await waitFor(() =>
      expect(screen.getByText('Saved successfully.')).toBeInTheDocument()
    );
    const submissions = vi
      .mocked(workspaceCall)
      .mock.calls.filter(([action]) => action === 'requestLeave');
    expect(submissions).toHaveLength(2);
    expect(submissions[0][1]).toEqual(submissions[1][1]);
    expect(submissions[0][1]).toMatchObject({
      date: '2026-12-01',
      minutes: 120,
    });
  });
  it('does not expose employer controls', async () => {
    view();
    await screen.findByText('Balance not recorded');
    expect(screen.queryByRole('tab', { name: 'Team' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Record adjustment' })
    ).not.toBeInTheDocument();
  });
});
