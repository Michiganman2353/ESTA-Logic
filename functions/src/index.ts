/**
 * Firebase Cloud Functions for ESTA Tracker
 * 
 * This file contains serverless functions that handle:
 * - Email verification status updates
 * - Custom claims assignment
 * - User approval workflows
 * - Audit logging
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

/**
 * Cloud Function triggered when a user's email is verified
 * This function automatically approves the user and sets custom claims
 */
export const onEmailVerified = functions.auth.user().onCreate(async (user) => {
  // This function is triggered on user creation
  // We'll use a Firestore trigger instead to detect verification
  functions.logger.info('New user created:', user.uid, user.email);
});

/**
 * Firestore trigger to detect when a user document is updated with email verification
 * Automatically assigns custom claims based on user role
 */
export const onUserVerified = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const userId = context.params.userId;

    // Check if email was just verified
    if (!before.emailVerified && after.emailVerified) {
      functions.logger.info('User email verified:', userId, after.email);

      try {
        // Set custom claims based on role
        const claims: { [key: string]: any } = {
          role: after.role,
          tenantId: after.tenantId,
        };

        await admin.auth().setCustomUserClaims(userId, claims);
        
        functions.logger.info('Custom claims set for user:', userId, claims);

        // Log the verification event
        await db.collection('authEvents').add({
          userId,
          email: after.email,
          action: 'custom_claims_assigned',
          role: after.role,
          tenantId: after.tenantId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Send notification to tenant owner if this is an employee
        if (after.role === 'employee' && after.tenantId) {
          const tenantDoc = await db.collection('tenants').doc(after.tenantId).get();
          
          if (tenantDoc.exists) {
            const tenantData = tenantDoc.data();
            const ownerDoc = await db.collection('users').doc(tenantData!.ownerId).get();
            
            if (ownerDoc.exists) {
              // In a production system, this would send an email notification
              // For now, we just log it
              functions.logger.info('New employee registered:', {
                employeeName: after.name,
                employeeEmail: after.email,
                tenantName: tenantData!.name,
                ownerEmail: ownerDoc.data()!.email,
              });
              
              // You could integrate with SendGrid, AWS SES, or Firebase Extensions here
            }
          }
        }

        return { success: true };
      } catch (error) {
        functions.logger.error('Error setting custom claims:', error);
        throw error;
      }
    }

    return null;
  });

/**
 * HTTP function to manually approve a user (for admin dashboard)
 */
export const approveUser = functions.https.onCall(async (data, context) => {
  // Check if request is from an authenticated admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to approve users'
    );
  }

  // Check if user has admin role
  const adminClaims = context.auth.token;
  if (adminClaims.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Must be an admin to approve users'
    );
  }

  const { userId } = data;

  if (!userId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'userId is required'
    );
  }

  try {
    // Update user status
    await db.collection('users').doc(userId).update({
      status: 'active',
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedBy: context.auth.uid,
    });

    // Get user data to set claims
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (userData) {
      // Set custom claims
      await admin.auth().setCustomUserClaims(userId, {
        role: userData.role,
        tenantId: userData.tenantId,
      });
    }

    // Log the approval
    await db.collection('authEvents').add({
      userId,
      email: userData?.email,
      action: 'manually_approved',
      approvedBy: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info('User manually approved:', userId);

    return { success: true, message: 'User approved successfully' };
  } catch (error) {
    functions.logger.error('Error approving user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to approve user');
  }
});

/**
 * HTTP function to reject a user registration (for admin dashboard)
 */
export const rejectUser = functions.https.onCall(async (data, context) => {
  // Check if request is from an authenticated admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to reject users'
    );
  }

  // Check if user has admin role
  const adminClaims = context.auth.token;
  if (adminClaims.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Must be an admin to reject users'
    );
  }

  const { userId, reason } = data;

  if (!userId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'userId is required'
    );
  }

  try {
    // Update user status
    await db.collection('users').doc(userId).update({
      status: 'rejected',
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectedBy: context.auth.uid,
      rejectionReason: reason || 'No reason provided',
    });

    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Log the rejection
    await db.collection('authEvents').add({
      userId,
      email: userData?.email,
      action: 'rejected',
      rejectedBy: context.auth.uid,
      reason,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Disable the Firebase Auth account
    await admin.auth().updateUser(userId, {
      disabled: true,
    });

    functions.logger.info('User rejected:', userId, reason);

    return { success: true, message: 'User rejected successfully' };
  } catch (error) {
    functions.logger.error('Error rejecting user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to reject user');
  }
});

/**
 * Scheduled function to clean up unverified accounts older than 7 days
 */
export const cleanupUnverifiedAccounts = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      // Query unverified users older than 7 days
      const snapshot = await db
        .collection('users')
        .where('emailVerified', '==', false)
        .where('createdAt', '<', sevenDaysAgo)
        .get();

      const deletionPromises: Promise<any>[] = [];

      snapshot.forEach((doc) => {
        const userData = doc.data();
        functions.logger.info('Deleting unverified user:', doc.id, userData.email);

        // Delete Firebase Auth account
        deletionPromises.push(
          admin.auth().deleteUser(doc.id).catch((error) => {
            functions.logger.error('Error deleting auth user:', doc.id, error);
          })
        );

        // Delete Firestore document
        deletionPromises.push(doc.ref.delete());

        // Log deletion
        deletionPromises.push(
          db.collection('authEvents').add({
            userId: doc.id,
            email: userData.email,
            action: 'unverified_account_deleted',
            reason: 'Email not verified within 7 days',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          })
        );
      });

      await Promise.all(deletionPromises);

      functions.logger.info(`Cleaned up ${snapshot.size} unverified accounts`);

      return { success: true, deletedCount: snapshot.size };
    } catch (error) {
      functions.logger.error('Error cleaning up unverified accounts:', error);
      throw error;
    }
  });

/**
 * HTTP function to validate tenant code (can be called before registration)
 */
export const validateTenantCode = functions.https.onCall(async (data) => {
  const { tenantCode } = data;

  if (!tenantCode) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'tenantCode is required'
    );
  }

  try {
    const snapshot = await db
      .collection('tenants')
      .where('tenantCode', '==', tenantCode.toUpperCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { valid: false, message: 'Invalid tenant code' };
    }

    const tenantData = snapshot.docs[0].data();

    return {
      valid: true,
      tenantName: tenantData.name,
      employerSize: tenantData.employerSize,
    };
  } catch (error) {
    functions.logger.error('Error validating tenant code:', error);
    throw new functions.https.HttpsError('internal', 'Failed to validate tenant code');
  }
});
