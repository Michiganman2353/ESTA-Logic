import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { getAuth, getFirestore } from '../services/firebase.js';

export const authRouter = Router();

/**
 * Get current user information
 * Requires valid Firebase ID token
 */
authRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { uid } = req.user!;
    
    // Get user document from Firestore
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User document not found',
      });
    }
    
    const userData = userDoc.data();
    
    res.json({
      success: true,
      user: {
        id: uid,
        email: userData?.email,
        name: userData?.name,
        role: userData?.role,
        status: userData?.status,
        employerId: userData?.employerId || userData?.tenantId,
        employerSize: userData?.employerSize,
        createdAt: userData?.createdAt?.toDate?.()?.toISOString() || userData?.createdAt,
        updatedAt: userData?.updatedAt?.toDate?.()?.toISOString() || userData?.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user information',
    });
  }
});

/**
 * Login endpoint
 * Note: Actual authentication is handled by Firebase Auth on the client
 * This endpoint validates the token and returns user data
 */
authRouter.post('/login', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { uid, email } = req.user!;
    
    // Get user document from Firestore
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User document not found',
      });
    }
    
    const userData = userDoc.data();
    
    // Allow pending users to log in
if (userData?.status === 'rejected') {
  return res.status(403).json({
    success: false,
    error: 'Your account has been rejected. Please contact support.',
  });
}

// Do NOT block pending users here
// Pending users can log in but may have restricted features
    
    res.json({
      success: true,
      user: {
        id: uid,
        email: email || userData?.email,
        name: userData?.name,
        role: userData?.role,
        status: userData?.status,
        employerId: userData?.employerId || userData?.tenantId,
        employerSize: userData?.employerSize,
        createdAt: userData?.createdAt?.toDate?.()?.toISOString() || userData?.createdAt,
        updatedAt: userData?.updatedAt?.toDate?.()?.toISOString() || userData?.updatedAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

/**
 * Register endpoint
 * Note: User registration should be handled on the client with Firebase Auth
 * This endpoint can be used for additional server-side validation or setup
 */
authRouter.post('/register', async (req, res) => {
  res.status(400).json({
    success: false,
    error: 'Please use Firebase Authentication for registration',
    message: 'Registration should be performed through Firebase Auth client SDK',
  });
});

/**
 * Employee registration endpoint
 * Legacy endpoint - registration should use Firebase Auth
 */
authRouter.post('/register/employee', async (req, res) => {
  res.status(400).json({
    success: false,
    error: 'Please use Firebase Authentication for registration',
    message: 'Registration should be performed through Firebase Auth client SDK',
  });
});

/**
 * Manager registration endpoint
 * Legacy endpoint - registration should use Firebase Auth
 */
authRouter.post('/register/manager', async (req, res) => {
  res.status(400).json({
    success: false,
    error: 'Please use Firebase Authentication for registration',
    message: 'Registration should be performed through Firebase Auth client SDK',
  });
});

/**
 * Logout endpoint
 * Note: Actual logout is handled on the client
 * This is a placeholder for any server-side cleanup
 */
authRouter.post('/logout', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    // Server-side logout logic (if any)
    // For example: invalidate refresh tokens, clear sessions, etc.
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
});

/**
 * Admin endpoint to manually set user custom claims
 * Requires admin role
 */
authRouter.post('/admin/set-claims', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { role: adminRole } = req.user!;
    
    // Check if user is admin
    if (adminRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can set custom claims',
      });
    }
    
    const { uid, claims } = req.body;
    
    if (!uid || !claims) {
      return res.status(400).json({
        success: false,
        error: 'Missing uid or claims in request body',
      });
    }
    
    // Set custom claims
    const auth = getAuth();
    await auth.setCustomUserClaims(uid, claims);
    
    // Update Firestore document
    const db = getFirestore();
    await db.collection('users').doc(uid).update({
      status: 'approved',
      updatedAt: new Date(),
    });
    
    // Create audit log
    await db.collection('auditLogs').add({
      userId: uid,
      action: 'claims_updated_by_admin',
      details: {
        claims,
        performedBy: req.user!.uid,
      },
      timestamp: new Date(),
    });
    
    res.json({
      success: true,
      message: 'Custom claims set successfully',
    });
  } catch (error) {
    console.error('Error setting claims:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set custom claims',
    });
  }
});
