# ESTA Tracker - Vercel Serverless API & Cron Jobs

This directory contains Vercel serverless functions for the ESTA Tracker application, including scheduled cron jobs for automated maintenance and compliance tasks.

## Directory Structure

```
api/
├── cron/                       # Scheduled cron jobs
│   ├── accrual.ts             # Daily accrual update
│   ├── cleanup.ts             # Daily unverified account cleanup
│   ├── recalculate-pto.ts     # Daily PTO balance recalculation
│   ├── audit.ts               # Weekly compliance audit
│   ├── ruleset-validator.ts   # Weekly RuleSet integrity validator
│   ├── billing-reports.ts     # Monthly billing reports
│   └── compliance-packet.ts   # Monthly ESTA compliance packet
├── lib/                        # Shared utilities
│   ├── firebase-admin.ts      # Firebase Admin SDK initialization
│   ├── cron-utils.ts          # Cron job utility functions
│   └── types.ts               # Shared TypeScript types
├── package.json
├── tsconfig.json
└── README.md
```

## Cron Jobs

### Daily Jobs

#### 1. Accrual Update (`/api/cron/accrual`)
- **Schedule**: Daily at midnight EST (0 0 * * *)
- **Purpose**: Updates sick time accruals for all active employees
- **Process**:
  - Processes unprocessed work logs from the last 24 hours
  - Calculates accrual based on Michigan ESTA rules (1 hour per 30 worked for large employers)
  - Updates employee balances
  - Creates audit logs
  - Respects maximum accrual caps (72 hours for large, 40 for small employers)

#### 2. Cleanup Unverified Accounts (`/api/cron/cleanup`)
- **Schedule**: Daily at 1:00 AM EST (0 1 * * *)
- **Purpose**: Removes user accounts that haven't verified their email after 7 days
- **Process**:
  - Identifies unverified accounts older than 7 days
  - Deletes from Firebase Auth and Firestore
  - Cleans up associated data (balances, work logs)
  - Creates audit logs for deletions

#### 3. Recalculate PTO Balances (`/api/cron/recalculate-pto`)
- **Schedule**: Daily at 2:00 AM EST (0 2 * * *)
- **Purpose**: Validates and corrects employee PTO balances for data integrity
- **Process**:
  - Recalculates balances from transaction history
  - Detects and corrects discrepancies
  - Logs all corrections for audit purposes
  - Ensures balances match work logs and usage records

### Weekly Jobs

#### 4. Compliance Audit Snapshot (`/api/cron/audit`)
- **Schedule**: Weekly on Sundays at 3:00 AM EST (0 3 * * 0)
- **Purpose**: Comprehensive compliance check for all tenants
- **Checks**:
  - Balances over accrual caps
  - Missing work logs for active employees
  - Missing documentation for multi-day absences
  - Unprocessed work logs
  - Employer size classification accuracy
- **Output**: Compliance audit reports with severity-based issues

#### 5. RuleSet Integrity Validator (`/api/cron/ruleset-validator`)
- **Schedule**: Weekly on Mondays at 3:00 AM EST (0 3 * * 1)
- **Purpose**: Validates Michigan ESTA rules integrity and calculation accuracy
- **Checks**:
  - Rule configuration consistency
  - Balance calculation anomalies (negative balances, excessive balances)
  - Accrual rate accuracy
  - Orphaned records
  - Audit log retention
  - Stale pending requests
- **Output**: Validation report with critical issues flagged

### Monthly Jobs

#### 6. Billing Reports (`/api/cron/billing-reports`)
- **Schedule**: Monthly on the 1st at 4:00 AM EST (0 4 1 * *)
- **Purpose**: Generate monthly billing reports for all tenants
- **Process**:
  - Calculates billing based on active employee count
  - Gathers usage statistics (requests, work logs, documents)
  - Generates itemized billing reports
  - Creates notifications for employers
  - Tracks total revenue

#### 7. ESTA Compliance Packet (`/api/cron/compliance-packet`)
- **Schedule**: Monthly on the 1st at 5:00 AM EST (0 5 1 * *)
- **Purpose**: Generate comprehensive monthly compliance packets for audit readiness
- **Contents**:
  - Employee accrual summary
  - Usage reports (paid/unpaid)
  - Current balance snapshots
  - Compliance status certification
  - Michigan ESTA requirement checklist
  - Document upload summary
  - Work log summary
- **Statuses**: `fully_compliant`, `compliant_with_warnings`, `non_compliant`

## Authentication & Security

All cron jobs are protected by Vercel's cron authentication mechanism:

1. **CRON_SECRET Environment Variable**: Set in Vercel dashboard
2. **Authorization Header**: Vercel automatically includes `Authorization: Bearer <CRON_SECRET>`
3. **Verification**: Each job verifies the request using `verifyCronRequest()`

## Environment Variables

Required environment variables (set in Vercel dashboard):

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com

# Cron Job Security
CRON_SECRET=your-secure-random-string
```

## Monitoring & Logs

### Cron Job Execution Logs

All jobs log their execution to Firestore in the `cronJobs` collection:

```typescript
{
  jobName: string;          // e.g., "accrual_update"
  success: boolean;         // Job completion status
  details: object;          // Job-specific data
  executedAt: Date;         // Execution timestamp
  timestamp: string;        // ISO 8601 timestamp
}
```

### Viewing Logs

1. **Vercel Dashboard**: Deployments → Functions → View Logs
2. **Firestore Console**: `cronJobs` collection
3. **Audit Logs**: `auditLogs` collection for specific actions

## Error Handling

All cron jobs implement comprehensive error handling:

- Individual errors don't stop the entire job
- Errors are logged to Firestore and console
- Failed items are tracked and reported
- Jobs return detailed error information in response

## Local Development

To test cron jobs locally:

```bash
# Install dependencies
cd api
npm install

# Run type checking
npm run typecheck

# Test a cron job endpoint (requires Firebase setup)
curl -X GET http://localhost:3000/api/cron/accrual \
  -H "Authorization: Bearer your-test-secret"
```

## Deployment

Cron jobs are automatically deployed when pushing to Vercel:

1. Push code to GitHub
2. Vercel builds and deploys automatically
3. Cron configuration in `vercel.json` is applied
4. Jobs run on schedule (Vercel Pro required)

## Troubleshooting

### Job Not Running

1. Check Vercel dashboard → Settings → Cron Jobs
2. Verify Vercel Pro subscription is active
3. Check function logs for errors
4. Verify `CRON_SECRET` is set

### Authentication Errors

1. Verify `CRON_SECRET` environment variable
2. Check authorization header in logs
3. Ensure Vercel is sending the correct header

### Firebase Errors

1. Verify `FIREBASE_SERVICE_ACCOUNT` is valid JSON
2. Check Firebase project permissions
3. Verify Firestore security rules allow admin access

## Pricing Considerations

Vercel Cron Jobs require a **Pro subscription** ($20/month):

- Hobby plan: Cron jobs are not available
- Pro plan: Unlimited cron jobs included
- Enterprise plan: Advanced scheduling and monitoring

## Future Enhancements

Potential improvements:

- [ ] Email notifications for critical compliance issues
- [ ] Slack/Teams integration for alerts
- [ ] PDF generation for compliance packets
- [ ] Automated retry mechanism for failed jobs
- [ ] Historical trend analysis and reporting
- [ ] Custom scheduling per tenant
- [ ] Multi-state compliance support

## Support

For issues or questions:

1. Check Vercel documentation: https://vercel.com/docs/cron-jobs
2. Review Firebase Admin SDK docs: https://firebase.google.com/docs/admin/setup
3. Contact support through GitHub issues

---

**Last Updated**: November 2024
**Michigan ESTA Compliance**: 2025 Requirements
**Vercel API Version**: 3.x
