# Firebase Authentication Testing Guide
## ESTA Tracker - Registration and Login Testing

**Date:** 2025-11-21  
**Version:** 1.0

---

## Overview

This guide provides step-by-step instructions for testing the Firebase authentication system in ESTA Tracker after the security audit fixes have been implemented.

## Prerequisites

### Environment Setup

1. **Firebase Project Configuration**
   - Firebase project must be created
   - Email/Password authentication enabled
   - Firestore database created
   - Cloud Functions deployed

2. **Environment Variables**
   
   Frontend `.env`:
   ```bash
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

   Backend `.env`:
   ```bash
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account-email
   FIREBASE_PRIVATE_KEY="your-private-key"
   ```

3. **Deploy Firestore Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Deploy Cloud Functions**
   ```bash
   firebase deploy --only functions
   ```

---

## Test Scenarios

### 1. Manager Registration Flow

#### Test Case 1.1: Valid Manager Registration

**Objective:** Verify that a new manager can register successfully

**Steps:**
1. Navigate to `/register/manager`
2. Fill in the registration form:
   - Name: "John Manager"
   - Email: "john.manager@testcompany.com"
   - Password: "TestPass123"
   - Company Name: "Test Company Inc"
   - Employee Count: 15
3. Click "Register as Manager"
4. Observe the email verification page
5. Check email inbox for verification email

**Expected Results:**
- ✅ Registration form submits successfully
- ✅ Email verification page is displayed
- ✅ Firebase Auth user is created
- ✅ Firestore `/users/{uid}` document is created with:
  - role: 'employer'
  - status: 'pending'
  - emailVerified: false
- ✅ Firestore `/tenants/{tenantId}` document is created with:
  - companyName: "Test Company Inc"
  - tenantCode: 8-character code
  - size: 'large' (employeeCount >= 10)
  - ownerId: user uid
- ✅ Custom claims are set via Cloud Function (check logs)
- ✅ Verification email is sent
- ✅ Audit log entry created

**How to Verify:**
```javascript
// Firebase Console > Authentication
// Check user exists with email

// Firestore Console > users collection
// Check document with uid contains correct data

// Firestore Console > tenants collection  
// Check tenant document created

// Cloud Functions Logs
// Should see: "Custom claims set for user {uid}"
```

#### Test Case 1.2: Manager Login Before Email Verification

**Objective:** Verify manager can login even without email verification

**Steps:**
1. Navigate to `/login`
2. Enter credentials from Test Case 1.1
3. Click "Sign in"

**Expected Results:**
- ✅ Login succeeds (no email verification blocker)
- ✅ User is redirected to dashboard
- ✅ Banner or notice displays "Please verify your email"
- ✅ Custom claims are checked and set if missing
- ✅ User status remains 'pending' until verified

#### Test Case 1.3: Manager Email Verification

**Objective:** Verify email verification updates status correctly

**Steps:**
1. Open verification email
2. Click verification link
3. Return to email verification page or login page
4. Click "I've Verified My Email" button

**Expected Results:**
- ✅ Email is verified in Firebase Auth
- ✅ Cloud Function `approveUserAfterVerification` is called
- ✅ Firestore user document updated:
  - emailVerified: true
  - status: 'approved'
  - verifiedAt: timestamp
- ✅ User redirected to dashboard or login
- ✅ Success message displayed

#### Test Case 1.4: Manager Registration with Invalid Data

**Test Steps and Expected Results:**

| Input Error | Expected Behavior |
|------------|-------------------|
| Email without @ | Error: "Invalid email address format" |
| Password < 8 chars | Error: "Password must be at least 8 characters" |
| Name < 2 chars | Error: "Please enter your full name (at least 2 characters)" |
| Company name < 2 chars | Error: "Please enter a valid company name" |
| Employee count < 1 | Error: "Please enter a valid employee count (1-10000)" |
| Employee count > 10000 | Error: "Please enter a valid employee count (1-10000)" |
| Duplicate email | Error: "This email is already registered" |

---

### 2. Employee Registration Flow

#### Test Case 2.1: Valid Employee Registration with Tenant Code

**Objective:** Verify employee can register with tenant code

**Prerequisites:**
- Manager account registered (from Test Case 1.1)
- Tenant code obtained from manager's tenant document

**Steps:**
1. Navigate to `/register/employee`
2. Fill in the registration form:
   - Name: "Jane Employee"
   - Email: "jane.employee@testcompany.com"
   - Password: "TestPass123"
   - Company Code: [tenant code from prerequisite]
3. Click "Register as Employee"
4. Observe email verification page

**Expected Results:**
- ✅ Registration form submits successfully
- ✅ Firebase Auth user is created
- ✅ Firestore `/users/{uid}` document is created with:
  - role: 'employee'
  - employerId: correct tenant ID
  - employerSize: matches tenant size
  - status: 'pending'
- ✅ Tenant is found by code
- ✅ Custom claims are set
- ✅ Verification email sent
- ✅ Audit log created

#### Test Case 2.2: Employee Login Before Verification

**Objective:** Verify employee can login without email verification

**Steps:**
1. Navigate to `/login`
2. Enter credentials from Test Case 2.1
3. Click "Sign in"

**Expected Results:**
- ✅ Login succeeds
- ✅ User redirected to employee dashboard
- ✅ Email verification notice displayed
- ✅ Can view own data

#### Test Case 2.3: Employee Registration with Invalid Tenant Code

**Objective:** Verify proper error handling for invalid tenant code

**Steps:**
1. Navigate to `/register/employee`
2. Enter valid data but invalid tenant code: "INVALID1"
3. Submit form

**Expected Results:**
- ❌ Registration fails
- ✅ Error message: "Invalid company code. Please check with your employer and try again."
- ✅ No Firebase Auth user created
- ✅ No Firestore document created

---

### 3. Authentication State Management

#### Test Case 3.1: Persistent Session

**Objective:** Verify session persists across page refreshes

**Steps:**
1. Login as manager or employee
2. Navigate to dashboard
3. Refresh the page
4. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

**Expected Results:**
- ✅ User remains logged in after refresh
- ✅ AuthContext maintains user state
- ✅ No re-login required
- ✅ Dashboard data loads correctly

#### Test Case 3.2: Protected Route Access

**Objective:** Verify route guards work correctly

**Test Matrix:**

| Route | Unauthenticated | Employee | Manager/Admin | Expected |
|-------|----------------|----------|---------------|----------|
| `/` | Redirect to `/login` | ✅ Access | ✅ Access | As shown |
| `/login` | ✅ Access | Redirect to `/` | Redirect to `/` | As shown |
| `/employee` | Redirect to `/login` | ✅ Access | ❌ Denied | As shown |
| `/employer` | Redirect to `/login` | ❌ Denied | ✅ Access | As shown |
| `/settings` | Redirect to `/login` | ✅ Access | ✅ Access | As shown |
| `/audit` | Redirect to `/login` | ✅ Access | ✅ Access | As shown |

#### Test Case 3.3: Custom Claims Validation

**Objective:** Verify custom claims are set and accessible

**Steps:**
1. Login as any user
2. Open browser console
3. Get ID token:
   ```javascript
   auth.currentUser.getIdTokenResult().then(result => {
     console.log('Custom claims:', result.claims);
   });
   ```

**Expected Results:**
- ✅ Claims object contains:
  - `role`: 'employer' or 'employee'
  - `tenantId`: correct tenant ID
  - `employerId`: correct employer ID
  - `emailVerified`: true or false

---

### 4. Firestore Security Rules Testing

#### Test Case 4.1: User Document Creation

**Objective:** Verify users can create their own document only

**Steps:**
1. Start registration flow
2. Monitor Firestore writes
3. Attempt to create document with different UID

**Expected Results:**
- ✅ User can create document with own UID
- ❌ User cannot create document with different UID
- ✅ Document creation only works once (no duplicates)
- ✅ Required fields are validated (email, name, role)

#### Test Case 4.2: Tenant Data Access

**Objective:** Verify tenant isolation

**Test Matrix:**

| User | Own Tenant | Other Tenant | Expected |
|------|-----------|--------------|----------|
| Manager | ✅ Read/Write | ❌ Denied | As shown |
| Employee | ✅ Read Only | ❌ Denied | As shown |

#### Test Case 4.3: User Document Access

**Test Matrix:**

| User | Own Document | Same Tenant User | Different Tenant User | Expected |
|------|-------------|-----------------|---------------------|----------|
| Manager | ✅ Read/Update | ✅ Read Only | ❌ Denied | As shown |
| Employee | ✅ Read/Update | ❌ Denied | ❌ Denied | As shown |

---

### 5. Error Handling and Edge Cases

#### Test Case 5.1: Network Errors

**Objective:** Verify graceful handling of network errors

**Steps:**
1. Disconnect network
2. Attempt registration or login
3. Observe error messages
4. Reconnect network
5. Retry operation

**Expected Results:**
- ✅ User-friendly error message displayed
- ✅ Retry mechanism works (exponential backoff)
- ✅ Operation succeeds after reconnection
- ✅ No data corruption

#### Test Case 5.2: Concurrent Registration Attempts

**Objective:** Verify race condition handling

**Steps:**
1. Open two browser tabs
2. Start registration in both tabs with same email
3. Submit both forms quickly

**Expected Results:**
- ✅ First submission succeeds
- ✅ Second submission fails with "email already in use"
- ✅ No duplicate user documents created
- ✅ No orphaned tenant documents

#### Test Case 5.3: Cloud Function Failure

**Objective:** Verify fallback when Cloud Function fails

**Steps:**
1. Disable Cloud Functions (or simulate failure)
2. Complete registration
3. Attempt login
4. Check custom claims

**Expected Results:**
- ✅ Registration completes (non-blocking)
- ✅ Login succeeds
- ✅ Fallback in signIn function sets claims
- ✅ User can access application

---

### 6. Security Testing

#### Test Case 6.1: XSS Prevention

**Objective:** Verify input sanitization prevents XSS

**Test Inputs:**
```javascript
// Name field
"<script>alert('XSS')</script>"
"<img src=x onerror=alert(1)>"
"'; DROP TABLE users; --"

// Email field  
"test@example.com<script>alert(1)</script>"

// Company name
"Company<iframe src='evil.com'></iframe>"
```

**Expected Results:**
- ✅ Malicious scripts are sanitized/removed
- ✅ Data is safely stored in Firestore
- ✅ Data is safely displayed in UI
- ✅ No JavaScript execution
- ✅ HTML tags removed or escaped

#### Test Case 6.2: SQL Injection Prevention

**Objective:** Verify NoSQL injection prevention

**Test Inputs:**
```javascript
// These should be treated as literal strings
{ $ne: null }
{ $gt: "" }
admin' OR '1'='1
```

**Expected Results:**
- ✅ Inputs treated as literal strings
- ✅ Firestore queries use parameterization
- ✅ No unauthorized data access

#### Test Case 6.3: Rate Limiting

**Objective:** Verify protection against brute force attacks

**Steps:**
1. Attempt login 10+ times with wrong password
2. Check for rate limiting

**Expected Results:**
- ✅ After X failed attempts, temporary block
- ✅ Error message: "Too many attempts. Please try again later."
- ✅ Block expires after reasonable time

---

## Manual Testing Checklist

### Registration Testing
- [ ] Manager registers successfully with valid data
- [ ] Manager receives verification email
- [ ] Manager document created in Firestore
- [ ] Tenant document created with correct data
- [ ] Custom claims set automatically
- [ ] Employee registers with valid tenant code
- [ ] Employee document created with correct tenantId
- [ ] Employee custom claims set
- [ ] Invalid tenant code rejected
- [ ] Duplicate email rejected
- [ ] Invalid inputs show proper errors

### Login Testing
- [ ] Manager can login without email verification
- [ ] Employee can login without email verification
- [ ] Invalid credentials rejected
- [ ] Pending account shows appropriate message
- [ ] Email verification updates status
- [ ] Custom claims checked and set if missing
- [ ] Session persists across refresh

### Route Protection Testing
- [ ] Unauthenticated users redirected to login
- [ ] Employees cannot access employer routes
- [ ] Managers cannot access employee-only routes
- [ ] Pending accounts show pending message
- [ ] Rejected accounts show error message

### Security Testing
- [ ] XSS attempts sanitized
- [ ] Input validation prevents injection
- [ ] Firestore rules enforce isolation
- [ ] Users cannot access other tenants' data
- [ ] Users cannot elevate privileges
- [ ] Audit logs capture important events

### Integration Testing
- [ ] AuthContext updates on login
- [ ] ProtectedRoute component works
- [ ] App.tsx redirects correctly
- [ ] Dashboard loads user data
- [ ] Logout clears session
- [ ] Network errors handled gracefully

---

## Automated Testing

### Unit Tests

```typescript
// Example test for sanitizeInput
describe('sanitizeInput', () => {
  it('removes HTML tags', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
  });
  
  it('removes control characters', () => {
    expect(sanitizeInput('test\x00string')).toBe('teststring');
  });
  
  it('trims whitespace', () => {
    expect(sanitizeInput('  test  ')).toBe('test');
  });
});
```

### Integration Tests

```typescript
// Example test for registration flow
describe('Manager Registration', () => {
  it('creates user and tenant documents', async () => {
    const result = await registerManager({
      name: 'Test Manager',
      email: 'test@example.com',
      password: 'TestPass123',
      companyName: 'Test Company',
      employeeCount: 10
    });
    
    expect(result.user).toBeDefined();
    expect(result.needsVerification).toBe(true);
    
    // Verify Firestore documents
    const userDoc = await getDoc(doc(db, 'users', result.user.id));
    expect(userDoc.exists()).toBe(true);
    expect(userDoc.data().role).toBe('employer');
  });
});
```

---

## Troubleshooting

### Common Issues

#### Issue: "Firebase not configured"
**Solution:** 
- Verify environment variables are set
- Check `.env` file exists
- Restart development server

#### Issue: "Permission denied" on Firestore write
**Solution:**
- Deploy latest Firestore rules
- Check user has required custom claims
- Verify document path is correct

#### Issue: Custom claims not set
**Solution:**
- Check Cloud Function logs
- Verify function is deployed
- Try calling `approveUserAfterVerification` manually
- Check signIn fallback logic

#### Issue: Email verification email not received
**Solution:**
- Check spam folder
- Verify email settings in Firebase Console
- Check authorized domains
- Verify Cloud Function logs

---

## Test Data Cleanup

After testing, clean up test data:

```bash
# Firebase Console > Authentication
# Delete test users

# Firestore Console
# Delete test documents from:
# - /users
# - /tenants
# - /auditLogs
```

Or use Firebase Admin SDK:

```javascript
const deleteTestUsers = async () => {
  const users = await admin.auth().listUsers();
  for (const user of users.users) {
    if (user.email.includes('test')) {
      await admin.auth().deleteUser(user.uid);
      await admin.firestore().collection('users').doc(user.uid).delete();
    }
  }
};
```

---

## Conclusion

Following this testing guide will ensure that all authentication and security fixes are working correctly. Document any issues found during testing and create bug reports as needed.

## Next Steps

1. Complete manual testing checklist
2. Implement automated tests
3. Set up CI/CD pipeline with tests
4. Monitor Firebase logs in production
5. Set up error tracking (e.g., Sentry)
6. Create user feedback mechanism
