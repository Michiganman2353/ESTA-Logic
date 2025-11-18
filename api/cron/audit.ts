/**
 * Weekly Compliance Audit Snapshot Cron Job
 * Runs weekly to create a comprehensive compliance snapshot for all tenants
 * Checks for ESTA compliance issues, missing documentation, and policy violations
 * 
 * Schedule: Weekly on Sundays at 3:00 AM EST (America/Detroit timezone)
 * Route: /api/cron/audit
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore } from '../lib/firebase-admin';
import { verifyCronRequest, sendErrorResponse, sendSuccessResponse, logCronExecution } from '../lib/cron-utils';

const MAX_ACCRUAL_LARGE = 72;
const MAX_ACCRUAL_SMALL = 40;

interface ComplianceIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedEmployees: string[];
  recommendation: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a legitimate cron request
  if (!verifyCronRequest(req)) {
    return sendErrorResponse(res, 401, 'Unauthorized: Invalid cron secret');
  }

  const db = getFirestore();
  let tenantsAudited = 0;
  let totalIssues = 0;
  const errors: string[] = [];

  try {
    console.log('Starting weekly compliance audit...');

    // Get all active tenants
    const tenantsSnapshot = await db.collection('tenants').where('status', '==', 'active').get();

    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();
      const employerSize = tenantData.size || 'large';

      try {
        const issues: ComplianceIssue[] = [];

        // Get all employees for this tenant
        const employeesSnapshot = await db
          .collection('users')
          .where('tenantId', '==', tenantId)
          .where('role', '==', 'employee')
          .get();

        // Check 1: Employees with excessive balances (over cap)
        const maxCap = employerSize === 'large' ? MAX_ACCRUAL_LARGE : MAX_ACCRUAL_SMALL;
        const overCapEmployees: string[] = [];

        for (const empDoc of employeesSnapshot.docs) {
          const balanceDoc = await db.collection('balances').doc(empDoc.id).get();
          if (balanceDoc.exists) {
            const balance = balanceDoc.data()?.availablePaidHours || 0;
            if (balance > maxCap) {
              overCapEmployees.push(empDoc.id);
            }
          }
        }

        if (overCapEmployees.length > 0) {
          issues.push({
            type: 'BALANCE_OVER_CAP',
            severity: 'high',
            description: `${overCapEmployees.length} employee(s) have balances exceeding the ${maxCap}-hour cap`,
            affectedEmployees: overCapEmployees,
            recommendation: 'Review accrual calculations and adjust balances to comply with Michigan ESTA caps',
          });
        }

        // Check 2: Missing work logs for active employees (no logs in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const inactiveEmployees: string[] = [];
        for (const empDoc of employeesSnapshot.docs) {
          const employeeData = empDoc.data();
          if (employeeData.status === 'active') {
            const recentLogsSnapshot = await db
              .collection('workLogs')
              .where('userId', '==', empDoc.id)
              .where('date', '>=', thirtyDaysAgo)
              .limit(1)
              .get();

            if (recentLogsSnapshot.empty) {
              inactiveEmployees.push(empDoc.id);
            }
          }
        }

        if (inactiveEmployees.length > 0) {
          issues.push({
            type: 'NO_RECENT_WORK_LOGS',
            severity: 'medium',
            description: `${inactiveEmployees.length} active employee(s) have no work logs in the last 30 days`,
            affectedEmployees: inactiveEmployees,
            recommendation: 'Verify if these employees are still active or update their status',
          });
        }

        // Check 3: Approved sick time requests without documentation (for multi-day absences)
        const requestsSnapshot = await db
          .collection('sickTimeRequests')
          .where('employerId', '==', tenantId)
          .where('status', '==', 'approved')
          .get();

        const missingDocumentation: string[] = [];
        for (const reqDoc of requestsSnapshot.docs) {
          const reqData = reqDoc.data();
          const hoursRequested = reqData.hoursRequested || 0;
          
          // If more than 24 hours (3+ days), documentation may be required
          if (hoursRequested > 24) {
            const hasDocuments = reqData.hasDocuments || false;
            if (!hasDocuments) {
              missingDocumentation.push(reqDoc.id);
            }
          }
        }

        if (missingDocumentation.length > 0) {
          issues.push({
            type: 'MISSING_DOCUMENTATION',
            severity: 'low',
            description: `${missingDocumentation.length} multi-day sick time request(s) lack supporting documentation`,
            affectedEmployees: [],
            recommendation: 'Request documentation for extended absences to ensure compliance',
          });
        }

        // Check 4: Unprocessed work logs (older than 2 days)
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const unprocessedLogsSnapshot = await db
          .collection('workLogs')
          .where('tenantId', '==', tenantId)
          .where('processed', '==', false)
          .where('date', '<', twoDaysAgo)
          .get();

        if (!unprocessedLogsSnapshot.empty) {
          issues.push({
            type: 'UNPROCESSED_WORK_LOGS',
            severity: 'medium',
            description: `${unprocessedLogsSnapshot.size} work log(s) remain unprocessed for more than 2 days`,
            affectedEmployees: [],
            recommendation: 'Investigate why work logs are not being processed by the daily accrual job',
          });
        }

        // Check 5: Employer size mismatch (employee count vs configured size)
        const actualEmployeeCount = employeesSnapshot.size;
        const configuredSize = employerSize;
        const sizeThreshold = 10; // Michigan ESTA threshold

        const shouldBeLarge = actualEmployeeCount >= sizeThreshold;
        const isConfiguredLarge = configuredSize === 'large';

        if (shouldBeLarge !== isConfiguredLarge) {
          issues.push({
            type: 'EMPLOYER_SIZE_MISMATCH',
            severity: 'critical',
            description: `Company has ${actualEmployeeCount} employees but is configured as "${configuredSize}" employer`,
            affectedEmployees: [],
            recommendation: `Update employer size to "${shouldBeLarge ? 'large' : 'small'}" to apply correct ESTA rules`,
          });
        }

        // Store audit snapshot
        const auditSnapshot = {
          tenantId,
          companyName: tenantData.companyName,
          employerSize,
          employeeCount: employeesSnapshot.size,
          issues,
          issueCount: issues.length,
          auditDate: new Date(),
          timestamp: new Date(),
        };

        await db.collection('complianceAudits').add(auditSnapshot);

        // If there are critical or high severity issues, create notifications
        const criticalIssues = issues.filter((i) => i.severity === 'critical' || i.severity === 'high');
        if (criticalIssues.length > 0) {
          await db.collection('notifications').add({
            tenantId,
            type: 'compliance_alert',
            severity: 'high',
            title: 'Compliance Issues Detected',
            message: `Weekly audit found ${criticalIssues.length} high-priority compliance issue(s)`,
            data: { issues: criticalIssues },
            read: false,
            createdAt: new Date(),
          });
        }

        totalIssues += issues.length;
        tenantsAudited++;

        console.log(`Audited tenant ${tenantId}: ${issues.length} issues found`);
      } catch (tenantError: any) {
        const errorMsg = `Error auditing tenant ${tenantId}: ${tenantError.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Log job execution
    await logCronExecution(db, 'compliance_audit', true, {
      tenantsAudited,
      totalIssues,
      errorCount: errors.length,
      errors: errors.slice(0, 10),
    });

    console.log(`Compliance audit completed. Audited: ${tenantsAudited}, Issues: ${totalIssues}, Errors: ${errors.length}`);

    return sendSuccessResponse(res, 'Compliance audit completed', {
      tenantsAudited,
      totalIssues,
      errorCount: errors.length,
      hasErrors: errors.length > 0,
    });
  } catch (error: any) {
    await logCronExecution(db, 'compliance_audit', false, {
      error: error.message,
      tenantsAudited,
    });
    return sendErrorResponse(res, 500, 'Failed to complete compliance audit', error.message);
  }
}
