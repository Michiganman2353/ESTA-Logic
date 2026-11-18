import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { PayrollImport } from './PayrollImport';
import { workspaceCall, type WorkspaceData } from '@/lib/workspaceClient';
vi.mock('@/lib/workspaceClient', () => ({ workspaceCall: vi.fn() }));
const data = {
  tenantId: 'client-company',
  companyName: 'Client Company',
  payrollEmployees: [],
} as unknown as WorkspaceData;
beforeEach(() => vi.mocked(workspaceCall).mockReset());

async function upload() {
  fireEvent.change(screen.getByLabelText('Payroll CSV'), {
    target: {
      files: [
        {
          size: 80,
          text: async () => 'name,email,payrollId\nJane,jane@example.test,QB-1',
        },
      ],
    },
  });
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Review 1 employee records' })
    ).toBeEnabled()
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Review 1 employee records' })
  );
}
const review = {
  previewToken: 'review-1',
  review: [
    {
      name: 'Jane',
      email: 'jane@example.test',
      payrollId: 'QB-1',
      employeeId: null,
      previous: null,
      action: 'create',
      conflict: null,
    },
  ],
};

it('requires review and confirmation, and keeps the operation ID after an uncertain save', async () => {
  vi.mocked(workspaceCall)
    .mockResolvedValueOnce(review)
    .mockRejectedValueOnce(new Error('Network interrupted'))
    .mockResolvedValueOnce({ count: 1 });
  const refresh = vi.fn().mockResolvedValue(undefined);
  render(<PayrollImport data={data} refresh={refresh} />);
  await upload();
  const save = await screen.findByRole('button', {
    name: 'Save reviewed import',
  });
  expect(save).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(save);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Network interrupted'
  );
  fireEvent.click(screen.getByRole('button', { name: 'Save reviewed import' }));
  expect(await screen.findByRole('status')).toHaveTextContent(
    '1 employee records saved'
  );
  const commits = vi
    .mocked(workspaceCall)
    .mock.calls.filter(([action]) => action === 'commitImport');
  expect(commits).toHaveLength(2);
  expect(commits[0]?.[1]).toEqual(commits[1]?.[1]);
  expect(commits[0]?.[1]).toEqual(
    expect.objectContaining({
      tenantId: 'client-company',
      previewToken: 'review-1',
    })
  );
  expect(refresh).toHaveBeenCalledOnce();
});

it('blocks saving a review with conflicting matches', async () => {
  vi.mocked(workspaceCall).mockResolvedValueOnce({
    ...review,
    review: [
      { ...review.review[0], conflict: 'Payroll ID belongs to another email.' },
    ],
  });
  render(<PayrollImport data={data} refresh={vi.fn()} />);
  await upload();
  expect(
    await screen.findByText('Payroll ID belongs to another email.')
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox'));
  expect(
    screen.getByRole('button', { name: 'Save reviewed import' })
  ).toBeDisabled();
});
