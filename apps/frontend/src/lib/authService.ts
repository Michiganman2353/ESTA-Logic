import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '@/services/firebase';
import { loadApprovedAccount } from './accountAccess';
import { workspaceCall, type AccountResult } from './workspaceClient';
import { trackAccountEvent } from './analytics';
import { isValidEmail, validatePassword } from '@/utils/security';
import type { User } from '@/types';

export interface RegisterManagerData {
  name: string;
  email: string;
  password: string;
  companyName: string;
  employeeCount: number;
}
export interface RegisterEmployeeData {
  name: string;
  email: string;
  password: string;
  tenantCode?: string;
  employerEmail?: string;
}

async function register(
  data: RegisterManagerData | RegisterEmployeeData,
  kind: 'employer' | 'employee'
) {
  const email = data.email.trim().toLowerCase();
  if (!isValidEmail(email)) throw new Error('Invalid email address.');
  const password = validatePassword(data.password);
  if (!password.valid) throw new Error(password.message);
  if (data.name.trim().length < 2 || data.name.trim().length > 160)
    throw new Error('Please enter your full name.');
  if (kind === 'employer') {
    const company = data as RegisterManagerData;
    if (
      company.companyName.trim().length < 2 ||
      company.companyName.trim().length > 160
    )
      throw new Error('Please enter a valid company name.');
    if (
      !Number.isInteger(company.employeeCount) ||
      company.employeeCount < 1 ||
      company.employeeCount > 100000
    )
      throw new Error('Please enter a valid employee count.');
  } else if (!(data as RegisterEmployeeData).tenantCode?.trim()) {
    throw new Error('Please provide an employer code.');
  }
  if (!auth) throw new Error('Firebase not configured.');
  trackAccountEvent('signup_started');
  let identity;
  try {
    identity = (
      await createUserWithEmailAndPassword(auth, email, data.password)
    ).user;
  } catch (error) {
    if ((error as { code?: string }).code !== 'auth/email-already-in-use')
      throw error;
    // Authenticate before resuming a partially completed enrollment.
    identity = (await signInWithEmailAndPassword(auth, email, data.password))
      .user;
  }
  const result = await workspaceCall<AccountResult>('register', {
    kind,
    name: data.name.trim(),
    ...(kind === 'employer'
      ? {
          companyName: (data as RegisterManagerData).companyName.trim(),
          employeeCount: (data as RegisterManagerData).employeeCount,
        }
      : {
          companyCode: (data as RegisterEmployeeData)
            .tenantCode!.trim()
            .toUpperCase(),
        }),
  });
  if (!result.account)
    throw new Error('Account setup was not confirmed. Please retry.');
  if (!identity.emailVerified) {
    try {
      await sendEmailVerification(identity);
    } catch {
      /* The signed-in recovery screen supports resending. */
    }
  }
  trackAccountEvent('signup_completed');
  return { user: result.account, needsVerification: !identity.emailVerified };
}
export const registerManager = (data: RegisterManagerData) =>
  register(data, 'employer');
export const registerEmployee = (data: RegisterEmployeeData) =>
  register(data, 'employee');

export async function signIn(email: string, password: string): Promise<User> {
  if (!auth) throw new Error('Firebase not configured.');
  try {
    const { user } = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );
    const account = await loadApprovedAccount(user);
    if (!account)
      throw new Error(
        'Your sign-in exists. Complete registration using the same email and password to finish account setup.'
      );
    return account;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (
      [
        'auth/invalid-credential',
        'auth/user-not-found',
        'auth/wrong-password',
      ].includes(code ?? '')
    )
      throw new Error('Invalid email or password. Please try again.');
    throw error;
  }
}
