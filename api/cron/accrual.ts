/**
 * Daily Accrual Update Cron Job
 * Runs daily to update sick time accruals for all employees
 * 
 * Schedule: Daily at midnight EST (America/Detroit timezone)
 * Route: /api/cron/accrual
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore } from '../lib/firebase-admin';
import { verifyCronRequest, sendErrorResponse, sendSuccessResponse, logCronExecution } from '../lib/cron-utils';

// Michigan ESTA accrual rules
const ACCRUAL_RATE_LARGE_EMPLOYER = 1 / 30; // 1 hour per 30 hours worked
const MAX_ACCRUAL_LARGE = 72;
const MAX_ACCRUAL_SMALL = 40;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a legitimate cron request
  if (!verifyCronRequest(req)) {
    return sendErrorResponse(res, 401, 'Unauthorized: Invalid cron secret');
  }

  const db = getFirestore();
  let processedCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  try {
    console.log('Starting daily accrual update job...');

    // Get all active tenants
    const tenantsSnapshot = await db.collection('tenants').where('status', '==', 'active').get();

    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantData = tenantDoc.data();
      const tenantId = tenantDoc.id;
      const employerSize = tenantData.size || 'large'; // 'small' or 'large'

      try {
        // Get all active employees for this tenant
        const employeesSnapshot = await db
          .collection('users')
          .where('tenantId', '==', tenantId)
          .where('status', '==', 'active')
          .where('role', '==', 'employee')
          .get();

        for (const employeeDoc of employeesSnapshot.docs) {
          const employeeId = employeeDoc.id;
          const employeeData = employeeDoc.data();

          try {
            // Get unprocessed work logs from the last 24 hours
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const workLogsSnapshot = await db
              .collection('workLogs')
              .where('userId', '==', employeeId)
              .where('processed', '==', false)
              .where('date', '>=', yesterday)
              .get();

            if (workLogsSnapshot.empty) {
              continue; // No new work logs to process
            }

            let totalHoursWorked = 0;
            const workLogIds: string[] = [];

            workLogsSnapshot.forEach((logDoc) => {
              const logData = logDoc.data();
              totalHoursWorked += logData.hoursWorked || 0;
              workLogIds.push(logDoc.id);
            });

            // Calculate accrual
            let accrued = 0;
            if (employerSize === 'large') {
              accrued = totalHoursWorked * ACCRUAL_RATE_LARGE_EMPLOYER;
            } else {
              // Small employers grant 40 hours annually at start of year, not rate-based
              accrued = 0;
            }

            // Get current balance
            const balanceDoc = await db.collection('balances').doc(employeeId).get();
            const currentBalance = balanceDoc.exists 
              ? (balanceDoc.data()?.availablePaidHours || 0) 
              : 0;
            const yearlyAccrued = balanceDoc.exists
              ? (balanceDoc.data()?.yearlyAccrued || 0)
              : 0;

            // Apply max accrual cap
            const maxAccrual = employerSize === 'large' ? MAX_ACCRUAL_LARGE : MAX_ACCRUAL_SMALL;
            const newYearlyAccrued = Math.min(yearlyAccrued + accrued, maxAccrual);
            const actualAccrued = newYearlyAccrued - yearlyAccrued;
            const newBalance = currentBalance + actualAccrued;

            // Update balance
            await db.collection('balances').doc(employeeId).set({
              userId: employeeId,
              tenantId: tenantId,
              availablePaidHours: newBalance,
              yearlyAccrued: newYearlyAccrued,
              lastUpdated: new Date(),
              updatedAt: new Date(),
            }, { merge: true });

            // Mark work logs as processed
            const batch = db.batch();
            for (const logId of workLogIds) {
              const logRef = db.collection('workLogs').doc(logId);
              batch.update(logRef, { processed: true, processedAt: new Date() });
            }
            await batch.commit();

            // Create audit log
            if (actualAccrued > 0) {
              await db.collection('auditLogs').add({
                userId: employeeId,
                employerId: tenantId,
                action: 'accrual_updated',
                details: {
                  hoursWorked: totalHoursWorked,
                  accrued: actualAccrued,
                  previousBalance: currentBalance,
                  newBalance: newBalance,
                  employerSize: employerSize,
                  jobType: 'cron',
                },
                timestamp: new Date(),
              });
            }

            processedCount++;
          } catch (employeeError: any) {
            errorCount++;
            const errorMsg = `Error processing employee ${employeeId}: ${employeeError.message}`;
            errors.push(errorMsg);
            console.error(errorMsg);
          }
        }
      } catch (tenantError: any) {
        errorCount++;
        const errorMsg = `Error processing tenant ${tenantId}: ${tenantError.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Log job execution
    await logCronExecution(db, 'accrual_update', true, {
      processedCount,
      errorCount,
      errors: errors.slice(0, 10), // Only log first 10 errors
    });

    console.log(`Accrual update completed. Processed: ${processedCount}, Errors: ${errorCount}`);

    return sendSuccessResponse(res, 'Accrual update completed', {
      processedCount,
      errorCount,
      hasErrors: errorCount > 0,
    });
  } catch (error: any) {
    await logCronExecution(db, 'accrual_update', false, {
      error: error.message,
      processedCount,
      errorCount,
    });
    return sendErrorResponse(res, 500, 'Failed to complete accrual update', error.message);
  }
}
