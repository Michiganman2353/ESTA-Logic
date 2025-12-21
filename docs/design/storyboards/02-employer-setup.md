# Employer Profile Setup Flow

## Overview
After completing the Welcome & Eligibility Wizard, employers create their profile and configure their organization's presence in ESTA Tracker. This flow establishes the employer's identity, branding, and basic organizational settings.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  EMPLOYER PROFILE SETUP                      │
│                      (4 Step Flow)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Company Information                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏢 Section Header                                       │ │
│ │ "Let's Set Up Your Company Profile"                     │ │
│ │                                                          │ │
│ │ 📝 Form Fields                                          │ │
│ │ ┌──────────────────────────────────────────┐           │ │
│ │ │ Company Name *                           │           │ │
│ │ │ [____________________________]           │           │ │
│ │ └──────────────────────────────────────────┘           │ │
│ │                                                          │ │
│ │ ┌──────────────────────────────────────────┐           │ │
│ │ │ Industry                                 │           │ │
│ │ │ [Select Industry ▼]                      │           │ │
│ │ └──────────────────────────────────────────┘           │ │
│ │ Options: Retail, Healthcare, Manufacturing,             │ │
│ │ Food Service, Professional Services, Other              │ │
│ │                                                          │ │
│ │ ┌──────────────────────────────────────────┐           │ │
│ │ │ Business Address *                       │           │ │
│ │ │ [____________________________]           │           │ │
│ │ │ City [____________] State [MI ▼]         │           │ │
│ │ │ ZIP [_______]                            │           │ │
│ │ └──────────────────────────────────────────┘           │ │
│ │                                                          │ │
│ │ 💡 Why We Need This                                     │ │
│ │ "Your address helps ensure compliance with local         │ │
│ │  Michigan regulations."                                 │ │
│ │                                                          │ │
│ │ [← Back]                              [Continue →]      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Contact & Administrator Info                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👤 Section Header                                       │ │
│ │ "Primary Contact Information"                           │ │
│ │                                                          │ │
│ │ 📝 Form Fields                                          │ │
│ │ ┌──────────────────────────────────────────┐           │ │
│ │ │ Your Name *                              │           │ │
│ │ │ [____________________________]           │           │ │
│ │ └──────────────────────────────────────────┘           │ │
│ │                                                          │ │
│ │ ┌──────────────────────────────────────────┐           │ │
│ │ │ Your Title/Role *                        │           │ │
│ │ │ [____________________________]           │           │ │
│ │ └──────────────────────────────────────────┘           │ │
│ │                                                          │ │
│ │ ┌──────────────────────────────────────────┐           │ │
│ │ │ Email Address *                          │           │ │
│ │ │ [____________________________]           │           │ │
│ │ └──────────────────────────────────────────┘           │ │
│ │ ✓ Already verified from account creation               │ │
│ │                                                          │ │
│ │ ┌──────────────────────────────────────────┐           │ │
│ │ │ Phone Number (optional)                  │           │ │
│ │ │ [____________________________]           │           │ │
│ │ └──────────────────────────────────────────┘           │ │
│ │                                                          │ │
│ │ 💡 Privacy Note                                         │ │
│ │ "This information is used for account management        │ │
│ │  and compliance notifications only."                    │ │
│ │                                                          │ │
│ │ [← Back]                              [Continue →]      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Branding & Customization                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎨 Section Header                                       │ │
│ │ "Customize Your Workspace (Optional)"                   │ │
│ │                                                          │ │
│ │ 🖼️ Logo Upload                                          │ │
│ │ ┌────────────────────────────────┐                     │ │
│ │ │                                │                     │ │
│ │ │     [  Upload Logo  ]          │  Preview:          │ │
│ │ │                                │  ┌──────────┐      │ │
│ │ │  or drag and drop here         │  │   LOGO   │      │ │
│ │ │                                │  └──────────┘      │ │
│ │ │  Recommended: 512x512 PNG      │                     │ │
│ │ └────────────────────────────────┘                     │ │
│ │                                                          │ │
│ │ 🎨 Brand Color (Optional)                               │ │
│ │ ┌─────────┐ or use ESTA Tracker default blue           │ │
│ │ │ [#____] │ Color Picker                               │ │
│ │ └─────────┘                                             │ │
│ │                                                          │ │
│ │ 📋 Display Name for Employees                           │ │
│ │ ┌──────────────────────────────────────────┐           │ │
│ │ │ [Acme Corporation] (uses company name)   │           │ │
│ │ └──────────────────────────────────────────┘           │ │
│ │                                                          │ │
│ │ 💡 Why Customize?                                       │ │
│ │ "Your employees will see your logo and brand colors     │ │
│ │  when they access their sick time portal."             │ │
│ │                                                          │ │
│ │ [← Back]  [Skip This Step]        [Continue →]         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Enrollment Code Generation                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔑 Section Header                                       │ │
│ │ "Your Unique Enrollment Code"                           │ │
│ │                                                          │ │
│ │ 🎯 Code Display                                         │ │
│ │ ┌────────────────────────────────────────────────────┐  │ │
│ │ │                                                     │  │ │
│ │ │    Your Employee Enrollment Code:                  │  │ │
│ │ │                                                     │  │ │
│ │ │         ┌───────────────┐                          │  │ │
│ │ │         │   A  C  M  E   │   [📋 Copy]            │  │ │
│ │ │         └───────────────┘                          │  │ │
│ │ │         4-digit code                               │  │ │
│ │ │                                                     │  │ │
│ │ └────────────────────────────────────────────────────┘  │ │
│ │                                                          │ │
│ │ 📝 Usage Instructions                                   │ │
│ │ "Share this code with your employees so they can        │ │
│ │  register and access their sick time balances."        │ │
│ │                                                          │ │
│ │ ✅ Code Features                                        │ │
│ │ • Unique to your organization                          │ │
│ │ • Easy to remember and share                           │ │
│ │ • Can be changed later if needed                       │ │
│ │                                                          │ │
│ │ 💾 Next Steps Preview                                   │ │
│ │ ┌────────────────────────────────────────────────────┐  │ │
│ │ │ Your profile is complete! Next, we'll:             │  │ │
│ │ │                                                     │  │ │
│ │ │ 1. Configure your sick time policy                 │  │ │
│ │ │ 2. Add your first employees                        │  │ │
│ │ │ 3. Start tracking compliance                       │  │ │
│ │ └────────────────────────────────────────────────────┘  │ │
│ │                                                          │ │
│ │ [← Back]              [Complete Profile Setup →]        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Design Specifications

### Colors
- **Primary CTA**: `trust-blue` (#1E4BD8)
- **Secondary CTA**: `accent-blue` (#3B82F6)
- **Success State**: `gov-trust-green` (#00B289)
- **Background**: `background` (#F7FAFE)
- **Card Surface**: `surface` (#FFFFFF)
- **Code Display Background**: Light blue gradient (#F0F4FF to #DBEAFE)

### Typography
- **Section Headers**: 24px Semibold
- **Form Labels**: 14px Medium
- **Input Text**: 16px Regular
- **Help Text**: 14px Regular
- **Code Display**: 32px Bold (monospace)

### Spacing
- **Form Field Gap**: 24px between fields
- **Section Padding**: 24px on desktop, 16px on mobile
- **Input Padding**: 12px vertical, 16px horizontal
- **Button Spacing**: 16px gap between primary and secondary

### Components
- **Input Fields**: 
  - Height: 48px minimum
  - Border: 1px solid #D1D5DB
  - Border radius: 8px
  - Focus state: 2px border in trust-blue with shadow
  
- **Select Dropdowns**:
  - Match input field styling
  - Dropdown icon on right side
  - Options displayed in overlay with shadow
  
- **Logo Upload**:
  - Drag-and-drop zone: 300px × 200px
  - Dashed border in default state
  - Solid border on drag-over
  - Preview: 120px × 120px

- **Code Display Card**:
  - Elevated card with shadow-lg
  - Center-aligned code
  - Copy button with tooltip feedback

---

## Interaction Patterns

### Form Validation
- **Real-time Validation**: On blur for each field
- **Required Field Indicators**: Red asterisk (*)
- **Error States**: 
  - Red border on field
  - Icon indicator
  - Error message below field
  - Never block submission without clear guidance

### Logo Upload
- **Supported Formats**: PNG, JPG, SVG
- **Max File Size**: 2MB
- **Auto-resize**: Images automatically optimized
- **Preview**: Show immediate preview on upload
- **Remove**: X button to clear uploaded logo

### Enrollment Code
- **Auto-generated**: Based on company name (first 4 letters, uppercase)
- **Collision Handling**: Append number if duplicate (ACME, ACM2, ACM3)
- **Copy Function**: One-click copy with "Copied!" toast
- **Regenerate**: Option to change code (with warning about existing employees)

### Skip Options
- Branding step can be skipped entirely
- Phone number is optional
- Industry selection has "Other" and "Prefer not to say" options

---

## Copy Tone

### Encouraging & Optional
- ✅ "Customize your workspace to make it feel like home"
- ❌ "You must complete company branding"

### Clear Purpose
- ✅ "Your address helps ensure compliance with local Michigan regulations"
- ❌ "Address is required for legal purposes"

### Privacy Assurance
- ✅ "This information is used for account management and compliance notifications only"
- ❌ "We store your personal information securely"

---

## Success Metrics

### Profile Completion
- ✅ **Required Field Completion**: 100% of required fields completed
- ✅ **Optional Field Completion**: >60% add phone number, >40% upload logo
- ✅ **Time to Complete**: Average 2-3 minutes
- ✅ **Error Rate**: <3% validation errors

### User Satisfaction
- Code sharing success: >95% of employers successfully share enrollment code
- Customization adoption: Track branding vs. default usage

---

## Accessibility Requirements

### Form Accessibility
- All form fields have visible labels
- Required fields indicated with asterisk and aria-required
- Error messages associated with aria-describedby
- Color is not the only indicator of errors (icon + text)

### Logo Upload Accessibility
- Keyboard accessible upload trigger
- Screen reader announces upload success/failure
- Alt text prompt for uploaded logo

### Keyboard Navigation
- Tab order follows visual flow
- Enter key submits form
- Escape key clears focused field
- All interactive elements reachable via keyboard

---

## Technical Implementation Notes

### Data Persistence
```typescript
// Save profile data incrementally
const saveProfileStep = async (step: number, data: ProfileData) => {
  await updateDoc(doc(db, 'employers', employerId), {
    [`profile.step${step}`]: data,
    [`profile.lastUpdated`]: serverTimestamp()
  });
};
```

### Logo Processing
```typescript
// Client-side image optimization before upload
const optimizeLogo = async (file: File): Promise<Blob> => {
  const img = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, 512, 512);
  return await new Promise(resolve => 
    canvas.toBlob(resolve!, 'image/png')
  );
};
```

### Enrollment Code Generation
```typescript
// Generate unique 4-letter code
const generateEnrollmentCode = (companyName: string): string => {
  const base = companyName
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 4)
    .toUpperCase()
    .padEnd(4, 'X');
  
  // Check for collisions in Firestore
  // Append number if needed
  return ensureUnique(base);
};
```

### Analytics Events
```typescript
trackEvent('profile_step_completed', {
  step: 'company_info',
  has_logo: !!logoUrl,
  has_phone: !!phone,
  industry: selectedIndustry
});
```
