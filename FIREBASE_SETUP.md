# Firebase Setup Guide for ESTA Tracker

This guide explains how to set up Firebase Authentication and Firestore for the ESTA Tracker application.

## Prerequisites

- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Google account

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `esta-tracker` (or your preferred name)
4. Disable Google Analytics (optional for this project)
5. Click "Create Project"

## Step 2: Enable Firebase Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get Started"
3. Click on the **Sign-in method** tab
4. Enable **Email/Password** provider
5. Click "Save"

### Configure Email Verification

1. In Authentication settings, click on **Templates**
2. Click on **Email address verification**
3. Customize the email template (optional)
4. Make sure the email sender name is set appropriately

## Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose **Production mode** (we'll deploy security rules)
4. Select a location (choose closest to your users, e.g., `us-central`)
5. Click "Enable"

## Step 4: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web icon** (`</>`) to add a web app
4. Register app name: `ESTA Tracker Web`
5. **Don't check** "Also set up Firebase Hosting"
6. Copy the configuration object

You'll see something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "esta-tracker.firebaseapp.com",
  projectId: "esta-tracker",
  storageBucket: "esta-tracker.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 5: Configure Environment Variables

### For Local Development

Create a `.env.local` file in the root directory:

```env
# Firebase Web App Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### For Vercel Deployment

1. Go to your Vercel project
2. Click on **Settings** → **Environment Variables**
3. Add each variable from above
4. Make sure to select "Production", "Preview", and "Development" environments
5. Click "Save"

## Step 6: Deploy Firestore Rules and Indexes

```bash
# Login to Firebase CLI
firebase login

# Initialize Firebase in the project (if not already done)
firebase init

# Select:
# - Firestore (rules and indexes)
# - Functions
# - Hosting

# Deploy security rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

## Step 7: Deploy Firebase Functions

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Deploy functions
cd ..
firebase deploy --only functions
```

## Step 8: Test the Setup

### Test Email Verification

1. Start the development server:
   ```bash
   npm run dev:frontend
   ```

2. Navigate to http://localhost:5173/register/manager

3. Fill out the registration form

4. Check your email for the verification link

5. Click the verification link

6. Return to the app - you should be automatically approved

### Test Employee Registration

1. Use the tenant code from the manager registration

2. Navigate to http://localhost:5173/register/employee

3. Fill out the form with the tenant code

4. Verify email and check that you're linked to the correct company

## Firestore Collections Structure

The database will automatically create these collections:

- **users** - User account data
- **tenants** - Company/organization data
- **registrationLogs** - Audit trail for registrations
- **authEvents** - Authentication events log
- **sickTimeRequests** - Employee sick time requests
- **workLogs** - Employee work hour logs
- **accrualBalances** - Calculated sick time balances
- **auditLogs** - General audit trail
- **retaliationReports** - Employee retaliation reports

## Firebase Functions

The following Cloud Functions are deployed:

- **onUserVerified** - Automatically sets custom claims when email is verified
- **approveUser** - Manual approval function for admins
- **rejectUser** - Manual rejection function for admins
- **cleanupUnverifiedAccounts** - Scheduled cleanup of unverified accounts (7 days)
- **validateTenantCode** - Validates tenant codes before registration

## Security Rules

Security rules enforce:
- **Tenant isolation** - Users can only access data from their tenant
- **Role-based access** - Managers have broader access than employees
- **Email verification** - Users must verify email before accessing protected data
- **Audit trail protection** - Logs cannot be modified or deleted

## Monitoring and Debugging

### View Authentication Users

1. Go to Firebase Console → Authentication
2. See all registered users
3. Check email verification status
4. Manually disable/enable users if needed

### View Firestore Data

1. Go to Firebase Console → Firestore Database
2. Browse collections and documents
3. Check that data is being created correctly

### View Function Logs

```bash
# View all function logs
firebase functions:log

# View logs for specific function
firebase functions:log --only onUserVerified
```

### Test Functions Locally

```bash
# Start Firebase Emulators
firebase emulators:start

# Access:
# - Auth UI: http://localhost:4000/auth
# - Firestore UI: http://localhost:4000/firestore
# - Functions: http://localhost:5001
```

## Common Issues and Solutions

### Issue: Email verification link redirects to localhost

**Solution**: Configure authorized domains in Firebase Console:
1. Go to Authentication → Settings → Authorized domains
2. Add your Vercel deployment domain
3. Redeploy functions

### Issue: "Permission denied" errors in Firestore

**Solution**: Check that:
1. User has verified their email
2. Custom claims are set (check Auth token)
3. User belongs to the correct tenant

### Issue: Functions not triggering

**Solution**: Check that:
1. Functions are deployed: `firebase deploy --only functions`
2. Billing is enabled on Firebase project (required for Cloud Functions)
3. Check function logs for errors

## Production Deployment Checklist

- [ ] Firebase project created
- [ ] Email/Password authentication enabled
- [ ] Firestore database created
- [ ] Security rules deployed
- [ ] Firestore indexes deployed
- [ ] Cloud Functions deployed
- [ ] Environment variables set in Vercel
- [ ] Email templates customized
- [ ] Authorized domains configured
- [ ] Billing enabled (required for Cloud Functions)
- [ ] Monitoring set up

## Next Steps

1. **Customize email templates** in Firebase Console
2. **Set up monitoring** with Firebase Performance Monitoring
3. **Add Firebase Analytics** to track user behavior
4. **Configure Firebase Extensions** for additional features:
   - Trigger Email (SendGrid)
   - Export Collections to BigQuery (for analytics)
5. **Set up alerts** in Firebase Console for errors and quota limits

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Functions](https://firebase.google.com/docs/functions)
