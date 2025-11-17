![ESTA Tracker Logo](logo.png)

# ESTA Tracker - 🚀

**"ESTA Tracker: The HR Power Small Businesses Deserve – Without the Department."**

**Empower Your Business: Automate Complianc!**  
A Complete Strategic, Technical, and Operational company  
In the development phase

## Table of Contents
- [Section 1: Vision & Purpose](#section-1-vision--purpose)
- [Section 2: User Roles & Permissions](#section-2-user-roles--permissions)
- [Section 3: Core Features (Powerhouse Set)](#section-3-core-features-powerhouse-set)
- [Section 4: System Architecture](#section-4-system-architecture)
- [Section 5: Workflows](#section-5-workflows)
- [Section 6: UI/UX Design Requirements](#section-6-uiux-design-requirements)
- [Section 7: Legal Compliance](#section-7-legal-compliance)
- [Section 8: Long Term Roadmap](#section-8-long-term-roadmap)
- [Section 9: Brand & Business Strategy](#section-9-brand--business-strategy)

## SECTION 1: VISION & PURPOSE 💡

**Ignite Growth: Turn Compliance into a Competitive Edge!**  

ESTA Tracker is a full stack SaaS platform designed to automate compliance with the Michigan Earned Sick Time Act (2025). It empowers small and medium sized businesses - especially those with no HR department - to remain compliant, track employee accruals, manage PTO requests, automate documentation, and reduce legal risk.

The platform acts as a turnkey HR compliance engine: tracking hours, generating audit logs, notifying administrators of issues, integrating with payroll, and maintaining full legal adherence.

Long term vision:  
- Become the national standard tool for state specific HR compliance.  
- Expand to other states as laws evolve.  
- Integrate deeply with major payroll providers.  
- Provide AI powered HR assistance for small businesses.

## SECTION 2: USER ROLES & PERMISSIONS 🔒

**Secure Access: Empower Teams Without Compromising Control!**  

ROLES:  
1. Employer Owner full control of company, employees, billing, HR settings.  
2. Admin / Manager delegated control (approvals, editing hours, team access).  
3. Employee can view balances, request paid leave, upload documents.  
4. Auditor (optional) restricted, read-only access.

PERMISSION HIGHLIGHTS:  
- Data isolation between tenants.  
- Manager level restricted views (department based).  
- Every edit generates a time stamped audit record.  
- Critical edits require confirmation prompts and notifications.

## SECTION 3: CORE FEATURES (POWERHOUSE SET) ⚡

**Unleash Efficiency: The Ultimate Toolkit for HR Mastery!**  

3.1 Sick Time Accrual Engine  
- 1 hour per 30 hours worked (Michigan ESTA default).  
- Cap: 72 hours for employers with >50 employees.  
- Cap: 40 hours for small employers (less than 50 employees).  
- Rule versioning for legal updates.  
- Accrual simulation tool for forecasting.

3.2 PTO Request System  
- Employee submits request with:  
  Date range  
  ESTA approved reason (dropdown)  
  Optional doctor s note/photo upload  
- Manager approval workflow.  
- Auto deduction from available balance.  
- Notifications (in app + email + push).

3.3 Multi Day Absence Documentation  
- Photo upload (doctor s notes, medical documents).  
- Stored securely under employee profile.  
- Manager only visibility.

3.4 Compliance AI Assistant  
- Reviews employer settings.  
- Flags possible compliance risks.  
- Interprets ESTA rules.  
- Auto suggests corrections.

3.5 Notice Submission & Final Review System  
- Owner/Admin submits changes or hours.  
- System validates data, checks for errors.  
- Employer receives a final approval prompt.  
- Logs stored for audit protection.

3.6 Hours Import Options  
- Manual entry with validation.  
- CSV upload (bulk import).  
- QuickBooks Time integration (API).  
- Homebase integration (API).  
- Universal payroll API pipeline (expandable).

3.7 Offboarding Wizard  
- Generates final accrual summary.  
- Notes that employers do not need to PAY out ESTA for 120 days.  
- Offers record export for legal compliance.  
- Handles front loaded policy differences.

3.8 Document Library  
- ESTA poster (required by law).  
- Sick leave policy templates.  
- Employee handbook inserts.  
- Compliance checklists.

3.9 Company Wide Calendar System  
- Day / week / month views.  
- Employee availability.  
- Heatmap showing staffing shortages.  
- PTO conflicts and overlaps.

3.10 Advanced Reporting Suite  
- Usage reports.  
- Accrual changes over time.  
- Compliance audit trail.  
- Department level analytics.  
- Export to CSV / PDF / Excel.

3.11 HR Notes & Incident Logs  
- Private employer-only notes.  
- Time-stamped entries.  
- Attachments allowed.  
- AI summary of employee history (optional future phase).

3.12 Automated Compliance Certificate  
- Year end certificate proving ESTA compliance.  
- Helps during audits or insurance reviews.

## SECTION 4: SYSTEM ARCHITECTURE 🛠️

**Rock-Solid Foundation: Built for Scale, Speed, and Security!**  

4.1 Frontend  
- React + Next.js (Vercel deployment)  
- Component architecture:  
  Dashboard  
  Employee List  
  Calendar  
  PTO Manager  
  Reports  
  Employee Self-Service Portal  
- UI goals: simple, clean, employer friendly.

4.2 Backend  
- Firebase Auth  
- Firestore database  
- Firebase Functions  
- Firebase Storage (documents + uploads)

4.3 Data Model (Simplified)  
```json
TENANTS collection:  
- companyName  
- tier  
- employeeCount  
- complianceSettings  
- createdAt  

EMPLOYEES subcollection:  
- name  
- hireDate  
- accruedHours  
- usedHours  
- department  
- employmentStatus  

PTO_REQUESTS subcollection:  
- employeeId  
- dates  
- reason  
- status  
- approvalLog  
- attachments  

ACCRUAL_LOG:  
- timestamp  
- hoursAdded  
- ruleVersion  

HOUR_IMPORT_LOG:  
- method used (CSV / API / manual)  
- processed records  
- validation results