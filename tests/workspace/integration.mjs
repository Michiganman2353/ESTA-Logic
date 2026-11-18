import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';
import admin from 'firebase-admin';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';

const project = 'demo-esta-workspace';
if (
  process.env.GCLOUD_PROJECT !== project ||
  !process.env.FIRESTORE_EMULATOR_HOST ||
  !process.env.FIREBASE_AUTH_EMULATOR_HOST
) {
  throw new Error('These tests require the isolated demo Firebase emulators.');
}
let server;
if (process.env.WORKSPACE_HTTP_HARNESS === 'true') {
  const require = createRequire(import.meta.url);
  const { workspaceApi } = require('../../functions/lib/workspace.js');
  const express = require('express');
  const handler = express();
  handler.use(express.json());
  handler.use(workspaceApi);
  server = createServer(handler);
  await new Promise((resolve) => server.listen(5001, '127.0.0.1', resolve));
}
const app = admin.initializeApp({ projectId: project }, 'integration');
const auth = app.auth();
const db = app.firestore();
const users = {};
async function user(uid, verified = true) {
  await auth.createUser({
    uid,
    email: `${uid}@example.test`,
    password: 'TestPassword123!',
    emailVerified: verified,
  });
  const response = await fetch(
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: `${uid}@example.test`,
        password: 'TestPassword123!',
        returnSecureToken: true,
      }),
    }
  );
  const body = await response.json();
  assert.ok(body.idToken);
  users[uid] = body.idToken;
}
async function call(uid, action, input = {}) {
  const response = await fetch(
    `http://127.0.0.1:5001/${project}/us-central1/workspaceApi`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(uid ? { authorization: `Bearer ${users[uid]}` } : {}),
      },
      body: JSON.stringify({ data: { ...input, action } }),
    }
  );
  const result = await response.json();
  if (result.error)
    throw Object.assign(new Error(result.error.message), {
      code: result.error.status,
    });
  return result.result;
}
const denied = (promise) =>
  assert.rejects(promise, (e) =>
    [
      'PERMISSION_DENIED',
      'UNAUTHENTICATED',
      'NOT_FOUND',
      'FAILED_PRECONDITION',
      'ALREADY_EXISTS',
      'INVALID_ARGUMENT',
    ].includes(e.code)
  );
let codeA;
before(async () => {
  await fetch(
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${project}/accounts`,
    { method: 'DELETE' }
  );
  await fetch(
    `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${project}/databases/(default)/documents`,
    { method: 'DELETE' }
  );
  for (const uid of [
    'ownerA',
    'ownerB',
    'workerA',
    'workerB',
    'unverified',
    'outsider',
  ])
    await user(uid, uid !== 'unverified');
  for (const uid of ['ownerA', 'ownerB'])
    await call(uid, 'register', {
      kind: 'employer',
      name: uid,
      companyName: uid,
      employeeCount: 10,
    });
  codeA = (await call('ownerA', 'workspace')).companyCode;
  const codeB = (await call('ownerB', 'workspace')).companyCode;
  for (const [uid, code] of [
    ['workerA', codeA],
    ['workerB', codeB],
    ['unverified', codeA],
  ])
    await call(uid, 'register', {
      kind: 'employee',
      name: uid,
      companyCode: code,
    });
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await Promise.all(admin.apps.map((instance) => instance.delete()));
});

test('bookkeeper access is company-specific, owner-controlled and revocable', async () => {
  await denied(call('ownerB', 'workspace', { tenantId: 'company_ownerA' }));
  await denied(call('workerA', 'companies'));
  await call('ownerA', 'bookkeeperAccess', {
    email: 'ownerB@example.test',
    active: true,
  });
  const companies = (await call('ownerB', 'companies')).companies;
  assert.equal(companies.length, 2);
  assert.equal(
    companies.find((row) => row.id === 'company_ownerA').access,
    'bookkeeper'
  );
  const client = await call('ownerB', 'workspace', {
    tenantId: 'company_ownerA',
  });
  assert.equal(client.companyName, 'ownerA');
  assert.equal(client.isOwner, false);
  assert.deepEqual(client.bookkeepers, []);
  await denied(
    call('ownerB', 'bookkeeperAccess', {
      tenantId: 'company_ownerA',
      email: 'outsider@example.test',
      active: true,
    })
  );
  await call('ownerA', 'bookkeeperAccess', {
    email: 'ownerB@example.test',
    active: false,
  });
  assert.equal((await call('ownerB', 'companies')).companies.length, 1);
  await denied(call('ownerB', 'workspace', { tenantId: 'company_ownerA' }));
  await denied(
    call('ownerB', 'feedback', {
      tenantId: 'company_ownerA',
      operationId: 'revoked',
      message: 'No access',
    })
  );
});

test('payroll review detects duplicates, conflicts, stale reviews and retries without changing balances', async () => {
  const rows = [
    { name: 'Worker A', email: 'workerA@example.test', payrollId: 'PAY-01' },
  ];
  const before = (await call('ownerA', 'workspace')).balances;
  await denied(call('workerA', 'previewImport', { rows }));
  await denied(
    call('ownerA', 'previewImport', {
      rows: [...rows, { ...rows[0], email: 'WORKERA@example.test' }],
    })
  );
  const preview = await call('ownerA', 'previewImport', { rows });
  assert.equal(preview.review[0].action, 'create');
  assert.equal(preview.review[0].employeeId, 'workerA');
  const input = {
    rows,
    previewToken: preview.previewToken,
    operationId: 'roster-first',
  };
  await denied(call('ownerB', 'commitImport', input));
  await call('ownerA', 'commitImport', input);
  await call('ownerA', 'commitImport', input);
  await denied(
    call('ownerA', 'commitImport', {
      ...input,
      rows: [{ ...rows[0], name: 'Changed' }],
    })
  );
  const records = await call('ownerA', 'workspace');
  assert.equal(records.payrollEmployees.length, 1);
  assert.deepEqual(records.balances, before);
  assert.equal(
    records.history.filter((row) => row.action === 'payroll_roster_imported')
      .length,
    1
  );
  const conflict = await call('ownerA', 'previewImport', {
    rows: [
      { name: 'Different', email: 'other@example.test', payrollId: 'PAY-01' },
    ],
  });
  assert.match(conflict.review[0].conflict, /another email/);
  await denied(
    call('ownerA', 'commitImport', {
      rows: [
        { name: 'Different', email: 'other@example.test', payrollId: 'PAY-01' },
      ],
      previewToken: conflict.previewToken,
      operationId: 'conflict',
    })
  );
  const changedRows = [{ ...rows[0], name: 'Corrected name' }];
  const review = await call('ownerA', 'previewImport', { rows: changedRows });
  await call('ownerA', 'commitImport', {
    rows: changedRows,
    previewToken: review.previewToken,
    operationId: 'roster-update',
  });
  await denied(
    call('ownerA', 'commitImport', {
      rows: changedRows,
      previewToken: review.previewToken,
      operationId: 'stale-review',
    })
  );
  assert.equal((await call('ownerB', 'workspace')).payrollEmployees.length, 0);
});

test('authorized bookkeepers import only into granted companies and feedback is persisted once', async () => {
  await call('ownerA', 'bookkeeperAccess', {
    email: 'ownerB@example.test',
    active: true,
  });
  const rows = [
    {
      name: 'Payroll only',
      email: 'payroll@example.test',
      payrollId: 'PAY-02',
    },
  ];
  const review = await call('ownerB', 'previewImport', {
    tenantId: 'company_ownerA',
    rows,
  });
  assert.equal(review.review[0].employeeId, null);
  await call('ownerB', 'commitImport', {
    tenantId: 'company_ownerA',
    rows,
    previewToken: review.previewToken,
    operationId: 'client-import',
  });
  await call('ownerA', 'feedback', {
    message: 'Please improve the balance explanation.',
    operationId: 'feedback-1',
  });
  await call('ownerA', 'feedback', {
    message: 'Please improve the balance explanation.',
    operationId: 'feedback-1',
  });
  await denied(
    call('ownerA', 'feedback', {
      message: 'Different message',
      operationId: 'feedback-1',
    })
  );
  assert.equal((await call('ownerA', 'workspace')).feedback.length, 1);
  assert.equal((await call('ownerB', 'workspace')).feedback.length, 0);
  await call('ownerA', 'bookkeeperAccess', {
    email: 'ownerB@example.test',
    active: false,
  });
  await denied(
    call('ownerB', 'commitImport', {
      tenantId: 'company_ownerA',
      rows,
      previewToken: review.previewToken,
      operationId: 'after-revoke',
    })
  );
});

test('unauthenticated and unapproved callers cannot read records', async () => {
  await denied(call(null, 'workspace'));
  await denied(call('workerA', 'workspace'));
  await denied(call('outsider', 'workspace'));
});

test('program settings are versioned, audited, tenant-scoped and retry-safe', async () => {
  const input = {
    benefitYearStart: '2026-01-01',
    method: 'manual',
    notes: 'Opening balances come from payroll; the owner reviews requests.',
    version: 0,
    operationId: 'policy-v1',
  };
  await denied(call('workerA', 'savePolicy', input));
  await denied(
    call('ownerA', 'savePolicy', { ...input, benefitYearStart: '2026-02-30' })
  );
  await call('ownerA', 'savePolicy', input);
  await call('ownerA', 'savePolicy', input);
  await denied(
    call('ownerA', 'savePolicy', { ...input, notes: 'Changed content' })
  );
  await denied(
    call('ownerA', 'savePolicy', { ...input, operationId: 'stale-policy' })
  );
  assert.equal((await call('ownerA', 'workspace')).policy.version, 1);
  assert.equal((await call('ownerB', 'workspace')).policy, null);
});
test('membership requires verified email and the correct employer', async () => {
  await denied(call('ownerA', 'approveMember', { employeeId: 'workerB' }));
  await denied(call('ownerA', 'approveMember', { employeeId: 'unverified' }));
  await call('ownerA', 'approveMember', { employeeId: 'workerA' });
  await call('ownerB', 'approveMember', { employeeId: 'workerB' });
  await denied(call('workerA', 'approveMember', { employeeId: 'workerB' }));
  const account = await call('workerA', 'account');
  assert.equal(account.account.status, 'approved');
  assert.equal(
    (await auth.getUser('workerA')).customClaims.tenantId,
    'company_ownerA'
  );
});
test('duplicate enrollment cannot move the account or escalate its role', async () => {
  await call('workerA', 'register', {
    kind: 'employee',
    name: 'Changed',
    companyCode: (await call('ownerB', 'workspace')).companyCode,
  });
  assert.equal(
    (await call('workerA', 'account')).account.tenantId,
    'company_ownerA'
  );
  await denied(
    call('workerA', 'register', {
      kind: 'employer',
      name: 'Changed',
      companyName: 'Hijack',
      employeeCount: 2,
    })
  );
});
test('balance adjustments are scoped, validated and idempotent under concurrency', async () => {
  await denied(
    call('workerA', 'adjustBalance', {
      employeeId: 'workerA',
      minutes: 600,
      reason: 'self',
      operationId: 'self',
    })
  );
  await denied(
    call('ownerB', 'adjustBalance', {
      employeeId: 'workerA',
      minutes: 600,
      reason: 'cross',
      operationId: 'cross',
    })
  );
  const payload = {
    employeeId: 'workerA',
    minutes: 600,
    reason: 'Opening balance from approved payroll',
    operationId: 'opening',
  };
  await Promise.all([
    call('ownerA', 'adjustBalance', payload),
    call('ownerA', 'adjustBalance', payload),
  ]);
  assert.equal(
    (await call('workerA', 'workspace')).balances[0].bankMinutes,
    600
  );
  await denied(call('ownerA', 'adjustBalance', { ...payload, minutes: 601 }));
  await denied(
    call('ownerA', 'adjustBalance', {
      ...payload,
      operationId: 'negative',
      minutes: -601,
    })
  );
  await denied(
    call('ownerA', 'adjustBalance', {
      ...payload,
      operationId: 'fraction',
      minutes: 0.5,
    })
  );
});
test('requests and decisions persist once with matching audit and balance records', async () => {
  const payload = {
    date: '2026-12-01',
    minutes: 120,
    operationId: 'leave-one',
  };
  const first = await call('workerA', 'requestLeave', payload);
  await call('workerA', 'requestLeave', payload);
  await denied(
    call('workerA', 'requestLeave', {
      ...payload,
      date: '2026-02-30',
      operationId: 'bad-date',
    })
  );
  await denied(
    call('ownerB', 'decideLeave', {
      requestId: first.requestId,
      decision: 'approved',
      reason: 'Cross company',
      operationId: 'cross-decision',
    })
  );
  const decision = {
    requestId: first.requestId,
    decision: 'approved',
    reason: 'Reviewed policy and balance',
    operationId: 'decision-one',
  };
  await Promise.all([
    call('ownerA', 'decideLeave', decision),
    call('ownerA', 'decideLeave', decision),
  ]);
  const data = await call('workerA', 'workspace');
  assert.equal(data.balances[0].bankMinutes, 480);
  assert.equal(data.requests.length, 1);
  assert.equal(data.requests[0].status, 'approved');
  assert.equal(
    data.history.filter((e) => e.action === 'leave_approved').length,
    1
  );
  assert.equal((await call('workerB', 'workspace')).requests.length, 0);
  await denied(
    call('ownerA', 'decideLeave', { ...decision, decision: 'denied' })
  );
});
test('competing decisions cannot spend the same balance twice', async () => {
  const a = await call('workerA', 'requestLeave', {
    date: '2026-12-02',
    minutes: 300,
    operationId: 'race-a',
  });
  const b = await call('workerA', 'requestLeave', {
    date: '2026-12-03',
    minutes: 300,
    operationId: 'race-b',
  });
  const results = await Promise.allSettled(
    [a, b].map((r, i) =>
      call('ownerA', 'decideLeave', {
        requestId: r.requestId,
        decision: 'approved',
        reason: 'Reviewed',
        operationId: `race-${i}`,
      })
    )
  );
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(
    (await call('workerA', 'workspace')).balances[0].bankMinutes,
    180
  );
});
test('Firestore denies direct client reads and privilege writes', async () => {
  for (const token of [null, users.ownerA, users.workerA]) {
    const base = `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${project}/databases/(default)/documents`;
    const headers = {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    };
    const read = await fetch(`${base}/workspaceAccounts/workerA`, { headers });
    assert.equal(read.status, 403);
    const write = await fetch(`${base}/workspaceAccounts/workerA`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields: { role: { stringValue: 'admin' } } }),
    });
    assert.equal(write.status, 403);
  }
  assert.equal(
    (await db.doc('workspaceAccounts/workerA').get()).get('role'),
    'employee'
  );
});
