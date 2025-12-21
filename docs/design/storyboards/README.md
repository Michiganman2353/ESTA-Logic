# ESTA Tracker Storyboards

## Overview
Visual storyboards documenting ESTA Tracker's user flows and interface design. These storyboards serve as a bridge between design and engineering, ensuring consistent implementation of the user experience vision.

---

## 📚 Storyboard Index

### Core User Flows

1. **[Welcome & Eligibility Wizard](./01-welcome-flow.md)**
   - First-time user onboarding
   - Business classification
   - Compliance path determination
   - 5-step guided flow
   - **Estimated completion**: 3-5 minutes

2. **[Employer Profile Setup](./02-employer-setup.md)**
   - Company information entry
   - Contact details configuration
   - Branding customization
   - Enrollment code generation
   - **Estimated completion**: 2-3 minutes

3. **[Compliance Path Configuration](./03-compliance-path.md)**
   - Policy auto-configuration
   - Accrual rules setup
   - Usage cap configuration
   - Carryover rules
   - **Estimated completion**: 3-4 minutes

4. **[Employee Management](./04-employee-management.md)**
   - Employee registration flow
   - Bulk import via CSV
   - Individual employee enrollment
   - Hours tracking setup
   - **Estimated completion**: 5-10 minutes (varies by employee count)

5. **[Document Capture & Upload](./05-document-capture.md)**
   - Mobile document scanning
   - Edge detection and perspective correction
   - Secure upload with encryption
   - Medical note management
   - **Estimated completion**: 1-2 minutes per document

---

## 🎨 Design Principles

### TurboTax-Inspired UX
These storyboards follow the TurboTax model of guided, confidence-building experiences:

✅ **Progressive Disclosure** - Show one step at a time  
✅ **Contextual Help** - Explain concepts when they matter  
✅ **Plain Language** - Avoid legal jargon unless necessary  
✅ **Visual Feedback** - Confirm progress and success clearly  
✅ **Auto-Save** - Never lose user progress  
✅ **Non-Linear Navigation** - Allow users to go back and change answers

### Visual Hierarchy
```
Primary Actions (Continue, Submit)  →  Trust Blue (#1E4BD8)
Secondary Actions (Back, Cancel)    →  Gray/Ghost Buttons
Destructive Actions (Delete)        →  Red (#D32F2F)
Success States                      →  Green (#00B289)
Information States                  →  Accent Blue (#3B82F6)
```

### Layout Patterns
- **Single-column forms** for focused completion
- **Progressive stepper** always visible at top
- **Sticky navigation** for CTAs on mobile
- **Card-based UI** for scannable content
- **Responsive breakpoints**: Mobile (< 768px), Tablet (768-1024px), Desktop (> 1024px)

---

## 📐 Common Components

### Navigation Pattern
```
┌────────────────────────────────────────────────┐
│ Progress: ●─●─●─○─○  (Step 3 of 5)            │
│                                                 │
│ [← Back]              [Save & Exit]   [Next →] │
└────────────────────────────────────────────────┘
```

### Help Text Pattern
```
┌────────────────────────────────────┐
│ Field Label *                      │
│ [___________________________]      │
│                                     │
│ 💡 Why we need this                │
│ Collapsed help text, tap to expand │
└────────────────────────────────────┘
```

### Validation Pattern
```
✅ Success State
┌────────────────────────────────────┐
│ Email Address *                    │
│ [user@example.com] ✓               │
│ ✅ Email verified                   │
└────────────────────────────────────┘

❌ Error State
┌────────────────────────────────────┐
│ Email Address *                    │
│ [invalid-email] ⚠️                 │
│ ⚠️ Please enter a valid email      │
└────────────────────────────────────┘
```

---

## 🎯 Design Tokens Reference

All storyboards use the centralized design token system:

### Colors
- See `apps/frontend/src/design-tokens/colors.ts`
- Primary: Navy Deep, Royal Blue, Sky Blue
- Semantic: Trust Blue, Gov Trust Green, Compliance Error
- Full color scales for navy, royal, sky, and gray

### Typography
- See `apps/frontend/src/design-tokens/typography.ts`
- Font family: Inter (system fallback)
- Scale: xs (12px) → 6xl (60px)
- Weights: Regular (400), Medium (500), Semibold (600), Bold (700)

### Spacing
- See `apps/frontend/src/design-tokens/spacing.ts`
- 8px base grid system
- Component-specific spacing presets
- Layout spacing for margins and containers

### Shadows
- See `apps/frontend/src/design-tokens/shadows.ts`
- Elevation levels: xs, sm, md, lg, xl, 2xl
- Colored shadows for brand elements
- Glow effects for interactive states

### Borders
- See `apps/frontend/src/design-tokens/borders.ts`
- Radius: 8px for inputs/buttons, 18px for cards
- Width: 1px default, 2px focus states
- Pre-configured border presets

---

## 📱 Responsive Behavior

### Mobile First
All flows are designed mobile-first, then enhanced for larger screens:

**Mobile (< 768px)**
- Single column layout
- Sticky bottom navigation
- Full-width cards
- Large touch targets (44px minimum)
- Collapsible help text

**Tablet (768px - 1024px)**
- Two-column layouts where appropriate
- Side-by-side form fields
- Expanded help text visible
- Hover states enabled

**Desktop (> 1024px)**
- Maximum content width: 1024px (centered)
- Multi-column forms for efficiency
- Persistent help text
- Rich hover states and tooltips

---

## ♿ Accessibility Standards

All storyboards comply with **WCAG 2.1 Level AA**:

### Color & Contrast
- Text contrast ≥ 4.5:1 (normal text)
- Text contrast ≥ 3:1 (large text, 18px+)
- UI component contrast ≥ 3:1
- Color is never the only indicator

### Keyboard Navigation
- All interactive elements keyboard accessible
- Visible focus indicators (2px blue outline)
- Logical tab order
- Skip links for screen readers

### Screen Readers
- Semantic HTML (headings, landmarks, lists)
- ARIA labels where needed
- Form field associations
- Status announcements for dynamic content

### Motion & Animation
- Respect `prefers-reduced-motion`
- Never rely on animation alone to convey information
- Provide alternatives for time-based media

---

## 🧪 Usability Testing

### Testing Protocol
Each storyboard should be validated through:

1. **Heuristic Evaluation**
   - Nielsen's 10 Usability Heuristics
   - ESTA-specific heuristics (compliance clarity, trust signals)

2. **User Testing**
   - Minimum 5 users per flow
   - Think-aloud protocol
   - Task completion rate >85%
   - System Usability Scale (SUS) score >75

3. **A/B Testing**
   - Test variations of critical flows
   - Measure completion rate, time on task, errors
   - Iterate based on data

---

## 🔄 Iteration Process

### Storyboard Updates
1. **Design Change Request** - Document proposed changes
2. **Review** - Design team + engineering alignment
3. **Update Storyboard** - Revise markdown documentation
4. **Update Tokens** - Modify design tokens if needed
5. **Implement** - Engineering implements per updated spec
6. **Validate** - QA against storyboard specifications

### Version Control
- Storyboards are version-controlled in Git
- Major changes increment version in document header
- Change log maintained for significant updates

---

## 📊 Metrics & Analytics

### Flow-Level Metrics
Track these metrics for each flow:

- **Completion Rate**: % of users who finish the flow
- **Time to Complete**: Average and median completion time
- **Drop-off Points**: Where users abandon the flow
- **Error Rate**: Validation errors per field
- **Help Usage**: How often help text is accessed

### Component-Level Metrics
- **Button Click Rate**: Primary vs secondary actions
- **Field Interaction**: Which fields require multiple attempts
- **Navigation Patterns**: Back button usage, save & exit frequency

---

## 🛠️ Implementation Guidelines

### For Engineers
1. **Reference Storyboards First** - Before implementing any UI, read the storyboard
2. **Use Design Tokens** - Never hard-code colors, spacing, or typography
3. **Follow Patterns** - Reuse established component patterns
4. **Validate Accessibility** - Test with keyboard, screen reader, and contrast tools
5. **Track Analytics** - Implement specified analytics events

### For Designers
1. **Update Storyboards** - Before implementing design changes
2. **Maintain Token System** - Keep design tokens in sync with Figma
3. **Document Decisions** - Explain rationale for design choices
4. **Test with Users** - Validate before finalizing storyboards

### For Product Managers
1. **Validate Flows** - Ensure flows meet user needs and business goals
2. **Review Metrics** - Monitor analytics to identify improvement opportunities
3. **Prioritize Iterations** - Use data to guide enhancement roadmap

---

## 🔗 Related Documentation

- **[Design Tokens](../DESIGN_TOKENS.md)** - Complete design token reference
- **[Figma Integration Guide](../FIGMA_INTEGRATION_GUIDE.md)** - Syncing design and code
- **[UX Blueprint](../UX-Blueprint.md)** - Overall experience philosophy
- **[Design Tone Guide](../Design-Tone-Guide.md)** - Voice and tone standards
- **[Component Library](../COMPONENT_LIBRARY.md)** - Reusable UI components

---

## 📝 Contributing

### Adding New Storyboards
When documenting a new user flow:

1. **Use the Template** - Copy structure from existing storyboards
2. **Include Flow Diagram** - ASCII art for quick understanding
3. **Specify Design Details** - Colors, typography, spacing, components
4. **Document Interactions** - Hover, focus, validation states
5. **Define Copy** - Example text following tone guidelines
6. **Set Success Metrics** - How to measure flow effectiveness
7. **Consider Accessibility** - Document a11y requirements
8. **Provide Technical Notes** - Implementation guidance for engineers

### Storyboard Review Checklist
- [ ] Flow diagram is clear and complete
- [ ] Design specifications reference design tokens
- [ ] Interaction patterns are documented
- [ ] Copy follows tone guide
- [ ] Success metrics are defined
- [ ] Accessibility requirements specified
- [ ] Technical implementation notes included
- [ ] Related flows cross-referenced

---

## 📞 Questions & Feedback

For questions about storyboards or to suggest improvements:
- **GitHub Issues**: Tag with `design` or `ux` label
- **GitHub Discussions**: UX/UI category
- **Design Team**: Contact via project communication channels

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintained By**: ESTA Tracker Design Team
