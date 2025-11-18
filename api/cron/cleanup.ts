/**
 * Daily Cleanup Unverified Accounts Cron Job
 * Runs daily to remove accounts that haven't verified their email after 7 days
 * 
 * Schedule: Daily at 1:00 AM EST (America/Detroit timezone)
 * Route: /api/cron/cleanup
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore, getAuth } from '../lib/firebase-admin';
import { verifyCronRequest, sendErrorResponse, sendSuccessResponse, logCronExecution } from '../lib/cron-utils';

const UNVERIFIED_ACCOUNT_RETENTION_DAYS = 7;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a legitimate cron request
  if (!verifyCronRequest(req)) {
    return sendErrorResponse(res, 401, 'Unauthorized: Invalid cron secret');
  }

  const db = getFirestore();
  const auth = getAuth();
  let deletedCount = 0;
  const errors: string[] = [];

  try {
    console.log('Starting cleanup of unverified accounts...');

    // Calculate the cutoff date (7 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - UNVERIFIED_ACCOUNT_RETENTION_DAYS);

    // Find unverified users older than 7 days
    const unverifiedUsersSnapshot = await db
      .collection('users')
      .where('emailVerified', '==', false)
      .where('status', '==', 'pending')
      .where('createdAt', '<', cutoffDate)
      .get();

    console.log(`Found ${unverifiedUsersSnapshot.size} unverified accounts to clean up`);

    // Process deletions
    const deletePromises: Promise<any>[] = [];

    for (const userDoc of unverifiedUsersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      try {
        console.log(`Deleting unverified user: ${userId} (${userData.email})`);

        // Delete from Firebase Auth
        deletePromises.push(
          auth.deleteUser(userId).catch((error) => {
            console.error(`Failed to delete auth user ${userId}:`, error);
            errors.push(`Auth deletion failed for ${userId}: ${error.message}`);
          })
        );

        // Delete Firestore document
        deletePromises.push(
          userDoc.ref.delete().catch((error) => {
            console.error(`Failed to delete Firestore doc ${userId}:`, error);
            errors.push(`Firestore deletion failed for ${userId}: ${error.message}`);
          })
        );

        // Delete any associated data (balances, work logs, etc.)
        deletePromises.push(
          db.collection('balances').doc(userId).delete().catch(() => {
            // Ignore if doesn't exist
          })
        );

        // Create audit log for deletion
        deletePromises.push(
          db.collection('auditLogs').add({
            userId: userId,
            employerId: userData.tenantId || userData.employerId || null,
            action: 'unverified_account_deleted',
            details: {
              email: userData.email,
              createdAt: userData.createdAt,
              daysSinceCreation: Math.floor(
                (Date.now() - userData.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24)
              ),
              reason: 'Email not verified within 7 days',
            },
            timestamp: new Date(),
          })
        );

        deletedCount++;
      } catch (error: any) {
        const errorMsg = `Error deleting user ${userId}: ${error.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Wait for all deletions to complete
    await Promise.allSettled(deletePromises);

    // Log job execution
    await logCronExecution(db, 'cleanup_unverified', true, {
      deletedCount,
      errorCount: errors.length,
      errors: errors.slice(0, 10),
    });

    console.log(`Cleanup completed. Deleted: ${deletedCount}, Errors: ${errors.length}`);

    return sendSuccessResponse(res, 'Cleanup completed', {
      deletedCount,
      errorCount: errors.length,
      hasErrors: errors.length > 0,
    });
  } catch (error: any) {
    await logCronExecution(db, 'cleanup_unverified', false, {
      error: error.message,
      deletedCount,
    });
    return sendErrorResponse(res, 500, 'Failed to complete cleanup', error.message);
  }
}
