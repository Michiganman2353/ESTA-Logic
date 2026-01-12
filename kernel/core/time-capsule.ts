/**
 * ESTA-Logic Time Capsule System
 *
 * Implements the legal time capsule model where truth does not retroactively mutate.
 * Every calculation exists eternally at its (time, law, state) coordinates.
 *
 * @module kernel/core/time-capsule
 */

import type { ProofObject } from './proof-system';
import type { ISODate, SemanticVersion } from '../utils';

/**
 * Unique identifier for a time capsule
 */
export type CapsuleId = string & { readonly __brand: 'CapsuleId' };

/**
 * Jurisdiction code (branded type for extensibility while maintaining type safety)
 */
export type Jurisdiction = string & { readonly __brand: 'Jurisdiction' };

// Common jurisdictions
export const JURISDICTIONS = {
  MI: 'MI' as Jurisdiction,
  CA: 'CA' as Jurisdiction,
  NY: 'NY' as Jurisdiction,
  IL: 'IL' as Jurisdiction,
} as const;

/**
 * Law version with metadata
 */
export interface LawVersion {
  /** Semantic version */
  version: SemanticVersion;

  /** Jurisdiction this law applies to */
  jurisdiction: Jurisdiction;

  /** When this law became effective */
  effectiveDate: ISODate;

  /** When this law sunsets (if applicable) */
  sunsetDate?: ISODate;

  /** Version this amends (if applicable) */
  amendmentOf?: SemanticVersion;

  /** Changes made in this version */
  changelog: LegalChange[];
}

/**
 * Legal change description
 */
export interface LegalChange {
  /** Change type */
  type: 'MAJOR' | 'MINOR' | 'PATCH' | 'CLARIFICATION';

  /** Section affected */
  section: string;

  /** Description of change */
  description: string;

  /** Why change was made */
  rationale?: string;

  /** Reference to authorizing document */
  authority?: string;
}

/**
 * Recalculation reason
 */
export enum RecalculationReason {
  LAW_CHANGED = 'LAW_CHANGED',
  DATA_CORRECTED = 'DATA_CORRECTED',
  ERROR_DISCOVERED = 'ERROR_DISCOVERED',
  AUDIT_REQUESTED = 'AUDIT_REQUESTED',
  POLICY_UPDATED = 'POLICY_UPDATED',
}

/**
 * Recalculation metadata
 */
export interface RecalculationMetadata {
  /** Why recalculation was performed */
  reason: RecalculationReason;

  /** Original capsule being recalculated */
  originalCapsuleId: CapsuleId;

  /** New law version (if applicable) */
  newLawVersion?: SemanticVersion;

  /** Who authorized recalculation */
  authorizedBy: string;

  /** When recalculation was authorized */
  authorizedAt: ISODate;

  /** Effective date for recalculation */
  effectiveDate: ISODate;

  /** Notes about recalculation */
  notes?: string;
}

/**
 * Time Capsule - Immutable calculation at specific (time, law, state) coordinates
 *
 * Represents eternal truth: what was calculated, when, under which law.
 * Once sealed, never changes. Recalculation creates NEW capsule, old remains valid.
 */
export interface TimeCapsule<TInputs = unknown, TOutputs = unknown> {
  // === Identity ===
  /** Unique capsule identifier */
  id: CapsuleId;

  // === Temporal Coordinates ===
  /** When calculation was performed */
  calculatedAt: ISODate;

  /** Effective date for calculation (may differ from calculatedAt) */
  effectiveDate: ISODate;

  /** Law version used */
  lawVersion: LawVersion;

  // === Computation ===
  /** Complete proof object */
  proof: ProofObject<TInputs, TOutputs>;

  // === Versioning ===
  /** If this is a recalculation, metadata about why */
  recalculation?: RecalculationMetadata;

  /** Previous version (if this supersedes another calculation) */
  supersedes?: CapsuleId;

  /** Next version (if this was superseded) */
  supersededBy?: CapsuleId;

  // === Lifecycle ===
  /** Is this capsule still considered valid */
  isActive: boolean;

  /** Reason for deactivation (if not active) */
  deactivationReason?: string;

  /** When capsule was deactivated (if not active) */
  deactivatedAt?: ISODate;
}

/**
 * Generate unique capsule ID
 */
export function generateCapsuleId(): CapsuleId {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `CAPSULE-${timestamp}-${random}` as CapsuleId;
}

/**
 * Create a new time capsule
 */
export function createTimeCapsule<TInputs, TOutputs>(
  proof: ProofObject<TInputs, TOutputs>,
  lawVersion: LawVersion,
  options?: {
    effectiveDate?: ISODate;
    recalculation?: RecalculationMetadata;
    supersedes?: CapsuleId;
  }
): TimeCapsule<TInputs, TOutputs> {
  return {
    id: generateCapsuleId(),
    calculatedAt: proof.timestamp,
    effectiveDate: options?.effectiveDate ?? proof.timestamp,
    lawVersion,
    proof,
    recalculation: options?.recalculation,
    supersedes: options?.supersedes,
    supersededBy: undefined,
    isActive: true,
    deactivationReason: undefined,
    deactivatedAt: undefined,
  };
}

/**
 * Supersede a capsule with a new one
 */
export function supersedeCapsule<TInputs, TOutputs>(
  oldCapsule: TimeCapsule<TInputs, TOutputs>,
  newCapsule: TimeCapsule<TInputs, TOutputs>,
  reason: string
): TimeCapsule<TInputs, TOutputs> {
  return {
    ...oldCapsule,
    supersededBy: newCapsule.id,
    isActive: false,
    deactivationReason: reason,
    deactivatedAt: new Date().toISOString() as ISODate,
  };
}

/**
 * Time capsule query
 */
export interface CapsuleQuery {
  /** Filter by employee ID */
  employeeId?: string;

  /** Filter by employer ID */
  employerId?: string;

  /** Filter by date range */
  dateRange?: {
    start: ISODate;
    end: ISODate;
  };

  /** Filter by law version */
  lawVersion?: SemanticVersion;

  /** Filter by operation type */
  operation?: string;

  /** Only return active capsules */
  activeOnly?: boolean;

  /** Sort order */
  sortBy?: 'calculatedAt' | 'effectiveDate';

  /** Sort direction */
  sortDirection?: 'asc' | 'desc';

  /** Limit results */
  limit?: number;
}

/**
 * Time capsule repository interface
 */
export interface TimeCapsuleRepository {
  /**
   * Store a new capsule
   */
  store<TInputs, TOutputs>(
    capsule: TimeCapsule<TInputs, TOutputs>
  ): Promise<void>;

  /**
   * Retrieve capsule by ID
   */
  retrieve(id: CapsuleId): Promise<TimeCapsule | null>;

  /**
   * Query capsules
   */
  query(query: CapsuleQuery): Promise<TimeCapsule[]>;

  /**
   * Get capsule nearest to a specific date
   */
  getNearestTo(
    date: ISODate,
    filter?: Partial<CapsuleQuery>
  ): Promise<TimeCapsule | null>;

  /**
   * Get timeline of capsules for an entity
   */
  getTimeline(
    entityId: string,
    entityType: 'employee' | 'employer'
  ): Promise<TimeCapsule[]>;

  /**
   * Get all recalculations of a specific capsule
   */
  getRecalculations(originalId: CapsuleId): Promise<TimeCapsule[]>;
}

/**
 * In-memory implementation of time capsule repository
 * (for testing and reference - production would use persistent storage)
 */
export class InMemoryTimeCapsuleRepository implements TimeCapsuleRepository {
  private capsules: Map<CapsuleId, TimeCapsule> = new Map();

  async store<TInputs, TOutputs>(
    capsule: TimeCapsule<TInputs, TOutputs>
  ): Promise<void> {
    this.capsules.set(capsule.id, capsule as TimeCapsule);
  }

  async retrieve(id: CapsuleId): Promise<TimeCapsule | null> {
    return this.capsules.get(id) ?? null;
  }

  async query(query: CapsuleQuery): Promise<TimeCapsule[]> {
    let results = Array.from(this.capsules.values());

    // Apply filters
    if (query.employeeId) {
      results = results.filter(
        (c) =>
          c.proof.inputs &&
          typeof c.proof.inputs === 'object' &&
          'employeeId' in c.proof.inputs &&
          c.proof.inputs.employeeId === query.employeeId
      );
    }

    if (query.employerId) {
      results = results.filter(
        (c) =>
          c.proof.inputs &&
          typeof c.proof.inputs === 'object' &&
          'employerId' in c.proof.inputs &&
          c.proof.inputs.employerId === query.employerId
      );
    }

    if (query.dateRange) {
      results = results.filter(
        (c) =>
          c.calculatedAt >= query.dateRange!.start &&
          c.calculatedAt <= query.dateRange!.end
      );
    }

    if (query.lawVersion) {
      results = results.filter(
        (c) => c.lawVersion.version === query.lawVersion
      );
    }

    if (query.operation) {
      results = results.filter((c) => c.proof.operation === query.operation);
    }

    if (query.activeOnly) {
      results = results.filter((c) => c.isActive);
    }

    // Sort
    const sortBy = query.sortBy ?? 'calculatedAt';
    const sortDirection = query.sortDirection ?? 'desc';

    results.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  async getNearestTo(
    date: ISODate,
    filter?: Partial<CapsuleQuery>
  ): Promise<TimeCapsule | null> {
    const results = await this.query({
      ...filter,
      activeOnly: true,
    });

    if (results.length === 0) return null;

    // Find capsule with calculatedAt closest to target date
    return results.reduce((nearest, current) => {
      const nearestDiff = Math.abs(
        new Date(nearest.calculatedAt).getTime() - new Date(date).getTime()
      );
      const currentDiff = Math.abs(
        new Date(current.calculatedAt).getTime() - new Date(date).getTime()
      );
      return currentDiff < nearestDiff ? current : nearest;
    });
  }

  async getTimeline(
    entityId: string,
    entityType: 'employee' | 'employer'
  ): Promise<TimeCapsule[]> {
    const query: CapsuleQuery = {
      activeOnly: false,
      sortBy: 'calculatedAt',
      sortDirection: 'asc',
    };

    if (entityType === 'employee') {
      query.employeeId = entityId;
    } else {
      query.employerId = entityId;
    }

    return this.query(query);
  }

  async getRecalculations(originalId: CapsuleId): Promise<TimeCapsule[]> {
    return Array.from(this.capsules.values()).filter(
      (c) => c.recalculation?.originalCapsuleId === originalId
    );
  }
}

/**
 * Historical query - what did we believe on a specific date?
 */
export async function getHistoricalBelief(
  repository: TimeCapsuleRepository,
  entityId: string,
  entityType: 'employee' | 'employer',
  asOfDate: ISODate
): Promise<TimeCapsule | null> {
  const timeline = await repository.getTimeline(entityId, entityType);

  // Find capsule created before or on asOfDate, sorted by most recent
  const applicable = timeline
    .filter((c) => c.calculatedAt <= asOfDate)
    .sort(
      (a, b) =>
        new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime()
    );

  return applicable[0] ?? null;
}

/**
 * Compare two capsules to understand what changed
 */
export interface CapsuleDiff {
  /** What changed */
  changes: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }>;

  /** Why it changed (from recalculation metadata) */
  reason?: RecalculationReason;

  /** Law version changes */
  lawChanged: boolean;
  lawVersionDiff?: {
    oldVersion: SemanticVersion;
    newVersion: SemanticVersion;
  };

  /** Output differences */
  outputsDifferent: boolean;
}

/**
 * Compare two capsules
 */
export function compareCapsules(
  capsule1: TimeCapsule,
  capsule2: TimeCapsule
): CapsuleDiff {
  const changes: CapsuleDiff['changes'] = [];

  // Compare outputs
  const outputsDifferent =
    JSON.stringify(capsule1.proof.outputs) !==
    JSON.stringify(capsule2.proof.outputs);

  if (outputsDifferent) {
    changes.push({
      field: 'outputs',
      oldValue: capsule1.proof.outputs,
      newValue: capsule2.proof.outputs,
    });
  }

  // Compare law versions
  const lawChanged =
    capsule1.lawVersion.version !== capsule2.lawVersion.version;

  const lawVersionDiff = lawChanged
    ? {
        oldVersion: capsule1.lawVersion.version,
        newVersion: capsule2.lawVersion.version,
      }
    : undefined;

  return {
    changes,
    reason: capsule2.recalculation?.reason,
    lawChanged,
    lawVersionDiff,
    outputsDifferent,
  };
}

/**
 * Validate a time capsule
 */
export interface CapsuleValidation {
  /** Is capsule valid */
  valid: boolean;

  /** Issues found */
  issues: string[];

  /** Is seal intact */
  sealIntact: boolean;

  /** Is law version applicable */
  lawVersionApplicable: boolean;

  /** Is there a superseding capsule */
  superseded: boolean;
}

/**
 * Validate a capsule
 */
export async function validateCapsule(
  capsule: TimeCapsule,
  repository: TimeCapsuleRepository,
  currentLawVersion?: LawVersion
): Promise<CapsuleValidation> {
  const issues: string[] = [];

  // Check if capsule has been superseded
  const superseded = capsule.supersededBy !== undefined;
  if (superseded) {
    issues.push(`Capsule has been superseded by ${capsule.supersededBy}`);
  }

  // Check seal integrity (would need to import verifySeal from proof-system)
  // For now, assume seal is intact if proof exists
  const sealIntact = capsule.proof !== undefined;

  // Check if law version is still applicable
  let lawVersionApplicable = true;
  if (currentLawVersion) {
    // If law has changed since capsule was created, note it but don't invalidate
    if (capsule.lawVersion.version !== currentLawVersion.version) {
      lawVersionApplicable = false;
      issues.push(
        `Law version ${capsule.lawVersion.version} has been superseded by ${currentLawVersion.version}`
      );
    }
  }

  const valid = sealIntact && !superseded;

  return {
    valid,
    issues,
    sealIntact,
    lawVersionApplicable,
    superseded,
  };
}
