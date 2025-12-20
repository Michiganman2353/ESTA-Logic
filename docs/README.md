# ESTA Tracker Documentation

Welcome to the ESTA Tracker documentation. This directory contains all technical documentation, setup guides, and architectural information for the project.

## 🎯 Strategic Direction (Start Here!)

**ESTA-Logic is undergoing a strategic reset to become a TurboTax-style guided compliance experience.** These documents define our new product vision and experience-first approach:

| Document                                                                | Purpose                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------ |
| **[Experience Vision](./Experience-Vision.md)**                         | Public announcement of strategic direction shift |
| **[Strategic Roadmap](./ROADMAP.md)**                                   | Experience-first implementation phases           |
| **[UX Blueprint](./UX-Blueprint.md)**                                   | TurboTax-inspired user experience design         |
| **[GuidedFlowEngine](./GuidedFlowEngine.md)**                           | Architecture concept for guided journeys         |
| **[Experience-First Architecture](./Experience-First-Architecture.md)** | Architectural principles that serve UX           |

**Core Philosophy:** We're building a guided compliance partner that makes users feel confident, supported, and secure — not a tool they operate.

---

## 📖 Documentation Structure

```
docs/
├── abi/                # Kernel ABI specifications
├── adr/                # Architecture Decision Records (deprecated - moved to architecture/adr/)
├── architecture/       # System architecture and technical documentation
│   ├── adr/           # Architecture Decision Records
│   ├── ARCHITECTURE_QUICK_REFERENCE.md
│   ├── ARCHITECTURE_VISUAL_GUIDE.md
│   ├── MICROKERNEL_ARCHITECTURE.md
│   ├── WORKSPACE_ARCHITECTURE.md
│   └── WASM_ARCHITECTURE.md
├── deployment/         # Deployment guides and procedures
├── design/            # Design documents and planning
├── security/          # Security documentation and guidelines
│   └── SECURITY_SUMMARY.md
├── setup/             # Setup and configuration guides
└── archive/           # Historical documentation and reports
    └── implementations/ # Archived implementation summaries
```

## 🚀 Quick Start Documentation

### Essential Reading (Start Here!)

| Document                                                                           | Purpose                              |
| ---------------------------------------------------------------------------------- | ------------------------------------ |
| **[Developer Onboarding](./DEVELOPER_ONBOARDING.md)**                              | New team member setup guide          |
| **[Architecture Quick Reference](./architecture/ARCHITECTURE_QUICK_REFERENCE.md)** | One-page architecture overview       |
| **[Engineering Ecosystem](./ENGINEERING_ECOSYSTEM.md)**                            | Unified engineering ecosystem vision |
| **[Engineering Principles](./ENGINEERING_PRINCIPLES.md)**                          | Codified engineering charter         |
| **[Engineering Standards](./ENGINEERING_STANDARDS.md)**                            | Git, commits, versioning, reviews    |
| **[ADR Index](./architecture/adr/README.md)**                                      | All architecture decisions           |

### Core Documentation

- **[Architecture Overview](./architecture/architecture.md)** - System design and technical decisions
- **[Microkernel Status](./architecture/MICROKERNEL_STATUS.md)** - Current vs target architecture
- **[Testing Guide](./architecture/testing.md)** - Testing strategies and procedures
- **[Deployment Guide](./deployment/deployment.md)** - Production deployment instructions
- **[Security Summary](./security/security-summary.md)** - Security architecture overview

### First-Time Setup

1. [Firebase Setup](./setup/FIREBASE_SETUP.md) - Configure Firebase services
2. [KMS Setup](./setup/KMS_SETUP_GUIDE.md) - Google Cloud KMS for encryption
3. [Vercel Deployment](./setup/VERCEL_QUICK_START.md) - Deploy to Vercel
4. [Edge Config Setup](./setup/EDGE_CONFIG_SETUP.md) - Configure Vercel Edge Config

## 🔧 CI/CD & Deployment (New!)

### Critical Deployment Resources

- **[GitHub Secrets Setup](./GITHUB-SECRETS-SETUP.md)** - Step-by-step guide to configure GitHub secrets for CI/CD
- **[Pre-Deployment Checklist](./PRE-DEPLOYMENT-CHECKLIST.md)** - Complete checklist before deploying
- **[CI/CD Troubleshooting](./CI-CD-TROUBLESHOOTING.md)** - Common issues and solutions for GitHub Actions and Vercel
- **[Dependency Upgrade Plan](./DEPENDENCY-UPGRADE-PLAN.md)** - Strategy for upgrading deprecated packages

### Quick CI/CD Setup

If you're experiencing deployment failures:

1. Read [GitHub Secrets Setup](./GITHUB-SECRETS-SETUP.md) to configure secrets
2. Run `npm run validate:deployment` to check your build
3. Consult [CI/CD Troubleshooting](./CI-CD-TROUBLESHOOTING.md) for specific errors
4. Use [Pre-Deployment Checklist](./PRE-DEPLOYMENT-CHECKLIST.md) before pushing changes

## 🏗️ Architecture Documentation

### Architecture Decision Records (ADRs)

All major architectural decisions are documented as ADRs:

| ADR                                                | Title                  | Status      |
| -------------------------------------------------- | ---------------------- | ----------- |
| [001](./architecture/adr/001-monorepo-strategy.md) | Monorepo Strategy - Nx | Implemented |
| [002](./architecture/adr/002-gleam-integration.md) | Gleam Integration      | Implemented |
| [003](./architecture/adr/003-tauri-desktop.md)     | Tauri Desktop Strategy | Planned     |
| [004](./architecture/adr/004-wasm-strategy.md)     | WASM Compilation       | Planned     |
| [005](./architecture/adr/005-ipc-messaging.md)     | IPC Message-Passing    | Partial     |
| [006](./architecture/adr/006-adapter-pattern.md)   | Adapter Pattern        | Partial     |

See [ADR Index](./architecture/adr/README.md) for full list and templates.

### System Architecture

- **[Architecture Overview](./architecture/architecture.md)** - High-level system design
  - Hybrid architecture (React + Vite + Express + Firebase)
  - Backend routes vs Cloud Functions decision
  - Data flow and component interaction
  - Scaling considerations

- **[Microkernel Status](./architecture/MICROKERNEL_STATUS.md)** - Current vs target architecture
  - Current modular monolith state
  - Target microkernel architecture
  - Migration path and phases

- **[Kernel Contract Specification](./abi/kernel_contract.md)** - Formal kernel ABI
  - Process lifecycle
  - Message-passing semantics
  - Capability system
  - Formal verification targets

- **[Testing Guide](./architecture/testing.md)** - Testing infrastructure
  - Unit testing with Vitest
  - E2E testing with Playwright
  - CI/CD pipeline
  - Test coverage requirements

- **[Dependencies](./architecture/dependencies.md)** - Dependency management
  - Security audit procedures
  - Deprecated package handling
  - Version update strategies
  - Build health status

## 🚀 Deployment Documentation

### Production Deployment

- **[Deployment Guide](./deployment/deployment.md)** - Complete deployment instructions
  - Vercel configuration
  - Environment variables
  - Build optimization
  - Deployment verification
  - Troubleshooting

### Setup Guides

- **[Firebase Setup](./setup/FIREBASE_SETUP.md)** - Firebase project configuration
- **[KMS Setup Guide](./setup/KMS_SETUP_GUIDE.md)** - Google Cloud KMS configuration
- **[KMS IAM Setup](./setup/KMS_IAM_SETUP.md)** - IAM roles and permissions
- **[Vercel Deployment](./deployment/deployment.md)** - Complete Vercel deployment and CI/CD setup
- **[Vercel Quick Start](./setup/VERCEL_QUICK_START.md)** - Quick reference for Vercel setup
- **[Vercel Secrets Reference](./setup/VERCEL_SECRETS_IMPLEMENTATION.md)** - Implementation reference for Vercel secrets
- **[Edge Config Setup](./setup/EDGE_CONFIG_SETUP.md)** - Vercel Edge Config
- **[Quick Start Deployment](./setup/QUICK_START_DEPLOYMENT.md)** - Rapid deployment guide

## 🔒 Security Documentation

### Security Architecture

- **[Security Summary](./security/security-summary.md)** - Complete security overview
  - Document upload implementation
  - Access control and permissions
  - Audit logging
  - Compliance measures

- **[KMS Security](./security/KMS_SECURITY_SUMMARY.md)** - Key Management Service
  - Encryption architecture
  - Key rotation policies
  - Access controls
  - Compliance certifications

- **[Security Checklist](./security/SECURITY_CHECKLIST.md)** - Pre-deployment security review
- **[Decrypt Endpoint Security](./security/DECRYPT_ENDPOINT_SECURITY_SUMMARY.md)** - Decryption endpoint security

### Design Documents (Archived)

- **[Hybrid Encryption Design](./design/hybrid-encryption-design.md)** - Original encryption design and implementation plan

## 📋 Historical Documentation

The `archive/` directory contains historical implementation reports, audit findings, and system evolution documentation:

### Audit Reports

- [Audit Findings](./archive/audit-findings.md) - Repository audit results
- [Audit Report](./archive/AUDIT_REPORT.md) - Detailed audit documentation
- [Audit Summary](./archive/AUDIT_SUMMARY.md) - Executive summary

### Implementation Reports

- [Master Plan V2 Implementation](./archive/MASTER_PLAN_V2_IMPLEMENTATION.md) - Original strategic plan
- [Registration System](./archive/REGISTRATION_SYSTEM.md) - User registration architecture
- [Document Upload System](./archive/DOCUMENT_UPLOAD_SYSTEM.md) - Document handling implementation
- [Background Functions Summary](./archive/BACKGROUND_FUNCTIONS_SUMMARY.md) - Firebase functions overview

### Fix Reports

- [Registration Fix Summary](./archive/REGISTRATION_FIX_SUMMARY.md)
- [Firebase Fix](./archive/FIREBASE_FIX.md)
- [Load Failed Fix](./archive/LOAD_FAILED_FIX.md)
- [Decrypt Endpoint Auth](./archive/DECRYPT_ENDPOINT_AUTH.md)

## 🛠️ Development Resources

### For New Team Members

1. Complete [Developer Onboarding](./DEVELOPER_ONBOARDING.md)
2. Review [Architecture Quick Reference](./ARCHITECTURE_QUICK_REFERENCE.md)
3. Read [Engineering Standards](./ENGINEERING_STANDARDS.md)
4. Follow [Contributing Guide](../CONTRIBUTING.md) for setup
5. Study [Architecture Overview](./architecture/architecture.md)

### Engineering Governance

- **[Engineering Standards](./ENGINEERING_STANDARDS.md)** - Complete standards guide
  - Git workflow and branching strategy
  - Commit conventions (Conventional Commits)
  - Semantic versioning
  - Code review process
  - Release procedures

### For Contributors

- **[Contributing Guide](../CONTRIBUTING.md)** - How to contribute
  - Development setup
  - Code style guidelines
  - Testing requirements
  - Pull request process

### Main Documentation

- **[README](../README.md)** - Project overview and quick start
- **[License](../LICENSE)** - Project license

## 📚 Documentation by Role

### For New Developers

1. Complete [Developer Onboarding](./DEVELOPER_ONBOARDING.md) ⭐
2. Read [Architecture Quick Reference](./ARCHITECTURE_QUICK_REFERENCE.md)
3. Understand [Engineering Ecosystem](./ENGINEERING_ECOSYSTEM.md)
4. Review [Engineering Principles](./ENGINEERING_PRINCIPLES.md)
5. Study [Engineering Standards](./ENGINEERING_STANDARDS.md)
6. Explore [ADR Index](./architecture/adr/README.md)
7. Set up development environment using [Setup Guides](./setup/)

### For Tech Leads & Architects

1. Read [Engineering Ecosystem](./ENGINEERING_ECOSYSTEM.md) ⭐
2. Review [Engineering Principles](./ENGINEERING_PRINCIPLES.md)
3. Study [Microkernel Status](./architecture/MICROKERNEL_STATUS.md)
4. Understand [Architecture Overview](./architecture/architecture.md)
5. Explore [ADR Index](./architecture/adr/README.md)

### For DevOps Engineers

1. Review [Deployment Guide](./deployment/deployment.md)
2. Configure services using [Setup Guides](./setup/)
3. Implement [Security Checklist](./security/SECURITY_CHECKLIST.md)
4. Monitor using tools described in deployment docs

### For Security Auditors

1. Read [Security Summary](./security/security-summary.md)
2. Review [KMS Security](./security/KMS_SECURITY_SUMMARY.md)
3. Examine [Security Checklist](./security/SECURITY_CHECKLIST.md)
4. Check [Audit Findings](./archive/audit-findings.md)

### For Product Managers

1. Read [README](../README.md) for vision and features
2. Review [Engineering Ecosystem](./ENGINEERING_ECOSYSTEM.md) for platform vision
3. Check [Master Plan](./archive/MASTER_PLAN_V2_IMPLEMENTATION.md) for strategy
4. Understand compliance features in [Security Docs](./security/)

## 🔄 Keeping Documentation Updated

Documentation should be updated when:

- Architecture changes are made
- New features are added
- Deployment procedures change
- Security measures are updated
- Dependencies are modified

### Documentation Best Practices

- Keep docs concise and focused
- Use clear examples and code snippets
- Include diagrams where helpful
- Archive outdated documentation (don't delete)
- Review and update quarterly
- Link related documents

## 📞 Getting Help

- **Questions about documentation?** Open a GitHub Discussion
- **Found outdated information?** Open an issue or submit a PR
- **Security concerns?** See [Security Summary](./security/security-summary.md)

---

**Last Updated:** December 2025
