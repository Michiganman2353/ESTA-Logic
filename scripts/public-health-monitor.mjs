#!/usr/bin/env node
/**
 * Public-site-only smoke checks. Never request authenticated routes, cookies,
 * Firebase records, or response bodies for logging.
 */
import { pathToFileURL } from 'node:url';

export const ROUTES = Object.freeze(['/', '/guided-flow', '/pricing']);

export async function checkRoute(route, fetchImpl = fetch, origin = 'https://www.estatracker.com') {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const url = new URL(route, origin);
    const response = await fetchImpl(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'esta-logic-public-health-monitor/1.0' },
    });
    const type = response.headers.get('content-type') || '';
    // The SPA uses a shared index document. Checking its mount point detects
    // an auth challenge/error page returned with HTTP 200.
    const html = response.ok && type.includes('text/html')
      ? await response.text() : '';
    const hasAppMount = /<div[^>]+id=["']root["']/i.test(html);
    return {
      route,
      status: response.status,
      ok: response.ok && type.includes('text/html') && hasAppMount,
      elapsedMs: Date.now() - start,
      failure: response.ok && !hasAppMount ? 'unexpected-page' :
        response.ok ? null : 'http-error',
    };
  } catch (error) {
    return {
      route,
      status: null,
      ok: false,
      elapsedMs: Date.now() - start,
      failure: error?.name === 'AbortError' ? 'timeout' : 'request-failed',
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function runChecks(fetchImpl = fetch, origin = 'https://www.estatracker.com') {
  const routes = [];
  for (const route of ROUTES) {
    routes.push(await checkRoute(route, fetchImpl, origin));
  }
  return {
    schemaVersion: 1,
    checkedAt: new Date().toISOString(),
    site: origin,
    healthy: routes.every((route) => route.ok),
    routes,
  };
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {
  const report = await runChecks();
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (!report.healthy) process.exitCode = 1;
}
