import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import admin from 'firebase-admin';
if (
  process.env.GCLOUD_PROJECT !== 'demo-esta-workspace' ||
  !process.env.FIRESTORE_EMULATOR_HOST ||
  !process.env.FIREBASE_AUTH_EMULATOR_HOST
)
  throw new Error('Demo emulators required');
let server;
if (process.env.WORKSPACE_HTTP_HARNESS === 'true') {
  const require = createRequire(import.meta.url);
  const express = require('express');
  const { workspaceApi } = require('../../functions/lib/workspace.js');
  const handler = express();
  handler.use(express.json());
  handler.use(workspaceApi);
  server = createServer(handler);
  await new Promise((resolve) => server.listen(5001, '127.0.0.1', resolve));
}
const vite = spawn(
  './node_modules/.bin/vite',
  [
    '--config',
    'apps/frontend/vite.config.ts',
    '--host',
    '127.0.0.1',
    '--port',
    '5173',
  ],
  {
    env: {
      ...process.env,
      VITE_FIREBASE_API_KEY: 'demo-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'demo-esta-workspace.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'demo-esta-workspace',
      VITE_FIREBASE_STORAGE_BUCKET: 'demo-esta-workspace.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '123',
      VITE_FIREBASE_APP_ID: 'demo-app',
      VITE_USE_FIREBASE_EMULATORS: 'true',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  }
);
vite.stderr.on('data', (chunk) => process.stderr.write(chunk));
let browser;
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch('http://127.0.0.1:5173')).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    headless: true,
    args: ['--no-sandbox'],
  });
  const manager = await browser.newPage();
  const employee = await browser.newPage();
  manager.setDefaultTimeout(30000);
  employee.setDefaultTimeout(30000);
  // Existing emulator identities from the integration suite exercise persisted sessions.
  async function login(page, email) {
    await page.goto('http://127.0.0.1:5173/login', {
      waitUntil: 'domcontentloaded',
    });
    await page.getByPlaceholder('Email address').fill(email);
    await page
      .getByPlaceholder('Password', { exact: true })
      .fill('TestPassword123!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  }
  await login(manager, 'ownerA@example.test');
  await manager.waitForURL('**/dashboard');
  await manager.goto('http://127.0.0.1:5173/employer', {
    waitUntil: 'domcontentloaded',
  });
  await manager
    .getByRole('heading', { name: 'Employee directory', exact: true })
    .waitFor();
  await login(employee, 'workerA@example.test');
  await employee.waitForURL('**/dashboard');
  await employee.goto('http://127.0.0.1:5173/employee', {
    waitUntil: 'domcontentloaded',
  });
  await employee.getByText('3 hours', { exact: true }).waitFor();
  await employee.reload({ waitUntil: 'domcontentloaded' });
  await employee.getByText('3 hours', { exact: true }).waitFor();
  await employee.getByRole('tab', { name: 'My requests', exact: true }).click();
  await employee.getByLabel('Leave date').fill('2026-12-15');
  await employee.getByLabel('Requested hours').fill('1');
  await employee
    .getByRole('button', { name: 'Submit request', exact: true })
    .click();
  await employee.getByText('Saved successfully.', { exact: true }).waitFor();
  await manager.getByRole('button', { name: 'Refresh', exact: true }).click();
  await manager
    .getByRole('tab', { name: 'Leave requests', exact: true })
    .click();
  const row = manager.locator('li').filter({ hasText: '2026-12-15' });
  await row.getByLabel('Decision reason').fill('Verified browser test');
  await row.getByRole('button', { name: 'Approve', exact: true }).click();
  await manager.getByText('Saved successfully.', { exact: true }).waitFor();
  await employee.reload({ waitUntil: 'domcontentloaded' });
  await employee.getByText('2 hours', { exact: true }).waitFor();
  await manager
    .getByRole('tab', { name: 'Program setup', exact: true })
    .click();
  await manager
    .getByLabel('Policy and process notes')
    .fill('Browser verified company process.');
  await manager
    .getByRole('button', { name: 'Save program settings', exact: true })
    .click();
  await manager.getByText('Program settings saved.', { exact: true }).waitFor();
  await manager.reload({ waitUntil: 'domcontentloaded' });
  await manager
    .getByRole('tab', { name: 'Program setup', exact: true })
    .click();
  assert.equal(
    await manager.getByLabel('Policy and process notes').inputValue(),
    'Browser verified company process.'
  );
  await manager
    .getByRole('tab', { name: 'Bookkeeper access', exact: true })
    .click();
  await manager
    .getByLabel('Bookkeeper account email')
    .fill('ownerB@example.test');
  await manager
    .getByRole('button', { name: 'Grant company access', exact: true })
    .click();
  await manager
    .getByText('Bookkeeper access granted.', { exact: true })
    .waitFor();
  const bookkeeper = await browser.newPage();
  await login(bookkeeper, 'ownerB@example.test');
  await bookkeeper.waitForURL('**/dashboard');
  await bookkeeper.goto('http://127.0.0.1:5173/companies', {
    waitUntil: 'domcontentloaded',
  });
  await bookkeeper
    .getByRole('link', { name: /ownerA.*Bookkeeper access/ })
    .click();
  await bookkeeper
    .getByRole('heading', { name: 'Employee directory', exact: true })
    .waitFor();
  assert.equal(
    await bookkeeper
      .getByRole('tab', { name: 'Bookkeeper access', exact: true })
      .count(),
    0
  );
  await bookkeeper
    .getByRole('tab', { name: 'Payroll import', exact: true })
    .click();
  await bookkeeper
    .getByLabel('Payroll CSV')
    .setInputFiles({
      name: 'quickbooks-roster.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(
        'name,email,payrollId\nBrowser Employee,browser@example.test,QB-browser'
      ),
    });
  await bookkeeper
    .getByRole('button', { name: 'Review 1 employee records', exact: true })
    .click();
  await bookkeeper
    .getByRole('heading', {
      name: 'Review every match before saving',
      exact: true,
    })
    .waitFor();
  assert.equal(
    await bookkeeper
      .getByRole('button', { name: 'Save reviewed import', exact: true })
      .isDisabled(),
    true
  );
  await bookkeeper.getByRole('checkbox').check();
  await bookkeeper
    .getByRole('button', { name: 'Save reviewed import', exact: true })
    .click();
  await bookkeeper
    .getByText('1 employee records saved.', { exact: false })
    .waitFor();
  await bookkeeper.reload({ waitUntil: 'domcontentloaded' });
  await bookkeeper
    .getByRole('tab', { name: 'Payroll import', exact: true })
    .click();
  await bookkeeper
    .getByText(/Browser Employee · browser@example.test/)
    .waitFor();
  await manager
    .getByRole('button', { name: 'Revoke access', exact: true })
    .click();
  await manager
    .getByText('Bookkeeper access revoked.', { exact: true })
    .waitFor();
  await bookkeeper.reload({ waitUntil: 'domcontentloaded' });
  await bookkeeper
    .getByRole('alert')
    .filter({ hasText: 'You do not have access to this company.' })
    .waitFor();
  await employee.getByRole('tab', { name: 'Feedback', exact: true }).click();
  await employee
    .getByLabel('What should we improve?')
    .fill('Show clearer explanations of recorded balances.');
  await employee
    .getByRole('button', { name: 'Send feedback', exact: true })
    .click();
  await employee
    .getByText('Feedback saved for your company administrators. Thank you.', {
      exact: true,
    })
    .waitFor();
  await employee.goto('http://127.0.0.1:5173/employer', {
    waitUntil: 'domcontentloaded',
  });
  await employee.getByRole('heading', { name: /Welcome back/ }).waitFor();
  assert.equal(
    await employee.getByRole('button', { name: 'Approve membership' }).count(),
    0
  );
  await employee.getByRole('button', { name: 'Sign out', exact: true }).click();
  await employee
    .getByRole('link', { name: 'Log in', exact: true })
    .first()
    .waitFor();
  await employee.goto('http://127.0.0.1:5173/learn', {
    waitUntil: 'domcontentloaded',
  });
  await employee
    .getByRole('heading', {
      name: 'Understand ESTA. Set up a practical process.',
      exact: true,
    })
    .waitFor();
  await employee
    .getByRole('link', { name: 'Set up company records', exact: true })
    .waitFor();
  console.log(
    'PASS browser: login, persisted policy and balances, request, approval, company switch, reviewed payroll import, bookkeeper revocation, feedback, role route, sign-out, employer guide'
  );
} finally {
  await browser?.close();
  vite.kill('SIGTERM');
  if (server) await new Promise((resolve) => server.close(resolve));
  await Promise.all(admin.apps.map((app) => app.delete()));
}
