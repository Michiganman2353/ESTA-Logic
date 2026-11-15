import { describe, expect, it } from 'vitest';
import { appendLedgerEvent, type LedgerEntry, type LedgerInput } from './ledger';
import {
  rebuildBalance,
  verifyBalanceReceipt,
  detectBalanceDrift,
  type ReconstructionQuery,
} from './decision-intelligence';

const scope = {
  tenantId: 'tenant-demo',
  employeeId: 'employee-demo',
  benefitYear: '2026',
};

function input(
  id: string,
  kind: LedgerInput['kind'],
  hours: number,
  effectiveDate: string,
  recordedAt: string,
  additional: Partial<LedgerInput> = {}
): LedgerInput {
  return {
    schemaVersion: 1,
    entryId: id,
    idempotencyKey: 'input:' + id,
    ...scope,
    effectiveDate,
    recordedAt,
    rulesetVersion: 'example-ruleset-v1',
    actorId: 'server-verified-actor',
    kind,
    hours,
    ...additional,
  };
}

const fullQuery: ReconstructionQuery = {
  scope,
  effectiveThrough: '2026-12-31',
  knownAt: '2026-12-31T23:59:59.000Z',
};

function sample(): LedgerEntry[] {
  const a = appendLedgerEvent([], input('earned', 'accrual', 12, '2026-01-05', '2026-01-07T12:00:00.000Z'));
  const b = appendLedgerEvent([a], input('used', 'usage', 5, '2026-01-10', '2026-01-10T14:00:00.000Z'));
  const c = appendLedgerEvent([a, b], input('correction', 'adjustment', -2, '2026-01-05', '2026-03-04T12:00:00.000Z', {
    reason: 'Verified correction to example timecard',
    referenceEntryId: 'earned',
  }));
  return [a, b, c];
}

describe('decision intelligence: historical explainability', () => {
  it('reconstructs balances deterministically with explicit evidence', () => {
    const entries = sample();
    const receipt = rebuildBalance(entries, fullQuery);
    expect(receipt).toMatchObject({
      status: 'UNVERIFIED_MODEL',
      schemaVersion: 1,
      modeledBalanceHours: 5,
      ledgerHeadSequence: 3,
      scope,
      rulesetVersions: ['example-ruleset-v1'],
    });
    expect(receipt.evidence.map((e) => e.entryId)).toEqual(['earned', 'used', 'correction']);
    expect(receipt.evidence.map((e) => e.deltaHours)).toEqual([12, -5, -2]);
    expect(receipt.explanation).toMatch(/does not determine legal eligibility/i);
    expect(rebuildBalance(entries, fullQuery)).toEqual(receipt);
    expect(verifyBalanceReceipt(receipt, entries)).toEqual({
      matchesReplay: true,
      issues: [],
    });
  });

  it('keeps later-recorded corrections out of what was known earlier', () => {
    const entries = sample();
    const before = rebuildBalance(entries, {
      ...fullQuery,
      effectiveThrough: '2026-01-31',
      knownAt: '2026-02-01T00:00:00.000Z',
    });
    const after = rebuildBalance(entries, {
      ...fullQuery,
      effectiveThrough: '2026-01-31',
      knownAt: '2026-04-01T00:00:00.000Z',
    });
    expect(before.modeledBalanceHours).toBe(7);
    expect(before.evidence.map((e) => e.entryId)).toEqual(['earned', 'used']);
    expect(after.modeledBalanceHours).toBe(5);
    expect(after.evidence.map((e) => e.entryId)).toEqual(['earned', 'used', 'correction']);
    expect(verifyBalanceReceipt(before, entries).matchesReplay).toBe(true);
  });

  it('detects the difference between two knowledge snapshots without rewriting the old one', () => {
    const drift = detectBalanceDrift(
      sample(),
      { scope, effectiveThrough: '2026-01-31' },
      '2026-02-01T00:00:00.000Z',
      '2026-04-01T00:00:00.000Z'
    );
    expect(drift).toMatchObject({
      changed: true,
      previousModeledHours: 7,
      currentModeledHours: 5,
      deltaHours: -2,
      newlyConsideredEntryIds: ['correction'],
      removedEntryIds: [],
    });
    expect(drift.flags).toContain('BACKDATED_ENTRY');
  });

  it('does not count transactions effective after the requested date', () => {
    const result = rebuildBalance(sample(), {
      scope,
      effectiveThrough: '2026-01-08',
      knownAt: '2026-04-01T00:00:00.000Z',
    });
    expect(result.modeledBalanceHours).toBe(10);
    expect(result.evidence.map((e) => e.entryId)).toEqual(['earned', 'correction']);
  });

  it('flags mixed rule versions without silently resolving their legal validity', () => {
    const first = appendLedgerEvent([], input('a', 'accrual', 4, '2026-01-01', '2026-01-01T14:00:00.000Z'));
    const second = appendLedgerEvent([first], input('b', 'accrual', 2, '2026-07-01', '2026-07-01T14:00:00.000Z', {
      rulesetVersion: 'example-ruleset-v2',
    }));
    const receipt = rebuildBalance([first, second], fullQuery);
    expect(receipt.rulesetVersions).toEqual(['example-ruleset-v1', 'example-ruleset-v2']);
    expect(receipt.flags).toContain('MULTIPLE_RULESET_VERSIONS');
  });

  it('detects altered receipt values rather than treating them as proof', () => {
    const entries = sample();
    const receipt = rebuildBalance(entries, fullQuery);
    const tampered = { ...receipt, modeledBalanceHours: 80 };
    expect(verifyBalanceReceipt(tampered, entries)).toMatchObject({
      matchesReplay: false,
      issues: ['Receipt differs from recomputed ledger projection'],
    });
    expect(verifyBalanceReceipt(receipt, [{ ...entries[0]!, resultingBalance: 500 }, ...entries.slice(1)])).toMatchObject({
      matchesReplay: false,
    });
  });

  it('refuses mixing tenant scopes and does not infer authorization from actorId', () => {
    const entries = sample();
    expect(() => rebuildBalance(entries, {
      ...fullQuery,
      scope: { ...scope, tenantId: 'another-tenant' },
    })).toThrow(/scope/);
  });

  it('rejects invalid dates and noncanonical timestamps', () => {
    const entries = sample();
    expect(() => rebuildBalance(entries, { ...fullQuery, effectiveThrough: '2026-02-30' })).toThrow(/valid YYYY-MM-DD/);
    expect(() => rebuildBalance(entries, { ...fullQuery, knownAt: '2026-12-31T23:59:59Z' })).toThrow(/canonical UTC ISO/);
  });

  it('surfaces a negative historical projection instead of hiding it', () => {
    const a = appendLedgerEvent([], input('a', 'accrual', 5, '2026-03-01', '2026-03-01T12:00:00.000Z'));
    const b = appendLedgerEvent([a], input('b', 'usage', 3, '2026-02-01', '2026-03-02T12:00:00.000Z'));
    const projection = rebuildBalance([a, b], {
      ...fullQuery,
      effectiveThrough: '2026-02-28',
    });
    expect(projection.modeledBalanceHours).toBe(-3);
    expect(projection.flags).toContain('HISTORICAL_NEGATIVE_BALANCE');
  });

  it('keeps blank history a model result, never an asserted entitlement', () => {
    const receipt = rebuildBalance([], fullQuery);
    expect(receipt).toMatchObject({
      modeledBalanceHours: 0,
      ledgerHeadSequence: 0,
      evidence: [],
      status: 'UNVERIFIED_MODEL',
    });
    expect(receipt.explanation).toMatch(/No recorded ledger entries/i);
  });

  it('refuses a historical adjustment that predates its source in the recorded timeline', () => {
    const entries = sample();
    const forged = { ...entries[2]!, recordedAt: '2026-01-04T12:00:00.000Z' };
    expect(() => rebuildBalance([entries[0]!, entries[1]!, forged], {
      ...fullQuery, knownAt: '2026-01-04T13:00:00.000Z',
    })).toThrow(/predates its reference entry/);
  });
});
