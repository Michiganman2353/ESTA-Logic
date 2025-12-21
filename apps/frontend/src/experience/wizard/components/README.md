# Enhanced Guided Narrative UX Components

This directory contains TurboTax-style UX enhancement components that provide psychological reassurance, confidence tracking, and decision transparency throughout the guided wizard flow.

## Components Overview

### 1. EnhancedWizardStep

A wrapper component that adds comprehensive UX enhancements to wizard steps.

**Features:**

- Trust badges and security signals
- Progress indicators
- Confidence scores
- Legal assurance displays
- Automatic progress saving notifications

**Usage:**

```tsx
import EnhancedWizardStep from './components/EnhancedWizardStep';

<EnhancedWizardStep
  title="Step Title"
  subtitle="Step description"
  showTrustBadges={true}
  showSecuritySignals={false}
  showLegalAssurance={false}
  stepNumber={2}
  totalSteps={6}
>
  {/* Your step content */}
</EnhancedWizardStep>;
```

### 2. DecisionExplanation

Displays transparent explanations for recommendations with confidence levels.

**Features:**

- Visual confidence badges (High/Medium/Low)
- Clear reasoning with bullet points
- Decision factors breakdown
- Alternative options display

**Usage:**

```tsx
import DecisionExplanation, {
  PolicyDecisionExplanation,
  AccrualRateDecisionExplanation
} from './components/DecisionExplanation';

// Generic usage
<DecisionExplanation
  recommendation="We recommend the comprehensive policy"
  why="Based on your employee count and legal requirements"
  confidence="High"
  factors={['50+ employees', 'Michigan ESTA requirements']}
  alternativeOptions={['Standard policy']}
/>

// Pre-built helpers
<PolicyDecisionExplanation
  employeeCount={75}
  hasExistingPolicy={false}
/>

<AccrualRateDecisionExplanation
  employeeCount={75}
/>
```

### 3. ConfidenceIndicator

Provides psychological reassurance by showing setup completion quality.

**Variants:**

- `minimal`: Compact badge (default)
- `detailed`: Progress bar with tips
- `dashboard`: Full dashboard view

**Usage:**

```tsx
import ConfidenceIndicator, {
  StepConfidenceIndicator
} from './components/ConfidenceIndicator';

// Manual score
<ConfidenceIndicator
  score={85}
  variant="dashboard"
  showTips={true}
/>

// Auto-calculated from step data
<StepConfidenceIndicator
  stepData={{ companyName: 'Acme', employerType: 'large' }}
  requiredFields={['companyName', 'employerType']}
/>
```

## Integration with Existing Systems

### Trust Framework

All components integrate seamlessly with the existing trust framework:

- `SecuritySignals` - Visual security badges
- `LegalAssurance` - Legal compliance messaging
- `TrustBadge` - Trust and compliance indicators

### Tone Engine

Components use the `ToneEngine` for emotional UX:

```tsx
import { ToneEngine } from '../../tone/ToneEngine';

const message = ToneEngine.reassuring("You're making great progress!");
const celebration = ToneEngine.celebratory('🎉 Setup Complete!');
```

### Decision Intelligence

Components leverage the `DecisionEngine` for smart recommendations:

```tsx
import { DecisionEngine } from '../../intelligence/DecisionEngine';

const explanation = DecisionEngine.explainPolicyRecommendation(
  employeeCount,
  hasExistingPolicy
);
```

## Design Principles

### 1. **Transparency**

Every recommendation includes a clear explanation of why it was made, building user trust and confidence.

### 2. **Progressive Disclosure**

Information is revealed progressively as users make decisions, preventing overwhelm while maintaining context.

### 3. **Psychological Safety**

Confidence indicators and reassuring messages reduce anxiety and build completion momentum.

### 4. **Legal Clarity**

Complex compliance requirements are translated into plain English with clear visual hierarchy.

### 5. **Trust Building**

Security signals and legal assurance badges are displayed at critical decision points to build confidence.

## Enhanced Wizard Steps

All wizard steps have been enhanced with these components:

1. **IntroStep** - Trust signals, security indicators, time estimates
2. **EmployerProfileStep** - Confidence tracking, trust badges, contextual help
3. **EmployeePolicyStep** - Decision explanations, accrual rate recommendations
4. **ReviewStep** - Full confidence dashboard, comprehensive summary
5. **CompletionStep** - Success celebration, final confidence score, next steps

## Best Practices

### When to Use EnhancedWizardStep

- ✅ All wizard steps for consistency
- ✅ Multi-step processes requiring trust
- ✅ Complex decision points
- ❌ Simple single-page forms
- ❌ Non-wizard flows

### When to Show Decision Explanations

- ✅ Policy recommendations
- ✅ Accrual rate calculations
- ✅ Compliance tier determinations
- ✅ Any automated decision affecting the user
- ❌ User's own data entry
- ❌ Trivial choices

### When to Display Confidence Scores

- ✅ Multi-field forms (track completion)
- ✅ Review/summary pages (overall quality)
- ✅ Complex workflows (momentum building)
- ❌ Single-field inputs
- ❌ Optional information

## Accessibility

All components follow WCAG 2.1 AA standards:

- Semantic HTML with proper ARIA labels
- Keyboard navigation support
- Screen reader announcements
- Color contrast ratios meet standards
- Focus indicators visible

## Styling

Components use Tailwind CSS with consistent design tokens:

- Colors: Green (success), Blue (info), Yellow (warning), Orange (caution)
- Typography: Hierarchical font sizes with clear visual weight
- Spacing: Consistent padding/margin scale
- Animations: Subtle, meaningful transitions

## Future Enhancements

Planned improvements:

- [ ] Personalized recommendations based on industry
- [ ] Interactive confidence tips and suggestions
- [ ] A/B testing framework for UX variations
- [ ] Analytics integration for confidence correlation
- [ ] Multi-language support for explanations

## Examples

See the enhanced wizard steps in `src/experience/wizard/steps/` for complete integration examples.

## Support

For questions or issues with these components, refer to the main GUIDED_EXPERIENCE_GUIDE.md or contact the development team.
