import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { randomBytes, createHash } from 'crypto';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
const fail = (
  code: functions.https.FunctionsErrorCode,
  message: string
): never => {
  throw new functions.https.HttpsError(code, message);
};
function text(value: unknown, label: string, max = 160): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    return fail('invalid-argument', `Enter a valid ${label}.`);
  }
  return value.trim();
}
function id(value: unknown): string {
  const result = text(value, 'record identifier', 256);
  if (!/^[A-Za-z0-9_-]+$/.test(result))
    return fail('invalid-argument', 'Invalid record identifier.');
  return result;
}
function minutes(value: unknown, allowNegative = false): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value === 0 ||
    Math.abs(value) > 600000 ||
    (!allowNegative && value < 0)
  ) {
    return fail(
      'invalid-argument',
      'Hours must be a nonzero number of whole minutes within the supported range.'
    );
  }
  return value;
}
const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');
const root = (tenantId: string) => db.collection('workspaces').doc(tenantId);
const accountRef = (uid: string) => db.collection('workspaceAccounts').doc(uid);

async function register(uid: string, input: Record<string, unknown>) {
  const identity = await auth.getUser(uid);
  if (!identity.email)
    return fail('failed-precondition', 'An email address is required.');
  const name = text(input.name, 'full name');
  const kind = input.kind;
  if (kind !== 'employer' && kind !== 'employee')
    return fail('invalid-argument', 'Choose an account type.');
  const companyName =
    kind === 'employer' ? text(input.companyName, 'company name') : '';
  const count = input.employeeCount;
  if (
    kind === 'employer' &&
    (typeof count !== 'number' ||
      !Number.isSafeInteger(count) ||
      count < 1 ||
      count > 100000)
  ) {
    return fail('invalid-argument', 'Enter a valid employee count.');
  }
  const companyCode =
    kind === 'employee'
      ? text(input.companyCode, 'company code', 64).toUpperCase()
      : '';
  const newCode = randomBytes(12).toString('hex').toUpperCase();
  await db.runTransaction(async (tx) => {
    const existing = await tx.get(accountRef(uid));
    if (existing.exists) {
      if (existing.get('role') !== kind)
        return fail(
          'already-exists',
          'This account already has a different role.'
        );
      return; // Retrying registration never changes membership or creates a second company.
    }
    const tenantId =
      kind === 'employer'
        ? `company_${uid}`
        : (
            await tx.get(db.collection('workspaceCodes').doc(hash(companyCode)))
          ).get('tenantId');
    if (typeof tenantId !== 'string')
      return fail('not-found', 'Company code was not found.');
    let employeeCount = count as number;
    if (kind === 'employee') {
      const company = await tx.get(root(tenantId));
      employeeCount = company.get('employeeCount');
      if (!company.exists || company.get('status') !== 'active')
        return fail(
          'failed-precondition',
          'This company is not accepting members yet.'
        );
    }
    const now = new Date().toISOString();
    const account = {
      id: uid,
      name,
      email: identity.email,
      role: kind,
      tenantId,
      status: 'pending',
      employerSize: employeeCount <= 10 ? 'small' : 'large',
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    };
    tx.create(accountRef(uid), account);
    tx.create(root(tenantId).collection('members').doc(uid), account);
    if (kind === 'employer') {
      tx.create(root(tenantId), {
        name: companyName,
        ownerId: uid,
        employeeCount: count,
        companyCode: newCode,
        status: 'pending',
        createdAt: now,
      });
      tx.create(db.collection('workspaceCodes').doc(hash(newCode)), {
        tenantId,
      });
    }
  });
  return getAccount(uid);
}

async function getAccount(uid: string) {
  const identity = await auth.getUser(uid);
  const snapshot = await accountRef(uid).get();
  if (!snapshot.exists)
    return { account: null, emailVerified: identity.emailVerified };
  const account = snapshot.data()!;
  // Only a server-created owner of their new company can activate on email verification.
  if (
    account.role === 'employer' &&
    account.status === 'pending' &&
    identity.emailVerified
  ) {
    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(accountRef(uid));
      const company = await tx.get(root(account.tenantId));
      if (fresh.get('status') !== 'pending' || company.get('ownerId') !== uid)
        return;
      tx.update(accountRef(uid), { status: 'approved' });
      tx.update(root(account.tenantId).collection('members').doc(uid), {
        status: 'approved',
      });
      tx.update(root(account.tenantId), { status: 'active' });
    });
  }
  const fresh = (await accountRef(uid).get()).data()!;
  // Account records are Admin-SDK-only. Claims are derived exclusively from these records.
  if (identity.emailVerified && fresh.status === 'approved') {
    await auth.setCustomUserClaims(uid, {
      role: fresh.role,
      tenantId: fresh.tenantId,
    });
  }
  return { account: fresh, emailVerified: identity.emailVerified };
}

async function authorized(uid: string) {
  const identity = await auth.getUser(uid);
  const account = (await accountRef(uid).get()).data();
  if (!identity.emailVerified || !account || account.status !== 'approved') {
    return fail(
      'permission-denied',
      'Verified email and approved company membership are required.'
    );
  }
  return account;
}

export async function handleWorkspace(
  uid: string,
  input: Record<string, unknown>
) {
  if (input.action === 'register') return register(uid, input);
  if (input.action === 'account') return getAccount(uid);
  const actor = await authorized(uid);
  const company = root(actor.tenantId);
  const manager = actor.role === 'employer';
  if (input.action === 'workspace') {
    const requestsQuery = manager
      ? company.collection('requests')
      : company.collection('requests').where('employeeId', '==', uid);
    const historyQuery = manager
      ? company.collection('history')
      : company.collection('history').where('employeeId', '==', uid);
    const [companyDoc, members, requests, history, balances] =
      await Promise.all([
        company.get(),
        manager
          ? company.collection('members').limit(200).get()
          : company.collection('members').where('id', '==', uid).get(),
        requestsQuery.limit(200).get(),
        historyQuery.limit(200).get(),
        manager
          ? company.collection('balances').limit(200).get()
          : company.collection('balances').where('employeeId', '==', uid).get(),
      ]);
    const rows = (s: admin.firestore.QuerySnapshot) =>
      s.docs.map((d) => ({ ...d.data(), id: d.id }));
    return {
      companyName: companyDoc.get('name'),
      companyCode: manager ? companyDoc.get('companyCode') : null,
      members: rows(members),
      requests: rows(requests),
      history: rows(history),
      balances: rows(balances),
      limited: [members, requests, history, balances].some(
        (s) => s.size >= 200
      ),
    };
  }
  if (input.action === 'approveMember') {
    if (!manager)
      return fail('permission-denied', 'Employer access is required.');
    const target = id(input.employeeId);
    const identity = await auth.getUser(target);
    if (!identity.emailVerified)
      return fail(
        'failed-precondition',
        'The employee must verify their email first.'
      );
    await db.runTransaction(async (tx) => {
      const member = await tx.get(accountRef(target));
      if (
        member.get('tenantId') !== actor.tenantId ||
        member.get('role') !== 'employee'
      )
        return fail('permission-denied', 'Employee is outside this company.');
      if (member.get('status') === 'approved') return;
      if (member.get('status') !== 'pending')
        return fail(
          'failed-precondition',
          'Employee cannot be approved from this state.'
        );
      tx.update(accountRef(target), { status: 'approved' });
      tx.update(company.collection('members').doc(target), {
        status: 'approved',
      });
      tx.create(company.collection('history').doc(`member_${target}`), {
        employeeId: target,
        actorId: uid,
        action: 'membership_approved',
        createdAt: new Date().toISOString(),
      });
    });
    return { success: true };
  }
  const operationId = id(input.operationId);
  if (input.action === 'adjustBalance') {
    if (!manager)
      return fail('permission-denied', 'Employer access is required.');
    const target = id(input.employeeId);
    const delta = minutes(input.minutes, true);
    const reason = text(input.reason, 'adjustment reason', 500);
    const eventRef = company.collection('history').doc(`adjust_${operationId}`);
    await db.runTransaction(async (tx) => {
      const [member, event, balance] = await Promise.all([
        tx.get(accountRef(target)),
        tx.get(eventRef),
        tx.get(company.collection('balances').doc(target)),
      ]);
      if (
        member.get('tenantId') !== actor.tenantId ||
        member.get('role') !== 'employee' ||
        member.get('status') !== 'approved'
      )
        return fail(
          'permission-denied',
          'An approved employee in this company is required.'
        );
      if (event.exists) {
        if (
          event.get('employeeId') !== target ||
          event.get('minutes') !== delta ||
          event.get('reason') !== reason ||
          event.get('actorId') !== uid
        )
          return fail(
            'already-exists',
            'Operation identifier was already used.'
          );
        return;
      }
      const previous = balance.exists ? balance.get('bankMinutes') : 0;
      if (previous + delta < 0 || !Number.isSafeInteger(previous + delta))
        return fail(
          'failed-precondition',
          'Adjustment would produce an invalid balance.'
        );
      tx.set(company.collection('balances').doc(target), {
        employeeId: target,
        bankMinutes: previous + delta,
        updatedAt: new Date().toISOString(),
      });
      tx.create(eventRef, {
        employeeId: target,
        actorId: uid,
        action: 'balance_adjusted',
        minutes: delta,
        previousMinutes: previous,
        resultingMinutes: previous + delta,
        reason,
        createdAt: new Date().toISOString(),
      });
    });
    return { success: true };
  }
  if (input.action === 'requestLeave') {
    if (actor.role !== 'employee')
      return fail('permission-denied', 'Employee access is required.');
    const amount = minutes(input.minutes);
    if (amount > 1440)
      return fail(
        'invalid-argument',
        'A single-day request cannot exceed 24 hours.'
      );
    const date = text(input.date, 'date', 10);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date
    )
      return fail('invalid-argument', 'Enter a valid date.');
    const ref = company.collection('requests').doc(`${uid}_${operationId}`);
    await db.runTransaction(async (tx) => {
      const existing = await tx.get(ref);
      if (existing.exists) {
        if (existing.get('minutes') !== amount || existing.get('date') !== date)
          return fail(
            'already-exists',
            'Operation identifier was already used.'
          );
        return;
      }
      const now = new Date().toISOString();
      tx.create(ref, {
        employeeId: uid,
        employeeName: actor.name,
        date,
        minutes: amount,
        status: 'pending',
        createdAt: now,
      });
      tx.create(company.collection('history').doc(`request_${ref.id}`), {
        employeeId: uid,
        actorId: uid,
        action: 'leave_requested',
        requestId: ref.id,
        minutes: amount,
        createdAt: now,
      });
    });
    return { success: true, requestId: ref.id };
  }
  if (input.action === 'decideLeave') {
    if (!manager)
      return fail('permission-denied', 'Employer access is required.');
    const requestId = id(input.requestId);
    const decision = input.decision;
    if (decision !== 'approved' && decision !== 'denied')
      return fail('invalid-argument', 'Choose approve or deny.');
    const reason = text(input.reason, 'decision reason', 500);
    await db.runTransaction(async (tx) => {
      const ref = company.collection('requests').doc(requestId);
      const request = await tx.get(ref);
      if (!request.exists)
        return fail('not-found', 'Request was not found in this company.');
      if (request.get('status') !== 'pending') {
        if (
          request.get('operationId') === operationId &&
          request.get('status') === decision &&
          request.get('decisionReason') === reason &&
          request.get('decidedBy') === uid
        )
          return;
        return fail(
          'failed-precondition',
          'This request has already been decided. Refresh the page.'
        );
      }
      const employeeId = request.get('employeeId');
      const balanceRef = company.collection('balances').doc(employeeId);
      const balance = await tx.get(balanceRef);
      const previous = balance.exists ? balance.get('bankMinutes') : null;
      if (
        decision === 'approved' &&
        (previous === null || previous < request.get('minutes'))
      )
        return fail(
          'failed-precondition',
          'A recorded balance with sufficient hours is required before approval.'
        );
      const now = new Date().toISOString();
      tx.update(ref, {
        status: decision,
        decisionReason: reason,
        decidedBy: uid,
        decidedAt: now,
        operationId,
      });
      if (decision === 'approved')
        tx.update(balanceRef, {
          bankMinutes: previous - request.get('minutes'),
          updatedAt: now,
        });
      tx.create(company.collection('history').doc(`decision_${requestId}`), {
        employeeId,
        actorId: uid,
        action: `leave_${decision}`,
        requestId,
        reason,
        minutes: decision === 'approved' ? -request.get('minutes') : 0,
        previousMinutes: previous,
        resultingMinutes:
          decision === 'approved'
            ? previous - request.get('minutes')
            : previous,
        createdAt: now,
      });
    });
    return { success: true };
  }
  return fail('invalid-argument', 'Unknown workspace action.');
}

export const workspaceApi = functions
  .region('us-central1')
  .runWith({ maxInstances: 10 })
  .https.onCall(async (input, context) => {
    if (!context.auth) return fail('unauthenticated', 'Sign in to continue.');
    if (!input || typeof input !== 'object' || Array.isArray(input))
      return fail('invalid-argument', 'Invalid request.');
    return handleWorkspace(context.auth.uid, input);
  });
