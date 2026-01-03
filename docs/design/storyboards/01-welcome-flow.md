# Welcome & Eligibility Wizard Flow

## Overview

The Welcome & Eligibility Wizard is the first touchpoint for employers using ESTA Tracker. This guided flow removes anxiety, establishes trust, and collects essential information to determine the employer's compliance path.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    WELCOME & ELIGIBILITY                     │
│                      (5 Step Flow)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Welcome Screen                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎯 Hero Message                                         │ │
│ │ "Welcome to ESTA Tracker – Your Trusted Partner for     │ │
│ │  Michigan Employment Compliance"                        │ │
│ │                                                          │ │
│ │ 📝 Subheading                                           │ │
│ │ "We'll guide you through Michigan's Employee Earned     │ │
│ │  Sick Time Act in simple, clear steps."                 │ │
│ │                                                          │ │
│ │ ✓ What to expect (3-5 bullet points)                   │ │
│ │ ✓ Time estimate: "5 minutes to complete"               │ │
│ │ ✓ Trust signals: Lock icon + "Secure & Confidential"   │ │
│ │                                                          │ │
│ │ [Continue →]                                             │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Business Type Selection                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📋 Question                                             │ │
│ │ "What type of organization are you?"                    │ │
│ │                                                          │ │
│ │ ○ Small Business (fewer than 50 employees)             │ │
│ │ ○ Large Business (50+ employees)                       │ │
│ │ ○ Non-Profit Organization                              │ │
│ │ ○ Government Entity                                     │ │
│ │ ○ Not Sure                                             │ │
│ │                                                          │ │
│ │ 💡 Help Text (optional, collapsible)                   │ │
│ │ "Michigan law has different requirements based on       │ │
│ │  your organization size..."                             │ │
│ │                                                          │ │
│ │ [← Back]                              [Continue →]      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Employee Count                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📋 Question                                             │ │
│ │ "How many employees do you currently have?"             │ │
│ │                                                          │ │
│ │ ┌────────────────┐                                      │ │
│ │ │ [___________] │ ← Number input                       │ │
│ │ └────────────────┘                                      │ │
│ │ employees                                               │ │
│ │                                                          │ │
│ │ 💡 Contextual Message (shown after input)              │ │
│ │ "Based on 15 employees, you're classified as a          │ │
│ │  Small Employer under Michigan law."                    │ │
│ │                                                          │ │
│ │ 📊 Visual Indicator                                     │ │
│ │ ┌─────────┬──────────────────────────────────────┐      │ │
│ │ │ Small   │ Large                                │      │ │
│ │ │ < 50    │ 50+                                  │      │ │
│ │ │    ●────┴────────────────────────────────────  │      │ │
│ │ │   YOU                                          │      │ │
│ │ └───────────────────────────────────────────────┘      │ │
│ │                                                          │ │
│ │ [← Back]                              [Continue →]      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Employment Structure                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📋 Question                                             │ │
│ │ "Do you have any of the following?"                     │ │
│ │                                                          │ │
│ │ ☑ Part-time employees                                  │ │
│ │ ☑ Seasonal employees                                   │ │
│ │ ☑ Contract workers                                     │ │
│ │ ☑ None of the above                                    │ │
│ │                                                          │ │
│ │ 💡 Help Text                                            │ │
│ │ "This helps us configure the right accrual rules        │ │
│ │  for your workforce."                                   │ │
│ │                                                          │ │
│ │ [← Back]                              [Continue →]      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Compliance Path Summary                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ Summary Header                                       │ │
│ │ "Here's Your Compliance Path"                           │ │
│ │                                                          │ │
│ │ 📊 Classification Card                                  │ │
│ │ ┌───────────────────────────────────────────────────┐  │ │
│ │ │ Small Employer (< 50 employees)                   │  │ │
│ │ │                                                    │  │ │
│ │ │ ✓ Accrual Rate: 1 hour per 40 hours worked       │  │ │
│ │ │ ✓ Annual Cap: 40 hours                           │  │ │
│ │ │ ✓ Usage Cap: 40 hours per year                   │  │ │
│ │ │ ✓ Carryover: Up to 40 hours                      │  │ │
│ │ └───────────────────────────────────────────────────┘  │ │
│ │                                                          │ │
│ │ 🎯 Next Steps Preview                                   │ │
│ │ "Next, we'll help you:"                                 │ │
│ │ 1. Set up your employer profile                        │ │
│ │ 2. Configure your sick time policy                     │ │
│ │ 3. Add your employees                                  │ │
│ │                                                          │ │
│ │ 💾 Auto-save Notice                                     │ │
│ │ "Your progress is automatically saved. You can          │ │
│ │  return anytime."                                       │ │
│ │                                                          │ │
│ │ [← Back]                    [Continue to Setup →]       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Design Specifications

### Colors

- **Primary CTA Button**: `trust-blue` (#1E4BD8)
- **Background**: `background` (#F7FAFE)
- **Text Primary**: `text-primary` (#111827)
- **Text Secondary**: `text-secondary` (#4B5563)
- **Success Indicators**: `gov-trust-green` (#00B289)
- **Help Text Background**: Light blue tint (#F0F4FF)

### Typography

- **Hero Heading**: 34px Bold (H1)
- **Section Headers**: 24px Semibold (H2)
- **Body Text**: 16px Regular
- **Help Text**: 14px Regular
- **Button Text**: 16px Medium

### Spacing

- **Card Padding**: 24px (relaxed on desktop), 16px (compact on mobile)
- **Section Gaps**: 32px between major sections
- **Form Field Gaps**: 16px between inputs
- **Button Padding**: 12px vertical, 24px horizontal

### Components

- **Progress Indicator**: Horizontal stepper showing 5/5 steps
- **Radio Buttons**: Large touch targets (48px min height)
- **Checkboxes**: Standard with clear labels
- **Help Icons**: Tooltip on hover, tap to expand on mobile
- **Input Fields**: 48px height minimum for accessibility

---

## Interaction Patterns

### Progressive Disclosure

- Help text is collapsible to avoid overwhelming users
- Additional context appears only when relevant
- Error messages appear inline with specific guidance

### Validation

- Real-time feedback on employee count (shows classification)
- Clear error messages with actionable guidance
- Never block progress without explanation

### Navigation

- **Primary Action**: Always "Continue →" (blue button, right-aligned)
- **Secondary Action**: "← Back" (ghost button, left-aligned)
- **Tertiary Action**: "Save & Exit" (small link, top-right)
- Progress bar shows current step and total steps

### Mobile Considerations

- Single column layout
- Large touch targets (minimum 44x44px)
- Sticky bottom navigation bar with CTAs
- Help text expands on tap

---

## Copy Tone

### Voice Characteristics

- **Calm & Reassuring**: "We'll guide you through this step by step"
- **Professional**: Use proper terminology but explain it
- **Human**: "You" language, active voice
- **Confident**: "You're all set" not "You should be fine"

### Example Copy Patterns

- ✅ "Let's confirm your organization details"
- ❌ "Please enter your organization information"

- ✅ "Based on 15 employees, you're classified as a Small Employer"
- ❌ "You have been categorized as Employer Type A"

- ✅ "We'll help you set up your sick time policy"
- ❌ "Policy configuration is required"

---

## Success Metrics

### User Flow Success

- ✅ **Completion Rate**: >85% of users complete all 5 steps
- ✅ **Time to Complete**: Average 3-5 minutes
- ✅ **Error Rate**: <5% validation errors requiring correction
- ✅ **Drop-off Points**: Monitor each step, optimize high drop-off screens

### User Confidence

- Post-flow survey: "Did you feel confident in the information provided?" >90% Yes
- Support tickets related to wizard flow: <2% of total tickets

---

## Accessibility Requirements

- **WCAG 2.1 AA Compliance**
  - Color contrast ratio ≥ 4.5:1 for body text
  - Color contrast ratio ≥ 3:1 for large text and UI components
  - All interactive elements keyboard accessible
  - Screen reader announcements for step changes

- **Focus Management**
  - Visible focus indicators on all interactive elements
  - Logical tab order through the form
  - Focus moves to error messages when validation fails

- **Assistive Text**
  - All form fields have associated labels
  - Help text properly associated with aria-describedby
  - Progress indicator announced to screen readers

---

## Technical Implementation Notes

### State Management

- Store wizard progress in localStorage
- Sync to Firebase on step completion
- Resume from last completed step on return

### Validation Strategy

- Client-side validation for immediate feedback
- Server-side validation for data integrity
- Graceful error handling with retry options

### Analytics Events

```typescript
// Track each step completion
trackEvent('wizard_step_completed', {
  step: 'business_type',
  value: 'small_business',
  timestamp: Date.now(),
});

// Track drop-offs
trackEvent('wizard_abandoned', {
  last_step: 'employee_count',
  time_spent: 120, // seconds
});
```
