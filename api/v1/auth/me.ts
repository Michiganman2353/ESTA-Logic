import { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirebaseAuth, getFirebaseDb } from '../../lib/firebase';
import { setCorsHeaders, handlePreflight } from '../../lib/cors';

/**
 * Get Current User API Endpoint
 * GET /api/v1/auth/me
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

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token || token === 'null') {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    // Verify the Firebase ID token
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user data from Firestore
    const db = getFirebaseDb();
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const userData = userDoc.data();

    return res.status(200).json({
      user: userData,
    });
  } catch (error: any) {
    console.error('Get user error:', error);

    // Handle Firebase Auth errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        message: 'Session expired. Please login again.',
      });
    }

    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        message: 'Invalid token',
      });
    }

    return res.status(500).json({
      message: 'Failed to get user information.',
      error: error.message,
    });
  }
}
