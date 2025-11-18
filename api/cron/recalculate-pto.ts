/**
 * Daily PTO Balance Recalculation Cron Job
 * Runs daily to recalculate and validate all employee PTO balances
 * Ensures data integrity and catches any calculation errors
 * 
 * Schedule: Daily at 2:00 AM EST (America/Detroit timezone)
 * Route: /api/cron/recalculate-pto
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore } from '../lib/firebase-admin';
import { verifyCronRequest, sendErrorResponse, sendSuccessResponse, logCronExecution } from '../lib/cron-utils';

const MAX_ACCRUAL_LARGE = 72;
const MAX_ACCRUAL_SMALL = 40;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a legitimate cron request
  if (!verifyCronRequest(req)) {
    return sendErrorResponse(res, 401, 'Unauthorized: Invalid cron secret');
  }

  const db = getFirestore();
  let recalculatedCount = 0;
  let correctedCount = 0;
  const errors: string[] = [];
  const discrepancies: any[] = [];

  try {
    console.log('Starting PTO balance recalculation job...');

    // Get all active employees with balances
    const balancesSnapshot = await db.collection('balances').get();

    for (const balanceDoc of balancesSnapshot.docs) {
      const userId = balanceDoc.id;
      const currentBalance = balanceDoc.data();

      try {
        // Get user info to determine employer size
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
          console.warn(`User ${userId} not found, skipping balance recalculation`);
          continue;
        }

        const userData = userDoc.data();
        const tenantId = userData?.tenantId || userData?.employerId;

        if (!tenantId) {
          console.warn(`User ${userId} has no tenant ID, skipping`);
          continue;
        }

        // Get tenant info for employer size
        const tenantDoc = await db.collection('tenants').doc(tenantId).get();
        const employerSize = tenantDoc.exists ? (tenantDoc.data()?.size || 'large') : 'large';

        // Calculate actual balance from transaction history
        const transactionsSnapshot = await db
          .collection('sickTimeRequests')
          .where('userId', '==', userId)
          .where('status', '==', 'approved')
          .get();

        let totalUsed = 0;
        transactionsSnapshot.forEach((txDoc) => {
          const txData = txDoc.data();
          if (txData.isPaid && txData.hoursRequested) {
            totalUsed += txData.hoursRequested;
          }
        });

        // Get total accrued from work logs
        const processedLogsSnapshot = await db
          .collection('workLogs')
          .where('userId', '==', userId)
          .where('processed', '==', true)
          .get();

        // For large employers, recalculate from work logs
        let calculatedYearlyAccrued = currentBalance.yearlyAccrued || 0;
        if (employerSize === 'large') {
          let totalHoursWorked = 0;
          processedLogsSnapshot.forEach((logDoc) => {
            const logData = logDoc.data();
            totalHoursWorked += logData.hoursWorked || 0;
          });
          calculatedYearlyAccrued = Math.min(
            totalHoursWorked * (1 / 30),
            MAX_ACCRUAL_LARGE
          );
        } else {
          // Small employers get 40 hours at start of year
          calculatedYearlyAccrued = MAX_ACCRUAL_SMALL;
        }

        const calculatedBalance = calculatedYearlyAccrued - totalUsed;

        // Check for discrepancies
        const balanceDiff = Math.abs(calculatedBalance - (currentBalance.availablePaidHours || 0));
        const accrualDiff = Math.abs(calculatedYearlyAccrued - (currentBalance.yearlyAccrued || 0));

        if (balanceDiff > 0.01 || accrualDiff > 0.01) {
          // Found a discrepancy - log it
          discrepancies.push({
            userId,
            email: userData?.email,
            tenantId,
            currentBalance: currentBalance.availablePaidHours,
            calculatedBalance,
            difference: balanceDiff,
            currentYearlyAccrued: currentBalance.yearlyAccrued,
            calculatedYearlyAccrued,
            accrualDifference: accrualDiff,
          });

          // Correct the balance
          await db.collection('balances').doc(userId).update({
            availablePaidHours: calculatedBalance,
            yearlyAccrued: calculatedYearlyAccrued,
            lastRecalculated: new Date(),
            updatedAt: new Date(),
          });

          // Create audit log
          await db.collection('auditLogs').add({
            userId: userId,
            employerId: tenantId,
            action: 'balance_corrected',
            details: {
              previousBalance: currentBalance.availablePaidHours,
              correctedBalance: calculatedBalance,
              difference: balanceDiff,
              previousYearlyAccrued: currentBalance.yearlyAccrued,
              correctedYearlyAccrued: calculatedYearlyAccrued,
              reason: 'Daily recalculation detected discrepancy',
              jobType: 'cron',
            },
            timestamp: new Date(),
          });

          correctedCount++;
        } else {
          // Balance is correct, just update timestamp
          await db.collection('balances').doc(userId).update({
            lastRecalculated: new Date(),
            updatedAt: new Date(),
          });
        }

        recalculatedCount++;
      } catch (userError: any) {
        const errorMsg = `Error recalculating balance for user ${userId}: ${userError.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Log job execution
    await logCronExecution(db, 'recalculate_pto', true, {
      recalculatedCount,
      correctedCount,
      discrepanciesFound: discrepancies.length,
      errors: errors.slice(0, 10),
      sampleDiscrepancies: discrepancies.slice(0, 5),
    });

    console.log(
      `PTO recalculation completed. Recalculated: ${recalculatedCount}, Corrected: ${correctedCount}, Errors: ${errors.length}`
    );

    return sendSuccessResponse(res, 'PTO recalculation completed', {
      recalculatedCount,
      correctedCount,
      discrepanciesFound: discrepancies.length,
      errorCount: errors.length,
      hasErrors: errors.length > 0,
    });
  } catch (error: any) {
    await logCronExecution(db, 'recalculate_pto', false, {
      error: error.message,
      recalculatedCount,
      correctedCount,
    });
    return sendErrorResponse(res, 500, 'Failed to complete PTO recalculation', error.message);
  }
}
