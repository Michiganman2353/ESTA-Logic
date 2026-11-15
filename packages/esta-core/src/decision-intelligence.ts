/**
 * ESTA Decision Intelligence — deterministic, storage-independent reconstruction.
 *
 * This module deliberately accepts only validated LedgerEntry values. It does
 * not authenticate callers, verify legal eligibility, issue approvals, or write
 * any database records. A future trusted API must authenticate the actor,
 * authorize the tenant, validate the statutory ruleset, and append events in a
 * serializable/idempotent transaction before using these projections.
 *
 * Two times are modeled independently:
 *  - effectiveThrough: business date whose balance we want to reconstruct
 *  - knownAt:          UTC time at which the system could have known a record
 *
 * This separation preserves the difference between a correction that applies
 * to an older period and what the employer actually knew at that older date.
 */
import { replayLedger, type LedgerEntry, type LedgerKind } from './ledger';

const SCALE = 1_000_000;

export type ReconstructionStatus = 'UNVERIFIED_MODEL';
export type IntelligenceFlag =
  | 'MULTIPLE_RULESET_VERSIONS'
  | 'BACKDATED_ENTRY'
  | 'POSTDATED_ENTRY'
  | 'HISTORICAL_NEGATIVE_BALANCE'
  | 'INCOMPLETE_REFERENCE';

export interface LedgerScope {
  tenantId: string;
  employeeId: string;
  benefitYear: string;
}

export interface ReconstructionQuery {
  scope: LedgerScope;
  /** Calendar date in YYYY-MM-DD format; no implicit local timezone. */
  effectiveThrough: string;
  /** Explicit UTC ISO timestamp, e.g. 2026-11-14T12:00:00.000Z. */
  knownAt: string;
}

export interface BalanceEvidence {
  entryId: string;
  sequence: number;
  kind: LedgerKind;
  effectiveDate: string;
  recordedAt: string;
  rulesetVersion: string;
  /** Signed contribution in hours; negative for usage. */
  deltaHours: number;
  /** Optional trace back to the corrected ledger entry. */
  referenceEntryId?: string;
}

export interface BalanceReceipt {
  schemaVersion: 1;
  status: ReconstructionStatus;
  scope: LedgerScope;
  effectiveThrough: string;
  knownAt: string;
  /** Balance according to the ledger model only, not statutory availability. */
  modeledBalanceHours: number;
  ledgerHeadSequence: number;
  evidence: BalanceEvidence[];
  /** Unique ruleset identifiers present in the included evidence. */
  rulesetVersions: string[];
  /** Diagnostic flags are not legal findings or automatic employment decisions. */
  flags: IntelligenceFlag[];
  explanation: string;
}

export interface ReceiptVerification {
  matchesReplay: boolean;
  issues: string[];
}

export interface BalanceDrift {
  changed: boolean;
  previousModeledHours: number;
  currentModeledHours: number;
  deltaHours: number;
  newlyConsideredEntryIds: string[];
  removedEntryIds: string[];
  flags: IntelligenceFlag[];
}

function requireIsoDate(value: string, name: string): void {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(Date.parse(value + 'T00:00:00.000Z')) ||
      new Date(value + 'T00:00:00.000Z').toISOString().slice(0, 10) !== value) {
    throw new Error(name + ' must be a valid YYYY-MM-DD UTC date');
  }
}

function requireUtcTime(value: string, name: string): void {
  if (typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) ||
      Number.isNaN(Date.parse(value)) ||
      new Date(value).toISOString() !== value) {
    throw new Error(name + ' must be canonical UTC ISO time ending in Z');
  }
}

function validScope(scope: LedgerScope): void {
  for (const key of ['tenantId', 'employeeId', 'benefitYear'] as const) {
    if (!scope || typeof scope[key] !== 'string' ||
        scope[key].trim().length === 0 || scope[key].length > 256) {
      throw new Error('Valid ' + key + ' is required');
    }
  }
}

function signedMicros(entry: LedgerEntry): number {
  const scaled = Math.round(entry.hours * SCALE);
  return entry.kind === 'usage' ? -scaled : scaled;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

/**
 * Rebuild a bitemporal balance from a verified contiguous ledger.
 *
 * Historical corrections affect their effective dates only after they were
 * recorded; no new record silently alters what was known at an earlier time.
 * The complete ledger must replay successfully before any result is emitted.
 */
export function rebuildBalance(
  entries: readonly LedgerEntry[],
  query: ReconstructionQuery
): BalanceReceipt {
  validScope(query.scope);
  requireIsoDate(query.effectiveThrough, 'effectiveThrough');
  requireUtcTime(query.knownAt, 'knownAt');

  const full = replayLedger(entries); // Validates every event, not just selected entries.
  if (full && (full.tenantId !== query.scope.tenantId ||
      full.employeeId !== query.scope.employeeId ||
      full.benefitYear !== query.scope.benefitYear)) {
    throw new Error('Requested balance scope differs from ledger scope');
  }

  const known = entries.filter((entry) => {
    requireIsoDate(entry.effectiveDate, 'entry effectiveDate');
    requireUtcTime(entry.recordedAt, 'entry recordedAt');
    return entry.recordedAt <= query.knownAt;
  });

  // An adjustment whose target had not yet been recorded cannot be attributed
  // to a historical record without speculative reconstruction.
  const knownIds = new Set(known.map((entry) => entry.entryId));
  for (const entry of known) {
    if (entry.kind === 'adjustment' &&
        (!entry.referenceEntryId || !knownIds.has(entry.referenceEntryId))) {
      throw new Error('Historical adjustment predates its reference entry');
    }
  }

  const selected = known.filter((entry) => entry.effectiveDate <= query.effectiveThrough);
  const evidence: BalanceEvidence[] = [];
  const flags: IntelligenceFlag[] = [];
  let runningMicros = 0;

  for (const entry of selected) {
    const delta = signedMicros(entry);
    runningMicros += delta;
    if (!Number.isSafeInteger(runningMicros)) {
      throw new Error('Historical balance exceeds safe fixed-point precision');
    }
    evidence.push({
      entryId: entry.entryId,
      sequence: entry.sequence,
      kind: entry.kind,
      effectiveDate: entry.effectiveDate,
      recordedAt: entry.recordedAt,
      rulesetVersion: entry.rulesetVersion,
      deltaHours: delta / SCALE,
      ...(entry.referenceEntryId ? { referenceEntryId: entry.referenceEntryId } : {}),
    });
    if (entry.recordedAt.slice(0, 10) > entry.effectiveDate &&
        !flags.includes('BACKDATED_ENTRY')) {
      flags.push('BACKDATED_ENTRY');
    }
    if (entry.recordedAt.slice(0, 10) < entry.effectiveDate &&
        !flags.includes('POSTDATED_ENTRY')) {
      flags.push('POSTDATED_ENTRY');
    }
    if (entry.kind === 'adjustment' && entry.referenceEntryId &&
        !selected.some((candidate) => candidate.entryId === entry.referenceEntryId) &&
        !flags.includes('INCOMPLETE_REFERENCE')) {
      flags.push('INCOMPLETE_REFERENCE');
    }
  }

  const versions = unique(evidence.map((item) => item.rulesetVersion));
  if (versions.length > 1) flags.push('MULTIPLE_RULESET_VERSIONS');
  if (runningMicros < 0) flags.push('HISTORICAL_NEGATIVE_BALANCE');

  // The result of a structurally valid ledger might still be legally wrong.
  // Never floor a negative modeled balance or call it a spendable entitlement.
  const hours = runningMicros / SCALE;
  const explanation = evidence.length === 0
    ? 'No recorded ledger entries matched the selected effective date and knowledge cutoff.'
    : 'The modeled balance is ' + hours.toFixed(6) +
      ' hours, reconstructed from ' + evidence.length +
      ' recorded entries. This does not determine legal eligibility or annual usage limits.';

  return {
    schemaVersion: 1,
    status: 'UNVERIFIED_MODEL',
    scope: { ...query.scope },
    effectiveThrough: query.effectiveThrough,
    knownAt: query.knownAt,
    modeledBalanceHours: hours,
    ledgerHeadSequence: full?.lastSequence ?? 0,
    evidence,
    rulesetVersions: versions,
    flags,
    explanation,
  };
}

/**
 * Verify a displayed receipt by rerunning the model against the source ledger.
 *
 * This is a replay consistency check — not a signature, secure timestamp,
 * authentication check, guarantee of unaltered database history, or legal audit.
 */
export function verifyBalanceReceipt(
  receipt: BalanceReceipt,
  entries: readonly LedgerEntry[]
): ReceiptVerification {
  try {
    const expected = rebuildBalance(entries, {
      scope: receipt.scope,
      effectiveThrough: receipt.effectiveThrough,
      knownAt: receipt.knownAt,
    });
    const matchesReplay = JSON.stringify(expected) === JSON.stringify(receipt);
    return {
      matchesReplay,
      issues: matchesReplay ? [] : ['Receipt differs from recomputed ledger projection'],
    };
  } catch (error) {
    return {
      matchesReplay: false,
      issues: [error instanceof Error ? error.message : 'Failed to reconstruct ledger'],
    };
  }
}

/**
 * Compare two knowledge snapshots for the same business-effective period.
 * Reveals backdated corrections and new evidence without revising old reports.
 */
export function detectBalanceDrift(
  entries: readonly LedgerEntry[],
  query: Omit<ReconstructionQuery, 'knownAt'>,
  earlierKnownAt: string,
  laterKnownAt: string
): BalanceDrift {
  requireUtcTime(earlierKnownAt, 'earlierKnownAt');
  requireUtcTime(laterKnownAt, 'laterKnownAt');
  if (earlierKnownAt > laterKnownAt) {
    throw new Error('Knowledge cutoffs must be in chronological order');
  }
  const previous = rebuildBalance(entries, { ...query, knownAt: earlierKnownAt });
  const current = rebuildBalance(entries, { ...query, knownAt: laterKnownAt });
  const beforeIds = new Set(previous.evidence.map((item) => item.entryId));
  const afterIds = new Set(current.evidence.map((item) => item.entryId));
  return {
    changed: previous.modeledBalanceHours !== current.modeledBalanceHours ||
      beforeIds.size !== afterIds.size,
    previousModeledHours: previous.modeledBalanceHours,
    currentModeledHours: current.modeledBalanceHours,
    deltaHours: Math.round((current.modeledBalanceHours -
      previous.modeledBalanceHours) * SCALE) / SCALE,
    newlyConsideredEntryIds: [...afterIds].filter((id) => !beforeIds.has(id)),
    removedEntryIds: [...beforeIds].filter((id) => !afterIds.has(id)),
    flags: unique([...previous.flags, ...current.flags]),
  };
}
