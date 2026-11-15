import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import type { User } from '@/types';

/** Read-only account resolution shared by login and restored sessions.
 * Server rules must still enforce authorization independently of this UI gate.
 */
export async function loadApprovedAccount(
  identity: FirebaseUser
): Promise<User> {
  if (!db)
    throw new Error(
      'Account service is not configured. Please contact support.'
    );
  const snapshot = await getDoc(doc(db, 'users', identity.uid));
  if (!snapshot.exists()) {
    throw new Error(
      'Your sign-in exists, but account setup is incomplete. Please contact support to finish setup.'
    );
  }
  const profile = snapshot.data();
  if (profile.status === 'rejected') {
    throw new Error('Your account has been rejected. Please contact support.');
  }
  if (profile.status !== 'approved') {
    throw new Error(
      'Your account is awaiting approval. Signing in does not approve an account.'
    );
  }
  const token = await identity.getIdTokenResult(true);
  const { role, tenantId, employerId } = token.claims;
  if (
    !['employee', 'employer', 'admin'].includes(String(role)) ||
    typeof tenantId !== 'string' ||
    !tenantId ||
    profile.role !== role ||
    profile.tenantId !== tenantId ||
    (profile.employerId !== undefined && profile.employerId !== employerId)
  ) {
    throw new Error(
      'Your account permissions need verification. Please contact support.'
    );
  }
  if (!identity.emailVerified) {
    throw new Error(
      'Please verify your email address before accessing your workspace.'
    );
  }
  if (
    typeof profile.name !== 'string' ||
    !profile.name.trim() ||
    !['small', 'large'].includes(profile.employerSize)
  ) {
    throw new Error(
      'Your account profile is incomplete. Please contact support.'
    );
  }
  return {
    ...profile,
    id: identity.uid,
    email: identity.email ?? '',
    role: role as User['role'],
  } as User;
}
