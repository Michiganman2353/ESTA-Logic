# ESTA Tracker Copy Tokens

## Overview

Copy tokens are reusable UX copy patterns and templates for common UI scenarios — the content equivalent of design tokens. Just as you wouldn't hard-code `color: #1E4BD8`, you shouldn't hard-code `"Click here"`. These tokens ensure consistency, scalability, and brand voice across every interaction.

**Purpose**: Provide pre-written, tested, voice-consistent copy that developers and designers can use immediately.

---

## 📚 Token Categories

### 1. Trust & Security Messages
### 2. Error Messages & Validation
### 3. Success States & Encouragement
### 4. Help Text & Tooltips
### 5. Call-to-Action (CTA) Patterns
### 6. Loading & Progress States
### 7. Empty States
### 8. Confirmation & Alerts

---

## 🛡️ 1. Trust & Security Messages

### Encryption & Data Security

```typescript
trust.encryption = {
  clientSide: "Your data is encrypted before it leaves your device",
  bankLevel: "Bank-level security • AES-256 encryption",
  googleKMS: "Protected by Google Cloud KMS hardware security",
  fullStack: "End-to-end encryption • Zero-knowledge architecture",
  savedSecurely: "Saved securely • All data encrypted",
};
```

### Legal & Compliance Assurance

```typescript
trust.legal = {
  estaVerified: "Michigan ESTA law verified • MCL 408.963",
  expertReviewed: "Reviewed by compliance experts",
  auditReady: "Audit-ready • Complete documentation",
  immutableRecords: "All records are tamper-proof and legally defensible",
  automaticCompliance: "We keep you compliant automatically",
};
```

### Trust Badges

```typescript
trust.badges = {
  businessesCount: "1,200+ Michigan businesses trust us",
  uptimeGuarantee: "99.95% uptime SLA",
  gdprCompliant: "GDPR & CCPA compliant",
  soc2Ready: "SOC 2 security controls",
  zeroDataLoss: "Zero data loss guarantee",
};
```

### Privacy & Access

```typescript
trust.privacy = {
  employeeOnly: "Only you can see your sick time balance",
  employerIsolation: "Complete data isolation • No employer access to personal data",
  noThirdParty: "We never share your data with third parties",
  youControl: "You have complete control over your information",
  deleteAnytime: "You can delete your data anytime",
};
```

---

## ❌ 2. Error Messages & Validation

### Form Validation Errors

```typescript
errors.validation = {
  emailInvalid: "Let's fix that email address — it should look like name@example.com",
  emailRequired: "We'll need your email to keep you updated",
  passwordWeak: "Try a stronger password — add a mix of letters, numbers, and symbols",
  passwordMismatch: "Those passwords don't match — give it another try",
  phoneInvalid: "Phone number should be 10 digits (e.g., 555-123-4567)",
  numberRequired: "We need a number here",
  fieldRequired: "This field helps us [reason] — please fill it in",
  dateInvalid: "That date doesn't look right — try MM/DD/YYYY format",
  dateFuture: "This date should be in the past",
};
```

### Business Logic Errors

```typescript
errors.business = {
  employeeCountInvalid: "Employee count should be a positive number",
  hoursNegative: "Hours worked can't be negative",
  accrualExceeded: "This would exceed the maximum accrual cap — let's adjust",
  insufficientBalance: "Not enough sick time available (current: ${balance} hours)",
  overlapConflict: "This overlaps with an existing request — check your calendar",
};
```

### System & Network Errors

```typescript
errors.system = {
  networkError: "Connection issue — we'll retry automatically",
  timeoutError: "That took longer than expected — please try again",
  serverError: "Something went wrong on our end — we're looking into it",
  notFound: "We couldn't find that — it may have been moved or deleted",
  permissionDenied: "You don't have permission to do that — contact your administrator",
  sessionExpired: "Your session expired for security — please sign in again",
};
```

### File Upload Errors

```typescript
errors.upload = {
  fileTooLarge: "That file is too large — try keeping it under 10MB",
  fileTypeInvalid: "We support JPG, PNG, and PDF files only",
  uploadFailed: "Upload failed — please check your connection and try again",
  virusScan: "Security scan detected an issue — please try a different file",
};
```

---

## ✅ 3. Success States & Encouragement

### Action Completions

```typescript
success.actions = {
  accountCreated: "🎉 Welcome aboard! Let's get you set up",
  signedIn: "Welcome back!",
  setupComplete: "You're 100% compliant — well done!",
  employeeAdded: "Employee added successfully",
  employeeImported: "✅ Successfully imported ${count} employees",
  documentUploaded: "Document saved securely",
  ptoRequested: "Time off requested — your manager will review it soon",
  ptoApproved: "✅ Time off approved",
  settingsSaved: "Settings saved successfully",
  emailVerified: "✅ Email verified — you're all set",
};
```

### Progress Encouragement

```typescript
success.progress = {
  step1Complete: "Great start! Let's keep going",
  step2Complete: "You're doing great! Just a few more steps",
  step3Complete: "More than halfway there!",
  almostDone: "Almost there — one more question",
  autoSaved: "💾 Progress saved automatically",
};
```

### Milestones

```typescript
success.milestones = {
  firstEmployee: "🎉 Your first employee is enrolled!",
  tenEmployees: "Milestone reached: 10 employees enrolled!",
  firstMonth: "You've tracked sick time for a full month — great work!",
  fullCompliance: "You've maintained 97%+ compliance for 3 months straight!",
  auditPassed: "✅ Audit completed successfully — you're 100% compliant",
};
```

---

## 💡 4. Help Text & Tooltips

### Field Explanations

```typescript
help.fields = {
  employeeCount: {
    title: "Why we ask this",
    body: "Michigan law has different rules for small (<10) and large (10+) employers. This helps us set up the right policy for you.",
  },
  businessName: {
    title: "Where this appears",
    body: "Your business name shows on employee portals and audit reports. You can change it later in settings.",
  },
  startDate: {
    title: "Why this matters",
    body: "We use this date to calculate when ESTA compliance began for your business. This affects accrual calculations.",
  },
  accrualRate: {
    title: "How accrual works",
    body: "Michigan law requires 1 hour of sick time for every 30 hours worked. We calculate this automatically.",
  },
};
```

### Process Explanations

```typescript
help.processes = {
  encryption: {
    title: "How encryption works",
    body: "Your files are encrypted on your device before upload using AES-256-GCM. Even we can't read them without your key.",
  },
  auditTrail: {
    title: "What's an audit trail?",
    body: "Every action (accruals, usage, changes) is logged with timestamps and user info. This creates a complete, legally-defensible history.",
  },
  complianceScore: {
    title: "Understanding your score",
    body: "Your compliance score (0-100%) shows how well you're meeting Michigan ESTA requirements. 90%+ is excellent.",
  },
};
```

### Contextual Guidance

```typescript
help.contextual = {
  noEmployees: {
    title: "Don't have employees yet?",
    body: "No problem! Complete setup now and add employees when you're ready.",
  },
  unsureCount: {
    title: "Not sure about exact count?",
    body: "Use your best estimate. You can update this later as your team grows.",
  },
  needMoreTime: {
    title: "Need more time?",
    body: "Your progress is saved automatically. Come back anytime to finish.",
  },
};
```

---

## 🎯 5. Call-to-Action (CTA) Patterns

### Primary CTAs

```typescript
cta.primary = {
  continue: "Continue →",
  getStarted: "Get Started",
  saveAndContinue: "Save & Continue",
  finishSetup: "Finish Setup",
  createAccount: "Create Account",
  signIn: "Sign In",
  submit: "Submit",
  confirm: "Confirm",
  addEmployee: "Add Employee",
  uploadDocument: "Upload Document",
  requestTimeOff: "Request Time Off",
  approveRequest: "Approve Request",
};
```

### Secondary CTAs

```typescript
cta.secondary = {
  back: "← Back",
  cancel: "Cancel",
  skip: "Skip for Now",
  saveExit: "Save & Exit",
  learnMore: "Learn More",
  viewDetails: "View Details",
  editProfile: "Edit Profile",
  downloadReport: "Download Report",
};
```

### Contextual CTAs

```typescript
cta.contextual = {
  setupComplete: "View My Dashboard",
  employeeAdded: "Add Another Employee",
  documentUploaded: "Upload Another Document",
  firstEmployee: "Add Your First Employee",
  importCSV: "Import from CSV",
  needHelp: "Show Me How",
  contactSupport: "Contact Support",
};
```

---

## ⏳ 6. Loading & Progress States

### Loading Messages

```typescript
loading.messages = {
  processing: "Processing...",
  calculating: "Calculating your sick time accrual...",
  uploading: "Uploading securely...",
  encrypting: "Encrypting your document...",
  saving: "Saving your changes...",
  generating: "Generating your audit report...",
  authenticating: "Signing you in...",
  syncing: "Syncing with employees...",
};
```

### Progress Indicators

```typescript
loading.progress = {
  stepProgress: "Step ${current} of ${total}",
  percentComplete: "${percent}% complete",
  timeEstimate: "About ${minutes} minutes remaining",
  almostDone: "Almost done...",
};
```

### Auto-Save Indicators

```typescript
loading.autoSave = {
  saving: "Saving...",
  saved: "✅ Saved",
  savedAt: "Saved at ${time}",
  savingError: "Couldn't save — will retry",
  offline: "Offline — changes will sync when reconnected",
};
```

---

## 📭 7. Empty States

### No Data Yet

```typescript
empty.noData = {
  noEmployees: {
    title: "No employees yet",
    description: "Add your first employee to start tracking sick time",
    cta: "Add Employee",
  },
  noDocuments: {
    title: "No documents uploaded",
    description: "Upload medical notes, PTO forms, or other compliance documents",
    cta: "Upload Document",
  },
  noRequests: {
    title: "No time off requests",
    description: "Your employees can request time off from their portal",
    cta: "View Employee Portal",
  },
  noHistory: {
    title: "No sick time used yet",
    description: "Usage will appear here once employees request time off",
  },
};
```

### First-Use States

```typescript
empty.firstUse = {
  dashboardEmpty: {
    title: "Welcome to your dashboard!",
    description: "Complete setup to see your compliance status and employee data",
    cta: "Continue Setup",
  },
  calendarEmpty: {
    title: "No time off scheduled",
    description: "Approved PTO requests will appear on this calendar",
  },
};
```

---

## ⚠️ 8. Confirmation & Alerts

### Destructive Actions

```typescript
confirm.destructive = {
  deleteEmployee: {
    title: "Delete employee?",
    body: "This will permanently remove ${name} and all their sick time records. This can't be undone.",
    confirm: "Yes, Delete Employee",
    cancel: "Cancel",
  },
  deleteAccount: {
    title: "Delete your account?",
    body: "This will permanently delete all your data, including employee records and compliance history. This can't be undone.",
    confirm: "Delete My Account",
    cancel: "Keep My Account",
  },
};
```

### Important Alerts

```typescript
alerts.important = {
  approachingCap: {
    title: "Employee approaching accrual cap",
    body: "${name} has ${current} hours — only ${remaining} hours until the ${cap}-hour cap",
    cta: "View Details",
  },
  complianceIssue: {
    title: "Compliance check needed",
    body: "Your annual carryover policy needs to be reviewed by ${date}",
    cta: "Review Policy",
  },
  sessionTimeout: {
    title: "Session expiring soon",
    body: "You'll be signed out in ${minutes} minutes for security. Save your work!",
    cta: "Stay Signed In",
  },
};
```

### Informational Alerts

```typescript
alerts.info = {
  maintenanceScheduled: {
    title: "Scheduled maintenance",
    body: "ESTA Tracker will be offline for maintenance on ${date} from ${start} to ${end}. Plan accordingly.",
  },
  featureAnnouncement: {
    title: "New feature available!",
    body: "You can now ${feature}. Check it out in settings.",
    cta: "Learn More",
  },
};
```

---

## 🔧 Usage in Code

### Importing Copy Tokens

```typescript
// In React components
import { copyTokens } from '@/experience/tone/emotionalCopy';

<button>{copyTokens.cta.continue}</button>
<p>{copyTokens.trust.encryption.clientSide}</p>
<ErrorMessage>{copyTokens.errors.validation.emailInvalid}</ErrorMessage>
```

### Dynamic Copy with Variables

```typescript
// Use template literals for dynamic content
const message = copyTokens.success.actions.employeeImported.replace('${count}', employeeCount);
// Output: "✅ Successfully imported 12 employees"
```

### EmotionalUXWriter Component

```typescript
import { EmotionalUXWriter } from '@/experience/tone/EmotionalUXWriter';

<EmotionalUXWriter
  context="setup_complete"
  tone="celebratory"
/>
// Automatically selects appropriate copy from copyTokens
```

---

## ✅ Contributing New Tokens

### When to Add a New Token

**Add a new token when**:
- The copy will be reused across multiple screens
- It follows an established pattern
- It maintains brand voice
- It has been user-tested

**Don't add a token when**:
- It's highly specific to one screen
- It's temporary A/B test copy
- It doesn't follow tone guidelines

### Token Submission Template

```typescript
// Category: [trust/errors/success/help/cta/loading/empty/confirm/alerts]
// Context: [when this appears]
// Tone: [reassuring/celebratory/empathetic/etc.]

newToken.category.name = {
  title: "Optional title",
  body: "The actual copy text",
  cta: "Optional CTA text",
};
```

---

## 📚 Related Resources

- **[Tone Library](./TONE_LIBRARY.md)** - Voice and tone guidelines
- **[Emotional UX Patterns](./EMOTIONAL_UX_PATTERNS.md)** - Journey-specific copy
- **[UX Content Library README](./README.md)** - Library overview
- **[EmotionalUXWriter Code](../../apps/frontend/src/experience/tone/EmotionalUXWriter.ts)** - Implementation
- **[Copy Tokens Code](../../apps/frontend/src/experience/tone/emotionalCopy.ts)** - Token definitions

---

## 🎯 Quick Reference

**Before hard-coding any user-facing string, ask**:

1. **Does a copy token exist for this?** → Check this document
2. **Is this reusable?** → Create a token
3. **Is this one-off?** → Hard-code but follow tone guidelines
4. **Is this tested?** → User-test before finalizing

**Remember**: Every word is part of the experience. Make every word count.

---

**Document Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintained By**: ESTA Tracker UX & Content Team
