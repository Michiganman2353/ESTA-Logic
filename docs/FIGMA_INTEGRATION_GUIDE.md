# Figma Integration Guide - ESTA Guided Flow

This guide helps you create and maintain design consistency between Figma and the implemented guided flow wizard.

## Quick Start

### 1. Figma Project Setup

Create a new Figma file with the following structure:

```
📁 ESTA-Logic Guided Compliance System
  ├── 📄 Cover (Project description)
  ├── 📄 Design Tokens (Colors, Typography, Components)
  ├── 📄 Flow Diagram
  └── 📄 Screens
```

### 2. Paste Project Description

In your Figma project description (or Cover page), paste:

```
ESTA-Logic Guided Compliance System
Experience Objective:
A TurboTax-inspired guided flow that simplifies Michigan ESTA compliance for employers.

Primary Experience Pillars:
• Friendly government-grade confidence
• Zero-confusion guided steps
• Progressive disclosure: never overwhelm users
• State persistence – users must NEVER lose progress
• Explicit legal clarity

Experience Chapters:
1️⃣ Welcome & Eligibility Wizard
2️⃣ Employer Profile Setup
3️⃣ Workforce Review & Compliance Impact
4️⃣ Sick Time Accrual Guidance
5️⃣ Secure Docs + Photo Capture
6️⃣ Summary + Compliance Certificate

Navigation Standard:
Primary CTA: Continue →
Secondary CTA: Back
Tertiary: Save & Exit
Support: Help

Mobile-first. Desktop adaptive.
Professional, calm government trust UI tone.
```

## Design Tokens

### Color Styles

Create these color styles in Figma (right-click → Styles → Create style):

| Token Name         | Hex Value | Usage                             |
| ------------------ | --------- | --------------------------------- |
| Primary/Trust Blue | `#1E4BD8` | Primary buttons, links            |
| Accent Blue        | `#3B82F6` | Hover states, secondary actions   |
| Gov Trust Green    | `#00B289` | Success states, positive feedback |
| Compliance Error   | `#D32F2F` | Error messages, warnings          |
| Background         | `#F7FAFE` | Page background                   |
| Surface            | `#FFFFFF` | Card backgrounds                  |
| Text Primary       | `#111827` | Primary text content              |
| Text Secondary     | `#4B5563` | Secondary text, labels            |
| Border             | `#E5E7EB` | Borders, dividers                 |

**Implementation in Tailwind:**

```tsx
// The colors are already configured in tailwind.config.js
<div className="bg-trust-blue text-white">Primary Button</div>
<div className="bg-gov-trust-green">Success Message</div>
<div className="bg-background">Page Background</div>
```

### Typography Styles

Create these text styles in Figma:

| Style Name        | Font  | Size | Weight   | Usage              |
| ----------------- | ----- | ---- | -------- | ------------------ |
| Title/H1          | Inter | 34px | Bold     | Page titles        |
| Section Header/H2 | Inter | 24px | SemiBold | Section headers    |
| Field Label       | Inter | 14px | Medium   | Form labels        |
| Body              | Inter | 16px | Regular  | Body text          |
| Caption/Legal     | Inter | 13px | Regular  | Helper text, legal |

**Implementation in React:**

```tsx
// Page title
<h1 className="text-4xl font-bold text-gray-900">Welcome</h1>

// Section header
<h2 className="text-2xl font-semibold text-gray-900">Your Policy</h2>

// Field label
<label className="text-sm font-medium text-gray-700">Employee Count</label>

// Body text
<p className="text-base text-gray-600">Description here</p>

// Caption
<p className="text-sm text-gray-500">Helper text</p>
```

### Component Tokens

Create these as local styles in Figma:

| Token          | Value                       | Figma Property | CSS Class                        |
| -------------- | --------------------------- | -------------- | -------------------------------- |
| Card Radius    | 18px                        | Corner Radius  | `rounded-card`                   |
| Button Radius  | 12px                        | Corner Radius  | `rounded-button`                 |
| Field Radius   | 10px                        | Corner Radius  | `rounded-field`                  |
| Elevation Soft | 0 6px 18px rgba(0,0,0,0.08) | Drop Shadow    | `shadow-elevation-soft`          |
| Transition     | 350ms ease-in-out           | Smart Animate  | `transition-colors duration-350` |

## Screen Frames

Create these exact frames in Figma (Desktop: 1440x900, Mobile: 375x812):

### Frame Names and Content

#### 01 – Welcome Hero

**Desktop (1440x900)**

- Large heading: "Welcome to ESTA Compliance"
- Subheading explaining guided experience
- Hero illustration or icon
- Large "Get Started →" button

**Mobile (375x812)**

- Same content, single column layout
- Larger touch targets (min 44x44px)

#### 02 – Intro Explanation

- Numbered list of what user will complete
- Trust indicators (data saved, secure)
- "Continue →" button
- "Need help?" link

#### 03 – Eligibility Start

- Transition screen
- Brief explanation
- "Start →" button

#### 04 – Employer Type

- Four large cards:
  - 🏪 Small Business
  - 🏢 Large Business
  - 🏛️ Municipal/Government
  - 🤝 Nonprofit
- Each card shows icon, title, description
- Selected state with checkmark
- "Back" and "Continue →" buttons

#### 05 – Employee Count

- Large number input field
- Real-time policy tier preview
- Helper text about who to count
- "Back" and "Continue →" buttons

#### 06 – Policy Determination

- Policy summary card with:
  - Accrual rate: 1:30
  - Annual cap
  - Carryover limit
  - Usage limit
- Compliance requirements list
- "Back" and "Continue →" buttons

#### 07 – Guided Answer Wizard

- (Same as Policy Determination)

#### 08 – Secure Doc Capture Intro

- Camera icon
- Explanation of what to capture
- "Start Camera" button
- "Skip for Now →" button

#### 09 – Camera Flow

**Desktop**

- Camera preview window
- "Cancel" and "Capture Photo" buttons
- After capture: photo preview, "Retake" and "Save & Continue" buttons

**Mobile**

- Full-screen camera view
- Large capture button at bottom
- Same retake/save flow

#### 10 – Review Summary

- Collapsible sections:
  - Business Information
  - Policy Configuration
  - Documents Captured
- Next steps list
- "Download Certificate" button
- "Go to Dashboard →" button

#### 11 – Compliance Certificate

- Certificate design with:
  - ESTA logo
  - Business name
  - Policy details
  - Date generated
  - Download/Print buttons

## Prototype Wiring

In Figma's Prototype tab, create these interactions:

```
01 Welcome → [Click "Get Started"] → 02 Intro
02 Intro → [Click "Continue"] → 03 Eligibility
03 Eligibility → [Click "Start"] → 04 Employer Type
04 Employer Type → [Select card] → [Show checkmark]
04 Employer Type → [Click "Continue"] → 05 Employee Count
05 Employee Count → [Type number] → [Show policy preview]
05 Employee Count → [Click "Continue"] → 06 Policy
06 Policy → [Click "Continue"] → 08 Camera Intro
08 Camera → [Click "Start Camera"] → 09 Camera View
08 Camera → [Click "Skip"] → 10 Summary
09 Camera → [Click "Capture"] → [Show preview]
09 Camera → [Click "Save"] → 10 Summary
10 Summary → [Click "Certificate"] → 11 Certificate
10 Summary → [Click "Dashboard"] → [End flow]
```

**Interaction Settings:**

- Animation: Smart Animate
- Easing: Ease In Out
- Duration: 350ms

## Progress Bar Component

Create a reusable progress bar component:

**Structure:**

- 6 circles (one per step)
- Connecting lines between circles
- States:
  - Complete: Green background `#00B289`, white checkmark
  - Current: Blue background `#1E4BD8`, white number
  - Future: Gray background `#E5E7EB`, gray number
  - Line: Green if previous step complete, gray otherwise

**Component Properties:**

- Variant: step-1, step-2, step-3, step-4, step-5, step-6
- Auto-layout: horizontal, space between
- Responsive: scales on mobile

**Implementation:**

```tsx
// Already implemented in WizardEngine.tsx
// Visual progress bar with step indicators
```

## Mobile Responsive Guidelines

### Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Adaptations

1. **Typography**
   - H1: 28px (down from 34px)
   - H2: 20px (down from 24px)
   - Increase line height for readability

2. **Spacing**
   - Reduce card padding: 16px (down from 32px)
   - Reduce gaps: 12px (down from 16px)

3. **Buttons**
   - Full-width on mobile
   - Minimum 44px height
   - Increase padding for touch targets

4. **Cards**
   - Stack vertically
   - Full-width
   - Larger tap areas

### Implementation

```tsx
// Responsive classes in Tailwind
<div className="p-4 sm:p-6 lg:p-8">
  <h1 className="text-2xl sm:text-3xl lg:text-4xl">Title</h1>
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{/* Cards */}</div>
</div>
```

## Animation Guidelines

### Page Transitions

- Use fade-in-up for new steps
- Duration: 350ms
- Easing: ease-in-out

### Button Interactions

- Hover: Scale 1.02, brightness increase
- Active: Scale 0.98
- Duration: 150ms

### Loading States

- Skeleton screens for content loading
- Spinner for actions
- Progress indication for multi-step operations

### Implementation

```tsx
// Already configured in tailwind.config.js
<div className="animate-fade-in">Content</div>
<button className="transition-all duration-350 hover:scale-102">
  Click me
</button>
```

## Design-to-Code Workflow

### 1. Export Assets

- Use Figma's export settings
- 1x, 2x, 3x for images
- SVG for icons
- WebP for photos

### 2. Inspect Mode

- Use Figma's Inspect panel (right sidebar)
- Copy CSS values
- Export SVG code for icons

### 3. Component Mapping

| Figma Component | React Component       | File                  |
| --------------- | --------------------- | --------------------- |
| Welcome Frame   | IntroStep             | IntroStep.tsx         |
| Employer Card   | Button with selection | EmployerTypeStep.tsx  |
| Input Field     | Input component       | EmployeeCountStep.tsx |
| Policy Card     | Card with grid        | PolicyLogicStep.tsx   |
| Camera View     | Video element         | SecureCameraStep.tsx  |
| Summary Card    | Card with sections    | SummaryStep.tsx       |

### 4. Sync Process

1. Design changes made in Figma
2. Export/inspect updated values
3. Update corresponding React component
4. Test in browser
5. Update Figma with any implementation discoveries

## Handoff Checklist

Before handing off designs to developers:

- [ ] All color styles use defined tokens
- [ ] All text styles follow typography system
- [ ] Components use auto-layout
- [ ] Responsive frames for mobile/desktop
- [ ] Prototype flow is wired and tested
- [ ] Assets are exported at correct sizes
- [ ] Accessibility notes added (color contrast, focus states)
- [ ] Animation specs documented
- [ ] Edge cases designed (errors, empty states, loading)
- [ ] Developer notes added for complex interactions

## Maintenance

### When to Update Figma

- New feature additions
- UI improvements based on user feedback
- Design system changes
- Accessibility improvements
- New screen sizes/breakpoints

### When to Update Code

- Brand color changes
- Typography updates
- Component style changes
- New interaction patterns
- Layout improvements

### Version Control

- Name Figma pages with version numbers
- Tag important versions: "v1.0 - Launch", "v1.1 - Camera Update"
- Keep change log in project description
- Document breaking changes

## Resources

- [Figma to Code Best Practices](https://www.figma.com/best-practices/code-handoff/)
- [Design Tokens](https://www.designtokens.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Support

For design system questions or sync issues:

1. Check this guide first
2. Review component READMEs in `/modules/guidedFlow/`
3. Contact the design team
4. Submit design system update requests via GitHub issues
