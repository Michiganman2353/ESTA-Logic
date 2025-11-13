// src/lib/firebaseAdmin.js
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

// Rate limiting (in-memory for Vercel – Redis for prod)
const rateLimits = new Map();

// Pro Config: JSON from env (secure, no file leaks)
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  if (!serviceAccount.project_id) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT in env vars');
  }
} catch (error) {
  console.error('Firebase Admin Config Error:', error.message);
  throw new Error('Firebase Admin config invalid – check env vars');
}

// Lazy Init: Singleton with retry
let adminApp;
const initAdmin = (retries = 3) => {
  try {
    if (getApps().length) return getApp();
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    console.log('Firebase Admin initialized successfully');
    return adminApp;
  } catch (error) {
    if (retries > 0) {
      console.warn('Firebase Admin init retrying...', retries);
      return setTimeout(() => initAdmin(retries - 1), 1000);
    }
    console.error('Firebase Admin Init Error:', error.message);
    throw new Error('Firebase Admin failed to initialize after retries');
  }
};

adminApp = initAdmin();

// Core Exports
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

// Pro Utils: Verify Token (Server-Side with rate limit)
export const verifyIdToken = async (idToken, checkRevoked = true) => {
  const ip = getClientIP(); // Implement getClientIP for Vercel
  const key = `token:${ip}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 min
  const maxRequests = 100;

  // Rate limit
  const userRequests = rateLimits.get(key) || { count: 0, resetTime: now };
  if (now > userRequests.resetTime) {
    userRequests.count = 1;
    userRequests.resetTime = now + windowMs;
  } else {
    userRequests.count++;
  }
  rateLimits.set(key, userRequests);

  if (userRequests.count > maxRequests) {
    throw new Error('Too many verification requests. Retry in 1 minute.');
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken, checkRevoked);
    // Log for analytics
    console.log('Token verified for UID:', decoded.uid);
    return decoded;
  } catch (error) {
    // Structured logging
    console.error('Token Verification Error:', {
      code: error.code,
      message: error.message,
      ip,
      timestamp: new Date().toISOString(),
    });
    throw new Error('Invalid or expired token');
  }
};

// Pro Utils: User Management (Heavy Traffic Ready)
export const createUser = async (uid, data) => {
  const userRef = doc(adminDb, 'users', uid);
  await setDoc(userRef, {
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return userRef;
};

export const updateUser = async (uid, data) => {
  const userRef = doc(adminDb, 'users', uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return userRef;
};

export const deleteUser = async (uid) => {
  const userRef = doc(adminDb, 'users', uid);
  await deleteDoc(userRef);
  // Clean up related data (messages, etc.)
  // await deleteCollection('messages', (ref) => ref.where('userId', '==', uid));
  return uid;
};

export const getUser = async (uid) => {
  const userRef = doc(adminDb, 'users', uid);
  const snapshot = await getDoc(userRef);
  return snapshot.exists() ? snapshot.data() : null;
};

// Export App for Advanced Use
export default adminApp;