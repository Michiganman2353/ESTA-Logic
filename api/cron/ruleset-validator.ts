/**
 * Weekly RuleSet Integrity Validator Cron Job
 * Runs weekly to validate Michigan ESTA rules integrity and ensure compliance logic is correct
 * Checks for rule consistency, validates calculations, and detects anomalies
 * 
 * Schedule: Weekly on Mondays at 3:00 AM EST (America/Detroit timezone)
 * Route: /api/cron/ruleset-validator
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore } from '../lib/firebase-admin';
import { verifyCronRequest, sendErrorResponse, sendSuccessResponse, logCronExecution } from '../lib/cron-utils';

// Michigan ESTA constants - these should match the values in the compliance service
const EXPECTED_ACCRUAL_RATE_LARGE = 1 / 30;
const EXPECTED_MAX_ACCRUAL_LARGE = 72;
const EXPECTED_MAX_ACCRUAL_SMALL = 40;
const EXPECTED_CARRYOVER_CAP_LARGE = 72;
const EXPECTED_CARRYOVER_CAP_SMALL = 40;
const EXPECTED_AUDIT_RETENTION_YEARS = 3;

interface ValidationIssue {
  ruleType: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  expected: any;
  actual: any;
  recommendation: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a legitimate cron request
  if (!verifyCronRequest(req)) {
    return sendErrorResponse(res, 401, 'Unauthorized: Invalid cron secret');
  }

  const db = getFirestore();
  const issues: ValidationIssue[] = [];

  try {
    console.log('Starting RuleSet integrity validation...');

    // Validation 1: Check for rule configuration consistency across tenants
    const tenantsSnapshot = await db.collection('tenants').where('status', '==', 'active').get();
    const sizeMismatches: any[] = [];

    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantData = tenantDoc.data();
      const configuredSize = tenantData.size;
      
      // Get employee count
      const employeesSnapshot = await db
        .collection('users')
        .where('tenantId', '==', tenantDoc.id)
        .where('role', '==', 'employee')
        .get();
      
      const employeeCount = employeesSnapshot.size;
      const shouldBeLarge = employeeCount >= 10; // Michigan threshold
      const isLarge = configuredSize === 'large';

      if (shouldBeLarge !== isLarge) {
        sizeMismatches.push({
          tenantId: tenantDoc.id,
          companyName: tenantData.companyName,
          employeeCount,
          configuredSize,
          expectedSize: shouldBeLarge ? 'large' : 'small',
        });
      }
    }

    if (sizeMismatches.length > 0) {
      issues.push({
        ruleType: 'EMPLOYER_SIZE_CLASSIFICATION',
        severity: 'critical',
        description: `${sizeMismatches.length} tenant(s) have incorrect employer size classification`,
        expected: 'Size should match employee count (threshold: 10)',
        actual: sizeMismatches,
        recommendation: 'Update tenant size configuration to match actual employee count',
      });
    }

    // Validation 2: Check for balance calculation anomalies
    const balancesSnapshot = await db.collection('balances').get();
    const negativeBalances: any[] = [];
    const excessiveBalances: any[] = [];

    for (const balanceDoc of balancesSnapshot.docs) {
      const balanceData = balanceDoc.data();
      const balance = balanceData.availablePaidHours || 0;

      // Check for negative balances
      if (balance < 0) {
        negativeBalances.push({
          userId: balanceDoc.id,
          balance,
        });
      }

      // Check for balances exceeding maximum possible (over 100 hours is suspicious)
      if (balance > 100) {
        excessiveBalances.push({
          userId: balanceDoc.id,
          balance,
        });
      }
    }

    if (negativeBalances.length > 0) {
      issues.push({
        ruleType: 'NEGATIVE_BALANCE',
        severity: 'error',
        description: `${negativeBalances.length} employee(s) have negative PTO balances`,
        expected: 'All balances should be >= 0',
        actual: negativeBalances.slice(0, 10),
        recommendation: 'Investigate and correct negative balances - may indicate calculation errors',
      });
    }

    if (excessiveBalances.length > 0) {
      issues.push({
        ruleType: 'EXCESSIVE_BALANCE',
        severity: 'warning',
        description: `${excessiveBalances.length} employee(s) have balances over 100 hours`,
        expected: 'Balances should not exceed maximum accrual cap',
        actual: excessiveBalances.slice(0, 10),
        recommendation: 'Review these balances for potential errors or policy violations',
      });
    }

    // Validation 3: Check accrual rate consistency
    const recentAccrualLogsSnapshot = await db
      .collection('auditLogs')
      .where('action', '==', 'accrual_updated')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const accrualRateIssues: any[] = [];

    for (const logDoc of recentAccrualLogsSnapshot.docs) {
      const logData = logDoc.data();
      const details = logData.details || {};
      const hoursWorked = details.hoursWorked || 0;
      const accrued = details.accrued || 0;
      const employerSize = details.employerSize;

      if (employerSize === 'large' && hoursWorked > 0) {
        const actualRate = accrued / hoursWorked;
        const expectedRate = EXPECTED_ACCRUAL_RATE_LARGE;
        const tolerance = 0.001; // Allow small floating point differences

        if (Math.abs(actualRate - expectedRate) > tolerance) {
          accrualRateIssues.push({
            userId: logData.userId,
            hoursWorked,
            accrued,
            actualRate,
            expectedRate,
          });
        }
      }
    }

    if (accrualRateIssues.length > 0) {
      issues.push({
        ruleType: 'ACCRUAL_RATE_MISMATCH',
        severity: 'error',
        description: `${accrualRateIssues.length} accrual calculation(s) used incorrect rate`,
        expected: `Large employers: ${EXPECTED_ACCRUAL_RATE_LARGE} (1 hour per 30 worked)`,
        actual: accrualRateIssues.slice(0, 5),
        recommendation: 'Review accrual calculation logic in the daily accrual job',
      });
    }

    // Validation 4: Check for orphaned records
    const balanceUserIds = new Set<string>();
    balancesSnapshot.forEach((doc) => balanceUserIds.add(doc.id));

    const orphanedBalances: string[] = [];
    for (const userId of Array.from(balanceUserIds)) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        orphanedBalances.push(userId);
      }
    }

    if (orphanedBalances.length > 0) {
      issues.push({
        ruleType: 'ORPHANED_BALANCES',
        severity: 'warning',
        description: `${orphanedBalances.length} balance record(s) exist for deleted users`,
        expected: 'All balances should have corresponding user records',
        actual: orphanedBalances.slice(0, 10),
        recommendation: 'Clean up orphaned balance records',
      });
    }

    // Validation 5: Verify audit log retention
    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() - EXPECTED_AUDIT_RETENTION_YEARS);

    const oldAuditLogsSnapshot = await db
      .collection('auditLogs')
      .where('timestamp', '<', retentionDate)
      .limit(100)
      .get();

    if (!oldAuditLogsSnapshot.empty) {
      issues.push({
        ruleType: 'AUDIT_RETENTION',
        severity: 'info',
        description: `Found ${oldAuditLogsSnapshot.size}+ audit logs older than ${EXPECTED_AUDIT_RETENTION_YEARS} years`,
        expected: `Audit logs should be retained for ${EXPECTED_AUDIT_RETENTION_YEARS} years`,
        actual: `${oldAuditLogsSnapshot.size}+ old records found`,
        recommendation: 'Consider archiving or deleting old audit logs per Michigan ESTA requirements',
      });
    }

    // Validation 6: Check for pending sick time requests (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stalePendingRequests = await db
      .collection('sickTimeRequests')
      .where('status', '==', 'pending')
      .where('createdAt', '<', sevenDaysAgo)
      .get();

    if (!stalePendingRequests.empty) {
      issues.push({
        ruleType: 'STALE_REQUESTS',
        severity: 'warning',
        description: `${stalePendingRequests.size} sick time request(s) pending for more than 7 days`,
        expected: 'Requests should be processed in a timely manner',
        actual: `${stalePendingRequests.size} stale requests`,
        recommendation: 'Notify managers to review and approve/deny pending requests',
      });
    }

    // Store validation report
    const validationReport = {
      validationDate: new Date(),
      issuesFound: issues.length,
      issues,
      severityCounts: {
        critical: issues.filter((i) => i.severity === 'critical').length,
        error: issues.filter((i) => i.severity === 'error').length,
        warning: issues.filter((i) => i.severity === 'warning').length,
        info: issues.filter((i) => i.severity === 'info').length,
      },
      timestamp: new Date(),
    };

    await db.collection('ruleSetValidations').add(validationReport);

    // If there are critical issues, create admin notification
    const criticalIssues = issues.filter((i) => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      await db.collection('notifications').add({
        type: 'system_alert',
        severity: 'critical',
        title: 'Critical RuleSet Validation Issues',
        message: `RuleSet validation found ${criticalIssues.length} critical issue(s) requiring immediate attention`,
        data: { issues: criticalIssues },
        read: false,
        createdAt: new Date(),
      });
    }

    // Log job execution
    await logCronExecution(db, 'ruleset_validator', true, {
      issuesFound: issues.length,
      severityCounts: validationReport.severityCounts,
    });

    console.log(`RuleSet validation completed. Issues found: ${issues.length}`);

    return sendSuccessResponse(res, 'RuleSet validation completed', {
      issuesFound: issues.length,
      severityCounts: validationReport.severityCounts,
      hasIssues: issues.length > 0,
    });
  } catch (error: any) {
    await logCronExecution(db, 'ruleset_validator', false, {
      error: error.message,
    });
    return sendErrorResponse(res, 500, 'Failed to complete RuleSet validation', error.message);
  }
}
