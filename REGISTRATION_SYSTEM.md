# ESTA Tracker Registration System

## Overview

The ESTA Tracker registration system has been completely rewritten to provide a secure, reliable, and user-friendly account creation and verification process. The new system uses Firebase Authentication and Firestore to manage users with automated email verification and role-based access control.

## Key Features

### ✅ Email Verification
- Automatic email verification sent on registration
- Auto-detection of verification status (checks every 5 seconds for 2 minutes)
- Manual refresh option
- Resend verification email functionality
- User-friendly verification screen with clear instructions

### ✅ Multi-Tenant Architecture
- Each manager creates a unique tenant (company)
- 6-character alphanumeric tenant codes (e.g., ABC123)
- Employees join tenants using the code
- Complete tenant isolation via Firestore security rules

### ✅ Automated Approval
- Automatic approval upon email verification
- No manual admin approval required
- Instant access to dashboard after verification
- Status transitions: `pending` → `active`

### ✅ Role-Based Access Control (RBAC)
- Firebase custom claims for role enforcement
- Two roles: `manager` and `employee`
- Managers have full tenant access
- Employees have restricted access to their own data
- Firestore security rules enforce RBAC

### ✅ Comprehensive Error Handling
- Specific error messages for each failure scenario
- Firebase error code handling
- Network error detection
- User-friendly error display
- Loading states throughout

### ✅ Audit Logging
- All registration events logged
- Authentication events tracked
- Immutable audit trail
- Admin-only access to logs

## User Flows

### Manager Registration Flow

1. **Navigate to Registration** → `/register/manager`
2. **Fill Form:**
   - Full Name
   - Email Address
   - Company Name
   - Number of Employees
   - Password (min 8 characters)
   - Confirm Password
3. **Submit → Firebase Account Created**
   - Firebase Auth account created
   - Tenant created with unique 6-character code
   - Firestore user document created with `status: "pending"`
   - Verification email sent
4. **Email Verification Screen**
   - Auto-checks every 5 seconds
   - Manual refresh button
   - Resend email option
5. **Verify Email → Click Link in Email**
6. **Auto-Approved**
   - Status updated to `active`
   - Custom claims assigned (`role: manager`, `tenantId`)
   - Redirected to success page
7. **Success Page**
   - Displays tenant code (for employees to join)
   - Copy-to-clipboard functionality
   - Next steps guide
8. **Login** → Access manager dashboard

### Employee Registration Flow

1. **Navigate to Registration** → `/register/employee`
2. **Fill Form:**
   - Full Name
   - Email Address
   - **Employer Code** (get from manager)
   - Password (min 8 characters)
   - Confirm Password
3. **Submit → Validate Tenant Code**
   - System validates tenant code exists
   - If invalid, error displayed
4. **Firebase Account Created**
   - Firebase Auth account created
   - Firestore user document created with `status: "pending"`
   - Linked to tenant via tenantId
   - Verification email sent
5. **Email Verification Screen** (same as manager)
6. **Verify Email → Click Link in Email**
7. **Auto-Approved**
   - Status updated to `active`
   - Custom claims assigned (`role: employee`, `tenantId`)
   - Redirected to success page
8. **Success Page**
   - Confirms employer name
   - Next steps guide
9. **Login** → Access employee dashboard

### Login Flow

1. **Navigate to Login** → `/login`
2. **Enter Credentials**
   - Email
   - Password
3. **Submit → Firebase Authentication**
4. **Check Email Verification**
   - If not verified → Show verification screen
   - If verified but status not active → Show pending message
5. **Access Granted** → Redirect to dashboard

## Technical Architecture

### Frontend Components

**New Components:**
- `EmailVerification.tsx` - Email verification screen with auto-detection
- `RegisterSuccess.tsx` - Post-registration success page with tenant code

**Updated Components:**
- `RegisterManager.tsx` - Rewritten to use Firebase
- `RegisterEmployee.tsx` - Rewritten with tenant code validation
- `Login.tsx` - Updated to check verification and status
- `App.tsx` - Firebase auth state listener, user validation

**New Services:**
- `lib/firebase.ts` - Firebase initialization
- `lib/authService.ts` - Complete authentication service

### Backend (Firebase Functions)

**Cloud Functions:**
- `onUserVerified` - Firestore trigger, assigns custom claims on verification
- `approveUser` - HTTP function for manual approval (admin only)
- `rejectUser` - HTTP function for rejection (admin only)
- `cleanupUnverifiedAccounts` - Scheduled function, removes accounts after 7 days
- `validateTenantCode` - HTTP function to validate codes

### Database Structure

**Firestore Collections:**

```
users/{userId}
  - id: string
  - email: string
  - name: string
  - role: 'manager' | 'employee'
  - tenantId: string
  - status: 'pending' | 'active' | 'rejected'
  - emailVerified: boolean
  - createdAt: timestamp
  - updatedAt: timestamp
  - verifiedAt: timestamp (optional)
  - approvedAt: timestamp (optional)

tenants/{tenantId}
  - id: string
  - name: string (company name)
  - tenantCode: string (6-char, unique)
  - employeeCount: number
  - employerSize: 'small' | 'large'
  - ownerId: string (user id of manager)
  - createdAt: timestamp
  - updatedAt: timestamp

registrationLogs/{logId}
  - userId: string
  - email: string
  - role: string
  - tenantId: string
  - companyName: string (for managers)
  - tenantCode: string (for employees)
  - status: string
  - timestamp: timestamp

authEvents/{eventId}
  - userId: string
  - email: string
  - action: string
  - timestamp: timestamp
```

### Security Rules

**Key Security Features:**

1. **Tenant Isolation**
   ```javascript
   // Users can only access data from their tenant
   function belongsToTenant(tenantId) {
     return isVerified() && getTenantId() == tenantId;
   }
   ```

2. **Email Verification Required**
   ```javascript
   function isVerified() {
     return isAuthenticated() && 
            request.auth.token.email_verified == true;
   }
   ```

3. **Role-Based Access**
   ```javascript
   function isManager() {
     return isVerified() && getUserRole() == 'manager';
   }
   ```

4. **Audit Trail Protection**
   ```javascript
   // Logs are read-only, cannot be modified
   match /registrationLogs/{logId} {
     allow read: if isAdmin();
     allow write: if false;
   }
   ```

## Configuration

### Environment Variables

**Frontend (.env.local):**
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Vercel Production:**
Set these in Vercel Dashboard → Settings → Environment Variables

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `auth/email-already-in-use` | Email already registered | Use different email or login |
| `auth/invalid-email` | Invalid email format | Check email format |
| `auth/weak-password` | Password too short/weak | Use stronger password (8+ chars) |
| `auth/user-not-found` | Email not registered | Register first |
| `auth/wrong-password` | Incorrect password | Check password |
| `auth/too-many-requests` | Too many failed attempts | Wait and try again |
| `Invalid tenant code` | Wrong employer code | Get correct code from employer |

### Error Display

All errors are displayed with:
- 🔴 Red background for visibility
- Clear, user-friendly messages
- Specific guidance for resolution
- No technical jargon

## Testing

### Manual Testing Checklist

**Manager Registration:**
- [ ] Can access `/register/manager`
- [ ] Form validation works (required fields, password match)
- [ ] Registration creates Firebase account
- [ ] Verification email received
- [ ] Verification screen appears
- [ ] Auto-detection works (within 5 seconds of verification)
- [ ] Manual refresh works
- [ ] Resend email works
- [ ] Success page shows tenant code
- [ ] Tenant code can be copied
- [ ] Can login after verification

**Employee Registration:**
- [ ] Can access `/register/employee`
- [ ] Form validation works
- [ ] Invalid tenant code shows error
- [ ] Valid tenant code allows registration
- [ ] Verification email received
- [ ] Verification screen works
- [ ] Success page shows employer name
- [ ] Can login after verification
- [ ] Linked to correct tenant

**Login:**
- [ ] Can login with valid credentials
- [ ] Unverified users see verification screen
- [ ] Pending users see pending message
- [ ] Active users access dashboard

**Security:**
- [ ] Employees cannot access other tenants' data
- [ ] Unverified users cannot access dashboard
- [ ] Custom claims are set correctly
- [ ] Security rules enforced

## Deployment

### Prerequisites

1. Firebase project created
2. Email/Password authentication enabled
3. Firestore database created
4. Billing enabled (required for Cloud Functions)

### Deployment Steps

```bash
# 1. Login to Firebase
firebase login

# 2. Initialize (if not done)
firebase init

# 3. Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# 4. Deploy Cloud Functions
firebase deploy --only functions

# 5. Deploy to Vercel
# Set environment variables in Vercel Dashboard
# Push to GitHub - Vercel auto-deploys

# 6. Test production deployment
# - Register as manager
# - Get tenant code
# - Register as employee with code
# - Verify emails work
# - Check security rules enforce
```

### Monitoring

**Firebase Console:**
- Authentication → See all users
- Firestore → Browse data
- Functions → View logs

**Command Line:**
```bash
# View function logs
firebase functions:log

# View specific function
firebase functions:log --only onUserVerified
```

## Troubleshooting

### Issue: Verification emails not arriving

**Causes:**
- Email in spam folder
- Firebase email sender not configured
- SMTP limits reached

**Solutions:**
1. Check spam folder
2. Whitelist noreply@[your-project].firebaseapp.com
3. Configure custom SMTP in Firebase Console
4. Use resend button

### Issue: Auto-detection not working

**Causes:**
- User clicked link in different browser
- Firebase state not syncing

**Solutions:**
1. Use manual refresh button
2. Clear browser cache and retry
3. Check browser console for errors

### Issue: "Permission denied" in Firestore

**Causes:**
- Custom claims not set
- Email not verified
- Security rules too restrictive

**Solutions:**
1. Check Firebase Auth token includes claims
2. Verify email is verified
3. Review security rules in Firebase Console

### Issue: Tenant code not working

**Causes:**
- Code expired (if implemented)
- Code typed incorrectly
- Tenant deleted

**Solutions:**
1. Get fresh code from manager
2. Type carefully (case-sensitive)
3. Contact support if tenant deleted

## Future Enhancements

### Planned Features

1. **Password Reset Flow**
   - Forgot password link
   - Email-based reset
   - Security questions

2. **Two-Factor Authentication (2FA)**
   - SMS verification
   - Authenticator app support
   - Backup codes

3. **Social Login**
   - Google Sign-In
   - Microsoft/Azure AD
   - LinkedIn

4. **Advanced Tenant Management**
   - Tenant code expiration
   - Invitation system
   - Bulk employee import

5. **Email Customization**
   - Custom email templates
   - Branded emails
   - Multiple languages

6. **Admin Dashboard**
   - User management
   - Manual approval interface
   - Analytics and reports

## Support

### Documentation
- See `FIREBASE_SETUP.md` for Firebase setup
- See `README.md` for general project info
- See Firestore security rules comments for access control details

### Resources
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Functions Guide](https://firebase.google.com/docs/functions)

## Security Considerations

### Data Protection
- ✅ Passwords hashed by Firebase
- ✅ HTTPS enforced
- ✅ Tenant isolation
- ✅ RBAC enforcement
- ✅ Email verification required
- ✅ Audit logging enabled

### Compliance
- ✅ No sensitive data in logs
- ✅ Immutable audit trail
- ✅ User data deletion support (GDPR)
- ✅ Data retention policies enforced

### Best Practices
- ✅ Least privilege access
- ✅ Input validation
- ✅ Error handling without leaking info
- ✅ Rate limiting (via Firebase)
- ✅ Automatic cleanup of old accounts

---

**Last Updated:** 2024-01-18
**Version:** 2.0.0
