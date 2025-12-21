/**
 * UX Experience Contract Demo
 *
 * This demo shows how the experience contract transforms raw engine
 * outputs into human-readable, emotionally intelligent responses.
 *
 * Run with: npx ts-node --project demo/tsconfig.json demo/ux-experience-demo.ts
 */

import {
  transformAccrualToExperience,
  transformComplianceToExperience,
} from '../libs/shared-utils/src/experience-transformers';
import type {
  AccrualCalculateResult,
  ComplianceCheckResult,
} from '../kernel/abi/messages';

console.log('🎯 UX Experience Contract Demo\n');
console.log('='.repeat(80));
console.log('\n');

// ============================================================================
// Demo 1: Accrual Calculation
// ============================================================================

console.log('📊 Demo 1: Accrual Calculation\n');

const accrualResult: AccrualCalculateResult = {
  employeeId: 'emp-123',
  periodStart: '2024-01-01',
  periodEnd: '2024-01-15',
  hoursAccrued: 2.5,
  newBalance: 15.5,
  maxBalance: 40,
  isAtMax: false,
  calculation: {
    accrualRate: 1 / 30,
    hoursWorked: 75,
    rawAccrual: 2.5,
    appliedAccrual: 2.5,
  },
};

console.log('Raw Engine Output:');
console.log(JSON.stringify(accrualResult, null, 2));
console.log('\n' + '-'.repeat(80) + '\n');

const accrualExperience = transformAccrualToExperience(accrualResult);

console.log('UX Experience Response:\n');
console.log(`Decision: ${accrualExperience.decision}`);
console.log(`Risk Level: ${accrualExperience.riskLevel}`);
console.log(`Confidence: ${accrualExperience.confidenceScore}%\n`);

console.log('📝 Explanation:');
console.log(`"${accrualExperience.explanation}"\n`);

console.log('💭 Human Meaning:');
console.log(`"${accrualExperience.humanMeaning}"\n`);

console.log('💚 Reassurance:');
console.log(`"${accrualExperience.reassuranceMessage.message}"`);
console.log(`Tone: ${accrualExperience.reassuranceMessage.tone}\n`);

console.log('🎯 Next Steps:');
accrualExperience.nextSteps.forEach((step, i) => {
  console.log(`${i + 1}. [${step.priority.toUpperCase()}] ${step.title}`);
  console.log(`   ${step.description}`);
  if (step.helpLink) {
    console.log(`   → ${step.helpLink}`);
  }
});

console.log('\n📚 Legal References:');
accrualExperience.legalReferences.forEach((ref, i) => {
  console.log(`${i + 1}. ${ref.citation}`);
  console.log(`   ${ref.summary}`);
  console.log(`   → ${ref.relevanceExplanation}`);
});

console.log('\n' + '='.repeat(80) + '\n');

// ============================================================================
// Demo 2: Compliance Check - Success
// ============================================================================

console.log('✅ Demo 2: Compliance Check - All Clear\n');

const compliantResult: ComplianceCheckResult = {
  compliant: true,
  violations: [],
  warnings: [],
  auditTrail: JSON.stringify({
    timestamp: new Date().toISOString(),
    rulesEvaluated: ['ESTA-001', 'ESTA-002', 'ESTA-003'],
  }),
};

const compliantExperience = transformComplianceToExperience(compliantResult);

console.log(`Decision: ${compliantExperience.decision}`);
console.log(`Risk Level: ${compliantExperience.riskLevel}`);
console.log(`Confidence: ${compliantExperience.confidenceScore}%\n`);

console.log('📝 Explanation:');
console.log(`"${compliantExperience.explanation}"\n`);

console.log('💚 Reassurance:');
console.log(`"${compliantExperience.reassuranceMessage.message}"`);
console.log(`Context: "${compliantExperience.reassuranceMessage.context}"`);
console.log(`Tone: ${compliantExperience.reassuranceMessage.tone}\n`);

console.log(
  `✓ Rules Checked: ${compliantExperience.complianceSummary.totalRulesChecked}`
);
console.log(`✓ Status: ${compliantExperience.complianceSummary.overallStatus}`);

console.log('\n' + '='.repeat(80) + '\n');

// ============================================================================
// Demo 3: Compliance Check - Violations
// ============================================================================

console.log('⚠️  Demo 3: Compliance Check - Violations Found\n');

const violationResult: ComplianceCheckResult = {
  compliant: false,
  violations: [
    {
      code: 'ESTA-001',
      rule: 'Accrual Rate',
      message: 'Accrual rate violation: expected 2.50 hours, got 2.00',
      severity: 'critical',
      remediation: 'Recalculate accrual using 1:30 ratio',
    },
    {
      code: 'ESTA-002',
      rule: 'Maximum Accrual Cap',
      message: 'Balance exceeds maximum: 45 hours (max: 40)',
      severity: 'error',
      remediation: 'Cap balance at 40 hours',
    },
  ],
  warnings: [
    {
      code: 'ESTA-003',
      rule: 'Minimum Increment',
      message: 'Usage below minimum increment: 0.5 hours (min: 1 hour)',
      suggestion: 'Round up usage to nearest hour',
    },
  ],
  auditTrail: JSON.stringify({
    timestamp: new Date().toISOString(),
    rulesEvaluated: ['ESTA-001', 'ESTA-002', 'ESTA-003'],
  }),
};

const violationExperience = transformComplianceToExperience(violationResult);

console.log(`Decision: ${violationExperience.decision}`);
console.log(`Risk Level: ${violationExperience.riskLevel}`);
console.log(`Confidence: ${violationExperience.confidenceScore}%\n`);

console.log('📝 Explanation:');
console.log(`"${violationExperience.explanation}"\n`);

console.log('💔 Reassurance (Empathetic):');
console.log(`"${violationExperience.reassuranceMessage.message}"`);
console.log(`Context: "${violationExperience.reassuranceMessage.context}"`);
console.log(`Tone: ${violationExperience.reassuranceMessage.tone}\n`);

console.log('🚨 Violations:');
violationExperience.violations.forEach((v, i) => {
  console.log(`\n${i + 1}. ${v.code} [${v.severity.toUpperCase()}]`);
  console.log(`   ❌ ${v.userFriendlyMessage}`);
  console.log(`   💡 What it means: ${v.whatItMeans}`);
  console.log(`   🔧 How to fix: ${v.howToFix}`);
});

console.log('\n⚠️  Warnings:');
violationExperience.warnings.forEach((w, i) => {
  console.log(`\n${i + 1}. ${w.code}`);
  console.log(`   ⚠️  ${w.userFriendlyMessage}`);
  console.log(`   💭 Consider: ${w.whatToConsider}`);
});

console.log('\n🎯 Next Steps (Prioritized):');
violationExperience.nextSteps.forEach((step, i) => {
  const emoji =
    step.priority === 'urgent'
      ? '🔴'
      : step.priority === 'high'
        ? '🟠'
        : step.priority === 'medium'
          ? '🟡'
          : '🟢';
  console.log(`${emoji} ${i + 1}. [${step.category}] ${step.title}`);
  console.log(`   ${step.description}`);
  if (step.estimatedMinutes) {
    console.log(`   ⏱️  Est. time: ${step.estimatedMinutes} min`);
  }
});

console.log('\n' + '='.repeat(80) + '\n');

// ============================================================================
// Demo 4: Personalization (Employee vs Employer)
// ============================================================================

console.log('👤 Demo 4: Personalization - Role-Based Messaging\n');

const personalizedResult: AccrualCalculateResult = {
  employeeId: 'emp-456',
  periodStart: '2024-01-01',
  periodEnd: '2024-01-15',
  hoursAccrued: 2.5,
  newBalance: 35,
  maxBalance: 40,
  isAtMax: false,
  calculation: {
    accrualRate: 1 / 30,
    hoursWorked: 75,
    rawAccrual: 2.5,
    appliedAccrual: 2.5,
  },
};

console.log('As Employee (Beginner):');
const employeeExperience = transformAccrualToExperience(personalizedResult, {
  language: 'en',
  experienceLevel: 'beginner',
  prefersDetailedExplanations: false,
  timezone: 'America/Detroit',
  role: 'employee',
  hasSeenSimilarScenario: false,
});
console.log(`"${employeeExperience.humanMeaning}"`);
console.log(
  `Reassurance: "${employeeExperience.reassuranceMessage.message}"\n`
);

console.log('As Employer (Advanced):');
const employerExperience = transformAccrualToExperience(personalizedResult, {
  language: 'en',
  experienceLevel: 'advanced',
  prefersDetailedExplanations: true,
  timezone: 'America/Detroit',
  role: 'employer',
  hasSeenSimilarScenario: true,
});
console.log(`"${employerExperience.humanMeaning}"`);
console.log(
  `Reassurance: "${employerExperience.reassuranceMessage.message}"\n`
);

console.log(
  'Notice the different messaging based on role and experience level!\n'
);

console.log('='.repeat(80) + '\n');

console.log('✨ Demo Complete!\n');
console.log('Key Takeaways:');
console.log('✓ Every response includes human-readable explanations');
console.log('✓ Emotional reassurance builds trust');
console.log('✓ Clear next steps guide users');
console.log('✓ Risk levels and confidence scores provide transparency');
console.log('✓ Legal references are explained in plain English');
console.log('✓ Personalization adapts to user context\n');
