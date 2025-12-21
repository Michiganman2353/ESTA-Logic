/**
 * UX Experience Contract Layer
 *
 * This module defines the standardized interface between backend logic engines
 * and frontend UX components. Every compliance decision, calculation, or validation
 * must return data in this format to ensure:
 * - Human-readable explanations
 * - Emotional reassurance and trust
 * - Clear guidance on next steps
 * - Confidence in system decisions
 *
 * Philosophy: "This is a calming, guided experience that just happens to be
 * backed by advanced compliance technology."
 *
 * @module ux-experience-contract
 */

import { z } from 'zod';

// ============================================================================
// Section 1: Core Experience Response Types
// ============================================================================

/**
 * Decision outcomes for any compliance or logic operation
 */
export const DecisionStatusSchema = z.enum([
  'APPROVED',
  'DENIED',
  'NEEDS_INFORMATION',
  'PENDING_REVIEW',
  'COMPLETED',
  'WARNING',
  'INFO',
]);
export type DecisionStatus = z.infer<typeof DecisionStatusSchema>;

/**
 * Risk level assessment for transparency
 */
export const ExperienceRiskLevelSchema = z.enum([
  'NONE',
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);
export type ExperienceRiskLevel = z.infer<typeof ExperienceRiskLevelSchema>;

/**
 * Confidence score for decision transparency (0-100)
 */
export const ConfidenceScoreSchema = z.number().min(0).max(100);
export type ConfidenceScore = z.infer<typeof ConfidenceScoreSchema>;

/**
 * User guidance hint - actionable next step for the user
 */
export interface UserGuidanceHint {
  /** Category of guidance */
  category: 'ACTION_REQUIRED' | 'INFORMATION' | 'RECOMMENDATION' | 'WARNING';

  /** Short, actionable title */
  title: string;

  /** Detailed description of what to do */
  description: string;

  /** Optional link to more information */
  helpLink?: string;

  /** Estimated time to complete (in minutes) */
  estimatedMinutes?: number;

  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export const UserGuidanceHintSchema = z.object({
  category: z.enum([
    'ACTION_REQUIRED',
    'INFORMATION',
    'RECOMMENDATION',
    'WARNING',
  ]),
  title: z.string(),
  description: z.string(),
  helpLink: z.string().url().optional(),
  estimatedMinutes: z.number().positive().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

/**
 * Reassurance message to build trust and reduce anxiety
 */
export interface ReassuranceMessage {
  /** Main reassuring statement */
  message: string;

  /** Supporting context that builds confidence */
  context?: string;

  /** Tone of the message */
  tone: 'positive' | 'neutral' | 'encouraging' | 'empathetic';

  /** Whether to prominently display this message */
  emphasize: boolean;
}

export const ReassuranceMessageSchema = z.object({
  message: z.string(),
  context: z.string().optional(),
  tone: z.enum(['positive', 'neutral', 'encouraging', 'empathetic']),
  emphasize: z.boolean(),
});

/**
 * Legal reference with human-readable interpretation
 */
export interface LegalReference {
  /** Legal code or statute */
  citation: string;

  /** Human-readable summary */
  summary: string;

  /** Full text (optional) */
  fullText?: string;

  /** Link to official documentation */
  officialLink?: string;

  /** Relevance to this specific decision */
  relevanceExplanation: string;
}

export const LegalReferenceSchema = z.object({
  citation: z.string(),
  summary: z.string(),
  fullText: z.string().optional(),
  officialLink: z.string().url().optional(),
  relevanceExplanation: z.string(),
});

// ============================================================================
// Section 2: Core Experience Response Interface
// ============================================================================

/**
 * Universal Experience Response
 *
 * Every engine operation MUST return this structure.
 * This is the contract between backend logic and frontend UX.
 *
 * Example usage:
 * ```typescript
 * const response: ExperienceResponse = {
 *   decision: 'APPROVED',
 *   explanation: 'Based on Michigan ESTA regulations, your sick time accrual is correct.',
 *   humanMeaning: 'You earned 2.5 hours of sick time this pay period.',
 *   riskLevel: 'NONE',
 *   confidenceScore: 98,
 *   reassuranceMessage: {
 *     message: 'You are fully compliant and on track.',
 *     tone: 'positive',
 *     emphasize: true,
 *   },
 *   nextSteps: [{
 *     category: 'INFORMATION',
 *     title: 'Your balance is growing',
 *     description: 'Continue working to accrue more sick time.',
 *     priority: 'low',
 *   }],
 *   legalReferences: [{
 *     citation: 'Michigan ESTA 2025, Section 3(a)',
 *     summary: 'Employees accrue 1 hour per 30 hours worked',
 *     relevanceExplanation: 'This law defines your accrual rate',
 *   }],
 *   technicalDetails: { ... },
 * };
 * ```
 */
export interface ExperienceResponse<TTechnical = unknown> {
  /**
   * Primary decision outcome
   */
  decision: DecisionStatus;

  /**
   * Human-readable explanation of WHY this decision was made
   * Should be 1-2 sentences, clear and conversational
   */
  explanation: string;

  /**
   * What this means for the user in plain language
   * Should be actionable and specific to their situation
   */
  humanMeaning: string;

  /**
   * Risk assessment for transparency
   */
  riskLevel: ExperienceRiskLevel;

  /**
   * Confidence score (0-100) indicating certainty of the decision
   * Higher scores indicate more confidence in the decision
   */
  confidenceScore: ConfidenceScore;

  /**
   * Reassuring message to build trust and reduce anxiety
   */
  reassuranceMessage: ReassuranceMessage;

  /**
   * Ordered list of next steps the user should consider
   * First item is the most important/urgent
   */
  nextSteps: UserGuidanceHint[];

  /**
   * Legal references with human-readable interpretations
   */
  legalReferences: LegalReference[];

  /**
   * Technical details for developers/advanced users
   * This is the raw engine output, optional
   */
  technicalDetails?: TTechnical;

  /**
   * Timestamp when this response was generated
   */
  timestamp: string;

  /**
   * Source engine that generated this response
   */
  sourceEngine: string;

  /**
   * Unique identifier for this response (for audit/support)
   */
  responseId: string;
}

export const ExperienceResponseSchema = z.object({
  decision: DecisionStatusSchema,
  explanation: z.string().min(10).max(500),
  humanMeaning: z.string().min(5).max(300),
  riskLevel: ExperienceRiskLevelSchema,
  confidenceScore: ConfidenceScoreSchema,
  reassuranceMessage: ReassuranceMessageSchema,
  nextSteps: z.array(UserGuidanceHintSchema),
  legalReferences: z.array(LegalReferenceSchema),
  technicalDetails: z.unknown().optional(),
  timestamp: z.string().datetime(),
  sourceEngine: z.string(),
  responseId: z.string(),
});

// ============================================================================
// Section 3: Specialized Experience Responses
// ============================================================================

/**
 * Accrual Experience Response
 * Wraps accrual calculation with UX-friendly information
 */
export interface AccrualExperienceResponse extends ExperienceResponse {
  decision: 'APPROVED' | 'INFO';
  accrualSummary: {
    hoursEarned: number;
    newBalance: number;
    maxBalance: number;
    percentOfMax: number;
    isNearingMax: boolean;
  };
}

export const AccrualExperienceResponseSchema = ExperienceResponseSchema.extend({
  decision: z.enum(['APPROVED', 'INFO']),
  accrualSummary: z.object({
    hoursEarned: z.number().nonnegative(),
    newBalance: z.number().nonnegative(),
    maxBalance: z.number().positive(),
    percentOfMax: z.number().min(0).max(100),
    isNearingMax: z.boolean(),
  }),
});

/**
 * Compliance Experience Response
 * Wraps compliance check with emotional trust messaging
 */
export interface ComplianceExperienceResponse extends ExperienceResponse {
  decision: 'APPROVED' | 'DENIED' | 'WARNING';
  complianceSummary: {
    totalRulesChecked: number;
    rulesCompliant: number;
    violationCount: number;
    warningCount: number;
    overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_ATTENTION';
  };
  violations: {
    code: string;
    userFriendlyMessage: string;
    whatItMeans: string;
    howToFix: string;
    severity: 'error' | 'critical';
  }[];
  warnings: {
    code: string;
    userFriendlyMessage: string;
    whatToConsider: string;
    severity: 'warning';
  }[];
}

export const ComplianceExperienceResponseSchema =
  ExperienceResponseSchema.extend({
    decision: z.enum(['APPROVED', 'DENIED', 'WARNING']),
    complianceSummary: z.object({
      totalRulesChecked: z.number().int().nonnegative(),
      rulesCompliant: z.number().int().nonnegative(),
      violationCount: z.number().int().nonnegative(),
      warningCount: z.number().int().nonnegative(),
      overallStatus: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'NEEDS_ATTENTION']),
    }),
    violations: z.array(
      z.object({
        code: z.string(),
        userFriendlyMessage: z.string(),
        whatItMeans: z.string(),
        howToFix: z.string(),
        severity: z.enum(['error', 'critical']),
      })
    ),
    warnings: z.array(
      z.object({
        code: z.string(),
        userFriendlyMessage: z.string(),
        whatToConsider: z.string(),
        severity: z.literal('warning'),
      })
    ),
  });

// ============================================================================
// Section 4: Experience Context
// ============================================================================

/**
 * User context for personalizing experience responses
 */
export interface UserExperienceContext {
  /** User's preferred language */
  language: string;

  /** User's experience level with the system */
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';

  /** Whether user prefers detailed explanations */
  prefersDetailedExplanations: boolean;

  /** User's timezone for time-based messaging */
  timezone: string;

  /** User's role (affects messaging tone) */
  role: 'employee' | 'employer' | 'admin';

  /** Previous interactions (for progressive disclosure) */
  hasSeenSimilarScenario: boolean;
}

export const UserExperienceContextSchema = z.object({
  language: z.string(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  prefersDetailedExplanations: z.boolean(),
  timezone: z.string(),
  role: z.enum(['employee', 'employer', 'admin']),
  hasSeenSimilarScenario: z.boolean(),
});

// ============================================================================
// Section 5: Experience Request
// ============================================================================

/**
 * Request wrapper that includes user context
 */
export interface ExperienceRequest<TPayload = unknown> {
  /** The actual operation payload */
  payload: TPayload;

  /** User context for personalization */
  userContext?: UserExperienceContext;

  /** Request identifier for tracking */
  requestId: string;

  /** Timestamp of request */
  timestamp: string;
}

export const ExperienceRequestSchema = z.object({
  payload: z.unknown(),
  userContext: UserExperienceContextSchema.optional(),
  requestId: z.string(),
  timestamp: z.string().datetime(),
});

// ============================================================================
// Section 6: Timing and Performance Guarantees
// ============================================================================

/**
 * Performance metadata to ensure UX responsiveness
 */
export interface PerformanceMetadata {
  /** Time taken to compute decision (milliseconds) */
  computationTimeMs: number;

  /** Whether response was cached */
  wasCached: boolean;

  /** Whether computation exceeded expected time */
  exceededTargetTime: boolean;

  /** Target response time for this operation (milliseconds) */
  targetTimeMs: number;
}

export const PerformanceMetadataSchema = z.object({
  computationTimeMs: z.number().nonnegative(),
  wasCached: z.boolean(),
  exceededTargetTime: z.boolean(),
  targetTimeMs: z.number().positive(),
});

// ============================================================================
// Section 7: Enhanced Experience Response with Performance
// ============================================================================

/**
 * Extended experience response with performance tracking
 */
export interface EnhancedExperienceResponse<
  TTechnical = unknown,
> extends ExperienceResponse<TTechnical> {
  /** Performance metadata */
  performance: PerformanceMetadata;
}

export const EnhancedExperienceResponseSchema = ExperienceResponseSchema.extend(
  {
    performance: PerformanceMetadataSchema,
  }
);

// ============================================================================
// Section 8: Experience Transformer Interface
// ============================================================================

/**
 * Interface that all engine transformers must implement
 * to convert raw engine output to experience responses
 */
export interface IExperienceTransformer<TInput, TOutput> {
  /**
   * Transform raw engine output to experience response
   */
  transform(
    input: TInput,
    userContext?: UserExperienceContext
  ): ExperienceResponse<TOutput>;

  /**
   * Calculate confidence score for the decision
   */
  calculateConfidence(input: TInput): ConfidenceScore;

  /**
   * Generate reassurance message
   */
  generateReassurance(
    input: TInput,
    decision: DecisionStatus
  ): ReassuranceMessage;

  /**
   * Generate next steps guidance
   */
  generateNextSteps(input: TInput): UserGuidanceHint[];

  /**
   * Generate legal references
   */
  generateLegalReferences(input: TInput): LegalReference[];
}
