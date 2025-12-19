# Firebase Cloud Functions for ESTA Tracker

This directory contains Firebase Cloud Functions that provide backend services for the ESTA Tracker application.

## Functions Overview

### 1. `approveUserAfterVerification`

**Type**: Callable HTTPS Function
**Purpose**: Automatically approves user accounts after email verification

**Trigger**: Called by client after detecting email verification
**Actions**:

- Verifies email is confirmed
- Updates user status to "active"
- Sets `emailVerified` field in Firestore
- Assigns custom claims (role, tenantId)
- Creates audit log entry

**Usage**:

```typescript
const result = await httpsCallable(functions, 'approveUserAfterVerification')();
```

### 2. `setUserClaims`

**Type**: Callable HTTPS Function (Admin Only)
**Purpose**: Manually set custom claims for users

**Trigger**: Called by admin users
**Actions**:

- Verifies caller is admin
- Sets custom claims on target user
- Updates Firestore user status
- Creates audit log entry

**Usage**:

```typescript
const result = await httpsCallable(
  functions,
  'setUserClaims'
)({
  uid: 'user-id',
  claims: { role: 'employer', tenantId: 'tenant_123' },
});
```

### 3. `getTenantByCode`

**Type**: Callable HTTPS Function
**Purpose**: Look up tenant information by tenant code

**Trigger**: Called during employee registration
**Actions**:

- Searches Firestore for tenant code
- Returns tenant information if found
- Throws error if not found

**Usage**:

```typescript
const result = await httpsCallable(
  functions,
  'getTenantByCode'
)({
  tenantCode: 'ABC12XYZ',
});
```

### 4. `cleanupUnverifiedAccounts`

**Type**: Scheduled Function (Pub/Sub)
**Purpose**: Automatically delete unverified accounts older than 7 days

**Trigger**: Daily at midnight (America/Detroit timezone)
**Actions**:

- Queries users with `emailVerified: false`
- Filters accounts older than 7 days
- Deletes Firebase Auth accounts
- Deletes Firestore user documents

**Schedule**: `0 0 * * *` (Daily at midnight)

### 5. `onEmailVerified`

**Type**: Auth Trigger
**Purpose**: Placeholder for auth trigger (currently not active)

**Trigger**: When user is created
**Note**: Email verification happens after creation, so this trigger alone isn't sufficient. We use the callable function instead.

## Setup

### Prerequisites

- Node.js 18+
- Firebase CLI
- Firebase project with Blaze plan (required for functions)

### Installation

```bash
# Install dependencies
cd functions
npm install
```

### Configuration

Functions automatically use Firebase project settings. No additional configuration needed.

### Development

```bash
# Run functions emulator
firebase emulators:start --only functions

# Or run all emulators
firebase emulators:start
```

### Deployment

```bash
# Build TypeScript
npm run build

# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:approveUserAfterVerification
```

### Testing

```bash
# Run tests (if implemented)
npm test

# Check logs
firebase functions:log

# Check specific function logs
firebase functions:log --only approveUserAfterVerification
```

## Security

### Authentication Required

All callable functions require the user to be authenticated:

```typescript
if (!context.auth) {
  throw new functions.https.HttpsError(
    'unauthenticated',
    'User must be authenticated'
  );
}
```

### Admin Check

Admin-only functions verify custom claims:

```typescript
if (context.auth.token.role !== 'admin') {
  throw new functions.https.HttpsError('permission-denied', 'Admin required');
}
```

### Email Verification Check

Approval function verifies email before proceeding:

```typescript
if (!userRecord.emailVerified) {
  throw new functions.https.HttpsError(
    'failed-precondition',
    'Email not verified'
  );
}
```

## Error Handling

All functions use Firebase Functions error codes:

- `unauthenticated` - User not signed in
- `permission-denied` - Insufficient permissions
- `not-found` - Resource not found
- `invalid-argument` - Invalid parameters
- `failed-precondition` - Precondition not met
- `internal` - Internal server error

Example:

```typescript
try {
  // Function logic
} catch (error) {
  throw new functions.https.HttpsError(
    'internal',
    'Failed to process request',
    error
  );
}
```

## Logging

Functions log to Cloud Functions logs:

```typescript
console.log('Info message');
console.warn('Warning message');
console.error('Error message');
```

View logs:

```bash
# Real-time logs
firebase functions:log

# Filter by function
firebase functions:log --only approveUserAfterVerification

# Filter by time
firebase functions:log --since 1h
```

## Performance

### Cold Starts

- First invocation may take 1-3 seconds
- Subsequent calls are much faster (100-300ms)
- Keep functions warm by regular calls (if needed)

### Optimization Tips

1. Minimize dependencies
2. Reuse Firebase Admin instances
3. Use connection pooling
4. Cache frequently accessed data
5. Use batch operations when possible

## Monitoring

### Firebase Console

- Monitor function execution count
- Track error rates
- View invocation times
- Set up alerts

### Recommended Alerts

1. Error rate > 5%
2. Execution time > 10s
3. Daily invocations > 10,000 (adjust based on plan)

## Cost

### Blaze Plan Pricing

- **Invocations**: Free up to 2M/month, then $0.40 per million
- **Compute Time**: Free up to 400,000 GB-seconds/month
- **Networking**: $0.12 per GB egress

### Typical Costs (per 1000 users/month)

- Registrations: ~2,000 invocations
- Verification checks: ~10,000 invocations
- Cleanup: ~30 invocations
- **Estimated**: <$1/month for small deployments

## Troubleshooting

### Function Not Executing

1. Check function is deployed: `firebase functions:list`
2. Verify user is authenticated
3. Check function logs for errors
4. Ensure Blaze plan is active

### Permission Denied

1. Verify custom claims are set
2. Check Firestore security rules
3. Ensure email is verified
4. Verify user status is "active"

### Slow Performance

1. Check cold start times
2. Review function memory allocation
3. Optimize database queries
4. Use indexes for Firestore queries

### Email Not Verified

1. Check Firebase Auth user record
2. Verify email was sent (check quotas)
3. Check user's spam folder
4. Verify email template is active

## Development Workflow

1. **Write Function**: Add to `src/index.ts`
2. **Test Locally**: Use emulators
3. **Build**: `npm run build`
4. **Deploy**: `firebase deploy --only functions`
5. **Monitor**: Check logs and metrics
6. **Iterate**: Based on production data

## Best Practices

1. **Error Handling**: Always use try/catch
2. **Logging**: Log important events
3. **Validation**: Validate all inputs
4. **Authentication**: Always check `context.auth`
5. **Idempotency**: Make functions idempotent when possible
6. **Timeouts**: Set appropriate timeout limits
7. **Retries**: Use exponential backoff for retries

## Additional Resources

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Best Practices](https://firebase.google.com/docs/functions/tips)
- [Pricing Calculator](https://firebase.google.com/pricing)
- [Security Rules](https://firebase.google.com/docs/rules)

## Support

For issues:

1. Check function logs
2. Review Firebase Console
3. Test with emulators
4. Contact Firebase support

---

**Last Updated**: November 2024
**Functions Version**: 1.0
**Node Version**: 18
