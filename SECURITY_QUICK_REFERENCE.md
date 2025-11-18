# 🔐 ESTA Tracker Security Rules - Quick Reference

## 🎯 Core Security Principles

### ✅ All Security Features Implemented

1. **🔐 Tenant Isolation** - Complete data segregation between companies
2. **👥 Role Separation** - Manager vs Employee access control
3. **📧 Email Verification** - Required for all access
4. **🛂 Backend-Only Role Assignment** - No client-side privilege escalation
5. **🩺 Protected Doctor Notes** - Immutable medical documentation
6. **🔍 Immutable Audit Logs** - Tamper-proof compliance records
7. **🛡️ Default-Deny Posture** - All paths closed unless explicitly allowed

---

## 🗂️ Firestore Data Structure

```
tenants/{tenantId}/
├── employees/             [Manager: RW | Employee: R (self only)]
├── pto_requests/          [Manager: RW | Employee: R (self), C (self)]
├── work_logs/             [Manager: RW | Employee: R (self)]
├── accrual_logs/          [Manager: R | Employee: R (self)] [IMMUTABLE]
├── audit_logs/            [Manager: R] [IMMUTABLE]
├── retaliation_reports/   [Manager: RW | Employee: R (self), C (self)]
├── doctor_notes/          [Manager: R | Employee: R (self), C (self)] [IMMUTABLE]
└── compliance_settings/   [Manager: R] [Backend-only writes]

user_profiles/{userId}     [User: R (self), U (self - basic info only)]
```

**Legend:** R=Read, W=Write, C=Create, U=Update

---

## 📦 Storage Structure

```
tenants/{tenantId}/
├── employees/{employeeId}/documents/    [Mgr: RW | Emp: R (self), C (self, no overwrite)]
├── doctor-notes/{employeeId}/           [Mgr: R | Emp: R (self), C (self)] [IMMUTABLE]
├── compliance/                          [Mgr: RWD | Emp: R]
├── profile-pictures/{userId}            [Mgr: RWD | User: RWD (self)]
├── company-logo                         [Mgr: RWD | Emp: R]
└── audit-exports/                       [Mgr: R] [Admin: C only] [IMMUTABLE]
```

**Legend:** R=Read, W=Write, D=Delete

---

## 🔑 Custom Claims Required

Every authenticated user must have these custom claims (set via Firebase Admin SDK):

```typescript
{
  tenantId: "company-123",      // Which company they belong to
  role: "manager" | "employee"  // Their permission level
}
```

**Setting custom claims (Backend only):**
```typescript
import * as admin from 'firebase-admin';

await admin.auth().setCustomUserClaims(userId, {
  tenantId: companyId,
  role: userRole
});
```

---

## 🚫 Protected Fields (Cannot be set by clients)

These fields can ONLY be set by backend via Firebase Admin SDK:

- `role` - User's permission level
- `tenantId` - Company association
- `status` - Approval/pending status
- `customClaims` - Firebase authentication claims
- `accruedHours` - Sick time balance
- `usedHours` - Hours consumed
- `paidHoursUsed` - Paid hours used
- `unpaidHoursUsed` - Unpaid hours used

---

## 🔒 Access Control Matrix

| Resource | Manager | Employee | Admin | Backend |
|----------|---------|----------|-------|---------|
| **Employees** | Read All, Write All | Read Self | Full | Full |
| **PTO Requests** | Approve/Deny | Create Self, Read Self | Full | Full |
| **Work Logs** | Create, Edit | Read Self | Full | Full |
| **Accrual Logs** | Read All | Read Self | Read All | Create Only |
| **Audit Logs** | Read All | None | Read All | Create Only |
| **Doctor Notes** | Read All | Create Self, Read Self | Read All | None |
| **Documents (Storage)** | Read All, Delete | Upload (no overwrite) | Full | Full |

---

## 📝 File Upload Restrictions

### Allowed File Types
- Images: `image/*` (PNG, JPG, GIF, etc.)
- PDFs: `application/pdf`
- Word: `.doc`, `.docx`

### Size Limits
- **Documents & Doctor Notes:** 10MB max
- **Profile Pictures & Logos:** 5MB max

### Upload Rules
- ✅ Cannot overwrite existing files (doctor notes, documents)
- ✅ File type validation enforced
- ✅ Size limits enforced
- ❌ Cannot update uploaded documents (immutable)

---

## ⚠️ Important Security Notes

### 1. Email Verification is MANDATORY
```javascript
// All rules require this
request.auth.token.email_verified == true
```

### 2. Tenant Isolation is ENFORCED
```javascript
// Every operation checks
request.auth.token.tenantId == tenantId
```

### 3. Immutable Collections
These collections CANNOT be modified after creation:
- `accrual_logs` - Accrual history
- `audit_logs` - Compliance audit trail
- `doctor_notes` - Medical documentation
- `audit-exports` - Exported reports

### 4. Backend-Only Operations
Only Firebase Admin SDK can:
- Create audit/accrual logs
- Set custom claims
- Modify protected fields
- Create audit exports

---

## 🧪 Quick Test Commands

### Test Firestore Rules (using Firebase CLI)
```bash
# Start emulators
firebase emulators:start

# Test in browser
open http://localhost:4000

# Test specific rules
firebase emulators:exec "npm test"
```

### Test Storage Rules
```bash
# Upload test file
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf" \
  "http://localhost:9199/v0/b/default-bucket/o/tenants/test-tenant/doctor-notes/user123/note1"
```

---

## 🚀 Deployment

```bash
# Deploy all Firebase rules
firebase deploy --only firestore:rules,storage:rules

# Deploy with indexes
firebase deploy --only firestore:rules,firestore:indexes,storage:rules

# Verify deployment
firebase firestore:rules:list
```

---

## 📊 Rule Performance Tips

1. **Index Compound Queries** - Already configured in `firestore.indexes.json`
2. **Limit Rule Complexity** - Keep functions simple
3. **Cache Custom Claims** - Firebase caches them automatically
4. **Use Collection Groups** - For cross-tenant admin queries

---

## 🔧 Backend Implementation Checklist

- [ ] Set custom claims (`tenantId`, `role`) for all users
- [ ] Require email verification before granting access
- [ ] Use Admin SDK for creating audit/accrual logs
- [ ] Validate all inputs on backend (never trust client)
- [ ] Implement rate limiting (Firebase App Check)
- [ ] Monitor denied rule attempts
- [ ] Set up Firebase Security logging
- [ ] Test rules thoroughly before production deployment

---

## 📞 Support & Resources

- **Full Documentation:** See `SECURITY_RULES.md`
- **Firestore Rules:** `firestore.rules`
- **Storage Rules:** `storage.rules`
- **Firebase Console:** [https://console.firebase.google.com](https://console.firebase.google.com)
- **Firebase Rules Playground:** Available in Firebase Console

---

**Status:** ✅ Production Ready  
**Version:** 1.0  
**Last Updated:** November 2024
