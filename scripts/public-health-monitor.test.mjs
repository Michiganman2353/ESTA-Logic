import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRoute, runChecks, ROUTES } from './public-health-monitor.mjs';

const page = () => new Response('<!doctype html><html><body><div id="root"></div></body></html>', {
  status: 200,
  headers: { 'content-type': 'text/html; charset=utf-8' },
});

test('checks only the three public routes', async () => {
  const seen = [];
  const result = await runChecks(async (url) => {
    seen.push(new URL(url).pathname);
    return page();
  });
  assert.deepEqual(seen, ROUTES);
  assert.equal(result.healthy, true);
});

test('does not mistake a successful authentication challenge for the app', async () => {
  const result = await checkRoute('/', async () => new Response('<html>Sign in to Vercel</html>', {
    status: 200,
    headers: { 'content-type': 'text/html' },
  }));
  assert.equal(result.ok, false);
  assert.equal(result.failure, 'unexpected-page');
});

test('detects HTTP 5xx without logging response bodies', async () => {
  const result = await checkRoute('/', async () => new Response('sensitive stack trace', {
    status: 500,
    headers: { 'content-type': 'text/plain' },
  }));
  assert.equal(result.ok, false);
  assert.equal(result.status, 500);
  assert.equal(JSON.stringify(result).includes('sensitive'), false);
});

test('handles network failures with safe error categories', async () => {
  const result = await checkRoute('/', async () => { throw new Error('private details'); });
  assert.equal(result.ok, false);
  assert.equal(result.failure, 'request-failed');
  assert.equal(JSON.stringify(result).includes('private details'), false);
});
