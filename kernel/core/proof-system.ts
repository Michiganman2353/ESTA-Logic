/**
 * ESTA-Logic Proof System
 *
 * Immutable institutional memory that survives subpoenas.
 * This is not logging. This is eternal truth preservation.
 *
 * @module kernel/core/proof-system
 */

import { createHash, randomBytes } from 'crypto';
import type { ISODate, SemanticVersion } from '../utils';

/**
 * Unique identifier for a proof object
 */
export type ProofId = string & { readonly __brand: 'ProofId' };

/**
 * Kernel operation identifier
 */
export type KernelOperation = string & { readonly __brand: 'KernelOperation' };

/**
 * Rule identifier
 */
export type RuleId = string & { readonly __brand: 'RuleId' };

/**
 * Percentage (0-100)
 */
export type Percentage = number & { readonly __brand: 'Percentage' };

/**
 * Deep frozen object type - immutable at all levels
 */
export type DeepFrozen<T> = T extends object
  ? { readonly [K in keyof T]: DeepFrozen<T[K]> }
  : T;

/**
 * Statute reference for legal grounding
 */
export interface StatuteReference {
  /** Official legal citation */
  citation: string;

  /** Exact statute text */
  statuteText: string;

  /** Official source URL */
  officialLink?: string;

  /** How this statute applies to the calculation */
  application: string;

  /** Date statute became effective */
  effectiveFrom: ISODate;

  /** Date statute sunsets (if applicable) */
  effectiveTo?: ISODate;
}

/**
 * Single step in execution trace
 */
export interface ExecutionStep {
  /** Step number in sequence */
  stepNumber: number;

  /** Operation performed */
  operation: string;

  /** Inputs to this step */
  inputs: Record<string, unknown>;

  /** Output from this step */
  output: unknown;

  /** Duration of this step in milliseconds */
  durationMs: number;

  /** Rule applied (if any) */
  ruleApplied?: RuleId;

  /** Human-readable justification */
  justification: string;
}

/**
 * Complete execution trace
 */
export interface ExecutionTrace {
  /** All execution steps */
  steps: ExecutionStep[];

  /** Total execution time */
  totalDurationMs: number;

  /** Peak memory usage */
  peakMemoryBytes: number;
}

/**
 * Application of a specific rule
 */
export interface RuleApplication {
  /** Rule identifier */
  ruleId: RuleId;

  /** Human-readable rule name */
  ruleName: string;

  /** Version of rule applied */
  ruleVersion: SemanticVersion;

  /** Statute this rule implements */
  statute: StatuteReference;

  /** Inputs to rule */
  inputs: Record<string, unknown>;

  /** Output from rule */
  output: unknown;

  /** Condition evaluated */
  condition: string;

  /** Action taken */
  action: string;

  /** Confidence in rule application (0-100) */
  confidence: Percentage;

  /** Assumptions made */
  assumptions: string[];
}

/**
 * Warning about calculation
 */
export interface Warning {
  /** Severity level */
  severity: 'LOW' | 'MEDIUM' | 'HIGH';

  /** Warning category */
  category: string;

  /** Warning message */
  message: string;

  /** Recommended action */
  recommendation: string;

  /** Related statute (if any) */
  statute?: StatuteReference;
}

/**
 * Assumption made during calculation
 */
export interface Assumption {
  /** Assumption made */
  assumption: string;

  /** Why this assumption was made */
  justification: string;

  /** Confidence in assumption (0-100) */
  confidence: Percentage;

  /** Alternative if assumption is wrong */
  alternative?: string;
}

/**
 * Confidence factor
 */
export interface ConfidenceFactor {
  /** Factor name */
  factor: string;

  /** Impact on confidence (-100 to +100) */
  impact: number;

  /** Explanation of impact */
  explanation: string;
}

/**
 * Confidence metrics
 */
export interface ConfidenceMetrics {
  /** Overall confidence (0-100) */
  overall: Percentage;

  /** Input data quality */
  inputQuality: Percentage;

  /** Rule applicability */
  ruleApplicability: Percentage;

  /** Calculation accuracy */
  calculationAccuracy: Percentage;

  /** Data completeness */
  dataCompleteness: Percentage;

  /** Factors that increase confidence */
  boostingFactors: ConfidenceFactor[];

  /** Factors that reduce confidence */
  reducingFactors: ConfidenceFactor[];
}

/**
 * Cryptographic seal for immutability
 */
export interface CryptographicSeal {
  /** Hash algorithm used */
  algorithm: 'SHA-256';

  /** Hash of proof object */
  hash: string;

  /** When seal was created */
  timestamp: ISODate;

  /** System identity that created seal */
  signedBy: string;

  /** Random nonce to prevent collisions */
  nonce: string;
}

/**
 * System identity
 */
export interface SystemIdentity {
  /** System identifier */
  systemId: string;

  /** System version */
  version: SemanticVersion;

  /** Environment (production, staging, etc) */
  environment: string;
}

/**
 * Human-readable summary
 */
export interface HumanReadableSummary {
  /** Plain English summary */
  summary: string;

  /** Key findings */
  keyFindings: string[];

  /** Legal basis */
  legalBasis: string[];

  /** Reasoning */
  reasoning: string;

  /** Warnings */
  warnings: string[];
}

/**
 * Proof Object - Immutable institutional memory
 *
 * This is not a log entry. This is eternal truth that can survive:
 * - Regulatory audits
 * - Legal discovery
 * - Subpoenas
 * - System rewrites
 * - Framework changes
 */
export interface ProofObject<TInputs = unknown, TOutputs = unknown> {
  // === Identity ===
  /** Unique proof identifier */
  proofId: ProofId;

  /** When proof was created */
  timestamp: ISODate;

  // === Computation Context ===
  /** Operation that was performed */
  operation: KernelOperation;

  /** Version of kernel that executed */
  kernelVersion: SemanticVersion;

  /** Version of law that was applied */
  lawVersion: SemanticVersion;

  // === Frozen State ===
  /** Inputs (deeply frozen) */
  inputs: DeepFrozen<TInputs>;

  /** Outputs (deeply frozen) */
  outputs: DeepFrozen<TOutputs>;

  // === Legal Justification ===
  /** Rules that were applied */
  appliedRules: RuleApplication[];

  /** Statutes referenced */
  statuteReferences: StatuteReference[];

  // === Reasoning Trace ===
  /** Complete execution trace */
  executionTrace: ExecutionTrace;

  // === Quality Metrics ===
  /** System confidence in result */
  systemConfidence: ConfidenceMetrics;

  /** Warnings (if any) */
  warnings: Warning[];

  /** Assumptions made */
  assumptions: Assumption[];

  // === Immutability Guarantee ===
  /** Cryptographic seal */
  seal: CryptographicSeal;

  // === Human Explanation ===
  /** Human-readable summary */
  humanReadableSummary: HumanReadableSummary;
}

/**
 * Create a unique proof ID
 */
export function generateProofId(): ProofId {
  const timestamp = Date.now();
  const random = randomBytes(8).toString('hex');
  return `PROOF-${timestamp}-${random}` as ProofId;
}

/**
 * Deep freeze an object to make it immutable
 */
export function deepFreeze<T>(obj: T): DeepFrozen<T> {
  // Freeze the object itself
  Object.freeze(obj);

  // Recursively freeze all properties
  if (obj !== null && typeof obj === 'object') {
    Object.getOwnPropertyNames(obj).forEach((prop) => {
      const value = (obj as any)[prop];
      if (value !== null && typeof value === 'object') {
        deepFreeze(value);
      }
    });
  }

  return obj as DeepFrozen<T>;
}

/**
 * Create a cryptographic seal for a proof object
 */
export function createSeal(
  proof: Omit<ProofObject, 'seal'>,
  systemIdentity: SystemIdentity
): CryptographicSeal {
  // Create deterministic canonical representation
  const canonical = JSON.stringify(proof, Object.keys(proof).sort());

  // Generate nonce
  const nonce = randomBytes(16).toString('hex');

  // Create hash
  const hash = createHash('sha256')
    .update(canonical)
    .update(nonce)
    .digest('hex');

  return {
    algorithm: 'SHA-256',
    hash,
    timestamp: new Date().toISOString() as ISODate,
    signedBy: `${systemIdentity.systemId}@${systemIdentity.version}`,
    nonce,
  };
}

/**
 * Verify a proof object's seal
 */
export function verifySeal(proof: ProofObject): boolean {
  const { seal, ...content } = proof;

  // Recreate canonical representation (without seal)
  const canonical = JSON.stringify(content, Object.keys(content).sort());

  // Recompute hash
  const recomputedHash = createHash('sha256')
    .update(canonical)
    .update(seal.nonce)
    .digest('hex');

  // Verify hash matches
  return recomputedHash === seal.hash;
}

/**
 * Create a complete proof object
 */
export function createProofObject<TInputs, TOutputs>(
  operation: KernelOperation,
  inputs: TInputs,
  outputs: TOutputs,
  executionTrace: ExecutionTrace,
  options: {
    kernelVersion: SemanticVersion;
    lawVersion: SemanticVersion;
    appliedRules: RuleApplication[];
    statuteReferences: StatuteReference[];
    systemConfidence: ConfidenceMetrics;
    warnings?: Warning[];
    assumptions?: Assumption[];
    humanReadableSummary: HumanReadableSummary;
    systemIdentity: SystemIdentity;
  }
): ProofObject<TInputs, TOutputs> {
  const proofWithoutSeal: Omit<ProofObject<TInputs, TOutputs>, 'seal'> = {
    proofId: generateProofId(),
    timestamp: new Date().toISOString() as ISODate,
    operation,
    kernelVersion: options.kernelVersion,
    lawVersion: options.lawVersion,
    inputs: deepFreeze(inputs),
    outputs: deepFreeze(outputs),
    appliedRules: options.appliedRules,
    statuteReferences: options.statuteReferences,
    executionTrace,
    systemConfidence: options.systemConfidence,
    warnings: options.warnings ?? [],
    assumptions: options.assumptions ?? [],
    humanReadableSummary: options.humanReadableSummary,
  };

  const seal = createSeal(proofWithoutSeal, options.systemIdentity);

  return {
    ...proofWithoutSeal,
    seal,
  };
}

/**
 * Verification result
 */
export interface VerificationResult {
  /** Is seal valid */
  sealValid: boolean;

  /** Is computation reproducible */
  reproducible: boolean;

  /** Recomputed outputs (if verification attempted) */
  recomputedOutputs?: unknown;

  /** Are statutes valid */
  statutesValid: boolean;

  /** Is law version applicable */
  lawVersionApplicable: boolean;

  /** Overall verdict */
  verdict: 'VALID' | 'INVALID' | 'CANNOT_VERIFY';

  /** Issues found */
  issues: string[];
}

/**
 * Verify a proof object
 *
 * Note: Full verification requires re-executing the kernel operation,
 * which this function signature doesn't support. This performs
 * structural verification only.
 */
export function verifyProofStructure(proof: ProofObject): VerificationResult {
  const issues: string[] = [];

  // 1. Verify seal
  const sealValid = verifySeal(proof);
  if (!sealValid) {
    issues.push(
      'Cryptographic seal is invalid - proof may have been tampered with'
    );
  }

  // 2. Verify statute references are well-formed
  const statutesValid = proof.statuteReferences.every((ref) => {
    const valid =
      ref.citation && ref.statuteText && ref.application && ref.effectiveFrom;
    if (!valid) {
      issues.push(`Malformed statute reference: ${ref.citation}`);
    }
    return valid;
  });

  // 3. Verify execution trace is complete
  const traceComplete =
    proof.executionTrace.steps.length > 0 &&
    proof.executionTrace.steps.every((step, i) => step.stepNumber === i + 1);

  if (!traceComplete) {
    issues.push('Execution trace is incomplete or malformed');
  }

  // Note: We cannot verify reproducibility or law version applicability
  // without additional context and re-execution capability

  const verdict =
    sealValid && statutesValid && traceComplete ? 'VALID' : 'INVALID';

  return {
    sealValid,
    reproducible: false, // Cannot verify without re-execution
    statutesValid,
    lawVersionApplicable: false, // Cannot verify without law registry
    verdict,
    issues,
  };
}

/**
 * Extract human-readable explanation from proof
 */
export function explainProof(proof: ProofObject): string {
  const lines: string[] = [];

  lines.push(`Proof ID: ${proof.proofId}`);
  lines.push(`Date: ${proof.timestamp}`);
  lines.push(`Operation: ${proof.operation}`);
  lines.push('');

  lines.push('SUMMARY:');
  lines.push(proof.humanReadableSummary.summary);
  lines.push('');

  if (proof.humanReadableSummary.keyFindings.length > 0) {
    lines.push('KEY FINDINGS:');
    proof.humanReadableSummary.keyFindings.forEach((finding) => {
      lines.push(`  • ${finding}`);
    });
    lines.push('');
  }

  if (proof.humanReadableSummary.legalBasis.length > 0) {
    lines.push('LEGAL BASIS:');
    proof.humanReadableSummary.legalBasis.forEach((basis) => {
      lines.push(`  • ${basis}`);
    });
    lines.push('');
  }

  lines.push('REASONING:');
  lines.push(proof.humanReadableSummary.reasoning);
  lines.push('');

  if (proof.warnings.length > 0) {
    lines.push('WARNINGS:');
    proof.warnings.forEach((warning) => {
      lines.push(`  [${warning.severity}] ${warning.message}`);
      lines.push(`    → ${warning.recommendation}`);
    });
    lines.push('');
  }

  lines.push(`CONFIDENCE: ${proof.systemConfidence.overall}%`);
  lines.push(
    `SEAL: ${proof.seal.hash.substring(0, 16)}... (${proof.seal.algorithm})`
  );

  return lines.join('\n');
}
