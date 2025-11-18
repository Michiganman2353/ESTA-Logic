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

interface ApproveUserRequest {
  userId: string;
  approve: boolean;
  denialReason?: string;
}

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
    const adminUid = decodedToken.uid;

    // Check if the caller is an admin
    if (decodedToken.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied. Only administrators can approve users.' });
    }

    const { userId, approve, denialReason } = req.body as ApproveUserRequest;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user document
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    if (approve) {
      // Approve the user
      await userDocRef.update({
        status: 'active',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        approvedBy: adminUid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // If this is an employer, also approve their tenant
      if (userData?.role === 'employer' && userData?.tenantId) {
        await db.collection('tenants').doc(userData.tenantId).update({
          status: 'active',
          approvedAt: admin.firestore.FieldValue.serverTimestamp(),
          approvedBy: adminUid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Set custom claims
      const claims: { [key: string]: any } = {
        role: userData?.role || 'employee',
        tenantId: userData?.tenantId || userData?.employerId,
        emailVerified: userData?.emailVerified || false,
      };

      await auth.setCustomUserClaims(userId, claims);

      // Create audit log
      await db.collection('auditLogs').add({
        userId,
        employerId: userData?.tenantId || userData?.employerId,
        action: 'user_approved',
        details: {
          email: userData?.email,
          role: userData?.role,
          approvedBy: adminUid,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // TODO: Send approval email to user
      console.log(`User ${userId} approved by admin ${adminUid}`);

      return res.status(200).json({
        success: true,
        message: 'User approved successfully',
        user: {
          id: userId,
          status: 'active',
        },
      });
    } else {
      // Deny the user
      await userDocRef.update({
        status: 'denied',
        deniedAt: admin.firestore.FieldValue.serverTimestamp(),
        deniedBy: adminUid,
        denialReason: denialReason || 'No reason provided',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // If this is an employer, also deny their tenant
      if (userData?.role === 'employer' && userData?.tenantId) {
        await db.collection('tenants').doc(userData.tenantId).update({
          status: 'denied',
          deniedAt: admin.firestore.FieldValue.serverTimestamp(),
          deniedBy: adminUid,
          denialReason: denialReason || 'No reason provided',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Create audit log
      await db.collection('auditLogs').add({
        userId,
        employerId: userData?.tenantId || userData?.employerId,
        action: 'user_denied',
        details: {
          email: userData?.email,
          role: userData?.role,
          deniedBy: adminUid,
          denialReason: denialReason || 'No reason provided',
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // TODO: Send denial email to user
      console.log(`User ${userId} denied by admin ${adminUid}`);

      return res.status(200).json({
        success: true,
        message: 'User registration denied',
        user: {
          id: userId,
          status: 'denied',
        },
      });
    }
  } catch (error: any) {
    console.error('User approval error:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }

    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    return res.status(500).json({ 
      error: 'Failed to process user approval',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
