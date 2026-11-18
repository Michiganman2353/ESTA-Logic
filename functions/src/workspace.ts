import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { randomBytes, createHash } from 'crypto';
import { payrollRows, importDigest } from './payroll-import';

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
  let actor = await authorized(uid);
  if (input.action === 'companies') {
    if (actor.role !== 'employer')
      return fail(
        'permission-denied',
        'Employer or bookkeeper access is required.'
      );
    const grants = await accountRef(uid).collection('companies').get();
    const ids = [...new Set([actor.tenantId, ...grants.docs.map((d) => d.id)])];
    const companies = await Promise.all(
      ids.map(async (tenantId) => {
        const [company, grant] = await Promise.all([
          root(tenantId).get(),
          root(tenantId).collection('bookkeepers').doc(uid).get(),
        ]);
        const owner = company.get('ownerId') === uid;
        return company.exists &&
          company.get('status') === 'active' &&
          (owner || grant.get('active') === true)
          ? {
              id: tenantId,
              name: company.get('name'),
              access: owner ? 'owner' : 'bookkeeper',
            }
          : null;
      })
    );
    return { companies: companies.filter(Boolean) };
  }
  if (input.tenantId !== undefined && input.tenantId !== actor.tenantId) {
    const tenantId = id(input.tenantId);
    const grant = await root(tenantId).collection('bookkeepers').doc(uid).get();
    if (actor.role !== 'employer' || grant.get('active') !== true)
      return fail(
        'permission-denied',
        'You do not have access to this company.'
      );
    actor = { ...actor, tenantId };
  }
  const company = root(actor.tenantId);
  const manager = actor.role === 'employer';
  // Recheck membership and delegated access inside every write transaction, including retries.
  const transact = <T>(body: (tx: admin.firestore.Transaction) => Promise<T>) =>
    db.runTransaction(async (tx) => {
      const fresh = await tx.get(accountRef(uid));
      const workspace = await tx.get(company);
      if (
        fresh.get('status') !== 'approved' ||
        workspace.get('status') !== 'active' ||
        fresh.get('role') !== actor.role
      )
        return fail(
          'permission-denied',
          'Active company membership is required.'
        );
      if (fresh.get('tenantId') !== actor.tenantId) {
        const grant = await tx.get(company.collection('bookkeepers').doc(uid));
        if (!manager || grant.get('active') !== true)
          return fail('permission-denied', 'Company access has been revoked.');
      }
      return body(tx);
    });
  if (input.action === 'bookkeeperAccess') {
    if (!manager)
      return fail('permission-denied', 'Employer access is required.');
    if ((await company.get()).get('ownerId') !== uid)
      return fail(
        'permission-denied',
        'Only the company owner can change bookkeeper access.'
      );
    const email = text(input.email, 'bookkeeper email', 254).toLowerCase();
    const target = await auth
      .getUserByEmail(email)
      .catch(() =>
        fail(
          'not-found',
          'Ask this bookkeeper to create and verify an employer account first.'
        )
      );
    const active = input.active;
    if (typeof active !== 'boolean' || target.uid === uid)
      return fail(
        'invalid-argument',
        'Choose another account and an access setting.'
      );
    await transact(async (tx) => {
      const [workspace, account] = await Promise.all([
        tx.get(company),
        tx.get(accountRef(target.uid)),
      ]);
      if (workspace.get('ownerId') !== uid)
        return fail(
          'permission-denied',
          'Only the company owner can change bookkeeper access.'
        );
      if (
        active &&
        (!target.emailVerified ||
          account.get('role') !== 'employer' ||
          account.get('status') !== 'approved')
      )
        return fail(
          'failed-precondition',
          'A verified, active employer account is required for bookkeeper access.'
        );
      const now = new Date().toISOString();
      tx.set(company.collection('bookkeepers').doc(target.uid), {
        active,
        email,
        updatedAt: now,
      });
      tx.set(accountRef(target.uid).collection('companies').doc(company.id), {
        active,
      });
      tx.create(company.collection('history').doc(), {
        employeeId: target.uid,
        actorId: uid,
        action: active
          ? 'bookkeeper_access_granted'
          : 'bookkeeper_access_revoked',
        createdAt: now,
      });
    });
    return { success: true };
  }
  if (input.action === 'feedback') {
    const message = text(input.message, 'feedback', 2000);
    const operationId = id(input.operationId);
    await transact(async (tx) => {
      const ref = company.collection('feedback').doc(`${uid}_${operationId}`);
      const existing = await tx.get(ref);
      if (existing.exists) {
        if (existing.get('message') !== message)
          return fail(
            'already-exists',
            'Operation identifier was already used.'
          );
        return;
      }
      tx.create(ref, {
        message,
        actorId: uid,
        role: actor.role,
        status: 'new',
        createdAt: new Date().toISOString(),
      });
    });
    return { success: true };
  }
  if (input.action === 'savePolicy') {
    if (!manager)
      return fail(
        'permission-denied',
        'Employer or bookkeeper access is required.'
      );
    const benefitYearStart = text(
      input.benefitYearStart,
      'benefit year start',
      10
    );
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(benefitYearStart) ||
      !Number.isFinite(Date.parse(benefitYearStart)) ||
      new Date(benefitYearStart).toISOString().slice(0, 10) !== benefitYearStart
    )
      return fail('invalid-argument', 'Enter a valid benefit year start date.');
    const method = input.method;
    if (method !== 'accrual' && method !== 'frontload' && method !== 'manual')
      return fail('invalid-argument', 'Choose a recordkeeping method.');
    const notes = text(input.notes, 'policy and recordkeeping notes', 2000);
    const operationId = id(input.operationId);
    const payloadHash = importDigest({ benefitYearStart, method, notes });
    await transact(async (tx) => {
      const [workspace, previous] = await Promise.all([
        tx.get(company),
        tx.get(company.collection('history').doc(`policy_${operationId}`)),
      ]);
      if (previous.exists) {
        if (
          previous.get('payloadHash') !== payloadHash ||
          previous.get('actorId') !== uid
        )
          return fail(
            'already-exists',
            'Operation identifier was already used.'
          );
        return;
      }
      const version = Number(workspace.get('policy.version') ?? 0);
      if (input.version !== version)
        return fail(
          'failed-precondition',
          'Another administrator changed the policy. Refresh before saving.'
        );
      const now = new Date().toISOString();
      const policy = {
        benefitYearStart,
        method,
        notes,
        version: version + 1,
        updatedAt: now,
        updatedBy: uid,
      };
      tx.update(company, { policy });
      tx.create(company.collection('history').doc(`policy_${operationId}`), {
        employeeId: uid,
        actorId: uid,
        action: 'company_policy_updated',
        payloadHash,
        previousPolicy: workspace.get('policy') ?? null,
        policy,
        createdAt: now,
      });
    });
    return { success: true };
  }
  if (input.action === 'previewImport' || input.action === 'commitImport') {
    if (!manager)
      return fail(
        'permission-denied',
        'Employer or bookkeeper access is required.'
      );
    let rows: ReturnType<typeof payrollRows>;
    try {
      rows = payrollRows(input.rows);
    } catch (error) {
      return fail('invalid-argument', (error as Error).message);
    }
    const operationId =
      input.action === 'commitImport' ? id(input.operationId) : '';
    return transact(async (tx) => {
      const receiptRef = company
        .collection('imports')
        .doc(operationId || 'preview');
      const receipt = operationId ? await tx.get(receiptRef) : null;
      const payloadHash = importDigest({
        rows,
        previewToken: input.previewToken ?? null,
      });
      if (receipt?.exists) {
        if (
          receipt.get('payloadHash') !== payloadHash ||
          receipt.get('actorId') !== uid
        )
          return fail(
            'already-exists',
            'Operation identifier was already used.'
          );
        return { success: true, count: receipt.get('count') };
      }
      // A bounded review covers the entire payroll directory to detect external-ID conflicts.
      const [directory, members] = await Promise.all([
        tx.get(company.collection('payrollEmployees').limit(1001)),
        tx.get(
          company
            .collection('members')
            .where('role', '==', 'employee')
            .limit(1001)
        ),
      ]);
      if (directory.size > 1000 || members.size > 1000)
        return fail(
          'resource-exhausted',
          'This company needs a larger-directory import workflow. Contact support.'
        );
      const review = rows.map((row) => {
        const existing = directory.docs.find((d) => d.id === hash(row.email));
        const conflicts = directory.docs.filter(
          (d) =>
            row.payrollId &&
            d.get('payrollId') === row.payrollId &&
            d.id !== hash(row.email)
        );
        const matches = members.docs.filter(
          (d) => String(d.get('email')).toLowerCase() === row.email
        );
        return {
          ...row,
          action: existing ? 'update' : 'create',
          previous: existing?.data() ?? null,
          employeeId: matches.length === 1 ? matches[0].id : null,
          conflict:
            conflicts.length > 0
              ? 'Payroll ID already belongs to another email. Correct the source file.'
              : matches.length > 1
                ? 'More than one account matches this email.'
                : null,
        };
      });
      const previewToken = importDigest(review);
      if (input.action === 'previewImport') return { review, previewToken };
      if (input.previewToken !== previewToken)
        return fail(
          'failed-precondition',
          'Company records changed. Review the import again before saving.'
        );
      if (review.some((row) => row.conflict))
        return fail(
          'failed-precondition',
          'Resolve all matching conflicts before saving.'
        );
      const now = new Date().toISOString();
      for (const row of review)
        tx.set(company.collection('payrollEmployees').doc(hash(row.email)), {
          name: row.name,
          email: row.email,
          payrollId: row.payrollId,
          employeeId: row.employeeId,
          version: Number(row.previous?.version ?? 0) + 1,
          updatedAt: now,
          updatedBy: uid,
        });
      tx.create(receiptRef, {
        payloadHash,
        actorId: uid,
        count: review.length,
        createdAt: now,
      });
      tx.create(company.collection('history').doc(`import_${operationId}`), {
        employeeId: uid,
        actorId: uid,
        action: 'payroll_roster_imported',
        reason: `${review.length} reviewed employee records imported; balances unchanged.`,
        createdAt: now,
      });
      return { success: true, count: review.length };
    });
  }
  if (input.action === 'workspace') {
    const requestsQuery = manager
      ? company.collection('requests')
      : company.collection('requests').where('employeeId', '==', uid);
    const historyQuery = manager
      ? company.collection('history')
      : company.collection('history').where('employeeId', '==', uid);
    const [
      companyDoc,
      members,
      requests,
      history,
      balances,
      payroll,
      bookkeepers,
      feedback,
    ] = await Promise.all([
      company.get(),
      manager
        ? company.collection('members').limit(200).get()
        : company.collection('members').where('id', '==', uid).get(),
      requestsQuery.limit(200).get(),
      historyQuery.limit(200).get(),
      manager
        ? company.collection('balances').limit(200).get()
        : company.collection('balances').where('employeeId', '==', uid).get(),
      manager
        ? company
            .collection('payrollEmployees')
            .orderBy('email')
            .limit(200)
            .get()
        : null,
      manager
        ? company
            .collection('bookkeepers')
            .where('active', '==', true)
            .limit(200)
            .get()
        : null,
      manager
        ? company
            .collection('feedback')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get()
        : null,
    ]);
    const rows = (s: admin.firestore.QuerySnapshot) =>
      s.docs.map((d) => ({ ...d.data(), id: d.id }));
    return {
      companyName: companyDoc.get('name'),
      tenantId: company.id,
      isOwner: companyDoc.get('ownerId') === uid,
      policy: companyDoc.get('policy') ?? null,
      companyCode: manager ? companyDoc.get('companyCode') : null,
      members: rows(members),
      requests: rows(requests),
      history: rows(history),
      balances: rows(balances),
      payrollEmployees: payroll ? rows(payroll) : [],
      bookkeepers:
        companyDoc.get('ownerId') === uid && bookkeepers
          ? rows(bookkeepers)
          : [],
      feedback: feedback ? rows(feedback) : [],
      limited: [members, requests, history, balances, payroll].some(
        (s) => s !== null && s.size >= 200
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
    await transact(async (tx) => {
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
    await transact(async (tx) => {
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
    await transact(async (tx) => {
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
    await transact(async (tx) => {
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
