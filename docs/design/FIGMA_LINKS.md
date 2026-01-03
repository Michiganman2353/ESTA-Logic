# ESTA Tracker Figma Design Files

## Overview

This document serves as the central reference for all ESTA Tracker design files in Figma. Designers and engineers use these files to maintain design-code synchronization and ensure visual consistency.

**Purpose**: Provide quick access to design source files and maintain a single source of truth for visual design.

---

## 📐 Design Files Index

### 🎨 Core Design System

**Design Tokens & Components**

- **Status**: 🚧 In Development
- **Figma Link**: _Coming soon — Design tokens will be published to Figma Variables_
- **Description**: Core design token library (colors, typography, spacing, shadows, borders)
- **Sync Status**: Design tokens currently maintained in code at `apps/frontend/src/design-tokens/`
- **See Also**: [Design Tokens Documentation](./DESIGN_TOKENS.md)

**Component Library**

- **Status**: 🚧 In Development
- **Figma Link**: _Coming soon — Component library will be published for designer use_
- **Description**: Reusable UI components (Button, Card, Input, Modal, etc.)
- **Sync Status**: Components currently maintained in code at `apps/frontend/src/components/DesignSystem/`
- **See Also**: [Component Library Documentation](./COMPONENT_LIBRARY.md)

---

### 🖼️ User Flow Storyboards

**Welcome & Onboarding Flow**

- **Status**: 🚧 Planned
- **Figma Link**: _Coming soon — Visual storyboard for welcome experience_
- **Description**: First-time user journey from landing to account creation
- **Text Version**: [01-welcome-flow.md](./storyboards/01-welcome-flow.md)

**Guided Setup Wizard**

- **Status**: 🚧 Planned
- **Figma Link**: _Coming soon — TurboTax-style guided setup screens_
- **Description**: Step-by-step employer setup wizard with progress tracking
- **Text Version**: [02-employer-setup.md](./storyboards/02-employer-setup.md)

**Employer Dashboard**

- **Status**: 🚧 Planned
- **Figma Link**: _Coming soon — Employer compliance dashboard design_
- **Description**: Compliance confidence dashboard with widgets and alerts
- **Text Version**: Dashboard storyboard (planned)

**Employee Portal**

- **Status**: 🚧 Planned
- **Figma Link**: _Coming soon — Employee self-service portal_
- **Description**: Employee balance view, PTO request, document upload
- **Text Version**: Employee portal storyboard (planned)

**Document Capture Flow**

- **Status**: 🚧 Planned
- **Figma Link**: _Coming soon — Mobile document scanner interface_
- **Description**: Camera-based document capture with edge detection
- **Text Version**: [05-document-capture.md](./storyboards/05-document-capture.md)

---

### 🎭 Experience Design

**Complete Emotional Journey**

- **Status**: 🚧 Planned
- **Figma Link**: _Coming soon — Visual representation of user emotional journey_
- **Description**: Six-step emotional transformation from fear to advocacy
- **Text Version**: [00-experience-narrative.md](./storyboards/00-experience-narrative.md)

**Trust & Security Elements**

- **Status**: 🚧 Planned
- **Figma Link**: _Coming soon — Trust badges, security indicators, legal assurance elements_
- **Description**: Visual trust signals and security messaging components
- **Code Implementation**: `apps/frontend/src/experience/trust/`

---

## 🔄 Design-Code Sync Process

### Current Workflow

**Design tokens are code-first**:

1. Tokens defined in TypeScript at `apps/frontend/src/design-tokens/`
2. Exported to CSS variables at `apps/frontend/src/styles/design-tokens.css`
3. Used by both React components and Tailwind config
4. Will eventually sync to Figma Variables (when ready)

**Component design**:

1. Components built in React with design tokens
2. Storybook documentation (planned)
3. Visual design in Figma (coming soon)
4. Bidirectional sync maintained

### Future Workflow (When Figma Files Available)

**Figma → Code**:

- Design tokens exported from Figma Variables
- Components designed in Figma first
- Developers implement from Figma specs
- Automated token sync pipeline

**Code → Figma**:

- Component state changes reflected in Figma
- Token updates propagated to Figma Variables
- Living documentation in Figma

**Sync Tools**:

- [Figma API](https://www.figma.com/developers/api) for automation
- [Style Dictionary](https://amzn.github.io/style-dictionary/) for token transformation
- CI/CD integration for automated sync

---

## 🎨 Design Collaboration

### For Designers

**Starting a New Design**:

1. **Review existing system**:
   - [Design Tokens](./DESIGN_TOKENS.md) — Current token library
   - [Component Library](./COMPONENT_LIBRARY.md) — Available components
   - [Storyboards](./storyboards/README.md) — User flow documentation

2. **Use existing patterns first**:
   - Reuse design tokens (colors, spacing, typography)
   - Leverage existing components
   - Follow established UX patterns

3. **When creating new designs**:
   - Document in Figma
   - Link Figma file in this document
   - Create corresponding storyboard in `docs/design/storyboards/`
   - Submit for design review

**Design Review Process**:

- Share Figma link in PR or design discussion
- Ensure design uses established tokens
- Validate accessibility (contrast, text size, keyboard nav)
- Get engineering feasibility review
- Update documentation

### For Engineers

**Implementing from Figma**:

1. **Access design file** from links above (when available)
2. **Inspect component specs**:
   - Use Figma's Inspect panel for exact values
   - Reference design tokens (not raw values)
   - Check interaction states (hover, focus, active, disabled)
   - Note responsive breakpoints

3. **Build component**:
   - Import design tokens: `import { colors, spacing } from '@/design-tokens';`
   - Match visual specs exactly
   - Implement all interaction states
   - Ensure accessibility compliance

4. **Validate implementation**:
   - Compare side-by-side with Figma
   - Test responsive behavior
   - Verify accessibility
   - Get designer approval

---

## 📊 Design Assets Locations

### Current State (Code-Based Design)

| Asset Type          | Current Location                   | Future Figma Location             |
| ------------------- | ---------------------------------- | --------------------------------- |
| **Design Tokens**   | `apps/frontend/src/design-tokens/` | Figma Variables (planned)         |
| **Component Specs** | `docs/design/COMPONENT_LIBRARY.md` | Figma Component Library (planned) |
| **User Flows**      | `docs/design/storyboards/`         | Figma Storyboards (planned)       |
| **Icons**           | `apps/frontend/public/icons/`      | Figma Icon Library (planned)      |
| **Logo/Brand**      | `apps/frontend/public/images/`     | Figma Brand Assets (planned)      |
| **Screenshots**     | Not yet captured                   | Figma prototypes (planned)        |

---

## 🚀 Roadmap: Design File Development

### Phase 1: Foundation (Current)

- [x] Design tokens in code (colors, typography, spacing)
- [x] Component documentation (Component Library doc)
- [x] User flow storyboards (text-based)
- [x] UX writing library
- [ ] Figma account setup for ESTA Tracker

### Phase 2: Design System in Figma (Q1 2025)

- [ ] Create Figma workspace
- [ ] Build design token library in Figma Variables
- [ ] Create component library in Figma
- [ ] Set up automated token sync (code ↔ Figma)
- [ ] Link Figma files in this document

### Phase 3: User Flow Visualization (Q2 2025)

- [ ] Design visual storyboards for all flows
- [ ] Create interactive prototypes
- [ ] Capture UI screenshots
- [ ] Build Figma clickable prototypes
- [ ] User test with Figma prototypes

### Phase 4: Living Design System (Q3 2025)

- [ ] Automated sync pipeline (Figma ↔ code)
- [ ] Continuous design-engineering collaboration
- [ ] Version control for Figma files
- [ ] Design QA automation
- [ ] Public design system documentation site

---

## 🔗 Related Documentation

- **[Design Tokens](./DESIGN_TOKENS.md)** - Complete token reference
- **[Component Library](./COMPONENT_LIBRARY.md)** - Component specifications
- **[Storyboards](./storyboards/README.md)** - User flow documentation
- **[Figma Integration Guide](../FIGMA_INTEGRATION_GUIDE.md)** - Sync process details
- **[UX Blueprint](../UX-Blueprint.md)** - Design principles
- **[UI Directory Structure](../ui/UI_DIRECTORY_STRUCTURE.md)** - Frontend architecture

---

## 📞 Questions & Contributions

### Adding New Figma Files

When a new Figma design file is created:

1. **Create the file** in the ESTA Tracker Figma workspace
2. **Set permissions** to allow team access
3. **Add link to this document**:

   ```markdown
   **[File Name]**

   - **Status**: 🚧 In Development | ✅ Complete
   - **Figma Link**: [View in Figma](https://figma.com/file/...)
   - **Description**: Brief description
   - **Related Code**: Path to implementation
   ```

4. **Submit PR** updating this document
5. **Notify team** in design channel

### Requesting Design Files

If you need a design file that doesn't exist yet:

- **Open GitHub Issue** with label `design-needed`
- **Describe use case** and what screens/components are needed
- **Provide context** (user story, requirements, etc.)
- **Tag design team** for review

---

## 🎓 Design Resources

### Figma Learning

- [Figma Best Practices](https://www.figma.com/best-practices/)
- [Design Systems in Figma](https://www.figma.com/resources/learn-design-systems/)
- [Figma Variables Guide](https://help.figma.com/hc/en-us/articles/15339657135383)

### Design-to-Code Tools

- [Figma Dev Mode](https://www.figma.com/dev-mode/)
- [Figma API Documentation](https://www.figma.com/developers/api)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
- [Tokens Studio for Figma](https://tokens.studio/)

---

## 🎯 Quick Access

**Most Used Links** (will be populated as files are created):

- 🎨 Design System Library: _Coming soon_
- 🖼️ Component Specs: _Coming soon_
- 🧭 User Flow Prototypes: _Coming soon_
- 🎭 Emotional Journey Map: _Coming soon_
- 📐 Design Tokens (Code): [View Tokens](../../apps/frontend/src/design-tokens/)

---

**Note**: This document will be continuously updated as design files are created and published. Check back regularly for new links and resources.

---

**Document Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintained By**: ESTA Tracker Design Team

**Status Legend**:

- 🚧 In Development — Work in progress
- ✅ Complete — Ready to use
- 📅 Planned — On roadmap
- 🔄 Syncing — Automated sync active
