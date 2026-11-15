/**
 * Static regression checks for identity bootstrap and role/tenant trust.
 *
 * IMPORTANT: These are SOURCE checks, not Firebase Rules integration tests.
 * They do not prove authorization behavior. Emulator cross-tenant tests and
 * coordinated staging rollout remain mandatory before deployment.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const functions = readFileSync(new URL('../functions/src/index.ts', import.meta.url), 'utf8');

function ruleSegment(collection) {
  const marker = 'match /' + collection;
  const start = rules.indexOf(marker);
  assert.notEqual(start, -1, 'missing Firestore collection rule: ' + collection);
  return rules.slice(start, start + 700);
}

test('client cannot create identity, employer, tenant, or audit bootstrap records', () => {
  for (const collection of ['users/{userId}', 'employerProfiles/{employerId}', 'tenants/{tenantId}', 'auditLogs/{logId}']) {
    assert.match(ruleSegment(collection), /allow create:\s*if false\s*;/, collection + ' must deny client creation');
  }
});

test('authorization reads signed claim role and tenant, not editable user profiles', () => {
  assert.match(rules, /function isRole\(role\)\s*\{[^}]*request\.auth\.token\.role\s*==\s*role/s);
  assert.match(rules, /function belongsToTenant\(tenantId\)\s*\{[^}]*request\.auth\.token\.tenantId\s*==\s*tenantId/s);
  assert.doesNotMatch(rules, /function getUserData\(/, 'no rules authorization via potentially mutable user data');
});

test('new accounts start pending rather than inheriting client-selected roles', () => {
  const start = functions.indexOf('export const onUserCreate');
  const end = functions.indexOf('export const refreshUserClaims', start);
  assert.ok(start >= 0 && end > start, 'user bootstrap function found');
  const bootstrap = functions.slice(start, end);
  assert.match(bootstrap, /setCustomUserClaims\(uid,\s*\{\s*role:\s*'pending'\s*\}\)/);
  assert.doesNotMatch(bootstrap, /userData\s*\??\.\s*(?:role|tenantId|employerId)/, 'never infer privileges from new user-submitted data');
});

test('refresh does not mint elevated claims from user records', () => {
  const start = functions.indexOf('export const refreshUserClaims');
  const end = functions.indexOf('export const setUserClaims', start);
  assert.ok(start >= 0 && end > start, 'claim refresh function found');
  const refresh = functions.slice(start, end);
  assert.doesNotMatch(refresh, /setCustomUserClaims\s*\(/);
  assert.match(refresh, /auth\.getUser\(context\.auth\.uid\)/);
});

test('admin claim assignment is allowlisted and does not accept the entire request object', () => {
  const start = functions.indexOf('export const setUserClaims');
  const end = functions.indexOf('export const cleanupUnverifiedAccounts', start);
  assert.ok(start >= 0 && end > start, 'admin claim assignment function found');
  const assignment = functions.slice(start, end);
  assert.match(assignment, /const validRole\s*=/);
  assert.match(assignment, /const validTenant\s*=/);
  assert.match(assignment, /const safeClaims:/);
  assert.match(assignment, /setCustomUserClaims\(uid,\s*safeClaims\)/);
  assert.doesNotMatch(assignment, /setCustomUserClaims\(uid,\s*claims\)/);
});

test('claim changes cannot self-elevate, cross tenants, or grant admin without platform authority', () => {
  const start = functions.indexOf('export const setUserClaims');
  const end = functions.indexOf('export const cleanupUnverifiedAccounts', start);
  const assignment = functions.slice(start, end);
  assert.match(assignment, /uid === operator\.uid/, 'no self-service authorization changes');
  assert.match(assignment, /operator\.token\.tenantId !== claims\.tenantId/, 'tenant-scoped grants must match caller tenant');
  assert.match(assignment, /claims\.role === 'admin' && !isPlatformOperator/, 'only platform operator can grant admin');
  assert.match(assignment, /operator\.token\.platformAdmin === true/, 'platform authority is a signed claim');
  assert.doesNotMatch(assignment.slice(assignment.indexOf('const safeClaims:')), /safeClaims\.platformAdmin\s*=/, 'platform operator bit must never be writable via this callable');
});
