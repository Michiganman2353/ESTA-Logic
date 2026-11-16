import type { User as FirebaseUser } from 'firebase/auth';
import { workspaceCall, type AccountResult } from './workspaceClient';
import type { User } from '@/types';

export async function loadApprovedAccount(
  identity: FirebaseUser
): Promise<User | null> {
  await identity.reload();
  await identity.getIdToken(true);
  const { account, emailVerified } =
    await workspaceCall<AccountResult>('account');
  if (!account) return null;
  if (!emailVerified)
    throw new Error(
      'Check your email to verify your address, then select Check account again.'
    );
  if (account.status === 'rejected')
    throw new Error(
      'Your membership has been rejected. Please contact your employer.'
    );
  if (account.status !== 'approved')
    throw new Error(
      'Your employer needs to approve your company membership. Check again after approval.'
    );
  await identity.getIdToken(true);
  return account;
}
