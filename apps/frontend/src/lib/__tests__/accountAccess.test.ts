import { beforeEach, expect, it, vi } from 'vitest';
import type { User as FirebaseUser } from 'firebase/auth';
import { loadApprovedAccount } from '../accountAccess';
import { workspaceCall } from '../workspaceClient';
vi.mock('../workspaceClient', () => ({ workspaceCall: vi.fn() }));
const identity = {
  reload: vi.fn().mockResolvedValue(undefined),
  getIdToken: vi.fn().mockResolvedValue('token'),
} as unknown as FirebaseUser;
beforeEach(() => vi.clearAllMocks());
it('keeps a partially created identity available for registration recovery', async () => {
  vi.mocked(workspaceCall).mockResolvedValue({
    account: null,
    emailVerified: false,
  });
  expect(await loadApprovedAccount(identity)).toBeNull();
});
it.each([
  [{ status: 'approved' }, false, /verify your address/],
  [{ status: 'pending' }, true, /approve your company membership/],
  [{ status: 'rejected' }, true, /rejected/],
])(
  'rejects inaccessible account state %j',
  async (account, emailVerified, message) => {
    vi.mocked(workspaceCall).mockResolvedValue({ account, emailVerified });
    await expect(loadApprovedAccount(identity)).rejects.toThrow(message);
  }
);
it('refreshes claims and returns only the server-approved account', async () => {
  const account = {
    id: 'worker',
    role: 'employee',
    status: 'approved',
    tenantId: 'company',
  };
  vi.mocked(workspaceCall).mockResolvedValue({ account, emailVerified: true });
  expect(await loadApprovedAccount(identity)).toEqual(account);
  expect(identity.reload).toHaveBeenCalledOnce();
  expect(identity.getIdToken).toHaveBeenCalledTimes(2);
});
