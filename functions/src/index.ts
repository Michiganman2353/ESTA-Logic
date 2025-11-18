import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

/**
 * Cloud Function triggered when a user's email is verified
 * Automatically approves the user and sets custom claims
 */
export const onEmailVerified = functions.auth.user().onCreate(async (user) => {
  const { uid, email, emailVerified } = user;

  console.log(`New user created: ${uid}, email: ${email}, verified: ${emailVerified}`);

  // Note: onCreate fires when user is created, not when email is verified
  // We'll use a separate scheduled function or client-side trigger for verification
  return null;
});

/**
 * HTTP Function to check and approve user after email verification
 * Called by the client after email verification is detected
 */
export const approveUserAfterVerification = functions.https.onCall(
  async (data, context) => {
    // Verify the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to call this function.'
      );
    }

    const uid = context.auth.uid;

    try {
      // Get the current user's auth record
      const userRecord = await auth.getUser(uid);

      if (!userRecord.emailVerified) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Email is not verified yet. Please verify your email first.'
        );
      }

      // Get user document from Firestore
      const userDocRef = db.collection('users').doc(uid);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'User document not found in Firestore.'
        );
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

      console.log(`User ${uid} approved and custom claims set`);

      return {
        success: true,
        message: 'Account activated successfully',
        user: {
          id: uid,
          email: userRecord.email,
          role: userData?.role,
          status: 'active',
        },
      };
    } catch (error) {
      console.error('Error approving user:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to approve user account',
        error
      );
    }
  }
);

/**
 * HTTP Function to set custom claims for a user (admin only)
 * Can be used by administrators to manually approve users
 */
export const setUserClaims = functions.https.onCall(async (data, context) => {
  // Verify the caller is an admin
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can set custom claims.'
    );
  }

  const { uid, claims } = data;

  if (!uid || !claims) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing uid or claims in request.'
    );
  }

  try {
    await auth.setCustomUserClaims(uid, claims);

    // Update Firestore document
    await db.collection('users').doc(uid).update({
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create audit log
    await db.collection('auditLogs').add({
      userId: uid,
      action: 'claims_updated',
      details: {
        claims,
        performedBy: context.auth.uid,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: 'Custom claims set successfully' };
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to set custom claims',
      error
    );
  }
});

/**
 * Scheduled function to clean up unverified accounts after 7 days
 * Runs daily at midnight
 */
export const cleanupUnverifiedAccounts = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('America/Detroit')
  .onRun(async (context) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      // Find unverified users older than 7 days
      const unverifiedUsersQuery = db
        .collection('users')
        .where('emailVerified', '==', false)
        .where('createdAt', '<', sevenDaysAgo);

      const unverifiedUsers = await unverifiedUsersQuery.get();

      const deletePromises: Promise<any>[] = [];

      unverifiedUsers.forEach((doc) => {
        const userData = doc.data();
        console.log(`Deleting unverified user: ${doc.id} (${userData.email})`);

        // Delete auth user
        deletePromises.push(auth.deleteUser(doc.id));

        // Delete Firestore document
        deletePromises.push(doc.ref.delete());
      });

      await Promise.all(deletePromises);

      console.log(`Cleaned up ${unverifiedUsers.size} unverified accounts`);
      return null;
    } catch (error) {
      console.error('Error cleaning up unverified accounts:', error);
      return null;
    }
  });

/**
 * HTTP Function to get tenant information by tenant code
 */
export const getTenantByCode = functions.https.onCall(async (data, context) => {
  const { tenantCode } = data;

  if (!tenantCode) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Tenant code is required.'
    );
  }

  try {
    const tenantsQuery = db
      .collection('tenants')
      .where('tenantCode', '==', tenantCode.toUpperCase())
      .limit(1);

    const tenantSnapshot = await tenantsQuery.get();

    if (tenantSnapshot.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'No company found with this tenant code.'
      );
    }

    const tenantDoc = tenantSnapshot.docs[0];
    const tenantData = tenantDoc.data();

    return {
      success: true,
      tenant: {
        id: tenantDoc.id,
        companyName: tenantData.companyName,
        size: tenantData.size,
        tenantCode: tenantData.tenantCode,
      },
    };
  } catch (error) {
    console.error('Error fetching tenant:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to fetch tenant information',
      error
    );
  }
});
