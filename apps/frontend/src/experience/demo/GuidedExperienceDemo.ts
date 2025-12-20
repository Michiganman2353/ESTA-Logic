/**
 * ESTA-Logic Guided Experience Ecosystem Demonstration
 *
 * This demo shows how all the new components work together to create
 * a confidence-building, personalized compliance experience.
 */

import { TrustEngine } from '../trust/TrustEngine';
import { ToneEngine } from '../tone/ToneEngine';
import { NarrativeLibrary } from '../tone/NarrativeLibrary';
import {
  comfortingCopy,
  encouragementMessage,
} from '../tone/EmotionalUXWriter';
import { PersonalizationEngine } from '../intelligence/PersonalizationEngine';
import { DecisionEngine } from '../intelligence/DecisionEngine';
import { RiskInterpreter } from '../intelligence/RiskInterpreter';
import { AdaptiveFlowController } from '../wizard/extensions/AdaptiveFlowController';
import { BranchingLogic } from '../wizard/extensions/BranchingLogic';
import { AuditProofCore } from '../enterprise/AuditProofCore';
import { IntegrityLedger } from '../enterprise/IntegrityLedger';

/**
 * Demo 1: Trust & Reassurance System
 */
export function demoTrustFramework() {
  console.log('=== TRUST FRAMEWORK DEMO ===\n');

  // Get trust signals
  const userContext = { employeeCount: 25, industry: 'Healthcare' };
  const signals = TrustEngine.getTrustSignals(userContext);
  console.log('Trust Signals:', signals);

  // Calculate trust score
  const score = TrustEngine.getTrustScore(signals);
  const level = TrustEngine.getTrustLevel(signals);
  console.log(`Trust Score: ${score}/100 (${level})\n`);
}

/**
 * Demo 2: Emotional UX & Tone System
 */
export function demoEmotionalUX() {
  console.log('=== EMOTIONAL UX & TONE DEMO ===\n');

  // Apply different tones to the same message
  const message = 'Here are your next steps.';

  console.log('Friendly:', ToneEngine.friendly(message));
  console.log('Reassuring:', ToneEngine.reassuring(message));
  console.log('Authoritative:', ToneEngine.authoritative(message));

  // Get comforting copy for different emotional states
  console.log('\nEmotional Support:');
  console.log('Legal Fear:', comfortingCopy('legalFear'));
  console.log('Overwhelm:', comfortingCopy('overwhelm'));

  // Get encouragement based on progress
  console.log('\nProgress Encouragement:');
  console.log('25% complete:', encouragementMessage(25));
  console.log('75% complete:', encouragementMessage(75));
  console.log('100% complete:', encouragementMessage(100));

  // Get narrative content
  const welcome = NarrativeLibrary.welcome;
  console.log('\nWelcome Narrative:', welcome.message);
  console.log();
}

/**
 * Demo 3: Personalization & Intelligence
 */
export function demoPersonalization() {
  console.log('=== PERSONALIZATION ENGINE DEMO ===\n');

  // Small business
  const smallBiz = { employeeCount: 8, industry: 'Retail' };
  const smallProfile = PersonalizationEngine.deriveProfile(smallBiz);
  const smallFlow = PersonalizationEngine.personalizeFlow(smallProfile);

  console.log('Small Business (8 employees):');
  console.log('  Complexity:', smallProfile.complexityLevel);
  console.log('  Experience:', smallProfile.experienceLevel);
  console.log('  Flow Path:', smallFlow);
  console.log(
    '  Steps:',
    PersonalizationEngine.getRecommendedSteps(smallProfile)
  );

  // Enterprise
  const enterprise = { employeeCount: 150, industry: 'Healthcare' };
  const enterpriseProfile = PersonalizationEngine.deriveProfile(enterprise);
  const enterpriseFlow =
    PersonalizationEngine.personalizeFlow(enterpriseProfile);

  console.log('\nEnterprise (150 employees):');
  console.log('  Complexity:', enterpriseProfile.complexityLevel);
  console.log('  Flow Path:', enterpriseFlow);
  console.log(
    '  Steps:',
    PersonalizationEngine.getRecommendedSteps(enterpriseProfile)
  );
  console.log();
}

/**
 * Demo 4: Decision & Risk Intelligence
 */
export function demoDecisionIntelligence() {
  console.log('=== DECISION & RISK INTELLIGENCE DEMO ===\n');

  // Policy recommendation
  const policyRec = DecisionEngine.explainPolicyRecommendation(75, false);
  console.log('Policy Recommendation:');
  console.log('  Recommendation:', policyRec.recommendation);
  console.log('  Why:', policyRec.why);
  console.log('  Confidence:', policyRec.confidence);
  console.log('  Factors:', policyRec.factors);

  // Risk interpretation
  const risk = RiskInterpreter.interpretRisk('missingPolicy');
  console.log('\nRisk Assessment (Missing Policy):');
  console.log('  Level:', risk.level);
  console.log('  Title:', risk.title);
  console.log('  Plain English:', risk.plainEnglish);
  console.log('  Actions:', risk.actions);
  console.log();
}

/**
 * Demo 5: Adaptive Flow & Branching
 */
export function demoAdaptiveFlow() {
  console.log('=== ADAPTIVE FLOW DEMO ===\n');

  // Small business flow
  const smallUserData = { employeeCount: 10, industry: 'Restaurant' };
  const smallRecommended =
    AdaptiveFlowController.getRecommendedFlow(smallUserData);

  console.log('Small Business Flow:');
  console.log('  Path:', smallRecommended.path);
  console.log('  Steps:', smallRecommended.steps);
  console.log('  Estimated Time:', smallRecommended.estimatedTime, 'minutes');

  // Enterprise flow
  const enterpriseUserData = { employeeCount: 200, hasMultipleLocations: true };
  const enterpriseRecommended =
    AdaptiveFlowController.getRecommendedFlow(enterpriseUserData);

  console.log('\nEnterprise Flow:');
  console.log('  Path:', enterpriseRecommended.path);
  console.log('  Steps:', enterpriseRecommended.steps);
  console.log(
    '  Estimated Time:',
    enterpriseRecommended.estimatedTime,
    'minutes'
  );

  // Setup branching logic
  BranchingLogic.setupDefaultBranches();

  // Evaluate a branch
  const branchDecision = BranchingLogic.evaluateBranch('profile', {
    employeeCount: 60,
  });
  console.log('\nBranching Decision (60 employees):', branchDecision);
  console.log();
}

/**
 * Demo 6: Enterprise Trust Layer
 */
export function demoEnterpriseTrust() {
  console.log('=== ENTERPRISE TRUST LAYER DEMO ===\n');

  // Audit logging
  AuditProofCore.clear();
  AuditProofCore.record(
    'CREATE',
    'policy',
    { name: 'Sick Time Policy' },
    'user123'
  );
  AuditProofCore.record(
    'UPDATE',
    'employee',
    { id: 'emp001', hours: 40 },
    'user123'
  );
  AuditProofCore.record('READ', 'report', { type: 'compliance' }, 'user456');

  const auditLog = AuditProofCore.getAuditLog();
  console.log('Audit Events:', auditLog.count);
  console.log(
    'Events:',
    auditLog.events.map((e) => `${e.action} ${e.resource}`)
  );

  const report = AuditProofCore.generateComplianceReport(
    new Date('2024-01-01'),
    new Date('2025-12-31')
  );
  console.log('\nCompliance Report:');
  console.log('  Total Events:', report.totalEvents);
  console.log('  Unique Users:', report.uniqueUsers);
  console.log('  Events by Action:', report.eventsByAction);

  // Integrity ledger
  IntegrityLedger.clear();
  IntegrityLedger.addEntry({ action: 'policy_created', timestamp: new Date() });
  IntegrityLedger.addEntry({ action: 'employee_added', timestamp: new Date() });
  IntegrityLedger.addEntry({ action: 'time_accrued', hours: 2.5 });

  const verification = IntegrityLedger.verifyLedger();
  console.log('\nLedger Verification:');
  console.log('  Valid:', verification.valid);
  console.log('  Total Entries:', verification.totalEntries);
  console.log('  Verified Entries:', verification.verifiedEntries);
  console.log();
}

/**
 * Run all demos
 */
export function runAllDemos() {
  console.log(
    '\n╔═══════════════════════════════════════════════════════════╗'
  );
  console.log('║  ESTA-Logic Guided Experience Ecosystem Demonstration     ║');
  console.log(
    '╚═══════════════════════════════════════════════════════════╝\n'
  );

  demoTrustFramework();
  demoEmotionalUX();
  demoPersonalization();
  demoDecisionIntelligence();
  demoAdaptiveFlow();
  demoEnterpriseTrust();

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  All systems operational! 🎉                              ║');
  console.log(
    '╚═══════════════════════════════════════════════════════════╝\n'
  );
}

// Export for use in other modules
export const GuidedExperienceDemo = {
  demoTrustFramework,
  demoEmotionalUX,
  demoPersonalization,
  demoDecisionIntelligence,
  demoAdaptiveFlow,
  demoEnterpriseTrust,
  runAllDemos,
};
