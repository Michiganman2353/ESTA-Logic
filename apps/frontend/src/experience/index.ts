/**
 * Experience Module Exports
 *
 * Central export point for the guided UX system
 */

// Design System
export { motion } from './design-system/tokens/motion';
export { colors } from './design-system/tokens/colors';
export { typography } from './design-system/tokens/typography';

// Wizard Core
export { wizard, WizardEngine } from './wizard/core/WizardEngine';
export { WizardState } from './wizard/core/WizardState';
export { WizardProvider, useWizard } from './wizard/core/WizardContext';

// Wizard Routing
export { default as WizardRouter } from './wizard/routing/WizardRouter';

// Wizard Validation
export { validate, commonRules } from './wizard/validation/rules';
export type {
  ValidationRule,
  ValidationResult,
} from './wizard/validation/rules';

// Wizard Analytics
export { wizardEvents } from './wizard/analytics/wizardEvents';

// Wizard Steps
export { default as IntroStep } from './wizard/steps/IntroStep';
export { default as EmployerProfileStep } from './wizard/steps/EmployerProfileStep';
export { default as EmployeePolicyStep } from './wizard/steps/EmployeePolicyStep';
export { default as DocumentCaptureStep } from './wizard/steps/DocumentCaptureStep';
export { default as ReviewStep } from './wizard/steps/ReviewStep';
export { default as CompletionStep } from './wizard/steps/CompletionStep';

// Capture
export { SecureCapture } from './capture/SecureCapture';

// Animations
export { default as PageTransition } from './animations/PageTransition';
export { default as PulseSecure } from './animations/PulseSecure';

// Accessibility
export { focusManager } from './a11y/focusManager';

// Trust Framework
export { TrustEngine } from './trust/TrustEngine';
export type { TrustSignals, UserContext } from './trust/TrustEngine';
export { default as SecuritySignals } from './trust/SecuritySignals';
export { default as LegalAssurance } from './trust/LegalAssurance';
export { default as EncryptionIndicator } from './trust/EncryptionIndicator';

// Tone & Narrative
export { ToneEngine } from './tone/ToneEngine';
export type { ToneType } from './tone/ToneEngine';
export { NarrativeLibrary, getNarrative, getNarrativeMessage } from './tone/NarrativeLibrary';
export type { NarrativeKey, NarrativeContent } from './tone/NarrativeLibrary';
export {
  comfortingCopy,
  personalizedComfortingCopy,
  encouragementMessage,
} from './tone/EmotionalUXWriter';
export type { EmotionalContext, ComfortingCopyOptions } from './tone/EmotionalUXWriter';

// Intelligence & Personalization
export { PersonalizationEngine } from './intelligence/PersonalizationEngine';
export type {
  BusinessData,
  UserProfile,
  FlowPath,
} from './intelligence/PersonalizationEngine';
export { DecisionEngine } from './intelligence/DecisionEngine';
export type {
  DecisionExplanation,
  DecisionReason,
} from './intelligence/DecisionEngine';
export { RiskInterpreter } from './intelligence/RiskInterpreter';
export type { RiskLevel, RiskAssessment } from './intelligence/RiskInterpreter';

// Compliance Dashboard
export { default as ComplianceConfidenceDashboard } from './dashboard/ComplianceConfidenceDashboard';
export { default as ComplianceScore } from './dashboard/components/ComplianceScore';
export { default as RiskHeatMap } from './dashboard/components/RiskHeatMap';
export { default as ReadinessTimeline } from './dashboard/components/ReadinessTimeline';
export type { RiskCategory } from './dashboard/components/RiskHeatMap';
export type { TimelineItem } from './dashboard/components/ReadinessTimeline';

// Wizard Extensions
export { AdaptiveFlowController } from './wizard/extensions/AdaptiveFlowController';
export type { FlowDecision } from './wizard/extensions/AdaptiveFlowController';
export {
  BranchingLogic,
  BranchConditions,
} from './wizard/extensions/BranchingLogic';
export type {
  BranchCondition,
  BranchRule,
  Branch,
} from './wizard/extensions/BranchingLogic';

// Enterprise Trust Layer
export { AuditProofCore } from './enterprise/AuditProofCore';
export type { AuditEvent, AuditLog } from './enterprise/AuditProofCore';
export { IntegrityLedger } from './enterprise/IntegrityLedger';
export type {
  LedgerEntry,
  VerificationResult,
} from './enterprise/IntegrityLedger';
