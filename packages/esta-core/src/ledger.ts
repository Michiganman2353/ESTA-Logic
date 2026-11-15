/**
 * Deterministic, storage-agnostic sick-time event replay.
 *
 * This is a model and validation primitive, NOT a persistence layer or a
 * legal eligibility engine. Server-only code must enforce tenant membership,
 * atomic append/idempotency, and authoritative ruleset calculations.
 */
export type LedgerKind = 'accrual' | 'frontload' | 'carryover' | 'usage' | 'adjustment';

export interface LedgerInput {
  schemaVersion: 1;
  entryId: string;
  idempotencyKey: string;
  tenantId: string;
  employeeId: string;
  benefitYear: string;
  effectiveDate: string;
  recordedAt: string;
  rulesetVersion: string;
  actorId: string;
  kind: LedgerKind;
  hours: number;
  reason?: string;
  referenceEntryId?: string;
}

export interface LedgerEntry extends LedgerInput {
  sequence: number;
  previousBalance: number;
  resultingBalance: number;
}

export interface LedgerSnapshot {
  tenantId: string;
  employeeId: string;
  benefitYear: string;
  balance: number;
  lastSequence: number;
  count: number;
}

const SCALE = 1_000_000;

function micros(hours: number): number {
  if (!Number.isFinite(hours) || Math.abs(hours) > 1_000_000) {
    throw new Error('hours must be finite and within safe ledger bounds');
  }
  const value = Math.round(hours * SCALE);
  if (!Number.isSafeInteger(value)) throw new Error('hours exceed safe precision');
  return value;
}

function requireText(value: string | undefined, key: string): void {
  if (typeof value !== 'string' || !value.trim() || value.length > 256) {
    throw new Error(`${key} is required and must be at most 256 characters`);
  }
}

function validateInput(entry: LedgerInput): void {
  if (entry.schemaVersion !== 1) throw new Error('Unsupported ledger schema');
  for (const field of [
    'entryId', 'idempotencyKey', 'tenantId', 'employeeId', 'benefitYear',
    'effectiveDate', 'recordedAt', 'rulesetVersion', 'actorId',
  ] as const) {
    requireText(entry[field], field);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.effectiveDate)) {
    throw new Error('effectiveDate must use YYYY-MM-DD');
  }
  if (Number.isNaN(Date.parse(entry.recordedAt))) {
    throw new Error('recordedAt must be an ISO-compatible timestamp');
  }
  if (!(['accrual', 'frontload', 'carryover', 'usage', 'adjustment'] as string[])
    .includes(entry.kind)) {
    throw new Error('Unknown ledger kind');
  }
  const delta = micros(entry.hours);
  if (entry.kind !== 'adjustment' && delta <= 0) {
    throw new Error('Positive hours required for non-adjustment events');
  }
  if (entry.kind === 'adjustment') {
    if (delta === 0) throw new Error('Zero adjustment not allowed');
    requireText(entry.reason, 'adjustment reason');
    requireText(entry.referenceEntryId, 'referenceEntryId');
  }
}

function signedDelta(entry: LedgerInput): number {
  const value = micros(entry.hours);
  return entry.kind === 'usage' ? -value : value;
}

/** Fail closed if a stored event was changed, skipped, duplicated or re-scoped. */
export function replayLedger(entries: readonly LedgerEntry[]): LedgerSnapshot | null {
  if (entries.length === 0) return null;
  let running = 0;
  const ids = new Set<string>();
  const keys = new Set<string>();
  const scope = entries[0];
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    validateInput(entry);
    if (entry.sequence !== index + 1) throw new Error('Ledger sequence gap or reordering');
    if (entry.tenantId !== scope.tenantId ||
        entry.employeeId !== scope.employeeId ||
        entry.benefitYear !== scope.benefitYear) {
      throw new Error('Mixed tenant, employee, or benefit-year ledger');
    }
    if (ids.has(entry.entryId) || keys.has(entry.idempotencyKey)) {
      throw new Error('Duplicate ledger entry or idempotency key');
    }
    ids.add(entry.entryId);
    keys.add(entry.idempotencyKey);
    if (micros(entry.previousBalance) !== running) {
      throw new Error('Stored previousBalance does not match replay');
    }
    running += signedDelta(entry);
    if (running < 0) throw new Error('Ledger balance cannot be negative');
    if (!Number.isSafeInteger(running) || micros(entry.resultingBalance) !== running) {
      throw new Error('Stored resultingBalance does not match replay');
    }
  }
  return {
    tenantId: scope.tenantId,
    employeeId: scope.employeeId,
    benefitYear: scope.benefitYear,
    balance: running / SCALE,
    lastSequence: entries.length,
    count: entries.length,
  };
}

/**
 * Returns the proposed next immutable event; caller must persist it
 * atomically with an idempotency constraint in an authenticated backend.
 */
export function appendLedgerEvent(
  existing: readonly LedgerEntry[],
  input: LedgerInput
): LedgerEntry {
  validateInput(input);
  const before = replayLedger(existing);
  if (before && (before.tenantId !== input.tenantId ||
      before.employeeId !== input.employeeId ||
      before.benefitYear !== input.benefitYear)) {
    throw new Error('Ledger scope mismatch');
  }
  if (existing.some((entry) =>
    entry.entryId === input.entryId || entry.idempotencyKey === input.idempotencyKey)) {
    throw new Error('Duplicate ledger entry or idempotency key');
  }
  if (input.kind === 'adjustment' &&
      !existing.some((entry) => entry.entryId === input.referenceEntryId)) {
    throw new Error('Adjustment must reference an existing entry');
  }
  const previous = micros(before?.balance ?? 0);
  const resulting = previous + signedDelta(input);
  if (resulting < 0 || !Number.isSafeInteger(resulting)) {
    throw new Error('Insufficient hours or unsafe ledger balance');
  }
  return Object.freeze({
    ...input,
    sequence: existing.length + 1,
    previousBalance: previous / SCALE,
    resultingBalance: resulting / SCALE,
  });
}
