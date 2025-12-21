# ESTA Tracker Design Tokens

## Overview

Design tokens are the single source of truth for ESTA Tracker's visual design language. They ensure consistency between design (Figma) and code (React/Tailwind), enabling designers and engineers to speak the same language.

---

## 📚 Table of Contents

1. [What Are Design Tokens?](#what-are-design-tokens)
2. [Token Structure](#token-structure)
3. [Color Tokens](#color-tokens)
4. [Typography Tokens](#typography-tokens)
5. [Spacing Tokens](#spacing-tokens)
6. [Shadow Tokens](#shadow-tokens)
7. [Border Tokens](#border-tokens)
8. [Using Tokens in Code](#using-tokens-in-code)
9. [Using Tokens in Figma](#using-tokens-in-figma)
10. [Token Governance](#token-governance)

---

## What Are Design Tokens?

**Design tokens** are named design decisions stored as data. They replace hard-coded values with semantic names that can be updated globally.

### Example

❌ **Without Tokens** (hard-coded, inconsistent):

```tsx
<button style={{
  backgroundColor: '#1E63FF',
  padding: '12px 24px',
  borderRadius: '8px',
  fontSize: '16px'
}}>
```

✅ **With Tokens** (semantic, maintainable):

```tsx
import { colors, spacing, borders, typography } from '@/design-tokens';

<button style={{
  backgroundColor: colors.primary.royalBlue,
  padding: `${spacing[3]} ${spacing[6]}`,
  borderRadius: borders.componentRadius.button.default,
  fontSize: typography.fontSizes.base
}}>
```

### Benefits

✅ **Consistency** - Same visual language across the app  
✅ **Maintainability** - Change once, update everywhere  
✅ **Design-Engineering Sync** - Shared vocabulary  
✅ **Scalability** - Easy to add themes or rebrand  
✅ **Accessibility** - Centralized control over contrast and sizing

---

## Token Structure

All design tokens are located in:

```
apps/frontend/src/design-tokens/
├── colors.ts         # Color palette and semantic colors
├── typography.ts     # Font families, sizes, weights, line heights
├── spacing.ts        # Spacing scale and layout values
├── shadows.ts        # Shadows and elevation system
├── borders.ts        # Border radius, widths, and presets
└── index.ts          # Central export point
```

### Import Tokens

```typescript
// Import specific token categories
import { colors, typography, spacing } from '@/design-tokens';

// Or import the complete system
import { designTokens } from '@/design-tokens';
```

---

## Color Tokens

**Location**: `apps/frontend/src/design-tokens/colors.ts`

### Brand Colors

The core ESTA Tracker brand palette:

| Token                     | Hex       | Usage                                  |
| ------------------------- | --------- | -------------------------------------- |
| `primaryColors.navyDeep`  | `#0A1E45` | Deep navy for headers, key UI elements |
| `primaryColors.royalBlue` | `#1E63FF` | Primary brand color for actions        |
| `primaryColors.skyBlue`   | `#74B7FF` | Accent color for secondary elements    |
| `primaryColors.graphite`  | `#1B1B1B` | Professional dark neutral              |

### Semantic Colors

Intent-based colors for specific UI purposes:

| Token                            | Hex       | Usage                                 |
| -------------------------------- | --------- | ------------------------------------- |
| `semanticColors.trustBlue`       | `#1E4BD8` | Primary buttons, trust signals        |
| `semanticColors.accentBlue`      | `#3B82F6` | Hover states, secondary actions       |
| `semanticColors.govTrustGreen`   | `#00B289` | Success states, compliance indicators |
| `semanticColors.complianceError` | `#D32F2F` | Errors, warnings, critical alerts     |
| `semanticColors.warningAmber`    | `#F59E0B` | Warning states, caution messages      |

### Color Scales

Full 50-950 scales for navy, royal, and sky blue:

```typescript
// Navy scale (50-950)
colors.navy[50]; // Lightest
colors.navy[500]; // Medium
colors.navy[900]; // Darkest (primary anchor)

// Royal blue scale (50-950)
colors.royal[500]; // Core brand color

// Sky blue scale (50-950)
colors.sky[400]; // Primary accent
```

### Text Colors

Hierarchy of text colors:

```typescript
textColors.primary; // #111827 - Main body text
textColors.secondary; // #4B5563 - Supporting text
textColors.tertiary; // #6B7280 - Meta information
textColors.disabled; // #9CA3AF - Disabled states
textColors.inverse; // #FFFFFF - Text on dark backgrounds
textColors.link; // #1E63FF - Hyperlinks
```

### Surface Colors

Background colors for different surface levels:

```typescript
surfaces.background; // #F7FAFE - Page background
surfaces.surface; // #FFFFFF - Card/container background
surfaces.surfaceElevated; // #FAFBFC - Elevated surfaces
surfaces.overlay; // rgba(0,0,0,0.5) - Modal overlays
```

### Usage Examples

```tsx
// Primary button
<button className="bg-trust-blue text-inverse">
  Continue
</button>

// Success message
<div style={{
  backgroundColor: colors.status.success.light,
  color: colors.status.success.dark
}}>
  ✓ Profile saved successfully
</div>

// Error state
<input style={{
  borderColor: colors.border.error,
  backgroundColor: colors.status.error.light
}} />
```

---

## Typography Tokens

**Location**: `apps/frontend/src/design-tokens/typography.ts`

### Font Families

```typescript
fontFamilies.sans; // Inter, system-ui, ... (primary UI)
fontFamilies.mono; // JetBrains Mono, ... (code)
fontFamilies.serif; // Georgia, ... (special cases)
```

### Font Size Scale

| Token              | Size | Usage                |
| ------------------ | ---- | -------------------- |
| `fontSizes['6xl']` | 60px | Hero headings        |
| `fontSizes['5xl']` | 48px | Major headings       |
| `fontSizes['4xl']` | 36px | Page titles (H1)     |
| `fontSizes['2xl']` | 24px | Section headers (H2) |
| `fontSizes.xl`     | 20px | Subheadings (H3)     |
| `fontSizes.lg`     | 18px | Large body text      |
| `fontSizes.base`   | 16px | Default body text    |
| `fontSizes.sm`     | 14px | Small text, labels   |
| `fontSizes.xs`     | 12px | Captions, meta info  |

### Font Weights

```typescript
fontWeights.regular; // 400 - Body text
fontWeights.medium; // 500 - Labels, emphasis
fontWeights.semibold; // 600 - Subheadings
fontWeights.bold; // 700 - Headings
```

### Line Heights

```typescript
lineHeights.tight; // 1.25 - Headlines
lineHeights.normal; // 1.5 - Body text
lineHeights.relaxed; // 1.625 - Long-form content
```

### Pre-composed Text Styles

Common text styles ready to use:

```typescript
// Headings
textStyles.h1; // 36px Bold, tight line height
textStyles.h2; // 24px Semibold, snug line height
textStyles.h3; // 20px Semibold, snug line height

// Body
textStyles.body; // 16px Regular, normal line height
textStyles.bodyLarge; // 18px Regular, relaxed line height
textStyles.bodySmall; // 14px Regular, normal line height

// Specialized
textStyles.label; // 14px Medium, tight, wide tracking
textStyles.caption; // 12px Regular
textStyles.button; // 16px Medium, no line height, wide tracking
```

### Usage Examples

```tsx
// Heading
<h1 style={textStyles.h1}>
  Welcome to ESTA Tracker
</h1>

// Body text
<p style={{
  fontSize: typography.fontSizes.base,
  lineHeight: typography.lineHeights.normal,
  color: colors.text.primary
}}>
  Your compliance partner
</p>

// Button text
<button style={textStyles.button}>
  Continue
</button>
```

---

## Spacing Tokens

**Location**: `apps/frontend/src/design-tokens/spacing.ts`

### Base Spacing Scale

8px base grid system using rem units:

| Token         | Value   | Pixels |
| ------------- | ------- | ------ |
| `spacing[1]`  | 0.25rem | 4px    |
| `spacing[2]`  | 0.5rem  | 8px    |
| `spacing[3]`  | 0.75rem | 12px   |
| `spacing[4]`  | 1rem    | 16px   |
| `spacing[6]`  | 1.5rem  | 24px   |
| `spacing[8]`  | 2rem    | 32px   |
| `spacing[12]` | 3rem    | 48px   |
| `spacing[16]` | 4rem    | 64px   |

### Component Spacing

Pre-configured spacing for common patterns:

```typescript
// Padding
componentSpacing.padding.xs; // 8px
componentSpacing.padding.md; // 16px
componentSpacing.padding.lg; // 24px

// Gaps
componentSpacing.gap.sm; // 8px
componentSpacing.gap.md; // 16px
componentSpacing.gap.lg; // 24px

// Form spacing
componentSpacing.form.fieldGap; // 16px - Between fields
componentSpacing.form.labelGap; // 6px - Label to input
componentSpacing.form.groupGap; // 24px - Between groups

// Button padding
componentSpacing.button.md; // "12px 24px"
componentSpacing.button.lg; // "16px 32px"

// Card padding
componentSpacing.card.default; // 24px
componentSpacing.card.compact; // 16px
```

### Usage Examples

```tsx
// Card with standard padding
<div style={{
  padding: spacingSystem.component.card.default
}}>
  Card content
</div>

// Form with consistent gaps
<form style={{
  display: 'flex',
  flexDirection: 'column',
  gap: spacingSystem.component.form.fieldGap
}}>
  <input />
  <input />
</form>

// Button with standard padding
<button style={{
  padding: spacingSystem.component.button.md
}}>
  Submit
</button>
```

---

## Shadow Tokens

**Location**: `apps/frontend/src/design-tokens/shadows.ts`

### Base Shadow Scale

Progressive elevation levels:

| Token            | Usage               |
| ---------------- | ------------------- |
| `shadows.none`   | No shadow           |
| `shadows.xs`     | Subtle hover effect |
| `shadows.sm`     | Minimal elevation   |
| `shadows.md`     | Default cards       |
| `shadows.lg`     | Prominent cards     |
| `shadows.xl`     | Modals, popovers    |
| `shadows['2xl']` | Maximum elevation   |

### Colored Shadows

Brand-colored shadows for interactive elements:

```typescript
coloredShadows.royalSoft; // Royal blue, 8% opacity
coloredShadows.royalMedium; // Royal blue, 15% opacity
coloredShadows.successSoft; // Green, 8% opacity
coloredShadows.errorSoft; // Red, 8% opacity
```

### Glow Effects

Luminous effects for interactive states:

```typescript
glowEffects.blueGlow; // Standard blue glow
glowEffects.blueGlowStrong; // Prominent blue glow
glowEffects.focusGlow; // 3px focus ring
glowEffects.successGlow; // Green glow for success
```

### Component Shadows

Pre-configured for common components:

```typescript
componentShadows.card.default; // md shadow
componentShadows.card.hover; // lg shadow
componentShadows.button.focus; // Focus glow
componentShadows.modal.content; // 2xl shadow
componentShadows.input.focus; // Focus glow
```

### Usage Examples

```tsx
// Card with hover effect
<div style={{
  boxShadow: shadowSystem.component.card.default
}}
  onMouseEnter={(e) =>
    e.currentTarget.style.boxShadow = shadowSystem.component.card.hover
  }>
  Card content
</div>

// Input with focus glow
<input
  style={{ boxShadow: 'none' }}
  onFocus={(e) =>
    e.currentTarget.style.boxShadow = shadowSystem.glow.focusGlow
  }
/>
```

---

## Border Tokens

**Location**: `apps/frontend/src/design-tokens/borders.ts`

### Border Radius

| Token                 | Value  | Usage           |
| --------------------- | ------ | --------------- |
| `borderRadius.none`   | 0      | Sharp corners   |
| `borderRadius.sm`     | 4px    | Subtle rounding |
| `borderRadius.md`     | 6px    | Default inputs  |
| `borderRadius.lg`     | 8px    | Buttons, inputs |
| `borderRadius.xl`     | 12px   | Cards (compact) |
| `borderRadius['2xl']` | 16px   | Modals          |
| `borderRadius.full`   | 9999px | Pills, circles  |

### Component Border Radius

```typescript
componentBorderRadius.button.default; // 8px
componentBorderRadius.input.default; // 8px
componentBorderRadius.card.default; // 18px (custom)
componentBorderRadius.modal.default; // 16px
componentBorderRadius.avatar.circle; // full (9999px)
```

### Border Width

```typescript
borderWidth[0]; // 0
borderWidth[1]; // 1px (default)
borderWidth[2]; // 2px (focus states)
borderWidth[4]; // 4px (prominent outlines)
```

### Border Presets

Complete border combinations:

```typescript
borderPresets.default; // "1px solid #E5E7EB"
borderPresets.input.default; // "1px solid #D1D5DB"
borderPresets.input.focus; // "2px solid #1E63FF"
borderPresets.input.error; // "2px solid #D32F2F"
```

### Usage Examples

```tsx
// Button
<button style={{
  borderRadius: borderSystem.componentRadius.button.default,
  border: 'none'
}}>
  Click me
</button>

// Input with focus state
<input style={{
  borderRadius: borderSystem.componentRadius.input.default,
  border: borderSystem.presets.input.default
}}
  onFocus={(e) =>
    e.currentTarget.style.border = borderSystem.presets.input.focus
  }
/>

// Card
<div style={{
  borderRadius: borderSystem.componentRadius.card.default,
  border: borderSystem.presets.card.default
}}>
  Card content
</div>
```

---

## Using Tokens in Code

### React/TypeScript

```tsx
import { colors, typography, spacing, shadows, borders } from '@/design-tokens';

function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      style={{
        backgroundColor: colors.semantic.trustBlue,
        color: colors.text.inverse,
        padding: `${spacing.base[3]} ${spacing.base[6]}`,
        borderRadius: borders.componentRadius.button.default,
        fontSize: typography.fontSizes.base,
        fontWeight: typography.fontWeights.medium,
        border: 'none',
        boxShadow: shadows.sm,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
```

### Tailwind CSS

Tokens are already integrated into `tailwind.config.js`:

```tsx
// Use Tailwind classes that reference tokens
<button className="bg-trust-blue text-white px-6 py-3 rounded-lg font-medium shadow-sm">
  Continue
</button>

// Card
<div className="bg-surface rounded-card shadow-md p-6">
  Card content
</div>

// Typography
<h1 className="text-4xl font-bold text-gray-900">
  Welcome
</h1>
```

### CSS Custom Properties

Create CSS variables from tokens:

```typescript
// apps/frontend/src/styles/design-tokens.css
:root {
  /* Colors */
  --color-trust-blue: #1E4BD8;
  --color-royal-blue: #1E63FF;
  --color-text-primary: #111827;

  /* Spacing */
  --spacing-2: 0.5rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;

  /* Typography */
  --font-size-base: 1rem;
  --font-weight-medium: 500;

  /* Shadows */
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

---

## Using Tokens in Figma

### Setting Up Figma Styles

1. **Color Styles**
   - Create a color style for each token
   - Name format: `Token/Category/Name` (e.g., `Color/Primary/Royal Blue`)
   - Use exact hex values from `colors.ts`

2. **Text Styles**
   - Create text styles for `textStyles` presets
   - Name format: `Text/Category/Name` (e.g., `Text/Heading/H1`)
   - Match font, size, weight, line height

3. **Effect Styles** (Shadows)
   - Create effect styles for shadow tokens
   - Name format: `Shadow/Size` (e.g., `Shadow/Medium`)
   - Use exact values from `shadows.ts`

### Syncing Figma and Code

1. **Export from Figma**
   - Use Figma API or plugins to extract styles
   - Compare against `design-tokens/` files
   - Flag discrepancies

2. **Update Process**
   - Design changes start in Figma
   - Export updated tokens
   - Update `design-tokens/` files
   - Create PR with token changes
   - Review and merge

### Figma Naming Convention

```
├── Color
│   ├── Primary
│   │   ├── Navy Deep (#0A1E45)
│   │   ├── Royal Blue (#1E63FF)
│   │   └── Sky Blue (#74B7FF)
│   ├── Semantic
│   │   ├── Trust Blue (#1E4BD8)
│   │   ├── Gov Trust Green (#00B289)
│   │   └── Compliance Error (#D32F2F)
│   ├── Text
│   │   ├── Primary (#111827)
│   │   └── Secondary (#4B5563)
│   └── Surface
│       ├── Background (#F7FAFE)
│       └── Surface (#FFFFFF)
├── Text
│   ├── Heading
│   │   ├── H1 (36px Bold)
│   │   ├── H2 (24px Semibold)
│   │   └── H3 (20px Semibold)
│   └── Body
│       ├── Large (18px Regular)
│       ├── Default (16px Regular)
│       └── Small (14px Regular)
└── Shadow
    ├── Small
    ├── Medium
    └── Large
```

---

## Token Governance

### Adding New Tokens

1. **Justify the Need**
   - Is there an existing token that could work?
   - Does this represent a new, reusable pattern?
   - Will this be used in multiple places?

2. **Follow Naming Conventions**
   - Use semantic names (what it's for, not what it looks like)
   - Group related tokens together
   - Use consistent naming patterns

3. **Update All Locations**
   - Add to TypeScript files (`design-tokens/*.ts`)
   - Update Tailwind config if needed
   - Add to Figma styles
   - Document in this file

4. **Create PR**
   - Describe the new token and its use case
   - Update documentation
   - Request design + engineering review

### Modifying Existing Tokens

1. **Assess Impact**
   - Search codebase for usage
   - Check Figma for applied styles
   - Consider breaking changes

2. **Deprecation Process**
   - Mark old token as deprecated
   - Provide migration path
   - Update all usages
   - Remove after grace period

3. **Communication**
   - Announce in team channels
   - Update changelog
   - Provide migration guide

### Token Review Checklist

- [ ] Token name is semantic (purpose, not appearance)
- [ ] Token fits into existing category structure
- [ ] No duplicate or overlapping tokens
- [ ] TypeScript types are correct
- [ ] Tailwind config updated (if applicable)
- [ ] Figma styles created/updated
- [ ] Documentation updated
- [ ] Example usage provided

---

## Related Documentation

- **[Storyboards](./storyboards/README.md)** - Visual user flow documentation
- **[Figma Integration Guide](./FIGMA_INTEGRATION_GUIDE.md)** - Syncing design and code
- **[Component Library](./COMPONENT_LIBRARY.md)** - UI component documentation
- **[UX Blueprint](./UX-Blueprint.md)** - Experience design principles

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintained By**: ESTA Tracker Design Team
