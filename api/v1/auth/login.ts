import { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirebaseAuth, getFirebaseDb } from '../../lib/firebase';
import { setCorsHeaders, handlePreflight } from '../../lib/cors';

/**
 * Login API Endpoint
 * POST /api/v1/auth/login
 * 
 * Production: Uses Firebase ID token from client-side authentication
 * Development: Supports email/password for testing (should be disabled in production)
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  const origin = req.headers.origin || '';
  setCorsHeaders(res, origin);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return handlePreflight(res, origin);
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, idToken } = req.body;

    // Validation
    if (!idToken && (!email || !password)) {
      return res.status(400).json({
        message: 'Email and password or ID token are required',
      });
    }

    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    let uid: string;

    if (idToken) {
      // Production path: Verify Firebase ID token from client-side auth
      const decodedToken = await auth.verifyIdToken(idToken);
      uid = decodedToken.uid;
    } else {
      // Development path: Lookup user by email
      // WARNING: This bypasses Firebase Auth's security and should NOT be used in production
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
        return res.status(400).json({
          message: 'Email/password login is not supported in production. Please use the Firebase Auth client SDK.',
        });
      }
      
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
    }

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const userData = userDoc.data();

    // Generate custom token
    const customToken = await auth.createCustomToken(uid);

    return res.status(200).json({
      success: true,
      token: customToken,
      user: userData,
    });
  } catch (error: any) {
    console.error('Login error:', error);

    // Handle Firebase Auth errors
    if (error.code === 'auth/user-not-found') {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    if (error.code === 'auth/invalid-credential') {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        message: 'Session expired. Please login again.',
      });
    }

    return res.status(500).json({
      message: 'Login failed. Please try again later.',
      error: error.message,
    });
  }
}
