/**
 * Monthly Billing Reports Cron Job
 * Runs monthly to generate billing reports for all active tenants
 * Calculates usage, generates invoices, and prepares billing data
 * 
 * Schedule: Monthly on the 1st at 4:00 AM EST (America/Detroit timezone)
 * Route: /api/cron/billing-reports
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore } from '../lib/firebase-admin';
import { verifyCronRequest, sendErrorResponse, sendSuccessResponse, logCronExecution } from '../lib/cron-utils';

// Pricing tiers (example - adjust based on actual pricing model)
const PRICING = {
  SMALL_PER_EMPLOYEE: 5.00, // $5 per employee per month for small employers
  LARGE_PER_EMPLOYEE: 7.00, // $7 per employee per month for large employers
  MINIMUM_FEE: 25.00, // Minimum monthly fee
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a legitimate cron request
  if (!verifyCronRequest(req)) {
    return sendErrorResponse(res, 401, 'Unauthorized: Invalid cron secret');
  }

  const db = getFirestore();
  let reportsGenerated = 0;
  let totalRevenue = 0;
  const errors: string[] = [];

  try {
    console.log('Starting monthly billing report generation...');

    // Get current billing period
    const now = new Date();
    const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const billingPeriodDisplay = previousMonth.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });

    // Get all active tenants
    const tenantsSnapshot = await db.collection('tenants').where('status', '==', 'active').get();

    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();
      const employerSize = tenantData.size || 'large';

      try {
        // Get active employee count for this billing period
        const employeesSnapshot = await db
          .collection('users')
          .where('tenantId', '==', tenantId)
          .where('role', '==', 'employee')
          .where('status', '==', 'active')
          .get();

        const employeeCount = employeesSnapshot.size;

        // Calculate billing amount
        const perEmployeeFee = employerSize === 'large' 
          ? PRICING.LARGE_PER_EMPLOYEE 
          : PRICING.SMALL_PER_EMPLOYEE;
        
        const calculatedAmount = employeeCount * perEmployeeFee;
        const billingAmount = Math.max(calculatedAmount, PRICING.MINIMUM_FEE);

        // Count sick time requests processed this month
        const monthStart = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
        const monthEnd = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0);

        const requestsSnapshot = await db
          .collection('sickTimeRequests')
          .where('employerId', '==', tenantId)
          .where('createdAt', '>=', monthStart)
          .where('createdAt', '<=', monthEnd)
          .get();

        // Count work logs processed
        const workLogsSnapshot = await db
          .collection('workLogs')
          .where('tenantId', '==', tenantId)
          .where('date', '>=', monthStart)
          .where('date', '<=', monthEnd)
          .get();

        // Count documents uploaded
        const documentsSnapshot = await db
          .collection('documents')
          .where('tenantId', '==', tenantId)
          .where('createdAt', '>=', monthStart)
          .where('createdAt', '<=', monthEnd)
          .get();

        // Gather usage statistics
        const usageStats = {
          totalEmployees: employeeCount,
          activeEmployees: employeeCount,
          sickTimeRequestsProcessed: requestsSnapshot.size,
          workLogsProcessed: workLogsSnapshot.size,
          documentsUploaded: documentsSnapshot.size,
        };

        // Create billing report
        const billingReport = {
          tenantId,
          companyName: tenantData.companyName || 'Unknown',
          billingPeriod,
          billingPeriodDisplay,
          employerSize,
          employeeCount,
          perEmployeeFee,
          calculatedAmount,
          minimumFee: PRICING.MINIMUM_FEE,
          billingAmount,
          currency: 'USD',
          usageStats,
          status: 'generated',
          generatedAt: new Date(),
          dueDate: new Date(now.getFullYear(), now.getMonth(), 15), // Due on 15th of current month
          createdAt: new Date(),
        };

        // Store billing report
        await db.collection('billingReports').add(billingReport);

        // Update tenant with latest billing info
        await db.collection('tenants').doc(tenantId).update({
          lastBillingDate: new Date(),
          lastBillingAmount: billingAmount,
          updatedAt: new Date(),
        });

        // Create notification for employer
        await db.collection('notifications').add({
          tenantId,
          type: 'billing_report',
          severity: 'info',
          title: 'Monthly Billing Report Available',
          message: `Your billing report for ${billingPeriodDisplay} is ready. Amount: $${billingAmount.toFixed(2)}`,
          data: { 
            billingPeriod, 
            amount: billingAmount,
            employeeCount,
          },
          read: false,
          createdAt: new Date(),
        });

        // Create audit log
        await db.collection('auditLogs').add({
          employerId: tenantId,
          action: 'billing_report_generated',
          details: {
            billingPeriod,
            employeeCount,
            amount: billingAmount,
            usageStats,
          },
          timestamp: new Date(),
        });

        totalRevenue += billingAmount;
        reportsGenerated++;

        console.log(`Generated billing report for ${tenantData.companyName}: $${billingAmount.toFixed(2)}`);
      } catch (tenantError: any) {
        const errorMsg = `Error generating billing report for tenant ${tenantId}: ${tenantError.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Create system-level billing summary
    await db.collection('billingSystemReports').add({
      billingPeriod,
      billingPeriodDisplay,
      reportsGenerated,
      totalRevenue,
      averageRevenuePerTenant: reportsGenerated > 0 ? totalRevenue / reportsGenerated : 0,
      generatedAt: new Date(),
      timestamp: new Date(),
    });

    // Log job execution
    await logCronExecution(db, 'billing_reports', true, {
      reportsGenerated,
      totalRevenue,
      billingPeriod,
      errorCount: errors.length,
      errors: errors.slice(0, 10),
    });

    console.log(
      `Billing report generation completed. Generated: ${reportsGenerated}, Total Revenue: $${totalRevenue.toFixed(2)}, Errors: ${errors.length}`
    );

    return sendSuccessResponse(res, 'Billing reports generated', {
      reportsGenerated,
      totalRevenue,
      billingPeriod: billingPeriodDisplay,
      errorCount: errors.length,
      hasErrors: errors.length > 0,
    });
  } catch (error: any) {
    await logCronExecution(db, 'billing_reports', false, {
      error: error.message,
      reportsGenerated,
    });
    return sendErrorResponse(res, 500, 'Failed to generate billing reports', error.message);
  }
}
