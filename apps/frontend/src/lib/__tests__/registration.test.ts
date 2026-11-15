import { beforeEach, expect, it, vi } from 'vitest';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import { registerManager, registerEmployee } from '../authService';
import { workspaceCall } from '../workspaceClient';
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  sendEmailVerification: vi.fn(),
}));
vi.mock('@/services/firebase', () => ({ auth: {} }));
vi.mock('../workspaceClient', () => ({ workspaceCall: vi.fn() }));
vi.mock('../analytics', () => ({ trackAccountEvent: vi.fn() }));
const data = {
  name: 'Test Owner',
  email: 'OWNER@EXAMPLE.TEST',
  password: 'TestPassword123!',
  companyName: 'Test Company',
  employeeCount: 12,
};
const identity = { uid: 'owner', emailVerified: false };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
    user: identity,
  } as never);
  vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
    user: identity,
  } as never);
  vi.mocked(sendEmailVerification).mockResolvedValue(undefined);
  vi.mocked(workspaceCall).mockResolvedValue({
    account: { id: 'owner', status: 'pending' },
    emailVerified: false,
  });
});
it('persists membership before returning success and never sends the password to the callable', async () => {
  const result = await registerManager(data);
  expect(workspaceCall).toHaveBeenCalledWith('register', {
    kind: 'employer',
    name: 'Test Owner',
    companyName: 'Test Company',
    employeeCount: 12,
  });
  expect(sendEmailVerification).toHaveBeenCalledWith(identity);
  expect(result.needsVerification).toBe(true);
});
it('authenticates an existing email before resuming interrupted registration', async () => {
  vi.mocked(createUserWithEmailAndPassword).mockRejectedValueOnce({
    code: 'auth/email-already-in-use',
  });
  await registerManager(data);
  expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
    expect.anything(),
    'owner@example.test',
    data.password
  );
});
it('does not return success if the backend fails', async () => {
  vi.mocked(workspaceCall).mockRejectedValueOnce(new Error('Connection lost'));
  await expect(registerManager(data)).rejects.toThrow('Connection lost');
  expect(sendEmailVerification).not.toHaveBeenCalled();
});
it('requires a company code before creating employee credentials', async () => {
  await expect(registerEmployee(data)).rejects.toThrow('employer code');
  expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
});
it('still allows the recovery screen when the verification email cannot be sent', async () => {
  vi.mocked(sendEmailVerification).mockRejectedValueOnce(
    new Error('Temporarily unavailable')
  );
  expect((await registerManager(data)).needsVerification).toBe(true);
});
