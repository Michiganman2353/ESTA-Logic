import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} from 'firebase/functions';
import { app } from '@/services/firebase';
import type { User } from '@/types';

let client: ReturnType<typeof getFunctions> | null = null;
export async function workspaceCall<T>(
  action: string,
  data: Record<string, unknown> = {}
): Promise<T> {
  if (!app) throw new Error('Firebase is not configured.');
  if (!client) {
    client = getFunctions(app, 'us-central1');
    if (
      import.meta.env.DEV &&
      import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
    ) {
      connectFunctionsEmulator(client, '127.0.0.1', 5001);
    }
  }
  const result = await httpsCallable<Record<string, unknown>, T>(
    client,
    'workspaceApi'
  )({ ...data, action });
  return result.data;
}
export interface AccountResult {
  account: (User & { tenantId: string }) | null;
  emailVerified: boolean;
}
export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}
export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  minutes: number;
  status: string;
  decisionReason?: string;
}
export interface HistoryEntry {
  id: string;
  employeeId: string;
  actorId: string;
  action: string;
  minutes?: number;
  reason?: string;
  createdAt: string;
}
export interface WorkspaceData {
  tenantId: string;
  isOwner: boolean;
  policy: {
    benefitYearStart: string;
    method: 'accrual' | 'frontload' | 'manual';
    notes: string;
    version: number;
  } | null;
  companyName: string;
  companyCode: string | null;
  members: Member[];
  requests: LeaveRequest[];
  history: HistoryEntry[];
  balances: { employeeId: string; bankMinutes: number }[];
  limited: boolean;
  payrollEmployees: {
    id: string;
    name: string;
    email: string;
    payrollId: string;
    employeeId: string | null;
  }[];
  bookkeepers: { id: string; email: string }[];
  feedback: {
    id: string;
    message: string;
    createdAt: string;
    status: string;
  }[];
}
