import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const auth = admin.auth();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get the current user's auth record
    const userRecord = await auth.getUser(uid);

    if (!userRecord.emailVerified) {
      return res.status(400).json({ 
        error: 'Email is not verified yet. Please verify your email first.',
        emailVerified: false,
      });
    }

    // Get user document from Firestore
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User document not found in Firestore.' });
    }

    const userData = userDoc.data();

    // Update user status to active
    await userDocRef.update({
      status: 'active',
      emailVerified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Set custom claims based on role
    const claims: { [key: string]: any } = {
      role: userData?.role || 'employee',
      tenantId: userData?.tenantId || userData?.employerId,
      emailVerified: true,
    };

    await auth.setCustomUserClaims(uid, claims);

    // Create audit log
    await db.collection('auditLogs').add({
      userId: uid,
      employerId: userData?.employerId || userData?.tenantId,
      action: 'email_verified',
      details: {
        email: userRecord.email,
        role: userData?.role,
        approvedAt: new Date().toISOString(),
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`User ${uid} verified and activated`);

    return res.status(200).json({
      success: true,
      message: 'Account activated successfully',
      user: {
        id: uid,
        email: userRecord.email,
        role: userData?.role,
        status: 'active',
      },
    });
  } catch (error: any) {
    console.error('Email verification error:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }

    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    return res.status(500).json({ 
      error: 'Failed to verify user account',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
