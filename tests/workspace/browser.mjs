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
const require = createRequire(import.meta.url);
const express = require('express');
const { workspaceApi } = require('../../functions/lib/workspace.js');
const handler = express();
handler.use(express.json());
handler.use(workspaceApi);
const server = createServer(handler);
await new Promise((resolve) => server.listen(5001, '127.0.0.1', resolve));
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
    stdio: 'ignore',
  }
);
let browser;
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch('http://127.0.0.1:5173')).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox'],
  });
  const manager = await browser.newPage();
  const employee = await browser.newPage();
  manager.setDefaultTimeout(20000);
  employee.setDefaultTimeout(20000);
  // Existing emulator identities from the integration suite exercise persisted sessions.
  async function login(page, email) {
    await page.goto('http://127.0.0.1:5173/login');
    await page.getByPlaceholder('Email address').fill(email);
    await page
      .getByPlaceholder('Password', { exact: true })
      .fill('TestPassword123!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  }
  await login(manager, 'ownerA@example.test');
  await manager.goto('http://127.0.0.1:5173/employer');
  await manager
    .getByRole('heading', { name: 'Employee directory', exact: true })
    .waitFor();
  await login(employee, 'workerA@example.test');
  await employee.goto('http://127.0.0.1:5173/employee');
  await employee.getByText('3 hours', { exact: true }).waitFor();
  await employee.reload();
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
  await employee.reload();
  await employee.getByText('2 hours', { exact: true }).waitFor();
  await employee.goto('http://127.0.0.1:5173/employer');
  await employee.getByRole('heading', { name: /Welcome back/ }).waitFor();
  assert.equal(
    await employee.getByRole('button', { name: 'Approve membership' }).count(),
    0
  );
  await employee.getByRole('button', { name: 'Sign out', exact: true }).click();
  await employee
    .getByRole('link', { name: 'Sign in', exact: true })
    .first()
    .waitFor();
  console.log(
    'PASS browser: login, refresh persistence, request, approval, balance, role route, sign-out'
  );
} finally {
  await browser?.close();
  vite.kill('SIGTERM');
  await new Promise((resolve) => server.close(resolve));
  await Promise.all(admin.apps.map((app) => app.delete()));
}
