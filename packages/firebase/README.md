# @esta-tracker/firebase

Centralized Firebase Admin SDK package for ESTA Tracker.

## Purpose

This package provides a single, consistent way to initialize and use Firebase Admin SDK across all server-side code:
- Backend Express server
- Vercel API/serverless functions
- Firebase Cloud Functions

## Features

- **Single initialization**: Prevents duplicate Firebase Admin app instances
- **Automatic credential handling**: Supports both service account JSON and Application Default Credentials (ADC)
- **Typed exports**: Full TypeScript support with Firebase Admin types
- **Utility functions**: Common operations pre-configured
- **Modular structure**: Import only what you need

## Installation

This is a workspace package - it's automatically available to other packages in the monorepo.

```json
{
  "dependencies": {
    "@esta-tracker/firebase": "workspace:*"
  }
}
```

## Usage

### Basic Initialization

```typescript
import { initializeFirebaseAdmin, getFirestore } from '@esta-tracker/firebase';

// Initialize once at app startup
initializeFirebaseAdmin();

// Use Firestore
const db = getFirestore();
const users = await db.collection('users').get();
```

### With Custom Configuration

```typescript
import { initializeFirebaseAdmin } from '@esta-tracker/firebase';

initializeFirebaseAdmin({
  projectId: 'my-project',
  storageBucket: 'my-bucket.appspot.com',
  serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT
});
```

### Firestore Operations

```typescript
import { 
  getFirestore, 
  getDocRef, 
  getCollectionRef,
  serverTimestamp,
  increment
} from '@esta-tracker/firebase';

const db = getFirestore();

// Get document reference
const userRef = getDocRef('users/user123');

// Get collection reference
const usersRef = getCollectionRef('users');

// Use server timestamp
await userRef.update({
  updatedAt: serverTimestamp()
});

// Increment a counter
await userRef.update({
  loginCount: increment(1)
});
```

### Authentication Operations

```typescript
import { 
  getAuth, 
  verifyIdToken, 
  setCustomClaims,
  getUserById
} from '@esta-tracker/firebase';

// Verify ID token from client
const decodedToken = await verifyIdToken(idToken);
console.log('User ID:', decodedToken.uid);

// Set custom claims for RBAC
await setCustomClaims('user123', {
  role: 'employer',
  tenantId: 'tenant456'
});

// Get user details
const user = await getUserById('user123');
console.log('Email:', user.email);
```

### Storage Operations

```typescript
import { 
  getStorage, 
  getFile,
  getSignedDownloadUrl,
  getSignedUploadUrl
} from '@esta-tracker/firebase';

// Get signed URL for download (60 minutes)
const downloadUrl = await getSignedDownloadUrl(
  'documents/doc123.pdf',
  60
);

// Get signed URL for upload (15 minutes)
const uploadUrl = await getSignedUploadUrl(
  'uploads/file.pdf',
  'application/pdf',
  15
);
```

## API Reference

### Admin Module

- `initializeFirebaseAdmin(config?)` - Initialize Firebase Admin
- `getFirebaseApp()` - Get Firebase Admin app instance
- `resetFirebaseAdmin()` - Reset instance (testing only)

### Firestore Module

- `getFirestore()` - Get Firestore instance
- `getDocRef(path)` - Get document reference
- `getCollectionRef(path)` - Get collection reference
- `serverTimestamp()` - Create server timestamp
- `arrayUnion(...elements)` - Array union operation
- `arrayRemove(...elements)` - Array remove operation
- `increment(n)` - Increment operation

### Auth Module

- `getAuth()` - Get Auth instance
- `verifyIdToken(token)` - Verify ID token
- `getUserById(uid)` - Get user by UID
- `getUserByEmail(email)` - Get user by email
- `setCustomClaims(uid, claims)` - Set custom claims
- `createUser(properties)` - Create new user
- `updateUser(uid, properties)` - Update user
- `deleteUser(uid)` - Delete user

### Storage Module

- `getStorage()` - Get Storage instance
- `getBucket()` - Get default bucket
- `getFile(path)` - Get file reference
- `getSignedDownloadUrl(path, minutes)` - Generate download URL
- `getSignedUploadUrl(path, contentType, minutes)` - Generate upload URL
- `deleteFile(path)` - Delete file
- `fileExists(path)` - Check if file exists

## Environment Variables

The package respects these environment variables:

- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_STORAGE_BUCKET` - Storage bucket name
- `FIREBASE_SERVICE_ACCOUNT` - Service account JSON string
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON file

## Migration Guide

### From Backend Package

**Before:**
```typescript
import { initializeFirebase, getFirestore } from '../services/firebase';
```

**After:**
```typescript
import { initializeFirebaseAdmin, getFirestore } from '@esta-tracker/firebase';
```

### From API Functions

**Before:**
```typescript
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
```

**After:**
```typescript
import { initializeFirebaseAdmin, getFirestore } from '@esta-tracker/firebase';

initializeFirebaseAdmin();
const db = getFirestore();
```

### From Cloud Functions

**Before:**
```typescript
import * as admin from 'firebase-admin';
admin.initializeApp();
```

**After:**
```typescript
import { initializeFirebaseAdmin } from '@esta-tracker/firebase';
initializeFirebaseAdmin();
```

## Testing

```bash
npm run build
npm run test
npm run typecheck
```

## License

Private - Part of ESTA Tracker monorepo
