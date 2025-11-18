# 🔐 Firebase Security Rules Documentation

## Overview

This document describes the comprehensive security rules implemented for the ESTA Tracker application. These rules ensure complete data isolation, role-based access control, and compliance-safe document management.

## 🛡️ Security Features

### 1. 🔐 Tenant Isolation (Critical for Compliance)

**What it does:**
- Ensures no user can access data from other companies
- All database operations are scoped to a specific tenant ID
- Complete data segregation between organizations

**How it works:**
- Every user has a `tenantId` custom claim set by the backend
- All Firestore rules check `belongsToTenant(tenantId)` before allowing access
- Storage rules enforce tenant-based folder structure

**Implementation:**
```javascript
// Helper function in firestore.rules
function belongsToTenant(tenantId) {
  return isAuthenticatedAndVerified() && getTenantId() == tenantId;
}

// Usage in rules
allow read: if belongsToTenant(tenantId);
```

---

### 2. 👥 Manager vs. Employee Role Separation

**What it does:**
- Managers have write access to employee data
- Employees can only read their own data
- Employees cannot edit balances, accruals, or approve their own PTO

**How it works:**
- User roles (`manager`, `employee`, `admin`) are stored in custom claims
- Custom claims are set by backend functions (not editable by clients)
- Rules check role before granting write permissions

**Manager Permissions:**
- Read/write all employees in their tenant
- Approve/deny PTO requests
- Create/update work logs
- View all audit logs

**Employee Permissions:**
- Read their own data only
- Submit PTO requests (cannot approve their own)
- Upload doctor notes
- Cannot modify accrual balances

**Implementation:**
```javascript
// Manager check
function isManager() {
  return isAuthenticatedAndVerified() && 
         request.auth.token.role == 'manager';
}

// Employee self-access check
allow read: if isManagerOfTenant(tenantId) || 
               (belongsToTenant(tenantId) && request.auth.uid == employeeId);
```

---

### 3. 📧 Email Verification Required

**What it does:**
- No database or storage access before email is verified
- Prevents spam accounts and ensures valid user identity

**How it works:**
- All rules check `request.auth.token.email_verified == true`
- Firebase Authentication handles email verification flow
- Users must verify email before accessing any data

**Implementation:**
```javascript
function isEmailVerified() {
  return request.auth.token.email_verified == true;
}

function isAuthenticatedAndVerified() {
  return isAuthenticated() && isEmailVerified();
}
```

---

### 4. 🛂 Automated Approval Workflow

**What it does:**
- Clients cannot set their own role, status, or tenantId
- Only backend functions can assign these protected fields
- Prevents privilege escalation attacks

**How it works:**
- Helper function `cannotSetProtectedFields()` blocks writes containing protected fields
- Backend uses Firebase Admin SDK to set custom claims and protected fields
- Custom claims are cryptographically signed by Firebase

**Protected Fields:**
- `role` - Cannot be self-assigned
- `tenantId` - Cannot be changed by client
- `status` - Cannot be self-approved
- `customClaims` - Cannot be modified by client

**Implementation:**
```javascript
function cannotSetProtectedFields() {
  return !('role' in request.resource.data) &&
         !('tenantId' in request.resource.data) &&
         !('status' in request.resource.data) &&
         !('customClaims' in request.resource.data);
}

allow create: if belongsToTenant(tenantId) && 
                 cannotSetProtectedFields();
```

---

### 5. 🩺 Doctor Notes Uploads Protected

**What it does:**
- Only employees can upload doctor notes (for themselves)
- Uploaded notes cannot be modified or deleted by employees
- Managers can view all doctor notes in their tenant for compliance

**How it works:**
- Firestore rules: `doctor_notes` subcollection under tenants
- Storage rules: `/tenants/{tenantId}/doctor-notes/{employeeId}/{noteId}`
- Upload allowed, update/delete denied for employees
- Managers have read-only access

**Implementation:**
```javascript
// Firestore Rules
match /doctor_notes/{noteId} {
  allow create: if belongsToTenant(tenantId) &&
                   request.resource.data.employeeId == request.auth.uid;
  allow update, delete: if false; // Immutable
  allow read: if isManagerOfTenant(tenantId) || 
                 (belongsToTenant(tenantId) && 
                  resource.data.employeeId == request.auth.uid);
}

// Storage Rules
match /tenants/{tenantId}/doctor-notes/{employeeId}/{noteId} {
  allow create: if belongsToTenant(tenantId) &&
                   request.auth.uid == employeeId &&
                   fileDoesNotExist();
  allow update: if false; // Cannot modify
  allow delete: if false; // Cannot delete
}
```

---

### 6. 🔍 Compliance-Safe Logging

**What it does:**
- Audit logs and accrual logs are immutable
- Only backend can create logs (via Cloud Functions)
- Users cannot alter or delete historical records

**How it works:**
- `audit_logs` and `accrual_logs` subcollections
- Create operations: `allow create: if false` (backend only)
- Update/delete operations: `allow update, delete: if false`

**Implementation:**
```javascript
match /audit_logs/{logId} {
  allow read: if isManagerOfTenant(tenantId);
  allow create: if false; // Only backend via Admin SDK
  allow update, delete: if false; // Immutable
}

match /accrual_logs/{logId} {
  allow read: if isManagerOfTenant(tenantId) || 
                 (belongsToTenant(tenantId) && 
                  resource.data.userId == request.auth.uid);
  allow create: if false; // Only backend
  allow update, delete: if false; // Immutable
}
```

---

### 7. 🛡️ Strong Default-Deny Posture

**What it does:**
- All paths are closed unless explicitly opened
- Any unspecified path automatically denies all operations
- Prevents accidental data exposure

**How it works:**
- Last rule in both Firestore and Storage rules: deny all
- Must explicitly define allowed operations for each path
- Security by default, not by exception

**Implementation:**
```javascript
// Firestore Rules (last rule)
match /{document=**} {
  allow read, write: if false;
}

// Storage Rules (last rule)
match /{allPaths=**} {
  allow read, write: if false;
}
```

---

## 📦 Storage Rules Features

### Employee Document Uploads

**Path:** `/tenants/{tenantId}/employees/{employeeId}/documents/{documentId}`

**Rules:**
- ✅ Employees can upload to their own folder only
- ✅ Managers can view all employee documents
- ✅ Cannot overwrite existing files (`fileDoesNotExist()`)
- ✅ File type validation (images, PDFs, Word docs)
- ✅ File size limit: 10MB
- ❌ Cannot update documents after upload
- ✅ Managers can delete documents

### Doctor Notes Storage

**Path:** `/tenants/{tenantId}/doctor-notes/{employeeId}/{noteId}`

**Rules:**
- ✅ Employees upload for themselves only
- ✅ Managers can view all doctor notes
- ❌ Cannot overwrite existing notes
- ❌ Cannot update doctor notes (immutable)
- ❌ Cannot delete doctor notes (compliance requirement)
- ✅ File type and size validation

### Compliance Documents

**Path:** `/tenants/{tenantId}/compliance/{documentType}`

**Rules:**
- ✅ All tenant users can read
- ✅ Only managers can upload/update/delete
- ✅ Stores ESTA posters, policies, handbooks

### Profile Pictures

**Path:** `/tenants/{tenantId}/profile-pictures/{userId}`

**Rules:**
- ✅ All tenant users can view
- ✅ Users can upload their own picture
- ✅ Managers can upload for employees
- ✅ 5MB size limit for images

---

## 🔧 Backend Implementation Requirements

To use these security rules, your backend must:

### 1. Set Custom Claims (Required)

Use Firebase Admin SDK to set custom claims when users register:

```typescript
import * as admin from 'firebase-admin';

async function setUserClaims(userId: string, tenantId: string, role: string) {
  await admin.auth().setCustomUserClaims(userId, {
    tenantId: tenantId,
    role: role, // 'manager', 'employee', or 'admin'
  });
}
```

### 2. Require Email Verification

Force email verification before granting access:

```typescript
const user = await admin.auth().getUser(userId);
if (!user.emailVerified) {
  throw new Error('Email not verified');
}
```

### 3. Backend-Only Operations

Use Admin SDK for operations that bypass rules:

```typescript
// Create audit logs (bypass client rules)
await admin.firestore()
  .collection('tenants').doc(tenantId)
  .collection('audit_logs').add({
    userId: userId,
    action: 'accrual',
    details: { hours: 2.4 },
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
```

---

## 🧪 Testing the Rules

### Using Firebase Emulator

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Start emulators
firebase emulators:start

# Access Emulator UI
open http://localhost:4000
```

### Test Cases

**Test 1: Tenant Isolation**
```javascript
// Should FAIL: User from tenant A accessing tenant B data
db.collection('tenants/tenantB/employees').get()
// Expected: Permission denied
```

**Test 2: Role Separation**
```javascript
// Should FAIL: Employee modifying their own accrued hours
db.collection('tenants/tenantA/employees/emp123').update({
  accruedHours: 1000
})
// Expected: Permission denied
```

**Test 3: Email Verification**
```javascript
// Should FAIL: Unverified user accessing data
// (with email_verified = false in token)
db.collection('tenants/tenantA/employees').get()
// Expected: Permission denied
```

**Test 4: Immutable Logs**
```javascript
// Should FAIL: Attempting to delete audit log
db.collection('tenants/tenantA/audit_logs/log123').delete()
// Expected: Permission denied
```

---

## 📊 Data Model Structure

### Firestore Collections

```
tenants/{tenantId}
├── employees/{employeeId}
├── pto_requests/{requestId}
├── work_logs/{logId}
├── accrual_logs/{logId} [IMMUTABLE]
├── audit_logs/{logId} [IMMUTABLE]
├── retaliation_reports/{reportId}
├── doctor_notes/{noteId} [IMMUTABLE]
└── compliance_settings/{settingId}

user_profiles/{userId} [TOP-LEVEL]
```

### Storage Structure

```
tenants/{tenantId}/
├── employees/{employeeId}/documents/{documentId}
├── doctor-notes/{employeeId}/{noteId} [IMMUTABLE]
├── compliance/{documentType}
├── profile-pictures/{userId}
├── company-logo
└── audit-exports/{exportId} [IMMUTABLE]
```

---

## 🚨 Security Best Practices

### 1. Never Trust Client Input
- Always validate on backend
- Never accept role/tenantId from client
- Use server-side timestamps

### 2. Use Custom Claims for Authorization
- Set via Admin SDK only
- Include tenantId and role
- Check in every rule

### 3. Implement Rate Limiting
- Use Firebase App Check
- Monitor for abuse
- Set reasonable quotas

### 4. Monitor Security Events
- Enable Firebase Security Rules logging
- Set up alerts for denied requests
- Review audit logs regularly

### 5. Keep Rules Updated
- Version your rules
- Test before deploying
- Document all changes

---

## 📝 Deployment

### Deploy Rules to Firebase

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy both
firebase deploy --only firestore:rules,storage:rules

# Deploy everything
firebase deploy
```

### CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Deploy Firebase Rules
  run: |
    npm install -g firebase-tools
    firebase deploy --only firestore:rules,storage:rules --token ${{ secrets.FIREBASE_TOKEN }}
```

---

## 📚 Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules Guide](https://firebase.google.com/docs/storage/security)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)

---

## ✅ Security Checklist

- [x] Tenant isolation enforced on all collections
- [x] Email verification required for all access
- [x] Role-based access control (manager/employee/admin)
- [x] Protected fields cannot be set by clients
- [x] Doctor notes are immutable after upload
- [x] Audit logs cannot be modified or deleted
- [x] Storage files have proper access controls
- [x] File uploads are validated (type & size)
- [x] Default-deny posture on all paths
- [x] Custom claims used for authorization
- [x] Comprehensive indexes defined
- [x] Firebase emulator configuration included

---

**Last Updated:** November 2024  
**Version:** 1.0  
**Status:** Production Ready ✅
