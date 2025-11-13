import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Pro Config: JSON from env (secure, no file leaks)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

// Lazy Init: Singleton pattern
let adminApp;
try {
  adminApp = getApps().length ? getApp() : initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
} catch (error) {
  console.error('Firebase Admin Init Error:', error.code || error.message);
  throw new Error('Firebase Admin failed to initialize');
}

// Core Exports
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

// Pro Utils: Verify Token (Server-Side)
export const verifyIdToken = async (idToken) => {
  try {
    return await adminAuth.verifyIdToken(idToken, true); // Check revoked
  } catch (error) {
    console.error('Token Verification Error:', error.code);
    throw new Error('Invalid or expired token');
  }
};

// Export App for Advanced Use
export default adminApp;