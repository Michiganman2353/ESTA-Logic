import { describe, expect, it } from 'vitest';
import { appendLedgerEvent, replayLedger, type LedgerEntry, type LedgerInput } from './ledger';

const base = (entryId: string, kind: LedgerInput['kind'], hours: number): LedgerInput => ({
  schemaVersion: 1,
  entryId,
  idempotencyKey: 'source:' + entryId,
  tenantId: 'verified-tenant',
  employeeId: 'verified-employee',
  benefitYear: '2026',
  effectiveDate: '2026-11-14',
  recordedAt: '2026-11-14T12:00:00.000Z',
  rulesetVersion: 'mi-esta-test-v1',
  actorId: 'verified-actor',
  kind,
  hours,
});

describe('versioned sick-time ledger', () => {
  it('replays persisted accrual, frontload, and usage deterministically', () => {
    const a = appendLedgerEvent([], base('accrue-1', 'accrual', 1.333333));
    const b = appendLedgerEvent([a], base('frontload-1', 'frontload', 72));
    const c = appendLedgerEvent([a, b], base('usage-1', 'usage', 1));
    expect(replayLedger([a, b, c])).toMatchObject({
      balance: 72.333333,
      count: 3,
      lastSequence: 3,
    });
    expect(Object.isFrozen(c)).toBe(true);
  });

  it('rejects duplicate idempotency keys', () => {
    const first = appendLedgerEvent([], base('a', 'accrual', 1));
    const duplicate = { ...base('b', 'accrual', 1), idempotencyKey: first.idempotencyKey };
    expect(() => appendLedgerEvent([first], duplicate)).toThrow(/Duplicate/);
  });

  it('refuses negative balances rather than silently flooring to zero', () => {
    const a = appendLedgerEvent([], base('a', 'accrual', 2));
    expect(() => appendLedgerEvent([a], base('b', 'usage', 3)))
      .toThrow(/Insufficient hours/);
  });

  it('preserves corrections as independent traceable events', () => {
    const a = appendLedgerEvent([], base('a', 'accrual', 5));
    const correction: LedgerInput = {
      ...base('correct-a', 'adjustment', -2),
      reason: 'Verified correction to source timesheet',
      referenceEntryId: 'a',
    };
    const b = appendLedgerEvent([a], correction);
    expect(a.resultingBalance).toBe(5);
    expect(b.previousBalance).toBe(5);
    expect(replayLedger([a, b])?.balance).toBe(3);
    expect(() => appendLedgerEvent([], correction)).toThrow(/reference/);
  });

  it('rejects tampered historical balances and reordered entries', () => {
    const a = appendLedgerEvent([], base('a', 'accrual', 2));
    const b = appendLedgerEvent([a], base('b', 'accrual', 3));
    expect(() => replayLedger([{ ...a, resultingBalance: 200 }])).toThrow(/match replay/);
    expect(() => replayLedger([b, a])).toThrow(/sequence/);
  });

  it('does not combine records from distinct tenants or benefit years', () => {
    const a = appendLedgerEvent([], base('a', 'accrual', 2));
    expect(() => appendLedgerEvent([a], {
      ...base('b', 'accrual', 1), tenantId: 'unrelated-company',
    })).toThrow(/scope/);
    expect(() => appendLedgerEvent([a], {
      ...base('b', 'carryover', 1), benefitYear: '2027',
    })).toThrow(/scope/);
  });

  it('validates finite amounts and refuses undocumented adjustments', () => {
    expect(() => appendLedgerEvent([], base('a', 'accrual', Number.NaN)))
      .toThrow(/finite/);
    expect(() => appendLedgerEvent([], base('a', 'accrual', -1)))
      .toThrow(/Positive hours/);
    expect(() => appendLedgerEvent([], base('a', 'adjustment', 1)))
      .toThrow(/reason/);
    expect(replayLedger([] as LedgerEntry[])).toBeNull();
  });
});
